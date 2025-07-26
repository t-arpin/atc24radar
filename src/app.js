const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const http = require('http');

const PORT = 4000;
const API_URL = 'https://24data.ptfs.app/acft-data';
const POLL_INTERVAL_MS = 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve frontend files
app.use(express.static('public'));

let latestAircraftData = {};

// === Function to fetch aircraft data via REST ===
async function fetchAircraftData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        latestAircraftData = data;

        // Broadcast aircraft data to all connected frontend clients
        broadcastToClients({ type: 'AIRCRAFT_DATA', data });

    } catch (err) {
        console.error('Error fetching aircraft data:', err.message);
    }
}

// === Broadcast wrapper ===
function broadcastToClients(message) {
    const payload = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// === Setup polling for aircraft data ===
setInterval(fetchAircraftData, POLL_INTERVAL_MS);
fetchAircraftData(); // Initial fetch

// === Connect to 24data WebSocket for flight plans ===
const externalWS = new WebSocket('wss://24data.ptfs.app/wss');

// On connection open
externalWS.on('open', () => {
    console.log('Connected to 24data WebSocket for flight plans');
});

// On receiving a message
externalWS.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        const { t: type, d: payload } = msg;

        if (type === 'FLIGHT_PLAN') {
            console.log(`Received ${type}:`, payload);

            // Broadcast flight plan to frontend
            broadcastToClients({
                type,
                data: payload
            });
        }

    } catch (err) {
        console.error('Error parsing flight plan data:', err.message);
    }
});

// Handle external WebSocket errors
externalWS.on('error', err => {
    console.error('WebSocket error (flight plan):', err.message);
});

externalWS.on('close', () => {
    console.warn('24data flight plan WebSocket closed');
});

// === Start server ===
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});