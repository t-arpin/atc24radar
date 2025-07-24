const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const PORT = 4000;
const API_URL = 'https://24data.ptfs.app/acft-data';
const POLL_INTERVAL_MS = 3000;

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Serve frontend files
app.use(express.static('public'));

let latestData = {};

async function fetchAircraftData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        latestData = data;

        // Broadcast to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });

    } catch (err) {
        console.error('Error fetching data:', err.message);
    }
}

// Poll every 3 seconds
setInterval(fetchAircraftData, POLL_INTERVAL_MS);
fetchAircraftData(); // Initial fetch

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
