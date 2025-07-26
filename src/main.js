import AirlineMapJson from "/src/data/AirlineMap.js";
import AcftTypeMapJson from "/src/data/AcftTypeMap.js";
import CallsignMapJson from "/src/data/callsignMap.js";
import StationMap from "/src/data/StationMap.js";

//html elements
const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');
const airspaceButton = document.getElementById('airspace-bounds');
const displayButton = document.getElementById('display-button');
const resizer = document.getElementById('resizer');
const groundButton = document.getElementById('ground-button');
const chartsButton = document.getElementById('charts-button');
const groundAircraftButton = document.getElementById('ground-aircraft');
const airportSelector = document.getElementById('airport-dropdown');
const groundDisplayButton = document.getElementById('groundview-button');
const infoOverlay = document.getElementById('info-overlay');
const closeButton = document.getElementById('close-icon');

//maps
const airlineMap = new Map(Object.entries(AirlineMapJson));
const acftTypeMap = new Map(Object.entries(AcftTypeMapJson));
const callsignMap = new Map(Object.entries(CallsignMapJson));
const stationMap = new Map(Object.entries(StationMap));

//svg
const inFlightSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" /></svg>`;
const onGroundSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane-inflight"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 11.085h5a2 2 0 1 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3l4 7z" /><path d="M3 21h18" /></svg>`;

//websocket localhost port
const PORT = 4000;

let zuluTime = false;
let airspaceBoundsVisible = true;
let sideDisplayToggle = false;
let isDraggingLabel = { bool: false, label: null};
let isDraggingOverlay = false;
let currentZoom = 1;
let labelFontSize = 10;
let aircraftData = {};
let groundAircraftHidden = false;
let labelPadding = 50;
let defaultLabelOffset = 5;
let groundViewVisible = false;
let currentGroundSvg = null;
let start = { x: 0, y: 0};
let offsetInfoOverlay = { x: 0, y: 0 };
let curentAircraftId = null;
let textAlign = 'start';
const aircraftTrails = {};
const maxTrailLength = 15;

window.addEventListener('load', function() {
    loadAirportData(airportSelector);
});

// Update time display every second
function updateTime() {
    const now = new Date();
    timeDisplay.textContent = zuluTime
        ? now.toUTCString().split(' ')[4] + ' UTC'
        : now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

infoOverlay.addEventListener('mousedown', e => {
    if (e.button == 0){
        isDraggingOverlay = true;
        start = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }
});

infoOverlay.addEventListener('mousemove', e => {
    if (!isDraggingOverlay) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    infoOverlay.style.transform = `translate(${offsetInfoOverlay.x + dx}px, ${offsetInfoOverlay.y + dy}px)`;
});

document.addEventListener('mouseup', () => {
    if (isDraggingOverlay) {
        const style = window.getComputedStyle(infoOverlay).transform;
        const matrix = new DOMMatrix(style);
        offsetInfoOverlay.x = matrix.m41;
        offsetInfoOverlay.y = matrix.m42;
    }
    isDraggingOverlay = false;
});

function displayOverlay(id, info) {
    if (curentAircraftId == id){
        curentAircraftId = null;
        infoOverlay.style.display = 'none'
        return;
    } else {
        curentAircraftId = id;
        infoOverlay.style.display = 'block'
    }

    updateOverlay(id, info)
}

function updateOverlay(id, info) {
    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];

    const icon = info.isOnGround ? onGroundSVG : inFlightSVG;

    infoOverlay.querySelector('#callsign-bar').innerHTML = callsignMap.get(carrier) + number;
    infoOverlay.querySelector('#player-name').innerHTML = info.playerName;
    infoOverlay.querySelector('#aircraft-tag').innerHTML = acftTypeMap.get(info.aircraftType);
    infoOverlay.querySelector("#detailed-info").innerHTML = `
                <span style="margin-bottom: 4px;">${airlineMap.get(carrier)}</span>
                <span>Aircraft Type : (${acftTypeMap.get(info.aircraftType)})</span>
                <span>${info.aircraftType}</span>
                <hr style="width: 100%;"></hr>
                <div style="display: flex; justify-content: space-between;">
                    <span>Altitude: ${info.altitude}ft</span>
                    <span >Heading: ${info.heading}°</span>
                    <span >Speed: ${info.speed}kt</span>
                </div>
    `;
    infoOverlay.querySelector('#plane-icon-container').innerHTML = icon;
}

airportSelector.addEventListener('change', () => {
    loadAirportData(airportSelector);
});

function loadAirportData(airportSelector) {
    const folder = airportSelector.value;
    const svgPath = `assets/maps/${folder}/GROUND.svg`;

    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load ground SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            // Remove existing ground SVG
            const existing = document.getElementById('groundview-svg');
            if (existing) {
                existing.parentNode.removeChild(existing);
            }

            const mapSvg = document.getElementById('boundaries-svg');
            mapSvg.innerHTML += svgText;

            const loaded = mapSvg.querySelector('svg:last-of-type');
            if (!loaded) throw new Error('No <svg> element found in GROUND.svg');

            loaded.setAttribute('id', 'groundview-svg');
            loaded.style.display = groundViewVisible ? 'block' : 'none';

            const allShapes = loaded.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');

            allShapes.forEach(el => {
                // Remove Inkscape-style inline fill and style
                el.removeAttribute('fill');
                el.removeAttribute('style');

                // Set a clean white stroke and no fill
                el.setAttribute('fill', 'none');
                el.setAttribute('stroke', '#000000');
                el.setAttribute('stroke-width', currentZoom * 1); // Adjust stroke thickness as needed
            
            });

            document.addEventListener('wheel', e => {
                const allShapes = loaded.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');

                allShapes.forEach(el => {
                    // Remove Inkscape-style inline fill and style
                    el.removeAttribute('fill');
                    el.removeAttribute('style');

                    // Set a clean white stroke and no fill
                    el.setAttribute('fill', 'none');
                    el.setAttribute('stroke', '#000000');
                    el.setAttribute('stroke-width', currentZoom * 1); // Adjust stroke thickness as needed
                });
            });
        })
        .catch(err => {
            console.error(err);
            alert('Error loading groundview: ' + err.message);
        });
    
    const stationCenter = stationMap.get(folder);
    const stationType = 'CTR';
    console.log(stationCenter);
    
    document.querySelector('#station-info').innerHTML = `
        ${stationCenter}-${stationType}
        <select id="station-type">
            <option value="CTR">null</option>
            <option value="GND">null</option>
        </select>
        `;
}

timeButton.addEventListener('click', () => {
    zuluTime = !zuluTime;
    timeButton.textContent = zuluTime ? 'UTC' : 'LOCAL';
    updateTime();
});

airspaceButton.addEventListener('click', () => {
    airspaceBoundsVisible = !airspaceBoundsVisible;
    document.getElementById('boundaries-svg').style.display = airspaceBoundsVisible ? 'block' : 'none';
    airspaceButton.style.background = airspaceBoundsVisible ? '#4d4d4d' : '#3E3E3E';
    airspaceButton.style.border = airspaceBoundsVisible ? '3px solid #4B5DA3' : 'none';
});

groundAircraftButton.addEventListener('click', () => {
    groundAircraftHidden = !groundAircraftHidden;
    updateAircraftLayer(aircraftData);
    groundAircraftButton.style.background = !groundAircraftHidden ? '#4d4d4d' : '#3E3E3E';
    groundAircraftButton.style.border = !groundAircraftHidden ? '3px solid #4B5DA3' : 'none';
});

closeButton.addEventListener('click', () => {
    curentAircraftId = null;
    infoOverlay.style.display = 'none';
});

groundButton.addEventListener('click', () => {
    groundViewVisible = !groundViewVisible;

    const groundSvg = document.getElementById('groundview-svg');
    console.log(groundSvg);
    if (groundSvg) {
        groundSvg.style.display = groundViewVisible ? 'block' : 'none';
    }

    groundButton.style.background = groundViewVisible ? '#4d4d4d' : '#3E3E3E';
    groundButton.style.border = groundViewVisible ? '3px solid #4B5DA3' : 'none';
});

displayButton.addEventListener('click', () => {
    sideDisplayToggle = !sideDisplayToggle;
    document.getElementById('map-svg').style.width = sideDisplayToggle ? '50vw' : '100vw';
    document.getElementById('side-display').style.width = sideDisplayToggle ? '50vw' : '0';
    document.getElementById('resizer').style.width = sideDisplayToggle ? '1px' : '0';
    displayButton.innerText = sideDisplayToggle ? '<' : '>';
    //hide all child elements of side-display
    const childElements = document.querySelectorAll('#side-display > *');
    childElements.forEach(child => {
        child.style.display = sideDisplayToggle ? 'block' : 'none';
    });
});

//webSocket client to receive aircraft data
const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.onmessage = event => {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'AIRCRAFT_DATA':
            aircraftData = message.data;
            updateAircraftLayer(aircraftData);
            break;

        case 'FLIGHT_PLAN':
            console.log('Received flight plan:', message.data);
            // Optionally update UI or store the flight plan data
            break;

        default:
            console.warn('Unknown message type:', message.type);
    }
};

socket.onerror = err => console.error('WebSocket error:', err);

//aircraft fetures
let aircraftElements = {}; // Maps aircraft ID to <g> element

function updateAircraftLayer(aircraftData) {
    const newIds = new Set();
    const svg = document.getElementById('map-svg');

    let trailsLayer = document.getElementById('trails-layer');
    if (!trailsLayer) {
        trailsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trailsLayer.setAttribute('id', 'trails-layer');
        svg.appendChild(trailsLayer); // ensures it's above the map and other background layers
    }

    let start = { x: 0, y: 0};

    for (const [id, info] of Object.entries(aircraftData)) {
        //extract aircraft info
        const heading = info.heading;
        const player = info.playerName;
        const altitude = info.altitude;
        const type = info.aircraftType;
        const { x, y } = info.position;
        const speed = info.speed;
        const isOnGround = info.isOnGround;

        newIds.add(id);

        let group = aircraftElements[id];

        if (!group) {
            // Create new group for aircraft + label
            console.log(`Creating new group for aircraft ${id}`);
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('id', `ac-${id}`);

            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            icon.setAttribute('r', 2);
            icon.setAttribute('r', parseFloat(icon.getAttribute('r')) * currentZoom);
            icon.setAttribute('fill', 'red');
            icon.classList.add('aircraft-icon');

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("fill", "white");
            label.setAttribute("font-size", labelFontSize);
            label.setAttribute('font-size', labelFontSize * currentZoom);
            label.classList.add("aircraft-label");
            label.setAttribute("x", defaultLabelOffset * currentZoom); // offset for label
            label.setAttribute("y", 2 * currentZoom); // offset for label

            const connector = document.createElementNS("http://www.w3.org/2000/svg", "line")
            connector.setAttribute("stroke", "white");
            connector.setAttribute("stroke-width", 0.5);
            connector.classList.add("label-connector");

            //event listeners for moveing
            label.addEventListener('mousedown', e => {
                if (e.button == 0){
                    isDraggingLabel = { bool: true, label: label};
                    start = { x: e.clientX, y: e.clientY };
                    console.log(start);
                    e.preventDefault();
                }
            });

            document.addEventListener('mousemove', e => labelMove(e, label, svg, group, start));

            document.addEventListener('mouseup', e => {
                isDraggingLabel.bool = false;
            });

            label.addEventListener("dblclick", function () {
                displayOverlay(id, info);
            });

            group.appendChild(icon);
            group.appendChild(label);
            group.insertBefore(connector, group.firstChild);
            svg.appendChild(group);

            aircraftElements[id] = group;

            document.addEventListener('wheel', e => {
                updateLabel(group, info, id);
                document.querySelectorAll('.trail').forEach(trail => {
                    trail.setAttribute('stroke-width', 1 * currentZoom);
                });
                updateConnector(group);
            });
        }

        //update position
        group.setAttribute('transform', `translate(${x/100}, ${y/100})`);

        group.querySelectorAll

        //handle trails only if aircraft is not on the ground
        if (!isOnGround) {
            if (!aircraftTrails[id]) {
                aircraftTrails[id] = [];
            }

            aircraftTrails[id].push({ x: x / 100, y: y / 100 });

            if (aircraftTrails[id].length > maxTrailLength) {
                aircraftTrails[id].shift();
            }

            drawTrail(id, aircraftTrails[id]);
        } else {          
            // If on ground, remove any existing trail
            const trail = document.getElementById(`trail-${id}`);
            if (trail && trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
            delete aircraftTrails[id];
        }

        //hide/show ground aircraft
        group.style.display = groundAircraftHidden && isOnGround ? 'none' : 'block';

        //label stuff
        updateLabel(group, info, id);

        if (id == curentAircraftId){
            updateOverlay(id, info);
        }
    }

    // Remove aircraft no longer in the data
    for (const id in aircraftElements) {
        if (!newIds.has(id)) {
            const group = aircraftElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete aircraftElements[id];
            console.log(`Removed aircraft ${id}`);

            // Also remove trail
            const trail = document.getElementById(`trail-${id}`);
            if (trail && trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }

            delete aircraftTrails[id];
            console.log(`Removed aircraft ${id}`);
        }
    }

    //console.log(aircraftElements);
}

function labelMove(e, label, svg, group, start){
    if (!isDraggingLabel.bool || isDraggingLabel.label != label) {
        return;
    }
    let adjustX = 1;
    let adjustY = 1;
    
    if (window.innerWidth < svg.getAttribute('width')) {
            adjustX = svg.getAttribute('width') / window.innerWidth;
    }

    if (window.innerHeight < svg.getAttribute('height')) {
            adjustY = svg.getAttribute('height') / window.innerHeight;
    }

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    start.x = e.clientX;
    start.y = e.clientY;

    const x = parseFloat(label.getAttribute('x')) + dx * currentZoom * adjustX;
    const y = parseFloat(label.getAttribute('y')) + dy * currentZoom * adjustY;
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    console.log(dx, dy);

    //connector
    updateConnector(group);
}

function drawTrail(id, points) {
    const svg = document.getElementById('map-svg');
    let path = document.getElementById(`trail-${id}`);
    const trailsLayer = document.getElementById('trails-layer');

    if (!path) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `trail-${id}`);
        path.classList.add("trail");
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'cyan');
        path.setAttribute('stroke-width', 0.5 * currentZoom);
        trailsLayer.appendChild(path);
    }

    // Only render latest segment or full if trail is short
    if (points.length < 2) return;

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x},${points[i].y}`;
    }

    path.setAttribute('d', d);
}

function updateConnector(group){
    const text = group.querySelector("text")
    const bbox = text.getBBox();
    const connector = group.querySelector(".label-connector")

    connector.setAttribute("stroke-width", 0.5 * currentZoom);

    const circleCenter = { x: 0, y: 0 }; // center of group is (0, 0)
    const textWidth = text.querySelector("#tspan2").getBBox().width;

    if (textAlign == 'start') {
        textAlign = bbox.x > 0 ? 'start' : 'end';
    } else {
        textAlign = bbox.x + textWidth > 0 ? 'start' : 'end';
    }
        
    text.setAttribute('text-anchor', textAlign);

    const fromX = bbox.x >= 0 ? bbox.x : bbox.x + textWidth;
    const fromY = bbox.y + 18 * currentZoom;

    // Set line attributes (converted into group-relative coords)
    connector.setAttribute("x1", fromX);
    connector.setAttribute("y1", fromY);
    connector.setAttribute("x2", circleCenter.x);
    connector.setAttribute("y2", circleCenter.y);
}

function updateLabel(group, info, id){
    const text = group.querySelector("text")

    if (info.isOnGround && currentZoom > 0.09651739612301583) {

        text.innerHTML = '';
        return;
    }

    const color = info.isOnGround ? '#48b8fb' : 'white';
    text.setAttribute("fill", color);
    
    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];


    text.innerHTML = `
        <tspan dx="0" dy="0em" id="tspan1">${callsignMap.get(carrier) + number}</tspan>
        <tspan dx="0" dy="0em" id="tspan2">${info.altitude}ftㅤ${info.speed}kt</tspan>
    `;

    const tspan1 = text.querySelector("#tspan1").getBBox().width;
    const tspan2 = text.querySelector("#tspan2").getBBox().width;

    // Now update the text content with aligned tspans
    text.innerHTML = `
        <tspan dx="0" dy="0em">${callsignMap.get(carrier) + number}</tspan>
        <tspan id="tspan2" dx="-${(tspan1 + 6 * currentZoom)}" dy="1.2em">${info.altitude}ftㅤ${info.speed}kt</tspan>
        <tspan dx="-${(tspan2 + 6 * currentZoom)}" dy="1.2em">${info.heading}°ㅤㅤ${acftTypeMap.get(info.aircraftType)}</tspan>
    `;
}

window.addEventListener('resize', () => {
    updateAircraftLayer(aircraftData);
});

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

        const aircraftLayer = document.createElement('div');
        aircraftLayer.setAttribute('id', 'aircraft-layer');

        svg.appendChild(aircraftLayer);

        /*
        window.addEventListener('resize', () => {
            //update viewBox refence size
            const bbox = svg.getBBox();
            viewBox.width = bbox.width;
            viewBox.height = bbox.height;
            viewBox.x = -viewBox.width / 2;
            viewBox.y = -viewBox.height / 2;
            initalviewBoxwidth = viewBox.width;
            initalviewBoxheight = viewBox.height;
        }); */
        
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

            const planeIcons = svg.querySelectorAll('.aircraft-icon');

            planeIcons.forEach(child => {
                child.setAttribute('r', parseFloat(child.getAttribute('r')) * delta);
            });

            const labels = svg.querySelectorAll('.aircraft-label');
            labels.forEach(label => {
                label.setAttribute('font-size', label.getAttribute('font-size') * delta);
                label.setAttribute("x", label.getAttribute('x') * delta); 
                label.setAttribute("y", label.getAttribute('y') * delta); 
            });

            currentZoom *= delta;
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