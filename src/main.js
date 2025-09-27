import AirlineMapJson from "../src/data/AirlineMap.js";
import AcftTypeMapJson from "../src/data/AcftTypeMap.js";
import CallsignMapJson from "../src/data/CallsignMap.js";
import StationMap from "../src/data/StationMap.js";
import AircraftIconMap from "../src/data/AircraftIconMap.js";
import AircraftScaleMap from "../src/data/AircraftScaleMap.js";
import GroundOffsets from "../src/data/GroundOffsets.js";
import fixes from '../src/data/fixes.js';
import airportInfo from '../src/data/AirportInfo.js';

//html elements
const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');
const displayButton = document.getElementById('display-button');
const resizer = document.getElementById('resizer');
const groundButton = document.getElementById('ground-button');
const groundAircraftButton = document.getElementById('ground-aircraft');
const airportSelector = document.getElementById('airport-dropdown');
const infoOverlay = document.getElementById('info-overlay');
const fullWideButton = document.getElementById('full-wide-button');
const sideDisplay = document.getElementById('side-display');
const sidePanelContent = document.getElementById('side-panel-content');
const sideButton1 = document.getElementById('side-window-1-button');
const sideButton2 = document.getElementById('side-window-2-button');
const settingsButton = document.getElementById('settings-button');
const airspaceBoundsCheck = document.getElementById('bounds-check');
const fontSizeInput = document.getElementById('font-size-input');
const fontSizeInputGround = document.getElementById('font-size-input-ground');
const fixFontSizeInput = document.getElementById('fix-font-size');
const fixSizeInput = document.getElementById('fix-size');

//maps
const airlineMap = new Map(Object.entries(AirlineMapJson));
const acftTypeMap = new Map(Object.entries(AcftTypeMapJson));
const callsignMap = new Map(Object.entries(CallsignMapJson));
const stationMap = new Map(Object.entries(StationMap));
const aircraftIconMap = new Map(Object.entries(AircraftIconMap));
const aircraftScaleMap = new Map(Object.entries(AircraftScaleMap));
const groundOffsetsMap = new Map(Object.entries(GroundOffsets));

//svg
let fixSize = 12;
const inFlightSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" /></svg>`;
const onGroundSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane-inflight"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 11.085h5a2 2 0 1 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3l4 7z" /><path d="M3 21h18" /></svg>`;
const fixSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${fixSize}" height="${fixSize}" fill="white" class="bi bi-triangle" viewBox="0 0 16 16"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/></svg>`;
const vortacSVG = `<svg fill="#ffffffff" width="${fixSize}" height="${fixSize}" viewBox="0 0 32 32" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1 {fill: none;}</style></defs><circle cx="16" cy="14" r="2"/><path d="M29.8682,10.5039l-4-7a.9992.9992,0,0,0-1.3828-.3613L19.7231,6H12.2769L7.5146,3.1426a.9992.9992,0,0,0-1.3828.3613l-4,7a1,1,0,0,0,.3536,1.3535l4.7758,2.8657L11,21.2656V27a1,1,0,0,0,1,1h8a1,1,0,0,0,1-1V21.2656l3.7388-6.5425,4.7758-2.8657A1,1,0,0,0,29.8682,10.5039ZM18.8484,21H13.1516L8.5757,12.9922,11.4287,8h9.1426l2.853,4.9922Z" transform="translate(0 0)"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32" transform="translate(32 32) rotate(-180)"/></svg>`;
const vordmeSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="${fixSize}" height="${fixSize}" viewBox="0 0 185.20833 158.75" version="1.1" id="svg1" xml:space="preserve"><defs id="defs1"></defs><g id="layer1" transform="translate(-5.9005295,-54.13221)"><g id="g1" transform="matrix(6.6145833,0,0,6.6145833,-7.3286368,27.673878)" style="fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.00006;stroke-dasharray:none;stroke-opacity:1"><circle cx="16" cy="16" r="2" id="circle1" style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.00006;stroke-dasharray:none;stroke-opacity:1"/><path class="cls-1" d="M 30,6 A 2.0023,2.0023 0 0 0 28,4 H 4 A 2.0023,2.0023 0 0 0 2,6 v 20 a 2.0023,2.0023 0 0 0 2,2 h 24 a 2.0023,2.0023 0 0 0 2,-2 z M 28,12.9258 22.9636,6 H 28 Z M 27.7637,16 20.491,26 H 11.509 L 4.2363,16 11.509,6 h 8.982 z M 9.0364,6 4,12.9248 V 6 Z M 4,19.0752 9.0364,26 H 4 Z M 22.9636,26 28.001,19.0737 28,26 Z" id="path1" style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.00006;stroke-dasharray:none;stroke-opacity:1"/></g></g></svg>`;

//websocket localhost port
const PORT = 4000;

let zuluTime = false;
let isDraggingLabel = { bool: false, label: null };
let isDraggingGroundLabel = { bool: false, label: null };
let isDraggingOverlay = false;
let currentZoom = 1;
let groundCurrentZoom = 0.04;
let labelFontSize = 10;
let groundLabelFontSize = 12;
let aircraftData = {};
let groundAircraftHidden = false;
let defaultLabelOffset = 5;
let groundViewVisible = false;
let start = { x: 0, y: 0 };
let curentAircraftId = null;
let textAlign = 'start';
let isMeasuring = false;
let measuringline = null;
let textStart = null;
let textEnd = null;
let fixFontSize = 8;
let currentAtisCode = "Atis Error";
let measuringLineStart = null;
let textDistance = null;
let previousChartTransform = null;
let groundAircraftElements = {}; // Maps aircraft ID to <g> element
let target;
let currentStations = new Set();;
currentStations.add(airportSelector.value)

const aircraftTrails = {};
const maxTrailLength = 15;

window.addEventListener('load', function () {
    fetchMapLayer(container);
    atisLetter(airportSelector.value);
});

function runOnMapLoad() {
    loadAirportData(airportSelector);
    document.querySelectorAll('.overlay').forEach(el => {
        overlaySetup(el);
    });
    loadApproachList(airportSelector.value);
    fetchData();
    loadTopDown();
}

// Update time display every second
function updateTime() {
    const now = new Date();
    timeDisplay.textContent = zuluTime
        ? now.toUTCString().split(' ')[4] + ' UTC'
        : now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

function getHighestZIndex() {
    const overlays = document.querySelectorAll('.overlay');
    let highest = 0;
    overlays.forEach(el => {
        const z = parseInt(window.getComputedStyle(el).zIndex, 10);
        if (!isNaN(z) && z > highest) {
            highest = z;
        }
    });
    return highest;
}

function overlaySetup(overlay){
    let currentX;
    let currentY;
    overlay.style.zIndex = '100';

    overlay.addEventListener('mousedown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.button == 0) {
            isDraggingOverlay = true;
            target = overlay;
            start = { x: e.clientX, y: e.clientY };
            const match = overlay.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
            currentX = match ? parseFloat(match[1]) : 0;
            currentY = match ? parseFloat(match[2]) : 0;
            e.preventDefault();
            overlay.style.zIndex = getHighestZIndex() + 1;
        }
    });

    let lastX;
    let lastY;
    document.addEventListener('mousemove', e => {
        if (!isDraggingOverlay || target != overlay || overlay.id == 'changes-overlay') return;

        let x;
        let y;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        x = currentX + dx + parseInt(getComputedStyle(overlay).getPropertyValue('left'), 10) < 0 || currentX + dx + parseInt(getComputedStyle(overlay).getPropertyValue('left'), 10) + overlay.offsetWidth > window.innerWidth ? lastX : currentX + dx;
        y = currentY + dy + parseInt(getComputedStyle(overlay).getPropertyValue('top'), 10) < 0 || currentY + dy + parseInt(getComputedStyle(overlay).getPropertyValue('top'), 10) + overlay.offsetHeight > window.innerHeight ? lastY : currentY + dy;
        
        overlay.style.transform = `translate(${x}px, ${y}px)`;
        lastX = x
        lastY = y
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingOverlay) {
            const style = window.getComputedStyle(overlay).transform;
            const matrix = new DOMMatrix(style);
        }
        isDraggingOverlay = false;
    });
    
    const closeButton = overlay.querySelector('.close-svg');

    closeButton.addEventListener('click', () => {
        curentAircraftId = null;
        closeButton.parentElement.classList.remove('show');
    });
}

function displayOverlay(id, info) {
    if (curentAircraftId == id) {
        curentAircraftId = null;
        overlay.classList.remove('show');
        return;
    } else {
        curentAircraftId = id;
        infoOverlay.classList.add('show');
    }
    updateOverlay(id, info)
}

function updateOverlay(id, info) {
    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];

    const icon = info.isOnGround || info.isTaxiing ? onGroundSVG : inFlightSVG;
    if (info.flightPlan != null) {
        const fp = info.flightPlan;
        infoOverlay.querySelector('#route-container').innerHTML = `
            <div id="departure" class="route">
                ${fp.departing}
                <span class="airport-name">${airportInfo[fp.departing].name}</span>
            </div>
            <div id="arrival" class="route">
                ${fp.arriving}
                <span class="airport-name">${airportInfo[fp.arriving].name}</span>
            </div>
            <div id="plane-icon-container"></div>`;

        infoOverlay.querySelector('#flight-plan').innerHTML = `
            <div id="details-spacer"></div>
            <div id="fp-info">
                <span>Callsign⠀⠀⠀⠀⠀: ${fp.callsign}</span>
                <span>Filed Cruise : FL${fp.flightlevel}</span>
                <span>Flight Rules : ${fp.flightrules}</span>
                <span>Route⠀⠀⠀⠀⠀⠀⠀⠀: ${fp.route}</span>
                <span>Status⠀⠀⠀⠀⠀⠀⠀: ${info.flightStatus}</span>
            </div>
        `;
    } else {
        infoOverlay.querySelector('#route-container').innerHTML = `<div id="departure" class="route">N/A<span class="airport-name">Not available</span></div><div id="arival" class="route">N/A<span class="airport-name">Not available</span></div><div id="plane-icon-container"></div>`;
        infoOverlay.querySelector('#flight-plan').innerHTML = `<div id="details-spacer"></div><div id="fp-info"><span>Callsign⠀⠀⠀⠀⠀: No FLP</span><span>Filed Cruise : No FLP</span><span>Flight Rules : No FLP</span><span>Status⠀⠀⠀⠀⠀⠀⠀: No FLP</span></div>`;
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



function drawFixes() {
    //delete existing
    document.querySelectorAll('.fix-svg').forEach(el => el.remove());

    const svg = document.getElementById('fix-container');
    let svgContent = '';

    fixes.forEach(fix => {
        // Translate coordinates
        const x = fix.x / 33.4 + 20;
        const y = fix.y / 33.4 + 12;

        let icon;

        if (fix.type == 'waypoint') {
            icon = fixSVG;
        } else if (fix.type == 'vortac') {
            icon = vortacSVG;
        } else if (fix.type == 'vordme') { 
            icon = vordmeSVG;
        }
        // Your custom SVG for a fix (as a string), using a <g> with transform
        const customSVG = `
            <g transform="translate(${x - fixSize}, ${y - fixSize})" class="fix-svg">
                ${icon}
                <text x="${2 * currentZoom}" y="${-2 * currentZoom}" fill="white" font-size="${fixFontSize * currentZoom}">${fix.identifier}</text>
            </g>
        `;

        svgContent += customSVG;
    });

    // Assign all at once
    svg.innerHTML += svgContent;

    fixSize = parseFloat(fixSizeInput.value)/10;
    document.querySelectorAll('.fix-svg').forEach(el => {
        el.querySelector('svg').setAttribute('width', fixSize * currentZoom);
        el.querySelector('svg').setAttribute('height', fixSize * currentZoom);
    });
}

airportSelector.addEventListener('change', () => {
    document.getElementById('airport-dropdown-app').value = airportSelector.value
    fetchAtisLetter(airportSelector.value);
});

function updateAirportSelector() {
    loadAirportData(airportSelector);
    groundAircraftElements = {};
    document.querySelectorAll('#ground-container').forEach(cont => {
        loadGroundDisplay(cont.parentElement);
    });
    document.querySelectorAll('#chart-container').forEach(cont => {
        addAirportChart(cont.parentElement);
        previousChartTransform = null;
    });
    document.querySelector('#departures-table tbody').innerHTML = '';
    departuresElements = {};
    departuresTimestamps = {};
    updateDepartures(aircraftData);
    loadRunwayOptions();
    MultiselectDropdown();
    generateATIS();
    loadApproachList(airportSelector.value);
    currentStations = new Set();
    currentStations.add(airportSelector.value);
    loadTopDown();
}

document.getElementById('airport-dropdown-app').addEventListener('change', () => {
    loadApproachList(document.getElementById('airport-dropdown-app').value);
    airportSelector.value = document.getElementById('airport-dropdown-app').value
    updateAirportSelector()
});

function loadAirportData(airportSelector) {
    const folder = airportSelector.value;
    const svgPath = `public/assets/maps/${folder}/GROUND.svg`;

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
            setTimeout(() => {
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
            }, 100);
        })
        .catch(err => {
            console.error(err);
            alert('Error loading groundview: ' + err.message);
        });

    
    const stationCenter = stationMap.get(folder);
    const stationType = airportInfo[folder].frequency.CTR == null ? 'TWR' : 'CTR';
    document.querySelector('#station-info').innerHTML = `${stationCenter}-${stationType} (${currentAtisCode})`
    /*
    document.querySelector('#station-info').innerHTML = `
        ${stationCenter}-${stationType}
        <select id="station-type">
            <option value="CTR">null</option>
            <option value="GND">null</option>
        </select>
        `;*/
}

function loadGroundChartSVG(airportSelector, cont) {
    const folder = airportSelector.value;
    const svgPath = `public/assets/maps/${folder}/GROUND.svg`;
    const mapSvg = cont.querySelector('#ground-map-svg');

    // Helper: parse text into SVG element
    const parseSVG = (svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        return doc.documentElement;
    };

    // Remove existing ground SVG
    const existing = cont.querySelector('#groundCenter-svg');
    if (existing) {
        existing.parentNode.removeChild(existing);
    }

    const existingTaxi = cont.querySelector('#taxiwaysCenter-svg');
    if (existingTaxi) {
        existing.parentNode.removeChild(existingTaxi);
    }

    // Fetch GROUND.svg
    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load ground SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            const loaded = parseSVG(svgText);
            loaded.setAttribute('id', 'groundCenter-svg');

            // Manipulate layers
            const getLayer = (label) => {
                return Array.from(loaded.querySelectorAll('g')).find(el => el.getAttribute('inkscape:label') === label);
            };

            // Style Taxiway Lines
            const taxiwaysLines = getLayer('Taxiway Lines');
            if (taxiwaysLines) {
                taxiwaysLines.querySelectorAll('path, rect, circle, polygon, polyline, ellipse').forEach(el => {
                    el.removeAttribute('fill');
                    el.removeAttribute('style');
                    el.setAttribute('fill', 'none');
                    el.setAttribute('stroke', '#927d16');
                    el.setAttribute('stroke-width', 0.03 * groundCurrentZoom / groundOffsetsMap.get(folder).zoom);
                });
            }

            document.addEventListener('wheel', () => {
                const taxiwaysLines = getLayer('Taxiway Lines');
                if (taxiwaysLines) {
                    taxiwaysLines.querySelectorAll('path, rect, circle, polygon, polyline, ellipse').forEach(el => {
                        el.setAttribute('stroke-width', 0.03 * groundCurrentZoom / groundOffsetsMap.get(folder).zoom);
                    });
                }
            })

            // Style Taxiways
            const taxiways = getLayer('Taxiways / Ramps');
            if (taxiways) {
                taxiways.querySelectorAll('path, rect, circle, polygon, polyline, ellipse').forEach(el => {
                    el.removeAttribute('fill');
                    el.removeAttribute('style');
                    el.setAttribute('fill', '#2e2e2eff');
                });
            }

            // Style Buildings and Runways
            const buildings = getLayer('Runways / Buildings');
            if (buildings) {
                buildings.querySelectorAll('path, rect, circle, polygon, polyline, ellipse').forEach(el => {
                    el.removeAttribute('fill');
                    el.removeAttribute('style');
                    el.setAttribute('fill', '#0e0e0eff');
                    el.setAttribute('stroke', 'none');
                    el.setAttribute('stroke-width', 0.5 * groundCurrentZoom);
                });
            }

            mapSvg.appendChild(loaded); // Add GROUND.svg first

            // Now fetch and append taxiways.svg
            return fetch(`public/assets/maps/${folder}/TAXIWAYS.svg`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load taxiways SVG: ' + response.status);
            }
            return response.text();
        })
        .then(taxiwaysText => {
            const taxiwaysSVG = parseSVG(taxiwaysText);
            taxiwaysSVG.setAttribute('id', 'taxiwaysCenter-svg');
            mapSvg.appendChild(taxiwaysSVG);
            
            
            const textElements = Array.from(taxiwaysSVG.querySelectorAll('g')).find(el => el.getAttribute('id')).querySelectorAll('text');
            textElements.forEach(el => {
                const baseFontSize = 0.4;
                el.setAttribute('style', `font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:${baseFontSize * groundCurrentZoom / groundOffsetsMap.get(folder).zoom}px;font-family:Montserrat;-inkscape-font-specification:Montserrat;text-align:start;writing-mode:lr-tb;direction:ltr;text-anchor:start;fill:#999999;fill-opacity:1;stroke-width:1;stroke-dasharray:none`);
            });
            document.addEventListener('wheel', () => {
                textElements.forEach(el => {
                    const baseFontSize = 0.4;
                    el.setAttribute('style', `font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:${baseFontSize * groundCurrentZoom / groundOffsetsMap.get(folder).zoom}px;font-family:Montserrat;-inkscape-font-specification:Montserrat;text-align:start;writing-mode:lr-tb;direction:ltr;text-anchor:start;fill:#999999;fill-opacity:1;stroke-width:1;stroke-dasharray:none`);
                });
            });            
        })
        .catch(err => {
            console.error(err);
            console.log('Error loading groundview: ' + err.message);
        });
}

//tool to rotate taxiway labels
function updateTaxiwayLabelRotation(cameraRotationDeg) {
    const taxiwaysSvg = document.querySelector('#taxiwaysCenter-svg');

    if (!taxiwaysSvg) return;

    const textElements = taxiwaysSvg.querySelectorAll('text');

    textElements.forEach(el => {
        const x = parseFloat(el.getAttribute('x')) || 0;
        const y = parseFloat(el.getAttribute('y')) || 0;

        // Counter-rotate to keep text upright
        const rotation = -cameraRotationDeg;

        el.setAttribute('transform', `rotate(${rotation}, ${x}, ${y})`);
    });
    downloadModifiedTaxiwaysSVG();
}

function downloadModifiedTaxiwaysSVG(filename = 'TAXIWAYS.svg') {
    const taxiwaysSvg = document.querySelector('#taxiwaysCenter-svg');
    if (!taxiwaysSvg) {
        alert('Taxiways SVG not found.');
        return;
    }

    // Clone the SVG so we don't mess with the live one
    const clone = taxiwaysSvg.cloneNode(true);

    // Create a full SVG wrapper with proper XML headers
    const svgWrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    // Copy attributes from original
    for (let attr of taxiwaysSvg.attributes) {
        svgWrapper.setAttribute(attr.name, attr.value);
    }

    svgWrapper.appendChild(clone);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgWrapper);

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create download link and trigger it
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
}

timeButton.addEventListener('click', () => {
    zuluTime = !zuluTime;
    timeButton.textContent = zuluTime ? 'UTC' : 'LOCAL';
    updateTime();
});

airspaceBoundsCheck.addEventListener('change', () => {
    document.getElementById('boundaries-svg').style.display = airspaceBoundsCheck.checked ? 'block' : 'none';
});

fontSizeInput.addEventListener('change', () => {
    labelFontSize = parseFloat(fontSizeInput.value)/10;
    updateAircraftLayer(aircraftData);
});

fontSizeInputGround.addEventListener('change', () => {
    groundLabelFontSize = parseFloat(fontSizeInputGround.value)/10;
    document.querySelectorAll('#ground-container').forEach(cont => {
        updateGroundAircraftLayer(aircraftData, cont);
    });
});

fixFontSizeInput.addEventListener('change', () => {
    fixFontSize = parseFloat(fixFontSizeInput.value)/10;
    document.querySelectorAll('.fix-svg').forEach(el => {
        el.querySelector('text').setAttribute('font-size', fixFontSize * currentZoom);
    });
});

fixSizeInput.addEventListener('change', () => {
    fixSize = parseFloat(fixSizeInput.value)/10;
    document.querySelectorAll('.fix-svg').forEach(el => {
        el.querySelector('svg').setAttribute('width', fixSize * currentZoom);
        el.querySelector('svg').setAttribute('height', fixSize * currentZoom);
    });
});

groundAircraftButton.addEventListener('click', () => {
    groundAircraftHidden = !groundAircraftHidden;
    document.querySelectorAll('.aircraft-group').forEach(group => {
        group.style.display = groundAircraftHidden && group.getAttribute('isOnGround') == 'true' ? 'none' : 'block';
    });
    groundAircraftButton.style.background = !groundAircraftHidden ? '#3e3e3e' : '#303030';
    groundAircraftButton.style.border = !groundAircraftHidden ? '3px solid #4B5DA3' : 'none';
});

groundButton.addEventListener('click', () => {
    groundViewVisible = !groundViewVisible;

    const groundSvg = document.getElementById('groundview-svg');
    if (groundSvg) {
        groundSvg.style.display = groundViewVisible ? 'block' : 'none';
    }

    groundButton.style.background = groundViewVisible ? '#3e3e3e' : '#303030';
    groundButton.style.border = groundViewVisible ? '3px solid #4B5DA3' : 'none';
});

displayButton.addEventListener('click', () => {
    if (sideDisplay.style.width == '100vw') {
        expandCollapse();
        return;
    }
    if (container.style.width == '50vw'){
        displayButton.style.left = '10px';
        container.style.width = '100vw';
        sideDisplay.style.width = '0';
        fullWideButton.style.display = 'none';
        sidePanelContent.style.display = 'none';
        resizer.style.width = '0';
        displayButton.innerText = '▶';
    } else {
        displayButton.style.left = `${(window.innerWidth / 2) + 10}px`;
        container.style.width = '50vw';
        sideDisplay.style.width = '50vw';
        fullWideButton.style.display = 'block';
        sidePanelContent.style.display = 'flex';
        resizer.style.width = '1px';
        displayButton.innerText = '◀';
    }
});

fullWideButton.addEventListener('click', () => {
    expandCollapse();
});

function expandCollapse() {
    if (sideDisplay.style.width == '100vw') {
        displayButton.style.left = `${(window.innerWidth / 2) + 10}px`;
        container.style.width = '50vw';
        sideDisplay.style.width = '50vw';
        resizer.style.width = '1px';
        fullWideButton.style.display = 'block';
    } else {
        displayButton.style.left = `${window.innerWidth - 40}px`;
        container.style.width = '0';
        sideDisplay.style.width = '100vw';
        resizer.style.width = '0';
        fullWideButton.style.display = 'none';
    }
}

sideButton1.addEventListener('click', () => {
    const sideWindow1 = document.getElementById('side-window-1');
    const sideWindow2 = document.getElementById('side-window-2');
    sideWindow1.style.height = sideWindow1.style.height == '50%' ? '100%' : '50%';
    sideWindow2.style.display = sideWindow2.style.display == 'flex' ? 'none' : 'flex';
    sideButton1.innerHTML = sideButton1.innerHTML == '▼' ? '▲' : '▼';
});

sideButton2.addEventListener('click', () => {
    const sideWindow1 = document.getElementById('side-window-1');
    const sideWindow2 = document.getElementById('side-window-2');
    sideWindow2.style.height = sideWindow2.style.height == '100%' ? '50%' : '100%';
    sideWindow1.style.display = sideWindow1.style.display == 'none' ? 'flex' : 'none';
    sideButton2.innerHTML = sideButton2.innerHTML == '▼' ? '▲' : '▼';
});

settingsButton.addEventListener('click', () => {
    const overlay = document.getElementById('settings-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('min-tool').addEventListener('click', () => {
    const topBar = document.getElementById('top-bar');
    topBar.style.cssText = document.getElementById('min-tool').checked ? `
        top: 0;
        left: 0;
        right 0;
        height: auto;
        width: 100vw;
        border-radius: 0;
        font-size: .7em;
    ` : 
    topBar.style.cssText = '';

    const backButton = document.getElementById('side-window-1').querySelector('.back-button');
    console.log(backButton);
    if (document.getElementById('min-tool').checked && backButton) {
        backButton.style.top = '50px';
    } else if (backButton) {
        backButton.style.top = '10px';
    }
});

document.getElementById('fix-button').addEventListener('click', () => {
    if (document.getElementById('fix-button').checked) {
        drawFixes();
    } else {
        document.querySelectorAll('.fix-svg').forEach(el => el.remove());
    }    
})

document.getElementById('notepad-icon').addEventListener('click', () => {
    const overlay = document.getElementById('notepad-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('departures-icon').addEventListener('click', () => {
    const overlay = document.getElementById('departures-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('arrivals-icon').addEventListener('click', () => {
    const overlay = document.getElementById('arrivals-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('atis-icon').addEventListener('click', () => {
    const overlay = document.getElementById('atis-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
    generateATIS();
});

document.getElementById('approach-button').addEventListener('click', () => {
    const overlay = document.getElementById('approach-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('vector-icon').addEventListener('click', () => {
    const overlay = document.getElementById('vector-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('station-icon').addEventListener('click', () => {
    const overlay = document.getElementById('station-overlay');
    overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
    overlay.style.zIndex = getHighestZIndex() + 1;
});

//station settings
function loadTopDown() {
    const stationToggles = document.getElementById('station-toggles');
    stationToggles.innerHTML = '';

    for (const [key, value] of stationMap) {
        if (value === airportSelector.value && key != airportSelector.value) {
            const label = document.createElement('label');
            label.setAttribute('for', `${key}-topdown`);
            label.style.fontSize = '.8em';
            label.style.marginRight = 'auto';
            label.textContent = key;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${key}-topdown`;

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    currentStations.add(key);
                } else {
                    currentStations.delete(key);
                }
            });
            const cont = document.createElement('div');
            cont.classList.add('topdown-div')
            cont.append(label);
            cont.append(checkbox);

            stationToggles.append(cont);
        }
    }
}

//runway assignment selector : 
var style = document.createElement('style');
style.setAttribute("id", "multiselect_dropdown_styles");

document.head.appendChild(style);

function loadRunwayOptions() {
    const dep = document.getElementById('depRwy');
    const arr = document.getElementById('arrRwy');
    dep.innerHTML = '';
    arr.innerHTML = '';
    for (const runway of airportInfo[airportSelector.value].runways) {
        const opt = document.createElement('option');
        opt.setAttribute('value', runway);
        opt.innerHTML = runway;
        dep.appendChild(opt);
    }
    for (const runway of airportInfo[airportSelector.value].runways) {
        const opt = document.createElement('option');
        opt.setAttribute('value', runway);
        opt.innerHTML = runway;
        arr.appendChild(opt);
    }
}

function MultiselectDropdown(options) {
    var config = {
        search: true,
        height: 'auto',
        placeholder: 'select',
        txtSelected: 'selected',
        txtAll: 'All',
        width: '100%',
        ...options
    };
    function newEl(tag, attrs) {
        var e = document.createElement(tag);
        if (attrs !== undefined) Object.keys(attrs).forEach(k => {
            if (k === 'class') { Array.isArray(attrs[k]) ? attrs[k].forEach(o => o !== '' ? e.classList.add(o) : 0) : (attrs[k] !== '' ? e.classList.add(attrs[k]) : 0) }
            else if (k === 'style') {
                Object.keys(attrs[k]).forEach(ks => {
                    e.style[ks] = attrs[k][ks];
                });
            }
            else if (k === 'text') { attrs[k] === '' ? e.innerHTML = '&nbsp;' : e.innerText = attrs[k] }
            else e[k] = attrs[k];
        });
        return e;
    }

    document.querySelectorAll('.multiselect-dropdown').forEach(el => el.remove());

    document.querySelectorAll("select[multiple]").forEach((el, k) => {
        var div = newEl('div', { class: 'multiselect-dropdown', style: { width: config.style?.width, padding: config.style?.padding ?? '' } });
        el.style.display = 'none';
        el.parentNode.insertBefore(div, el.nextSibling);
        var listWrap = newEl('div', { class: 'multiselect-dropdown-list-wrapper' });
        var list = newEl('div', { class: 'multiselect-dropdown-list', style: { height: config.height } });
        var search = newEl('input', { class: ['multiselect-dropdown-search'].concat([config.searchInput?.class ?? 'form-control']), style: { width: '100%', display: el.attributes['multiselect-search']?.value === 'true' ? 'block' : 'none' }, placeholder: 'search' });
        listWrap.appendChild(search);
        div.appendChild(listWrap);
        listWrap.appendChild(list);

        el.loadOptions = () => {
            list.innerHTML = '';

            if (el.attributes['multiselect-select-all']?.value == 'true') {
                var op = newEl('div', { class: 'multiselect-dropdown-all-selector' })
                var ic = newEl('input', { type: 'checkbox' });
                op.appendChild(ic);
                op.appendChild(newEl('label', { text: config.txtAll }));

                op.addEventListener('click', () => {
                    op.classList.toggle('checked');
                    op.querySelector("input").checked = !op.querySelector("input").checked;

                    var ch = op.querySelector("input").checked;
                    list.querySelectorAll("input").forEach(i => i.checked = ch);
                    Array.from(el.options).map(x => x.selected = ch);

                    el.dispatchEvent(new Event('change'));
                });
                ic.addEventListener('click', (ev) => {
                    ic.checked = !ic.checked;
                });

                list.appendChild(op);
            }

            Array.from(el.options).map(o => {
                var op = newEl('div', { class: o.selected ? 'checked' : '', optEl: o })
                var ic = newEl('input', { type: 'checkbox', checked: o.selected });
                op.appendChild(ic);
                op.appendChild(newEl('label', { text: o.text }));

                op.addEventListener('click', () => {
                    op.classList.toggle('checked');
                    op.querySelector("input").checked = !op.querySelector("input").checked;
                    op.optEl.selected = !!!op.optEl.selected;
                    el.dispatchEvent(new Event('change'));
                });
                ic.addEventListener('click', (ev) => {
                    ic.checked = !ic.checked;
                });

                list.appendChild(op);
            });
            div.listEl = listWrap;

            div.refresh = () => {
                div.querySelectorAll('span.optext, span.placeholder').forEach(t => div.removeChild(t));
                var sels = Array.from(el.selectedOptions);
                if (sels.length > (el.attributes['multiselect-max-items']?.value ?? 5)) {
                    div.appendChild(newEl('span', { class: ['optext', 'maxselected'], text: sels.length + ' ' + config.txtSelected }));
                }
                else {
                    sels.map(x => {
                        var c = newEl('span', { class: 'optext', text: x.text });
                        div.appendChild(c);
                    });
                }
                if (0 == el.selectedOptions.length) div.appendChild(newEl('span', { class: 'placeholder', text: el.attributes['placeholder']?.value ?? config.placeholder }));
            };
            div.refresh();
        }
        el.loadOptions();

        search.addEventListener('input', () => {
            list.querySelectorAll("div").forEach(d => {
                var txt = d.querySelector("label").innerText.toUpperCase();
                d.style.display = txt.includes(search.value.toUpperCase()) ? 'block' : 'none';
            });
        });

        div.addEventListener('click', () => {
            div.listEl.style.display = 'block';
            search.focus();
            search.select();
        });

        document.addEventListener('click', function (event) {
            
            if (!div.contains(event.target) && !event.target.classList.contains('atis-dropdown') ) {
                listWrap.style.display = 'none';
                div.refresh();
            }
        });
    });
}

window.addEventListener('load', () => {
    loadRunwayOptions();
    MultiselectDropdown();
});

//vectoring stuff
let hoveredVector = null;
const vectorStart = document.getElementById('vector-start');
const vectorClear = document.getElementById('vector-clear');
const vectorColor = document.getElementById('vector-color');
const vectorDistance = document.getElementById('vector-distance');
const vectorDirOnly = document.getElementById('vector-direction-only');

let doVectorDelete = true;

vectorStart.addEventListener('click', () => {
    vectorStart.innerHTML = vectorStart.innerHTML == 'Start' ? 'Stop' : 'Start';
    doVectorDelete = doVectorDelete ? false : true;
});

vectorClear.addEventListener('click', () => {
    document.getElementById('vector-container').innerHTML = '';
    isMeasuring = false;
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        if (hoveredVector) {
            hoveredVector.remove();
            hoveredVector = null; 
        }

        if (isMeasuring) {
            document.getElementById('vector-container').querySelector('.vector')?.remove();
            isMeasuring = false;
        }
    }
    if (e.key === 'Escape') {
        if (isMeasuring) {
            document.getElementById('vector-container').querySelector('.vector')?.remove();
            isMeasuring = false;
        }
    }
});

//saving and loading vectors
function extractVectorData() {
    const svg = document.getElementById("vector-container");
    if (!svg.innerHTML) {
        alert('No vectors to export'); 
        return;
    }
    const vectors = svg.querySelectorAll('.vector');
    const vectorData = [];

    vectors.forEach((vector) => {
        const color = vector.getAttribute('color');
        const distanceDisplayed = vector.getAttribute('distance') === 'true';
        const dirOnly = vector.getAttribute('dirOnly') === 'true';
        
        const line = vector.querySelector('line');
        const factor = parseFloat(line.getAttribute('factor'));
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));

        vectorData.push({
            color,
            distance_displayed: distanceDisplayed,
            dirOnly: dirOnly,
            factor: factor,
            coordinates: { x1, y1, x2, y2 }
        });
    });

    return vectorData;
}

document.getElementById('vector-export').addEventListener('click', () => {
    const vectorData = extractVectorData();
    if (!vectorData) return;
    const fileName = prompt("Enter the file name (without extension):", "vector_data");
      if (fileName) {
        const blob = new Blob([JSON.stringify(vectorData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.json`;  // Use the user-specified file name
        link.click();
      } else {
        alert("Export cancelled. No file name provided.");
      }
});

document.getElementById('vector-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    // When a file is selected, read it
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const vectorData = JSON.parse(e.target.result);
                console.log('Imported Data:', vectorData);
                createVectorElement(vectorData);
            };
            reader.readAsText(file);
        }
    };
    input.click();
});

function createVectorElement(vectorData) {
    vectorData.forEach(data => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'vector');

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", data.coordinates.x1);
        line.setAttribute("y1", data.coordinates.y1);
        line.setAttribute("x2", data.coordinates.x2);
        line.setAttribute("y2", data.coordinates.y2);
        line.setAttribute("stroke", data.color);
        group.setAttribute("color", data.color);
        line.setAttribute("stroke-width", 1 * currentZoom);
        line.setAttribute("id", "measuringline");
        line.setAttribute("factor", data.factor);

        const start = document.createElementNS("http://www.w3.org/2000/svg", "text");
        start.setAttribute("fill", "white");
        start.setAttribute("font-size", 12 * currentZoom);
        start.setAttribute("text-anchor", "middle");
        start.setAttribute("id", "textStart");

        const end = document.createElementNS("http://www.w3.org/2000/svg", "text");
        end.setAttribute("fill", "white");
        end.setAttribute("font-size", 12 * currentZoom);
        end.setAttribute("text-anchor", "middle");
        end.setAttribute("id", "textEnd");

        const dx = data.coordinates.x2 - data.coordinates.x1;
        const dy = data.coordinates.y2 - data.coordinates.y1;
        const heading = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        const oppositeHeading = (heading + 180) % 360;
        let distance = null;

        distance = document.createElementNS("http://www.w3.org/2000/svg", "text");
        distance.setAttribute("fill", "white");
        distance.setAttribute("font-size", 12 * currentZoom);
        distance.setAttribute("text-anchor", "middle");

        if (!data.dirOnly) {
            start.textContent = `${Math.round(heading)}°`;
            end.textContent = `${Math.round(oppositeHeading)}°`;
            group.setAttribute('dirOnly', false);

            if (data.distance_displayed) {
                const distPx = Math.sqrt(dx * dx + dy * dy);
                const distStuds = distPx * 100; // 100 studs per px
                const distNM = distStuds / 3307.14286;
                distance.textContent = `${distNM.toFixed(2)} NM`;
                group.setAttribute("distance", "true");
            } else {
                distance = document.createElementNS("http://www.w3.org/2000/svg", "text");
                distance.setAttribute("display", "none");
                group.setAttribute("distance", "false");
            }
        } else {
            distance.textContent = `${Math.round(heading)}`;
            group.setAttribute("dirOnly", true);
        }
            

        distance.setAttribute("x", (data.coordinates.x1 + data.coordinates.x2) / 2);
        distance.setAttribute("y", (data.coordinates.y1 + data.coordinates.y2) / 2);
        distance.setAttribute("font-size", 12 * currentZoom);

        document.addEventListener('wheel', () => {
            group.querySelector("line").setAttribute("stroke-width", 1 * currentZoom);
            group.querySelectorAll("text").forEach(text => {
                text.setAttribute("font-size", 12 * currentZoom);
            });

            const measuringline = group.querySelector("#measuringline");
            const textStart = group.querySelector("#textStart");
            textStart.setAttribute("x", parseFloat(measuringline.getAttribute("x1")) - (20 * data.factor) * currentZoom);
            textStart.setAttribute("y", parseFloat(measuringline.getAttribute("y1")) + 4 * currentZoom);

            const textEnd = group.querySelector("#textEnd");
            textEnd.setAttribute("x", parseFloat(measuringline.getAttribute("x2")) + (20 * data.factor) * currentZoom);
            textEnd.setAttribute("y", parseFloat(measuringline.getAttribute("y2")) + 4 * currentZoom);
        });

        group.addEventListener('mouseover', () => {
            hoveredVector = group;
        });

        // Track mouseout to clear the current hovered element
        group.addEventListener('mouseout', () => {
            if (hoveredVector === group) {
                hoveredVector = null;
            }
        });

        group.appendChild(line);
        group.appendChild(start);
        group.appendChild(end);
        group.appendChild(distance);

        group.querySelector("line").setAttribute("stroke-width", 1 * currentZoom);
        group.querySelectorAll("text").forEach(text => {
            text.setAttribute("font-size", 12 * currentZoom);
        });

        const measuringline = group.querySelector("#measuringline");
        const textStart = group.querySelector("#textStart");
        console.log(parseFloat(measuringline.getAttribute("x1")) - (20 * parseFloat(data.factor) * currentZoom));
        textStart.setAttribute("x", parseFloat(measuringline.getAttribute("x1")) - (20 * parseFloat(data.factor) * currentZoom));
        textStart.setAttribute("y", parseFloat(measuringline.getAttribute("y1")) + 4 * currentZoom);

        const textEnd = group.querySelector("#textEnd");
        textEnd.setAttribute("x", parseFloat(measuringline.getAttribute("x2")) + (20 * parseFloat(data.factor) * currentZoom));
        textEnd.setAttribute("y", parseFloat(measuringline.getAttribute("y2")) + 4 * currentZoom);

        document.getElementById('vector-container').insertAdjacentElement("afterbegin", group);
    });
}


//atis stuff
document.getElementById('atis-gen-button').addEventListener('click', () => {
    generateATIS();
    copyATIS();
})

document.getElementById('atis-overlay').querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', generateATIS);
    el.addEventListener('change', generateATIS);
});

function generateATIS() {
    const nextLetter = letter => String.fromCharCode((letter.charCodeAt(0) - 65 + 1) % 26 + 65);
    const code = nextLetter(currentAtisCode);
    const qnh = document.getElementById('qnh').value;
    const charts = document.getElementById('charts').value;
    const depRwys = Array.from(document.getElementById('depRwy').selectedOptions).map(opt => opt.value).join(' ');;
    const arrRwys = Array.from(document.getElementById('arrRwy').selectedOptions).map(opt => opt.value).join(' ');;
    
    const time = new Date().toISOString().slice(11,16).replace(':','') + 'z';

    const windParts = Object.values(aircraftData)[0]?.wind.split("/");
    const dir = windParts[0].padStart(3, '0');
    const speed = windParts[1].padStart(2, '0');

    const chartsLink = charts == 'Offical' ? `https://github.com/Treelon/ptfs-charts/tree/main/${airportInfo[airportSelector.value].ChartsLinkPath}` : '';

    const atis =
    `${airportSelector.value} ATIS INFO ${code} TIME ${time}
DEP RWY ${depRwys} ARR RWY ${arrRwys}
${dir}/${speed} 9999 OVC045 00/06 Q${qnh}
ACKNOWLEDGE RECEIPT OF INFORMATION ${code}
AND ADVISE AFCT TYPE ON FIRST CONTACT WITH ${airportInfo[airportSelector.value].name.toUpperCase()}
END OF INFORMATION ${code}

Charts Link: ${chartsLink}`;

    const command = `/updateatis airport: ${airportSelector.value} arr_rwys: ${arrRwys} dep_rwys: ${depRwys} qnh: ${qnh} chart_link: ${chartsLink}`;

    document.getElementById('output').textContent = atis;
    document.getElementById('output').setAttribute('command', command);
}

function copyATIS() {
    const text = document.getElementById('output').getAttribute('command');
    navigator.clipboard.writeText(text).then(() => {
        document.getElementById('copied-text').innerHTML = 'ATIS command copied';
    });
}

function setWinds() {
    const windParts = Object.values(aircraftData)[0]?.wind.split("/");
    const dir = windParts[0].padStart(3, '0')
    const speed = windParts[1].padStart(2, '0')
    document.getElementById('wind-container').innerHTML = `W: ${dir}/${speed}`; 
}

window.addEventListener('load', function () {
    const sideButtons = document.querySelectorAll('.sidebar-button');
    sideButtons.forEach(button => {
        const id = button.getAttribute('id');
        button.addEventListener('click', () => {
            const container = button.parentElement;
            const buttons = container.querySelectorAll('.sidebar-button');
            buttons.forEach(child => {
                child.style.display = 'none';
            });

            //create back button
            const backButton = document.createElement('button');
            backButton.setAttribute('id', 'side-panel-back');
            backButton.classList.add('back-button');
            if (document.getElementById('min-tool').checked && container.id === 'side-window-1') {
                backButton.style.top = '50px';
            }
            backButton.innerHTML = '↩';
            container.appendChild(backButton);

            backButton.addEventListener('click', () => {
                Array.from(container.children).forEach(child => {
                    if (child.classList.contains('sidebar-button') || child.classList.contains('side-window-button')){
                        child.style.display = 'block';
                    } else {
                        child.remove();
                    }
                });
            });

            //find corret function, can replace with switch later
            if (id == 'groundview-button'){
                loadGroundDisplay(button.parentElement)
            } else if (id == 'charts-button') {
                addAirportChart(button.parentElement);
            }
        });
    });
});


function loadGroundDisplay(cont) {
    groundAircraftElements = {};
    if (cont.querySelector('.ground-svg-container')) {
        cont.querySelector('.ground-svg-container').remove();
    }
    const groundView = document.createElement('div');
    groundView.classList.add('ground-svg-container');
    groundView.setAttribute('id', 'ground-container')
    cont.appendChild(groundView);
    fetchMapLayerGround(groundView);
    setTimeout(() => {
        if (aircraftData != null) {
            updateGroundAircraftLayer(aircraftData, groundView);
        }
    }, 200);
}

//webSocket client to receive aircraft data
const secureProtocol = '';
//const serverAddress = 'api.24radar.xyz';
const serverAddress = `localhost:${PORT}`;

const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.onopen = () => {
    console.log("WebSocket connection established");
};

socket.onclose = () => {
    console.log("WebSocket connection closed");
};

async function fetchData() {
    try {
        const response = await fetch(`http${secureProtocol}://${serverAddress}/data`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const enrichedAircraftMap = await response.json();
        aircraftData = enrichedAircraftMap;
        updateAircraftLayer(enrichedAircraftMap);
        document.querySelectorAll('#ground-container').forEach(cont => {
            updateGroundAircraftLayer(enrichedAircraftMap, cont);
        });
        preserveFocusWhileUpdating(() => {
            updateDepartures(enrichedAircraftMap);
        });
        preserveFocusWhileUpdating(() => {
            updateArrivals(enrichedAircraftMap);
        });
        setWinds();

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
setInterval(fetchData, 3000);

async function loadApproachList(icao) {
    let paths;
    const svgContainer = document.getElementById('map-svg');
    if (svgContainer) {
        paths = svgContainer.querySelectorAll('.approach-path')
    };
    if (paths) paths.forEach(el => el.remove());

    const res = await fetch(`http${secureProtocol}://${serverAddress}/approaches/${icao}`)
    if (!res.ok) return console.error('Could not load approaches');
    const files = await res.json();

    const container = document.getElementById('approach-toggles');
    container.innerHTML = ''; // clear previous toggles

    files.forEach(file => {
        
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.file = file;

        checkbox.addEventListener('change', e => {
            if (e.target.checked) {
                loadApproachSVG(icao, file);
            } else {
                removeApproachSVG(file);
            }
        });

        label.appendChild(checkbox);
        label.append(` ${file.replace('.svg', '')}`);
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
    });
}

async function atisLetter(icao) {
    try {
        const response = await fetch(`http${secureProtocol}://${serverAddress}/atis/${icao}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        if (!data.letter) throw new Error("No ATIS letter found in response");
        if (currentAtisCode == data.letter) {
            return currentAtisCode;
        } else {
            console.log(`ATIS letter updated: ${currentAtisCode} -> ${data.letter}`);
            currentAtisCode = data.letter;
            document.querySelector('#station-info').innerHTML = `${stationMap.get(data.airport)}-${airportInfo[data.airport].frequency.CTR == null ? 'TWR' : 'CTR'} (${currentAtisCode})`
            return data.letter;
        }
    } catch (err) {
        console.error('Error fetching ATIS letter:', err);
        return "Atis Error";
    }
}

async function fetchAtisLetter(icao) {
    const currentAtisLetter = await atisLetter(icao);
    currentAtisCode = currentAtisLetter;
    updateAirportSelector();
}

let departuresElements = {};
let departuresTimestamps = {};
function updateDepartures(data){
    const newIds = new Set();

    //add new rows
    for (const [id, info] of Object.entries(data)) {
        const fp = info.flightPlan;
        if (!fp || !currentStations.has(fp.departing) || (fp.flightStatus === "landed" || info.flightStatus === "desceding" || info.flightStatus === "inFlight")) continue;
        
        newIds.add(id);

        const currentAltitude = parseInt(info.altitude);
        let inputCruising = document.querySelector(`#cruise-input-${id}`);
        let filedCruisingAltitude = inputCruising
            ? parseInt(inputCruising.value)
            : parseInt(fp.cruisingAltitude);
        const isCruising = info.flightStatus === "cruising" || info.flightStatus === "climbing";

        if (isCruising && (currentAltitude === filedCruisingAltitude)) {
            const group = arrivalsElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete arrivalsElements[id];
            delete arrivalsTimestamps[id];
        }
        if (info.flightStatus === 'landed' || info.flightStatus === 'cruising' || info.flightStatus === 'descending') {
            const group = departuresElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete departuresElements[id];
            delete departuresTimestamps[id];
            
            continue;
        }
        
        const currentTimestamp = fp.timestamp;

        if (!departuresElements[id] || departuresTimestamps[id] !== currentTimestamp) {

            if (departuresElements[id]) departuresElements[id].remove();

            addDepartureRow(info, id);
            departuresTimestamps[id] = currentTimestamp;
        }
    }

    //delete rows
    for (const id in departuresElements) {
        if (!newIds.has(id)) {
            const group = departuresElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete departuresElements[id];
            delete departuresTimestamps[id];
        }
    }

    reorderDepartureRows();
}

function addDepartureRow(info, id) {
    const tableBody = document.querySelector('#departures-table tbody');
    const fp = info.flightPlan;

    // Define columns info: name and input type (or "label" for readonly)
    const columns = [
        { name: 'callsign', type: 'text', value: fp.callsign || '' },
        { name: 'type', type: 'text', value: acftTypeMap.get(info.aircraftType) || '' },
        { name: 'arrival', type: 'label', value: fp.arriving || '' },
        { name: 'flightRules', type: 'label', value: fp.flightrules || '' },
        { name: 'rwy', type: 'text', value: '' },
        { name: 'sid', type: 'text', value: '' },
        { name: 'climb', type: 'text', value: fp.flightlevel || '' },
        { name: 'c', type: 'checkbox',},
        { name: 'rmk', type: 'text', value: '' },
    ];

    // Create a new table row
    const newRow = document.createElement('tr');
    newRow.id = id;

    columns.forEach(col => {
        const cell = document.createElement('td');

        if (col.type === 'label') {
            // Disabled input for label
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value;
            input.disabled = true;
            input.style.width = '100%';
            input.autocomplete = 'off';
            cell.appendChild(input);

        } else if (col.type === 'checkbox') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = col.name;
            input.checked = col.value === true;  // set checked state
            input.style.display = 'block';
            input.style.margin = '0 auto';
            cell.style.textAlign = 'center';
            input.autocomplete = 'off';
            cell.appendChild(input);

             input.addEventListener('change', () => {
                if (input.checked) {
                    input.dataset.checkedAt = Date.now();
                } else {
                    delete input.dataset.checkedAt;
                }
                reorderDepartureRows();
                updateDepartures();
            });

        } else if (col.name === 'climb') {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value || '';
            input.style.width = '100%';
            input.setAttribute('id', `cruise-input-${id}`)
            input.autocomplete = 'off';
            cell.appendChild(input);
        } else {
            // Default text input
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value || '';
            input.style.width = '100%';
            input.autocomplete = 'off';
            cell.appendChild(input);
        }

        newRow.appendChild(cell);
    });

    tableBody.appendChild(newRow);
    departuresElements[id] = newRow;
}

function reorderDepartureRows() {
    const tableBody = document.querySelector('#departures-table tbody');

    const unchecked = [];
    const checked = [];

    for (const id in departuresElements) {
        const row = departuresElements[id];
        const cb = row.querySelector('input[name="c"]');
        const isChecked = cb?.checked;

        if (isChecked) {
            checked.push({ id, checkedAt: parseInt(cb.dataset.checkedAt || '0') });
        } else {
            unchecked.push({ id, timestamp: departuresTimestamps[id] });
        }
    }

    // Sort unchecked by flightplan timestamp (newest first)
    unchecked.sort((a, b) => b.timestamp - a.timestamp);

    // Sort checked by checkedAt (newest first — so they appear at top of checked group)
    checked.sort((a, b) => a.checkedAt - b.checkedAt);

    const sortedIds = [...checked.map(e => e.id), ...unchecked.map(e => e.id)];

    for (const id of sortedIds) {
        const row = departuresElements[id];
        if (row) tableBody.appendChild(row); // reordering
    }
}

let arrivalsElements = {};
let arrivalsTimestamps = {};
function updateArrivals(data){
    const newIds = new Set();

    //add new rows
    for (const [id, info] of Object.entries(data)) {
        const fp = info.flightPlan;
        if (!fp || !currentStations.has(fp.arriving) || info.isOnGround) continue;
        
        newIds.add(id);

        const currentAltitude = parseInt(info.altitude);
        const isCruising = info.flightStatus === "cruising" || "climbing";

        if (info.flightStatus === 'landed') {
            const group = arrivalsElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete arrivalsElements[id];
            delete arrivalsTimestamps[id];
            
            continue;
        }
        
        const currentTimestamp = fp.timestamp;

        if (!arrivalsElements[id] || arrivalsTimestamps[id] !== currentTimestamp) {

            if (arrivalsElements[id]) arrivalsElements[id].remove();

            addArrivalsRow(info, id);
            arrivalsTimestamps[id] = currentTimestamp;
        }
    }

    //delete rows
    for (const id in arrivalsElements) {
        if (!newIds.has(id)) {
            const group = arrivalsElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete arrivalsElements[id];
            delete arrivalsTimestamps[id];
        }
    }

    //reorderDepartureRows();
}

function addArrivalsRow(info, id) {
    const tableBody = document.querySelector('#arrivals-table tbody');
    const fp = info.flightPlan;

    // Define columns info: name and input type (or "label" for readonly)
    const columns = [
        { name: 'callsign', type: 'text', value: fp.callsign || '' },
        { name: 'type', type: 'text', value: acftTypeMap.get(info.aircraftType) || '' },
        { name: 'rwy', type: 'text', value: '' },
        { name: 'stand', type: 'text', value: '' },
        { name: 'rmk', type: 'text', value: '' },
    ];

    // Create a new table row
    const newRow = document.createElement('tr');
    newRow.id = id;

    columns.forEach(col => {
        const cell = document.createElement('td');

        if (col.type === 'label') {
            // Disabled input for label
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value;
            input.disabled = true;
            input.style.width = '100%';
            input.autocomplete = 'off';
            cell.appendChild(input);
        } else {
            // Default text input
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value || '';
            input.style.width = '100%';
            input.autocomplete = 'off';
            cell.appendChild(input);
        }

        newRow.appendChild(cell);
    });

    tableBody.appendChild(newRow);
    arrivalsElements[id] = newRow;
}

function preserveFocusWhileUpdating(updateFunction) { //note
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.name || activeEl.type != 'text') {
        // No focused input, just update normally
        updateFunction();
        return;
    }

    const inputName = activeEl.name;
    const rowId = activeEl.parentElement.parentElement.id;
    const inputValue = activeEl.value;
    const selectionStart = activeEl.selectionStart;
    const selectionEnd = activeEl.selectionEnd;

    updateFunction();
    
    const tableBody = activeEl.parentElement.parentElement.parentElement;
    const row = tableBody.querySelector(`#${rowId}`)
    const input = row.querySelector(`input[name="${inputName}"]`);
    if (input) {
        input.focus();
    }
    /*
    let inputToFocus = null;
    for (const input of inputs) {
        if (input.value === inputValue) {
            inputToFocus = input;
            break;
        }
    }

    if (inputToFocus) {
        inputToFocus.focus();
        if (selectionStart !== null && selectionEnd !== null) {
            inputToFocus.setSelectionRange(selectionStart, selectionEnd);
        }
    }*/
}

function addAirportChart(container) {
    const chartUrl = `https://ptfs.app/charts/dark/${airportSelector.value}%20Ground%20Chart.png`;

    if (container.querySelector('.charts-container')) {
        container.querySelector('.charts-container').remove();
    }
    const chartView = document.createElement('div');
    chartView.classList.add('charts-container');
    chartView.setAttribute('id', 'chart-container')
    container.appendChild(chartView);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    wrapper.style.position = 'relative'; // so button can be placed inside
    chartView.appendChild(wrapper);

    const img = document.createElement('img');
    img.src = chartUrl;
    img.alt = `${airportSelector.value} Ground Chart`;
    img.style.display = "block";
    wrapper.appendChild(img);

    // Add rotation button
    const rotateBtn = document.createElement('button');
    rotateBtn.innerText = "↺";
    rotateBtn.id = 'rotate-chart'

    wrapper.appendChild(rotateBtn);

    img.onload = () => {
        let transform = { 
            x: 0, 
            y: 0, 
            scale: container.clientWidth / img.naturalHeight, 
            rotation: 90 
        };

        function updateTransform() {
            previousChartTransform = transform;
            img.style.transform = 
                `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`;
        }

        if (previousChartTransform != null) {
            transform = previousChartTransform;
        } else {
            // Center the image initially
            transform.x = (container.clientWidth - img.naturalWidth) / 2;
            transform.y = (container.clientHeight - img.naturalHeight) / 2;
        }
        updateTransform();

        // Rotate button click
        rotateBtn.addEventListener("click", () => {
            transform.rotation -= 90;
            updateTransform();
        });

        container.querySelector('#side-panel-back').addEventListener("click", () => {
            previousChartTransform = transform;
        });

        // Panning logic
        let isPanning = false;
        let start = { x: 0, y: 0 };

        wrapper.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isPanning = true;
            start.x = e.clientX - transform.x;
            start.y = e.clientY - transform.y;
            wrapper.style.cursor = "grabbing";
        });

        window.addEventListener("mousemove", (e) => {
            if (!isPanning) return;
            transform.x = e.clientX - start.x;
            transform.y = e.clientY - start.y;
            updateTransform();
        });

        window.addEventListener("mouseup", () => {
            isPanning = false;
            wrapper.style.cursor = "grab";
        });

        wrapper.addEventListener('contextmenu', e => {
            e.preventDefault();
        });

        wrapper.addEventListener("wheel", (e) => {
            e.preventDefault();
            
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = transform.scale * zoomFactor;

            if (newScale < 0.25250351893095774 || newScale > 1.1776727859952076) {
                return;
            }
            transform.scale = newScale;
            updateTransform();
        });
    };

    img.onerror = () => {
        container.innerText = 'Failed to load chart image.';
    };
}

//aircraft fetures
function updateGroundAircraftLayer(data, cont) {
    const newIds = new Set();
    const svg = cont.querySelector('#ground-map-svg');

    let start = { x: 0, y: 0 };

    for (const [id, info] of Object.entries(data)) {
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

        let group = groundAircraftElements[id];

        if (!group) {
            // Create new group for aircraft + label
            console.log(`Creating new group for aircraft ${id}`);
            group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('id', `ac-${id}`);

            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            icon.classList.add('ground-aircraft-icon');

            const planeIcon = getPlaneIcon(type, group, heading);

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("fill", "white");
            label.setAttribute('font-size', groundLabelFontSize/30 * groundCurrentZoom/groundOffsetsMap.get(airportSelector.value).zoom * document.getElementById('label-size-slider').value);
            label.classList.add("ground-aircraft-label");
            label.setAttribute('id', "aircraft-label");
            label.setAttribute("x", defaultLabelOffset * groundCurrentZoom); // offset for label
            label.setAttribute("y", 2 * groundCurrentZoom); // offset for label
            label.setAttribute('pinned', 'false');

            const connector = document.createElementNS("http://www.w3.org/2000/svg", "line")
            connector.setAttribute("stroke", "white");
            connector.setAttribute("stroke-width", 0.5);
            connector.classList.add("ground-label-connector");

            //event listeners for moveing
            label.addEventListener('mousedown', e => {
                if (e.button == 0) {
                    isDraggingGroundLabel = { bool: true, label: label };
                    start = { x: e.clientX, y: e.clientY };
                    e.preventDefault();
                }
                if (e.button == 1) {
                    const pin = label.getAttribute('pinned') == 'false' ? 'true' : 'false';
                    label.setAttribute('pinned', pin);
                    if (label.getAttribute('pinned') == 'true') {
                        const text = group.querySelector('#span1');
                        text.innerHTML = '★ ' + text.innerHTML;
                    } else {
                        //remove the star here
                        group.querySelector('#span1').innerHTML = group.querySelector('#span1').innerHTML.replace(/^★\s*/, '');
                    }
                }
            });

            document.addEventListener('mousemove', e => {
                if (isDraggingGroundLabel.bool == true) labelGroundMove(e, label, svg, group, start);
            });

            document.addEventListener('mouseup', e => {
                isDraggingGroundLabel.bool = false;
            });

            label.addEventListener("dblclick", function () {
                displayOverlay(id, aircraftData[id]);
            });

            group.appendChild(icon);
            group.appendChild(label);
            group.insertBefore(connector, group.firstChild);
            svg.appendChild(group);

            groundAircraftElements[id] = group;

            svg.addEventListener('wheel', e => {
                if (aircraftData[id].isOnGround || aircraftData[id].isTaxiing) {
                    updateGroundLabel(group, aircraftData[id], id)
                    updateGroundConnector(group);
                }
            });

        }

        if (isOnGround || altitude < 150 || info.isTaxiing) {
            //update position
            group.setAttribute('transform', `translate(${x / 100}, ${y / 100})`);

            //label stuff
            updateGroundLabel(group, info, id)

            //update icon
            rotatePlaneIcon(group, heading);
        }
        group.style.display = isOnGround || altitude < 150 || info.isTaxiing ? 'block' : 'none';

    }

    // Remove aircraft no longer in the data
    for (const id in groundAircraftElements) {
        if (!newIds.has(id)) {
            const group = groundAircraftElements[id];
            if (group && group.parentNode) {
                group.parentNode.removeChild(group);
            }
            delete groundAircraftElements[id];
            console.log(`Removed ground aircraft ${id}`);
        }
    }

    //console.log(groundAircraftElements);
}

function updateGroundLabel(group, info, id) {
    const text = group.querySelector("text");
    const label = group.querySelector(".ground-aircraft-label");

    let color = 'white';

    if (info.flightPlan != null) {
        if (currentStations.has(info.flightPlan.departing)) {
            color = '#48b8fb';
        }
        if (currentStations.has(info.flightPlan.arriving)) {
            color = '#fce241';
        }
        if (info.flightPlan.flightrules == 'VFR' && (currentStations.has(info.flightPlan.departing) || currentStations.has(info.flightPlan.arriving))){
            color = '#48fb99ff';
        }
        text.setAttribute("fill", color);
    }

    label.setAttribute('font-size', groundLabelFontSize/30 * groundCurrentZoom/groundOffsetsMap.get(airportSelector.value).zoom * document.getElementById('label-size-slider').value);


    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];

    const star = label.getAttribute('pinned') == 'true' ? '★ ' : '';

    text.innerHTML = `
        <tspan id='span1' dx="0" dy="0em">${star + callsignMap.get(carrier) + number + ' ' + info.speed}kt ${acftTypeMap.get(info.aircraftType)}</tspan>
    `;
    if (info.flightPlan == null) {
        text.querySelector('#span1').innerHTML += " [NO FLP]";
    }
    text.setAttribute('transform', `rotate(-${groundOffsetsMap.get(airportSelector.value).r})`);
}

function updateGroundConnector(group) {
    const text = group.querySelector("text");
    const bbox = text.getBBox();
    const connector = group.querySelector(".ground-label-connector");
    const label = group.querySelector(".ground-aircraft-label");
    let textWidth = 0;

    connector.setAttribute("stroke-width", 0.5 * groundCurrentZoom);

    if (text.querySelector("#span1") != null) {
        textWidth = text.querySelector("#span1").getBBox().width;

        if (textAlign == 'start') {
            textAlign = bbox.x > 0 ? 'start' : 'end';
        } else {
            textAlign = bbox.x + textWidth > 0 ? 'start' : 'end';
        }

        text.setAttribute('text-anchor', textAlign);
    }

    const circleCenter = { x: 0, y: 0 }; // center of group is (0, 0)

    const x = bbox.x >= 0 ? bbox.x : bbox.x + textWidth;
    const y = bbox.y + 6 * groundCurrentZoom;

    const rad = -groundOffsetsMap.get(airportSelector.value).r * Math.PI / 180; // negative to go from screen → map
    const fromX = x * Math.cos(rad) - y * Math.sin(rad);
    const fromY = x * Math.sin(rad) + y * Math.cos(rad);

    // Set line attributes (converted into group-relative coords)
    connector.setAttribute("x1", fromX);
    connector.setAttribute("y1", fromY);
    connector.setAttribute("x2", circleCenter.x);
    connector.setAttribute("y2", circleCenter.y);
}

function labelGroundMove(e, label, svg, group, start) {
    if (!isDraggingGroundLabel.bool || isDraggingGroundLabel.label != label) {
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

    const x = parseFloat(label.getAttribute('x')) + dx * groundCurrentZoom * adjustX;
    const y = parseFloat(label.getAttribute('y')) + dy * groundCurrentZoom * adjustY;
    label.setAttribute('x', x);
    label.setAttribute('y', y);

    //connector
    updateGroundConnector(group);
}

/*
...................................................................................................................*/

//aircraft fetures
let aircraftElements = {}; // Maps aircraft ID to <g> element

function updateAircraftLayer(data) {
    const newIds = new Set();
    const svg = document.getElementById('map-svg');

    let trailsLayer = document.getElementById('trails-layer');
    if (!trailsLayer) {
        trailsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trailsLayer.setAttribute('id', 'trails-layer');
        svg.appendChild(trailsLayer); // ensures it's above the map and other background layers
    }

    let start = { x: 0, y: 0 };

    for (const [id, info] of Object.entries(data)) {
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
            group.classList.add('aircraft-group');

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
                if (e.button == 0) {
                    isDraggingLabel = { bool: true, label: label };
                    start = { x: e.clientX, y: e.clientY };
                    e.preventDefault();
                }
                if (e.button == 1) {
                    const pin = label.getAttribute('pinned') == 'false' ? 'true' : 'false';
                    label.setAttribute('pinned', pin);
                    updateLabel(group, aircraftData[id], id);
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
                displayOverlay(id, aircraftData[id]);
            });

            group.appendChild(icon);
            group.appendChild(label);
            group.insertBefore(connector, group.firstChild);
            svg.appendChild(group);

            aircraftElements[id] = group;

            svg.addEventListener('wheel', e => {
                updateLabel(group, aircraftData[id], id);
                document.querySelectorAll('.trail').forEach(trail => {
                    trail.setAttribute('stroke-width', 1 * currentZoom);
                });
                updateConnector(group);
            });
        }

        //update position
        group.setAttribute('transform', `translate(${x / 100}, ${y / 100})`);

        //handle trails only if aircraft is not on the ground
        if (!isOnGround || !info.isTaxiing) {
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
        group.style.display = groundAircraftHidden && (isOnGround || info.isTaxiing) ? 'none' : 'block';
        const isGroundOn = isOnGround || info.isTaxiing ? true : false
        group.setAttribute('isOnGround', isGroundOn);

        //label stuff
        updateLabel(group, info, id);

        //update icon
        rotatePlaneIcon(group, heading);

        if (id == curentAircraftId) {
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
    let svgPath = null;
    if (aircraftIconMap.get(type) == undefined) {
        svgPath = `public/assets/plane-Icons/GeneralAviation.svg`;
    } else {
        svgPath = `public/assets/plane-Icons/${aircraftIconMap.get(type)}.svg`;
    }
    

    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load plane SVG of type: ' + type + ', error:'+ response.status);
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

            const scale = aircraftScaleMap.get(aircraftIconMap.get(type)) || 0.0005;

            // Wrap and transform: move center to 0,0 and apply scale
            const innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            innerG.setAttribute('transform', `translate(${-cx * scale}, ${-cy * scale}) scale(${scale})`);
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

function rotatePlaneIcon(group, heading) {
    const rotater = group.querySelector('#rotater');
    if (rotater == null) return;
    rotater.setAttribute('transform', `rotate(${heading})`);
}

function labelMove(e, label, svg, group, start) {
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

function updateConnector(group) {
    const text = group.querySelector("text");
    const bbox = text.getBBox();
    const connector = group.querySelector(".label-connector");
    const label = group.querySelector(".aircraft-label");
    let textWidth = 0;

    connector.setAttribute("stroke-width", 0.5 * currentZoom);

    const circleCenter = { x: 0, y: 0 }; // center of group is (0, 0)
    if (text.querySelector("#tspan2") != null) {
        textWidth = text.querySelector("#tspan2").getBBox().width;

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

function updateLabel(group, info, id) {
    const text = group.querySelector("text");
    const label = group.querySelector(".aircraft-label");
    const connector = group.querySelector(".label-connector");

    if (group.getAttribute('isOnGround') == 'true' && currentZoom > 0.09651739612301583 && label.getAttribute('pinned') == 'false') {
        text.innerHTML = '';
        label.setAttribute('display', 'none');
        connector.setAttribute('display', 'none');
        return;
    } else {
        label.setAttribute('display', 'block');
        connector.setAttribute('display', 'block');
    }
    let color = 'white'

    if (info.flightPlan) {
        if (currentStations.has(info.flightPlan.departing)) {
            color = '#48b8fb';
        }
        if (currentStations.has(info.flightPlan.arriving)) {
            color = '#fce241';
        }
        if (info.flightPlan.flightrules == 'VFR' && (currentStations.has(info.flightPlan.departing) || currentStations.has(info.flightPlan.arriving))){
            color = '#48fb99ff';
        }
        text.setAttribute("fill", color);
    }

    label.setAttribute('font-size', labelFontSize * currentZoom);

    const callsignParts = id.split("-");
    const carrier = callsignParts[0];
    const number = callsignParts[1];

    const star = label.getAttribute('pinned') == 'true' ? ' ★' : '';

    text.innerHTML = `
        <tspan dx="0" dy="0em" id="tspan1">${callsignMap.get(carrier) + number + star}</tspan>
        <tspan dx="0" dy="0em" id="tspan2">${info.altitude}ftㅤ${info.speed}kt</tspan>
    `;

    const tspan1 = text.querySelector("#tspan1").getBBox().width;
    const tspan2 = text.querySelector("#tspan2").getBBox().width;

    // Now update the text content with aligned tspans
    text.innerHTML = `
        <tspan id="tspan1" dx="0" dy="0em">${callsignMap.get(carrier) + number + star}</tspan>
        <tspan id="tspan2" dx="-${(tspan1 + 6 * currentZoom)}" dy="1.2em">${info.altitude}ftㅤ${info.speed}kt</tspan>
        <tspan id="tspan3" dx="-${(tspan2 + 6 * currentZoom)}" dy="1.2em">${info.heading}°ㅤㅤ${acftTypeMap.get(info.aircraftType)}</tspan>
    `;
}

window.addEventListener('resize', () => {
    const mapSvg = document.getElementById('map-svg');
    updateAircraftLayer(aircraftData, mapSvg);
});

function updateMeasuringTool(x, y) {
    if (measuringline == null) return;
    measuringline.setAttribute("x2", x);
    measuringline.setAttribute("y2", y);
    measuringline.setAttribute("stroke-width", 1 * currentZoom);

    const dx = x - measuringLineStart.x;
    const dy = y - measuringLineStart.y;
    const heading = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const oppositeHeading = (heading + 180) % 360;

    const factor = dx > 0 ? 1 : -1;
    measuringline.setAttribute('factor', factor);

    if (!vectorDirOnly.checked) {
        textStart.textContent = `${Math.round(heading)}°`;
        textStart.setAttribute("x", measuringLineStart.x - (20 * factor) * currentZoom);
        textStart.setAttribute("y", measuringLineStart.y + 4 * currentZoom);
        textStart.setAttribute("font-size", 12 * currentZoom);

        textEnd.textContent = `${Math.round(oppositeHeading)}°`;
        textEnd.setAttribute("x", x + (20 * factor) * currentZoom);
        textEnd.setAttribute("y", y + 4 * currentZoom);
        textEnd.setAttribute("font-size", 12 * currentZoom);

        if (vectorDistance.checked) {
            // Distance in px, then convert to NM
            const distPx = Math.sqrt(dx * dx + dy * dy);
            const distStuds = distPx * 100; // 100 studs per px
            const distNM = distStuds / 3307.14286;
            textDistance.textContent = `${distNM.toFixed(2)} NM`;
        } else {
            textDistance.textContent = '';
        }
    } else {
        textDistance.textContent = `${Math.round(heading)}°`;
        textStart.textContent = '';
        textEnd.textContent = '';
    }
    
    textDistance.setAttribute("x", (measuringLineStart.x + x) / 2);
    textDistance.setAttribute("y", (measuringLineStart.y + y) / 2);
    textDistance.setAttribute("font-size", 12 * currentZoom);
}

function fetchMapLayerGround(container) {
    //fetch main SVG
    fetch('public/assets/coast.svg')
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
                el.removeAttribute('style');

                el.setAttribute('fill', 'black');
                el.setAttribute('stroke', 'none');
                el.setAttribute('stroke-width', 1 * groundCurrentZoom);
            });

            //slider
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 1;
            slider.max = 2;
            slider.step = 0.01;
            slider.value = 1;
            slider.style.cssText = `
                -webkit-appearance: none;
                height: 5px;
                width: 50px;
                border-radius: 5px;
                background: #333;
                outline: none;
                position: absolute;
                bottom: 20px;
                justify-self: center;
            `;
            slider.type = 'range';
            slider.min = '0.5';
            slider.max = '1.5';
            slider.step = '0.1';
            slider.value = 1;
            slider.setAttribute('id', 'label-size-slider')

            slider.addEventListener('input', () => {
                const labels = svg.querySelectorAll('.ground-aircraft-label');
                labels.forEach(label => {
                    label.setAttribute('font-size', groundLabelFontSize/30 * groundCurrentZoom/groundOffsetsMap.get(airportSelector.value).zoom * slider.value);
                });
            });

            container.appendChild(slider);

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
            let start = { x: 0, y: 0 };

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

                const labels = svg.querySelectorAll('.ground-aircraft-label');
                labels.forEach(label => {
                    label.setAttribute('font-size', label.getAttribute('font-size') * delta);
                    label.setAttribute("x", label.getAttribute('x') * delta);
                    label.setAttribute("y", label.getAttribute('y') * delta);
                });

            });

            loadGroundChartSVG(airportSelector, container);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
        });
}

function fetchMapLayer(container) {
    //fetch main SVG
    fetch('public/assets/coast.svg')
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
            let start = { x: 0, y: 0 };

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
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.setAttribute('class', 'vector');

                    measuringLineStart = { x, y };

                    measuringline = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    measuringline.setAttribute("x1", x);
                    measuringline.setAttribute("y1", y);
                    measuringline.setAttribute("x2", x);
                    measuringline.setAttribute("y2", y);
                    measuringline.setAttribute("stroke", vectorColor.value);
                    group.setAttribute("color", vectorColor.value);
                    measuringline.setAttribute("stroke-width", "1");
                    measuringline.setAttribute("id", "measuringline");

                    textStart = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textStart.setAttribute("fill", "white");
                    textStart.setAttribute("font-size", "12px");
                    textStart.setAttribute("text-anchor", "middle");
                    textStart.setAttribute("id", "textStart");

                    textEnd = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textEnd.setAttribute("fill", "white");
                    textEnd.setAttribute("font-size", "12px");
                    textEnd.setAttribute("text-anchor", "middle");
                    textEnd.setAttribute("id", "textEnd");

                    textDistance = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textDistance.setAttribute("fill", "white");
                    textDistance.setAttribute("font-size", "12px");
                    textDistance.setAttribute("text-anchor", "middle");

                    const distanceOn = vectorDistance.checked ? 'true' : 'false';
                    group.setAttribute('distance', distanceOn);

                    if (vectorDirOnly.checked) {
                        group.setAttribute('distance', false);
                        group.setAttribute('dirOnly', true);
                    } else {
                        group.setAttribute('dirOnly', false);
                    }

                    document.addEventListener('wheel', () => {
                        group.querySelector("line").setAttribute("stroke-width", 1 * currentZoom);
                        group.querySelectorAll("text").forEach(text => {
                            text.setAttribute("font-size", 12 * currentZoom);
                        });

                        const measuringline = group.querySelector("#measuringline");
                        const textStart = group.querySelector("#textStart");
                        textStart.setAttribute("x", parseFloat(measuringline.getAttribute("x1")) - (20 * parseFloat(measuringline.getAttribute('factor'))) * currentZoom);
                        textStart.setAttribute("y", parseFloat(measuringline.getAttribute("y1")) + 4 * currentZoom);

                        const textEnd = group.querySelector("#textEnd");
                        textEnd.setAttribute("x", parseFloat(measuringline.getAttribute("x2")) + (20 * parseFloat(measuringline.getAttribute('factor'))) * currentZoom);
                        textEnd.setAttribute("y", parseFloat(measuringline.getAttribute("y2")) + 4 * currentZoom);
                    });

                    group.addEventListener('mouseover', () => {
                        hoveredVector = group;
                    });

                    // Track mouseout to clear the current hovered element
                    group.addEventListener('mouseout', () => {
                        if (hoveredVector === group) {
                            hoveredVector = null;
                        }
                    });

                    group.appendChild(measuringline);
                    group.appendChild(textStart);
                    group.appendChild(textEnd);
                    group.appendChild(textDistance);

                    document.getElementById('vector-container').insertAdjacentElement("afterbegin", group);
                    isMeasuring = true;
                } else {
                    // Clear all elements and reset state
                    if (doVectorDelete) {
                        document.getElementById('vector-container').querySelector('.vector').remove();
                    }
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

                currentZoom *= delta;

                document.querySelectorAll('.fix-svg').forEach(el => {
                    el.querySelector('svg').setAttribute('width', fixSize * currentZoom);
                    el.querySelector('svg').setAttribute('height', fixSize * currentZoom);
                    el.querySelector('text').setAttribute('font-size', fixFontSize * currentZoom);
                });
                //console.log(currentZoom);
                //console.log('x', viewBox.x, ' y', viewBox.y);
            });

            //fetch boundaries SVG
            fetch('public/assets/boundaries.svg')
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

                    runOnMapLoad();

                    //add vector layer
                    const vectorLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    vectorLayer.setAttribute('id', 'vector-container');
                    svg.appendChild(vectorLayer);

                    //add fix layer
                    const fixLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    fixLayer.setAttribute('id', 'fix-container');
                    svg.appendChild(fixLayer);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
                })
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
        });
}
function loadApproachSVG(path, file) {
    fetch(`public/assets/maps/${path}/${file}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            const temp = document.createElement('div');
            temp.innerHTML = svgText.trim();

            const importedSVG = temp.querySelector('svg');
            if (!importedSVG) throw new Error('No <svg> found in file');

            const svgId = 'approach-' + file.replace('.svg', '');
            importedSVG.id = svgId;
            importedSVG.classList.add('approach-path');

            const svgContainer = document.getElementById('map-svg');
            svgContainer.appendChild(importedSVG);
        })
        .catch(err => {
            console.error(err);
            const container = document.getElementById('map-svg');
            container.innerHTML = `<p style="color:red;">Error loading SVG</p>`;
        });
}

function removeApproachSVG(file) {
    const svgId = 'approach-' + file.replace('.svg', '');
    const elem = document.getElementById(svgId);
    if (elem) elem.remove();
}

/*fetch rings SVG **currently disabled
fetch('public/assets/rings.svg')
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