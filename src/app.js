const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const PORT = 4000;
const API_URL = 'https://24data.ptfs.app/acft-data';
const POLL_INTERVAL_MS = 3000;
const FLIGHTPLAN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MISSING_AC_TTL_MS = 120 * 1000; // 30 seconds
const lastSeenMap = new Map(); // key: playerName, value: last seen timestamp

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const altitudeThreshold = 100;
const groundSpeedThreshold = 100;
let isOnGround = null;

app.use(express.static('public'));
app.use(cors()); // allow all origins

const path = require('path');
const fs = require('fs');

app.get('/approaches/:icao', (req, res) => {
    const airport = req.params.icao.toUpperCase();
    const folder = path.join(__dirname, '..', 'public', 'assets', 'maps', airport);

    fs.readdir(folder, (err, files) => {
        if (err) return res.status(404).json({ error: `Airport not found, ${folder}` });

        const svgs = files.filter(f => f.endsWith('.svg') && f.toUpperCase() !== 'GROUND.SVG');
        res.json(svgs);
    });
});

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
        const now = Date.now();

        const currentPlayers = new Set();

        for (const [callsign, ac] of Object.entries(rawData)) {
            const playerName = ac.playerName;
            if (playerName) {
                currentPlayers.add(playerName);
                lastSeenMap.set(playerName, now); // update last seen time
            }

            const flightPlan = playerName ? flightPlanMap.get(playerName) ?? null : null;
            const flightStatus = updateFlightStatus(callsign, ac, flightPlan);

            isOnGround = ac.altitude < altitudeThreshold && ac.groundSpeed < groundSpeedThreshold;

            enrichedData[callsign] = {
                heading: ac.heading,
                altitude: ac.altitude,
                playerName: playerName,
                aircraftType: ac.aircraftType,
                position: ac.position,
                speed: ac.speed,
                wind: ac.wind,
                isOnGround: isOnGround,
                isTaxiing: ac.isOnGround,
                groundSpeed: ac.groundSpeed,
                flightPlan,
                flightStatus
            };
        }

        // Remove flight plans for missing aircraft (> 60 sec)
        for (const [playerName, lastSeen] of lastSeenMap.entries()) {
            if (!currentPlayers.has(playerName) && now - lastSeen > MISSING_AC_TTL_MS) {
                flightPlanMap.delete(playerName);
                lastSeenMap.delete(playerName);
                console.log(`Removed flight plan for ${playerName} (missing > 60s)`);
            }
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

const aircraftStates = {}; // keyed by callsign

function stationaryFor(callsign, ms) {
    const s = aircraftStates[callsign];
    return s && Date.now() - s.lastPositionTime >= ms;
}

function updateFlightStatus(callsign, ac, flightPlan) {
    if (!flightPlan) return "No FLP";
    if (!aircraftStates[callsign]) {
        aircraftStates[callsign] = {
            lastState: "parked",
            lastPositionTime: Date.now(),
            cruiseAltitude: flightPlan?.flightlevel ? flightPlan.flightlevel * 100 : null,
            lastAltitude: ac.altitude,
            lastOnGround: ac.isOnGround,
            lastFlightPlanCallsign: flightPlan?.callsign || null
        };
    }

    const s = aircraftStates[callsign];
    let state = s.lastState;

    const cruiseAlt = s.cruiseAltitude || (flightPlan?.flightlevel ? flightPlan.flightlevel * 100 : null);

    // Detect new flight plan (reset landed lock)
    const newPlan = flightPlan?.callsign && flightPlan.callsign !== s.lastFlightPlanCallsign;
    if (newPlan) {
        s.lastFlightPlanCallsign = flightPlan.callsign;
        if (state === "landed") {
            state = "parked"; // start parked
        }
    }

    // Update stationary timer
    if (ac.groundSpeed < 1 && ac.isOnGround) {
        // stationary
    } else {
        s.lastPositionTime = Date.now();
    }

    // Handle sticky landed
    if (state === "landed") {
        if (stationaryFor(callsign, 5 * 60 * 1000)) {
            state = "parked";
        }
        if (ac.isOnGround) {
            // If still landed and no new plan, don't change
            s.lastAltitude = ac.altitude;
            s.lastOnGround = ac.isOnGround;
            s.lastState = state;
            return state;
        } 
    }

    // State logic
    if (ac.isOnGround) {
        if (!s.lastOnGround && ac.altitude < 50) {
            state = "landed";
        } else if (ac.groundSpeed > 1) {
            state = "taxiing";
        } else if (stationaryFor(callsign, 5 * 60 * 1000)) {
            state = "parked";
        }
    } else {
        if (ac.altitude > s.lastAltitude + 50 && cruiseAlt && ac.altitude < cruiseAlt - 500) {
            state = "climbing";
        } else if (cruiseAlt && Math.abs(ac.altitude - cruiseAlt) <= 500) {
            state = "cruising";
        } else if (ac.altitude < s.lastAltitude - 50 && cruiseAlt && ac.altitude < cruiseAlt - 500) {
            state = "descending";
        }
        if (isNaN(cruiseAlt)) {
            state = "inFlight";
        }
    }

    // Save changes
    s.lastState = state;
    s.lastAltitude = ac.altitude;
    s.lastOnGround = ac.isOnGround;

    return state;
}

setInterval(fetchAircraftData, POLL_INTERVAL_MS);
fetchAircraftData();

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});