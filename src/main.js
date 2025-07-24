//html elements
const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');
const airspaceButton = document.getElementById('airspace-bounds');
const displayButton = document.getElementById('display-button');
const resizer = document.getElementById('resizer');

//websocket localhost port
const PORT = 4000;

let zuluTime = false;
let airspaceBoundsVisible = true;
let sideDisplayToggle = false;
let isDragging = false;

// Update time display every second
function updateTime() {
    const now = new Date();
    timeDisplay.textContent = zuluTime
        ? now.toUTCString().split(' ')[4] + ' UTC'
        : now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

timeButton.addEventListener('click', () => {
    zuluTime = !zuluTime;
    timeButton.textContent = zuluTime ? 'UTC' : 'LOCAL';
    updateTime();
});

airspaceButton.addEventListener('click', () => {
    airspaceBoundsVisible = !airspaceBoundsVisible;
    document.getElementById('boundaries-svg').style.display = airspaceBoundsVisible ? 'block' : 'none';
    airspaceButton.style.background = airspaceBoundsVisible ? '#4d4d4d' : '#3E3E3E';
    airspaceButton.style.border = airspaceBoundsVisible ? '2px solid #4B5DA3' : 'none';
});

displayButton.addEventListener('click', () => {
    sideDisplayToggle = !sideDisplayToggle;
    document.getElementById('map-svg').style.width = sideDisplayToggle ? '50vw' : '100vw';
    document.getElementById('side-display').style.width = sideDisplayToggle ? '50vw' : '0';
    document.getElementById('resizer').style.width = sideDisplayToggle ? '1px' : '0';
    displayButton.innerText = sideDisplayToggle ? '<' : '>';
});

//webSocket client to receive aircraft data
const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.onmessage = event => {
    const data = JSON.parse(event.data);
    console.clear();
    updateAircraftLayer(data);
    /*console.log('=== Aircraft Data ===');
    for (const callsign in data) {
        const acft = data[callsign];
        console.log(`\nCallsign: ${callsign}`);
        console.log(`  Player: ${acft.playerName}`);
        console.log(`  Type: ${acft.aircraftType}`);
        console.log(`  Alt: ${acft.altitude} ft`);
        console.log(`  Speed: ${acft.speed} knots`);
        console.log(`  Position: x=${acft.position.x}, y=${acft.position.y}`);
    }*/
};
socket.onerror = err => console.error('WebSocket error:', err);

function createPlaneIcon(player = '0', callsign = '0', alt = '0', speed = '0', heading = '0', type = '0') {
    const planeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    planeIcon.setAttribute('id', player);
    planeIcon.setAttribute('callsign', callsign);
    planeIcon.setAttribute('alt', alt);
    planeIcon.setAttribute('speed', speed);
    planeIcon.setAttribute('heading', heading);
    planeIcon.setAttribute('type', type);
    return planeIcon;
}

//aircraft fetures
let aircraftElements = {}; // Maps aircraft ID to <g> element

function updateAircraftLayer(aircraftData) {
    const newIds = new Set();

    for (const [id, info] of Object.entries(aircraftData)) {
        const { x, y } = info.position;
        newIds.add(id);
        
        let group = aircraftElements[id];
    }

    // Remove aircraft no longer in the data
    for (const id in aircraftElements) {
        if (!newIds.has(id)) {
            const group = aircraftElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete aircraftElements[id];
        }
    }

    console.log(newIds.info);
}

//fetch main SVG
fetch('assets/coast.svg')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load SVG: ' + response.status);
        }
        return response.text();
    })
    .then(async svgText => {
        svgText = svgText.replace(/(fill|stroke)="[^"]*"/g, '');
        container.innerHTML += svgText;

        const svg = container.querySelector('svg');
        if (!svg) throw new Error('No <svg> element found in file');

        svg.setAttribute('id', 'map-svg');

        //get viewBox
        const viewBox = svg.viewBox.baseVal;

        //screen center the SVG
        const bbox = svg.getBBox();
        viewBox.width = bbox.width;
        viewBox.height = bbox.height;
        viewBox.x = -viewBox.width / 2;
        viewBox.y = -viewBox.height / 2;
        let initalviewBoxwidth = viewBox.width;
        let initalviewBoxheight = viewBox.height;

        svg.appendChild(createPlaneIcon());

        window.addEventListener('resize', () => {
            //update viewBox refence size
            const bbox = svg.getBBox();
            viewBox.width = bbox.width;
            viewBox.height = bbox.height;
            viewBox.x = -viewBox.width / 2;
            viewBox.y = -viewBox.height / 2;
            initalviewBoxwidth = viewBox.width;
            initalviewBoxheight = viewBox.height;
        });
        
        let isPanning = false;
        let start = { x: 0, y: 0};

        svg.addEventListener('mousedown', e => {
            if (e.button === 2) {
                isPanning = true;
                start = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            }
        });

        svg.addEventListener('mousemove', e => {
            if (!isPanning) return;

            const rect = container.getBoundingClientRect();

            //calculate scale factors
            const scaleX = viewBox.width / Math.min(rect.width, initalviewBoxwidth);
            const scaleY = viewBox.height / Math.min(rect.height, initalviewBoxheight);

            const dxScreen = e.clientX - start.x;
            const dyScreen = e.clientY - start.y;
            const dx = dxScreen * scaleX;
            const dy = dyScreen * scaleY;

            //update viewBox position
            viewBox.x -= dx;
            viewBox.y -= dy;

            //update start point
            start.x = e.clientX;
            start.y = e.clientY;
        });

        svg.addEventListener('mouseup', e => {
            if (e.button === 2) {
            isPanning = false;
            }
        });
        svg.addEventListener('mouseleave', () => {
            isPanning = false;
        });

        //prevent context menu on right click
        svg.addEventListener('contextmenu', e => {
            e.preventDefault();
        });

        svg.addEventListener('wheel', e => {
            e.preventDefault();

            const zoomIntensity = 0.1;
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            //calculate relative position
            const rect = svg.getBoundingClientRect();
            const zoomPointX = viewBox.x + (e.clientX - rect.left) / rect.width * viewBox.width;
            const zoomPointY = viewBox.y + (e.clientY - rect.top) / rect.height * viewBox.height;

            //zoom in or out
            const delta = e.deltaY < 0 ? 1 - zoomIntensity : 1 + zoomIntensity;
            viewBox.width *= delta;
            viewBox.height *= delta;

            //adjust x/y so zoom is centered on cursor
            viewBox.x = zoomPointX - (mouseX / svg.clientWidth) * viewBox.width;
            viewBox.y = zoomPointY - (mouseY / svg.clientHeight) * viewBox.height;
        });
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
    });

//fetch boundaries SVG
fetch('assets/boundaries.svg')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load SVG: ' + response.status);
        }
        return response.text();
    })
    .then(async boundariesText => {
        const svg = document.getElementById('map-svg')
        svg.innerHTML += boundariesText;

        const boundaries = svg.querySelector('svg');
        if (!boundaries) throw new Error('No <svg> element found in file');

        boundaries.setAttribute('id', 'boundaries-svg');

    })
    .catch(err => {
        console.error(err);
        container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
    });

/*fetch rings SVG **currently disabled
fetch('assets/rings.svg')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load SVG: ' + response.status);
        }
        return response.text();
    })
    .then(async ringsText => {
        const svg = document.getElementById('boundaries-svg')
        svg.innerHTML += ringsText;

        const rings = svg.querySelector('svg');
        if (!rings) throw new Error('No <svg> element found in file');

        rings.setAttribute('id', 'rings-svg');

        const inner = document.createElementNS("http://www.w3.org/2000/svg", "g");
        inner.setAttribute("transform", "translate(0, 100)"); // <-- Your offset here
        while (rings.firstChild) {
            inner.appendChild(rings.firstChild);
        }
        rings.appendChild(inner);

        svg.appendChild(rings); // Append to the main map SVG

    })
    .catch(err => {
        console.error(err);
        container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
    }); */