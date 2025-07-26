const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const http = require('http');

const PORT = 4000;
const API_URL = 'https://24data.ptfs.app/acft-data';
const POLL_INTERVAL_MS = 3000;
const FLIGHTPLAN_TTL_MS = 60 * 60 * 1000; // 1 hour

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

// Internal flight plan storage by playerName
const flightPlanMap = new Map(); // key: playerName, value: { ...flightPlan, timestamp }

// Cleanup old flight plans every 1 minute
setInterval(() => {
    const now = Date.now();
    for (const [playerName, plan] of flightPlanMap.entries()) {
        if (now - plan.timestamp > FLIGHTPLAN_TTL_MS) {
            flightPlanMap.delete(playerName);
        }
    }
}, 60000);

// WebSocket to 24data for flight plan stream
const externalWS = new WebSocket('wss://24data.ptfs.app/wss');

externalWS.on('open', () => {
    console.log('Connected to 24data WebSocket for flight plans');
});

externalWS.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        const { t: type, d: payload } = msg;

        if (type === 'FLIGHT_PLAN') {
            const playerName = payload.robloxName; // NEW: use playerName instead of callsign

            if (!playerName) {
                console.warn('FLIGHT_PLAN missing playerName. Skipping.');
                return;
            }

            const sanitizedPlan = {
                callsign: payload.callsign,
                aircraft: payload.aircraft,
                flightrules: payload.flightrules,
                departing: payload.departing,
                arriving: payload.arriving,
                route: payload.route,
                flightlevel: payload.flightlevel,
                timestamp: Date.now()
            };

            flightPlanMap.set(playerName, sanitizedPlan);
            console.log(`Stored flight plan for player: ${playerName}, with callsign : ${payload.callsign}`);
        }
    } catch (err) {
        console.error('Error parsing flight plan message:', err.message);
    }
});

externalWS.on('error', (err) => {
    console.error('WebSocket error (flight plan):', err.message);
});

externalWS.on('close', () => {
    console.warn('24data flight plan WebSocket closed');
});

async function fetchAircraftData() {
    try {
        const res = await fetch(API_URL);
        const rawData = await res.json();

        const enrichedData = {};

        for (const [callsign, ac] of Object.entries(rawData)) {
            const playerName = ac.playerName;
            const flightPlan = playerName ? flightPlanMap.get(playerName) ?? null : null;

            enrichedData[callsign] = {
                heading: ac.heading,
                altitude: ac.altitude,
                playerName: playerName,
                aircraftType: ac.aircraftType,
                position: ac.position,
                speed: ac.speed,
                wind: ac.wind,
                isOnGround: ac.isOnGround,
                groundSpeed: ac.groundSpeed,
                flightPlan // can be null
            };
        }

        const packet = JSON.stringify({
            type: 'ENRICHED_AIRCRAFT_DATA',
            data: enrichedData
        });

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(packet);
            }
        });

    } catch (err) {
        console.error('Error fetching aircraft data:', err.message);
    }
}

setInterval(fetchAircraftData, POLL_INTERVAL_MS);
fetchAircraftData();

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});