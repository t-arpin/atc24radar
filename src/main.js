import AirlineMapJson from "/src/data/AirlineMap.js";
import AcftTypeMapJson from "/src/data/AcftTypeMap.js";
import CallsignMapJson from "/src/data/callsignMap.js";
import StationMap from "/src/data/StationMap.js";
import AirportNamesMap from "/src/data/AirportNamesMap.js";
import AircraftIconMap from "/src/data/AircraftIconMap.js";
import AircraftScaleMap from "/src/data/AircraftScaleMap.js";
import GroundOffsets from "/src/data/GroundOffsets.js";

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
const groundContainer = document.getElementById('ground-svg-container');
const sidePanelBackButton = document.getElementById('side-panel-back');

//maps
const airlineMap = new Map(Object.entries(AirlineMapJson));
const acftTypeMap = new Map(Object.entries(AcftTypeMapJson));
const callsignMap = new Map(Object.entries(CallsignMapJson));
const stationMap = new Map(Object.entries(StationMap));
const airportNamesMap = new Map(Object.entries(AirportNamesMap));
const aircraftIconMap = new Map(Object.entries(AircraftIconMap));
const aircraftScaleMap = new Map(Object.entries(AircraftScaleMap));
const groundOffsetsMap = new Map(Object.entries(GroundOffsets));

//svg
const inFlightSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" /></svg>`;
const onGroundSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane-inflight"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 11.085h5a2 2 0 1 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3l4 7z" /><path d="M3 21h18" /></svg>`;

//websocket localhost port
const PORT = 4000;

let zuluTime = false;
let airspaceBoundsVisible = true;
let sideDisplayToggle = false;
let groundDisplayToggle = false;
let isDraggingLabel = { bool: false, label: null};
let isDraggingOverlay = false;
let currentZoom = 1;
let groundCurrentZoom = 0.04;
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
let isMeasuring = false;
let measuringline = null;
let textStart = null;
let textEnd = null;
let measuringLineStart = null;
let textDistance = null;

const aircraftTrails = {};
const maxTrailLength = 15;

fetchMapLayer(container);

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
    if (info.flightPlan != null){
        infoOverlay.querySelector('#route-container').innerHTML = `
            <div id="departure" class="route">
                ${info.flightPlan.departing}
                <span class="airport-name">${airportNamesMap.get(info.flightPlan.departing)}</span>
            </div>
            <div id="arival" class="route">
                ${info.flightPlan.arriving}
                <span class="airport-name">${airportNamesMap.get(info.flightPlan.arriving)}</span>
            </div>
            <div id="plane-icon-container"></div>`
    } else {
        infoOverlay.querySelector('#route-container').innerHTML = `<div id="departure" class="route">N/A<span class="airport-name">Not available</span></div><div id="arival" class="route">N/A<span class="airport-name">Not available</span></div><div id="plane-icon-container"></div>`;
    }

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
    if (groundDisplayToggle) {
        groundContainer.innerHTML = '';
        loadGroundDisplay();
    }
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
    
    document.querySelector('#station-info').innerHTML = `
        ${stationCenter}-${stationType}
        <select id="station-type">
            <option value="CTR">null</option>
            <option value="GND">null</option>
        </select>
        `;
}

function loadGroundChartSVG(airportSelector) {
    if (!groundDisplayToggle) {
        return;
    }
    const folder = airportSelector.value;
    const svgPath = `assets/maps/${folder}/GROUND.svg`;

    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load ground SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            // Remove existing ground SVG
            const existing = document.getElementById('groundCenter-svg');
            if (existing) {
                existing.parentNode.removeChild(existing);
            }

            const mapSvg = document.getElementById('ground-map-svg');
            mapSvg.innerHTML += svgText; 

            const loaded = mapSvg.querySelector('svg:last-of-type');
            if (!loaded) throw new Error('No <svg> element found in GROUND.svg');

            loaded.setAttribute('id', 'groundCenter-svg');

        })
        .catch(err => {
            console.error(err);
            alert('Error loading groundview: ' + err.message);
        });
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
    if (groundSvg) {
        groundSvg.style.display = groundViewVisible ? 'block' : 'none';
    }

    groundButton.style.background = groundViewVisible ? '#4d4d4d' : '#3E3E3E';
    groundButton.style.border = groundViewVisible ? '3px solid #4B5DA3' : 'none';
});

displayButton.addEventListener('click', () => {
    sideDisplayToggle = !sideDisplayToggle;
    container.style.width = sideDisplayToggle ? '50vw' : '100vw';
    document.getElementById('side-display').style.width = sideDisplayToggle ? '50vw' : '0';
    document.getElementById('resizer').style.width = sideDisplayToggle ? '1px' : '0';
    displayButton.innerText = sideDisplayToggle ? '<' : '>';
    //hide all child elements of side-display
    const childElements = document.querySelectorAll('#side-display > *');
    childElements.forEach(child => {
        if (child != groundContainer && child != sidePanelBackButton) {
            child.style.display = sideDisplayToggle && !groundDisplayToggle ? 'block' : 'none';
        }
    });
    sidePanelBackButton.style.display = sideDisplayToggle && groundDisplayToggle ? 'block' : 'none';
});

groundDisplayButton.addEventListener("click", () => {
    groundDisplayToggle = !groundDisplayToggle;
    groundDisplayButton.style.display = 'none'; 
    chartsButton.style.display = 'none';
    groundContainer.style.width = '100%';
    sidePanelBackButton.style.display = 'block';
    loadGroundDisplay()
});

sidePanelBackButton.addEventListener("click", () => {
    groundContainer.innerHTML = '';
    groundDisplayToggle = false;
    groundDisplayButton.style.display = 'block'; 
    chartsButton.style.display = 'block';
    groundContainer.style.width = '0%';
    sidePanelBackButton.style.display = 'none';
});

function loadGroundDisplay(){
    fetchMapLayerGround(groundContainer);
    loadGroundChartSVG(airportSelector);
}

//webSocket client to receive aircraft data
const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.onmessage = event => {
    const message = JSON.parse(event.data);

    if (message.type === 'ENRICHED_AIRCRAFT_DATA') {
        const enrichedAircraftMap = message.data; // object with callsign keys
        aircraftData = enrichedAircraftMap;
        updateAircraftLayer(enrichedAircraftMap);
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

        const flightPlan = info.flightPlan

        /*  const flightrules = flightPlan.flightrules;
            const departing = flightPlan.departing;
            const arriving = flightPlan.arriving;
            const route = flightPlan.route;
            const flightlevel = flightPlan.flightlevel; */

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

            const planeIcon = getPlaneIcon(type, group, heading);

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("fill", "white");
            label.setAttribute("font-size", labelFontSize);
            label.setAttribute('font-size', labelFontSize * currentZoom);
            label.classList.add("aircraft-label");
            label.setAttribute('id', "aircraft-label");
            label.setAttribute("x", defaultLabelOffset * currentZoom); // offset for label
            label.setAttribute("y", 2 * currentZoom); // offset for label
            label.setAttribute('pinned', 'false');

            const connector = document.createElementNS("http://www.w3.org/2000/svg", "line")
            connector.setAttribute("stroke", "white");
            connector.setAttribute("stroke-width", 0.5);
            connector.classList.add("label-connector");

            //event listeners for moveing
            label.addEventListener('mousedown', e => {
                if (e.button == 0){
                    isDraggingLabel = { bool: true, label: label};
                    start = { x: e.clientX, y: e.clientY };
                    e.preventDefault();
                }
                if (e.button == 1){
                    const pin = label.getAttribute('pinned') == 'false' ? 'true' : 'false';
                    label.setAttribute('pinned', pin);
                    updateLabel(group, info, id);
                }
            });

            document.addEventListener('mousemove', e => {
                if (isDraggingLabel.bool == true) labelMove(e, label, svg, group, start);
                if (isMeasuring == true) {
                    const pt = svg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                    updateMeasuringTool(svgP.x, svgP.y);
                }
            });

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

        //update icon
        rotatePlaneIcon(group, heading);

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
        }
    }

    //console.log(aircraftElements);
}

function getPlaneIcon(type, group, heading) {
    const svgPath = `assets/plane-Icons/${aircraftIconMap.get(type)}.svg`;

    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load plane SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            // Parse SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;

            // Apply fill color
            const paths = svgElement.querySelectorAll('path');
            paths.forEach(path => {
                path.style.fill = 'red';
            });

            // Use viewBox to center icon
            const vb = svgElement.viewBox.baseVal;
            const cx = vb.x + vb.width / 2;
            const cy = vb.y + vb.height / 2;

            const scale = aircraftScaleMap.get(aircraftIconMap.get(type)) || 1;

            // Wrap and transform: move center to 0,0 and apply scale
            const innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            innerG.setAttribute('transform', `translate(${-cx*scale}, ${-cy*scale}) scale(${scale})`);
            innerG.appendChild(svgElement);

            // 2. Create outer <g> to rotate around center
            const outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            outerG.setAttribute('transform', `rotate(${heading})`);
            outerG.setAttribute('id', 'rotater');
            outerG.appendChild(innerG);

            // Insert under existing children
            group.insertBefore(outerG, group.firstChild);
        })
        .catch(err => {
            console.error('Error loading plane icon:', err);
        });
}

function rotatePlaneIcon(group, heading){
    const rotater = group.querySelector('#rotater');
    if (rotater == null) return;
    rotater.setAttribute('transform', `rotate(${heading})`);
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
    const text = group.querySelector("text");
    const bbox = text.getBBox();
    const connector = group.querySelector(".label-connector");
    const label = group.querySelector(".aircraft-label");

    connector.setAttribute("stroke-width", 0.5 * currentZoom);

    const circleCenter = { x: 0, y: 0 }; // center of group is (0, 0)
    if (text.querySelector("#tspan2") != null) {
        const textWidth = text.querySelector("#tspan2").getBBox().width;

        if (textAlign == 'start') {
        textAlign = bbox.x > 0 ? 'start' : 'end';
        } else {
            textAlign = bbox.x + textWidth > 0 ? 'start' : 'end';
        }
            
        text.setAttribute('text-anchor', textAlign);
    }


    const fromX = bbox.x >= 0 ? bbox.x : bbox.x + textWidth;
    const fromY = bbox.y + 18 * currentZoom;

    // Set line attributes (converted into group-relative coords)
    connector.setAttribute("x1", fromX);
    connector.setAttribute("y1", fromY);
    connector.setAttribute("x2", circleCenter.x);
    connector.setAttribute("y2", circleCenter.y);
}

function updateLabel(group, info, id){
    const text = group.querySelector("text");
    const label = group.querySelector(".aircraft-label");
    const connector = group.querySelector(".label-connector");

    if (info.isOnGround && currentZoom > 0.09651739612301583 && label.getAttribute('pinned') == 'false') {

        text.innerHTML = '';
        label.setAttribute('display', 'none');
        connector.setAttribute('display', 'none');
        return;
    }
    label.setAttribute('display', 'block');
    connector.setAttribute('display', 'block');

    let color = 'white'

    if (info.flightPlan != null){
        if (info.flightPlan.departing == airportSelector.value){
            color = '#48b8fb';
        }
        if (info.flightPlan.arriving == airportSelector.value){
            color = '#fce241';
        }
    }
    
    text.setAttribute("fill", color);
    
    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];

    const star = group.querySelector(".aircraft-label").getAttribute('pinned') == 'true' ? ' ★' : '';

    text.innerHTML = `
        <tspan dx="0" dy="0em" id="tspan1">${callsignMap.get(carrier) + number + star}</tspan>
        <tspan dx="0" dy="0em" id="tspan2">${info.altitude}ftㅤ${info.speed}kt</tspan>
    `;

    const tspan1 = text.querySelector("#tspan1").getBBox().width;
    const tspan2 = text.querySelector("#tspan2").getBBox().width;

    // Now update the text content with aligned tspans
    text.innerHTML = `
        <tspan id="tspan1" dx="0" dy="0em">${callsignMap.get(carrier) + number  + star}</tspan>
        <tspan id="tspan2" dx="-${(tspan1 + 6 * currentZoom)}" dy="1.2em">${info.altitude}ftㅤ${info.speed}kt</tspan>
        <tspan id="tspan3" dx="-${(tspan2 + 6 * currentZoom)}" dy="1.2em">${info.heading}°ㅤㅤ${acftTypeMap.get(info.aircraftType)}</tspan>
    `;
}

window.addEventListener('resize', () => {
    updateAircraftLayer(aircraftData);
});

function updateMeasuringTool(x, y){
    if (measuringline == null) return;
    measuringline.setAttribute("x2", x);
    measuringline.setAttribute("y2", y);
    measuringline.setAttribute("stroke-width", 1 * currentZoom);

    const dx = x - measuringLineStart.x;
    const dy = y - measuringLineStart.y;
    const heading = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const oppositeHeading = (heading + 180) % 360;
    
    const factor = dx > 0 ? 1 : -1;
    
    textStart.textContent = `${Math.round(heading)}°`;
    textStart.setAttribute("x", measuringLineStart.x - (20*factor) * currentZoom);
    textStart.setAttribute("y", measuringLineStart.y + 4 * currentZoom);
    textStart.setAttribute("font-size", 12 * currentZoom);

    textEnd.textContent = `${Math.round(oppositeHeading)}°`;
    textEnd.setAttribute("x", x + (20*factor) * currentZoom);
    textEnd.setAttribute("y", y + 4 * currentZoom);
    textEnd.setAttribute("font-size", 12 * currentZoom);

    // Distance in px, then convert to NM
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distStuds = distPx * 100; // 100 studs per px
    const distNM = distStuds / 3307.14286;
    textDistance.textContent = `${distNM.toFixed(2)} NM`;
    textDistance.setAttribute("x", (measuringLineStart.x + x) / 2);
    textDistance.setAttribute("y", (measuringLineStart.y + y) / 2);
    textDistance.setAttribute("font-size", 12 * currentZoom);
}

function fetchMapLayerGround(container) {
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

            svg.setAttribute('id', 'ground-map-svg');

            const allShapes = svg.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');

            allShapes.forEach(el => {
                // Remove Inkscape-style inline fill and style
                //el.removeAttribute('style');

                el.setAttribute('fill', '#000000');
            });

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
            
            //rotate
            const rotation = groundOffsetsMap.get(airportSelector.value).r;
            svg.style.transform = `rotate(${rotation}deg)`

            //zoom in or out
            let maxZoom = groundOffsetsMap.get(airportSelector.value).zoom;
            groundCurrentZoom = maxZoom;
            viewBox.x = groundOffsetsMap.get(airportSelector.value).x; 
            viewBox.y = groundOffsetsMap.get(airportSelector.value).y;

            viewBox.width *= groundCurrentZoom;
            viewBox.height *= groundCurrentZoom;
            let initViewBoxWidth = viewBox.width;
            let initViewBoxHeight = viewBox.height;
            
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

                // --- Apply rotation correction ---
                const rad = -rotation * Math.PI / 180; // negative to go from screen → map
                const rotatedDx = dx * Math.cos(rad) - dy * Math.sin(rad);
                const rotatedDy = dx * Math.sin(rad) + dy * Math.cos(rad);

                // Update viewBox position using rotated deltas
                viewBox.x -= rotatedDx;
                viewBox.y -= rotatedDy;

                //update start point
                start.x = e.clientX;
                start.y = e.clientY;
                //console.log(`"${airportSelector.value}": { zoom: ${groundCurrentZoom}, x: ${viewBox.x}, y: ${viewBox.y}, r: ${degOffset} },`);
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
                const delta = e.deltaY < 0 ? 1 - zoomIntensity : 1 + zoomIntensity;
                groundCurrentZoom *= delta;

                if (groundCurrentZoom >= maxZoom) {
                    groundCurrentZoom = maxZoom;
                    viewBox.x = groundOffsetsMap.get(airportSelector.value).x; 
                    viewBox.y = groundOffsetsMap.get(airportSelector.value).y;
                    viewBox.width = initViewBoxWidth;
                    viewBox.height = initViewBoxHeight;
                    return;
                }

                const centerX = viewBox.x + viewBox.width / 2;
                const centerY = viewBox.y + viewBox.height / 2;

                viewBox.width *= delta;
                viewBox.height *= delta;

                viewBox.x = centerX - viewBox.width / 2;
                viewBox.y = centerY - viewBox.height / 2;
                
            });
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
        });
}

function fetchMapLayer(container) {
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
            console.log(container);
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

            //measuring tool
            svg.addEventListener('dblclick', (e) => {
                if (e.target.getAttribute('id') === 'tspan1' || e.target.getAttribute('id') === 'tspan2' || e.target.getAttribute('id') === 'tspan3') return;

                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                const x = svgP.x;
                const y = svgP.y;

                if (!isMeasuring) {
                    console.log('creating')
                    measuringLineStart = { x, y };

                    measuringline = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    measuringline.setAttribute("x1", x);
                    measuringline.setAttribute("y1", y);
                    measuringline.setAttribute("x2", x);
                    measuringline.setAttribute("y2", y);
                    measuringline.setAttribute("stroke", "yellow");
                    measuringline.setAttribute("stroke-width", "1");

                    textStart = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textStart.setAttribute("fill", "white");
                    textStart.setAttribute("font-size", "12px");
                    textStart.setAttribute("text-anchor", "middle");

                    textEnd = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textEnd.setAttribute("fill", "white");
                    textEnd.setAttribute("font-size", "12px");
                    textEnd.setAttribute("text-anchor", "middle");

                    textDistance = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textDistance.setAttribute("fill", "white");
                    textDistance.setAttribute("font-size", "12px");
                    textDistance.setAttribute("text-anchor", "middle");

                    svg.appendChild(measuringline);
                    svg.appendChild(textStart);
                    svg.appendChild(textEnd);
                    svg.appendChild(textDistance);

                    isMeasuring = true;
                } else {
                    // Clear all elements and reset state
                    svg.removeChild(measuringline);
                    svg.removeChild(textStart);
                    svg.removeChild(textEnd);
                    svg.removeChild(textDistance);
                    measuringline = textStart = textEnd = null;
                    measuringLineStart = null;
                    isMeasuring = false;
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
                //console.log(currentZoom);
                //console.log('x', viewBox.x, ' y', viewBox.y);
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
}

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