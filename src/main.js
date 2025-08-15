import AirlineMapJson from "../src/data/AirlineMap.js";
import AcftTypeMapJson from "../src/data/AcftTypeMap.js";
import CallsignMapJson from "../src/data/CallsignMap.js";
import StationMap from "../src/data/StationMap.js";
import AirportNamesMap from "../src/data/AirportNamesMap.js";
import AircraftIconMap from "../src/data/AircraftIconMap.js";
import AircraftScaleMap from "../src/data/AircraftScaleMap.js";
import GroundOffsets from "../src/data/GroundOffsets.js";
import chartsLinkPath from "../src/data/ChartsLinkPath.js";

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

//maps
const airlineMap = new Map(Object.entries(AirlineMapJson));
const acftTypeMap = new Map(Object.entries(AcftTypeMapJson));
const callsignMap = new Map(Object.entries(CallsignMapJson));
const stationMap = new Map(Object.entries(StationMap));
const airportNamesMap = new Map(Object.entries(AirportNamesMap));
const aircraftIconMap = new Map(Object.entries(AircraftIconMap));
const aircraftScaleMap = new Map(Object.entries(AircraftScaleMap));
const groundOffsetsMap = new Map(Object.entries(GroundOffsets));
const chartsLinkPathMap = new Map(Object.entries(chartsLinkPath));

//svg
const inFlightSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" /></svg>`;
const onGroundSVG = `<svg  id="plane-icon" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-plane-inflight"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 11.085h5a2 2 0 1 1 0 4h-15l-3 -6h3l2 2h3l-2 -7h3l4 7z" /><path d="M3 21h18" /></svg>`;

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

let measuringLineStart = null;
let textDistance = null;
let previousChartTransform = null;
let groundAircraftElements = {}; // Maps aircraft ID to <g> element
let target;

const aircraftTrails = {};
const maxTrailLength = 15;

window.addEventListener('load', function () {
    fetchMapLayer(container);
    loadAirportData(airportSelector);
    document.querySelectorAll('.overlay').forEach(el => {
        overlaySetup(el);
    });
    loadApproachList(airportSelector.value);
    fetchData();
});

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

    document.addEventListener('mousemove', e => {
        if (!isDraggingOverlay || target != overlay) return;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        overlay.style.transform = `translate(${currentX + dx}px, ${currentY + dy}px)`;
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
        closeButton.parentElement.style.display = 'none';
    });
}

function displayOverlay(id, info) {
    if (curentAircraftId == id) {
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

    const icon = info.isOnGround || info.isTaxiing ? onGroundSVG : inFlightSVG;
    if (info.flightPlan != null) {
        const fp = info.flightPlan;
        infoOverlay.querySelector('#route-container').innerHTML = `
            <div id="departure" class="route">
                ${fp.departing}
                <span class="airport-name">${airportNamesMap.get(fp.departing)}</span>
            </div>
            <div id="arival" class="route">
                ${fp.arriving}
                <span class="airport-name">${airportNamesMap.get(fp.arriving)}</span>
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

airportSelector.addEventListener('change', () => {
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
    generateATIS();
    loadApproachList(airportSelector.value);
    document.getElementById('airport-dropdown-app').value = airportSelector.value
});

document.getElementById('airport-dropdown-app').addEventListener('change', () => {
    loadApproachList(document.getElementById('airport-dropdown-app').value);
    airportSelector.value = document.getElementById('airport-dropdown-app').value
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
    const stationType = 'CTR'; // add map for type

    document.querySelector('#station-info').innerHTML = `${stationCenter}-${stationType}`
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

    fetch(svgPath)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load ground SVG: ' + response.status);
            return response.text();
        })
        .then(svgText => {
            // Remove existing ground SVG
            const existing = cont.querySelector('#groundCenter-svg');
            if (existing) {
                existing.parentNode.removeChild(existing);
            }

            const mapSvg = cont.querySelector('#ground-map-svg');
            setTimeout(() => {
                mapSvg.innerHTML += svgText;

                const loaded = mapSvg.querySelector('svg:last-of-type');
                if (!loaded) throw new Error('No <svg> element found in GROUND.svg');

                loaded.setAttribute('id', 'groundCenter-svg');

                //change colors
                let allShapes = null;

                // Taxiways Lines
                const taxiwaysLines = Array.from(loaded.querySelectorAll('g'))
                    .find(el => el.getAttribute('inkscape:label') === 'Taxiway Lines');

                if (taxiwaysLines) {
                    allShapes = taxiwaysLines.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');
                    allShapes.forEach(el => {
                        el.removeAttribute('fill');
                        el.removeAttribute('style');
                        el.setAttribute('fill', 'none');
                        el.setAttribute('stroke', 'black');
                        el.setAttribute('stroke-width', 1.5 * groundCurrentZoom);
                    });
                }

                // Taxiways
                const taxiways = Array.from(loaded.querySelectorAll('g'))
                    .find(el => el.getAttribute('inkscape:label') === 'Taxiways / Ramps');
                if (taxiways) {
                    allShapes = taxiways.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');
                    allShapes.forEach(el => {
                        el.removeAttribute('fill');
                        el.removeAttribute('style');
                        el.setAttribute('fill', '#414141');
                    });
                }

                // Buildings and Runways
                const buildings = Array.from(loaded.querySelectorAll('g'))
                    .find(el => el.getAttribute('inkscape:label') === 'Runways / Buildings');

                if (buildings) {
                    allShapes = buildings.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');
                    allShapes.forEach(el => {
                        el.removeAttribute('fill');
                        el.removeAttribute('style');
                        el.setAttribute('fill', '#222222');
                        el.setAttribute('stroke', 'none');
                        el.setAttribute('stroke-width', 0.5 * groundCurrentZoom);
                    });
                }
            }, 100);
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
    overlay.style.display = overlay.style.display == 'block' ? 'none' : 'block';
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
});

document.getElementById('notepad-icon').addEventListener('click', () => {
    const overlay = document.getElementById('notepad-overlay');
    overlay.style.display = overlay.style.display == 'block' ? 'none' : 'block';
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('departures-icon').addEventListener('click', () => {
    const overlay = document.getElementById('departures-overlay');
    overlay.style.display = overlay.style.display == 'flex' ? 'none' : 'flex';
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('arrivals-icon').addEventListener('click', () => {
    const overlay = document.getElementById('arrivals-overlay');
    overlay.style.display = overlay.style.display == 'flex' ? 'none' : 'flex';
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('atis-icon').addEventListener('click', () => {
    const overlay = document.getElementById('atis-overlay');
    overlay.style.display = overlay.style.display == 'flex' ? 'none' : 'flex';
    overlay.style.zIndex = getHighestZIndex() + 1;
});

document.getElementById('approach-button').addEventListener('click', () => {
    const overlay = document.getElementById('approach-overlay');
    overlay.style.display = overlay.style.display == 'flex' ? 'none' : 'flex';
    overlay.style.zIndex = getHighestZIndex() + 1;
});

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
    const code = document.getElementById('atisCode').value;
    const maxTaxi = document.getElementById('maxTaxi').value;
    const qnh = document.getElementById('qnh').value;
    const parking = document.getElementById('parking').checked;
    const acTypeGround = document.getElementById('acTypeGround').checked;
    const airACType = document.getElementById('airACType').checked;
    const airAltitude = document.getElementById('airAltitude').checked;
    const airAirspeed = document.getElementById('airAirspeed').checked;
    const airHeading = document.getElementById('airHeading').checked;
    const charts = document.getElementById('charts').value;
    const sidsStars = document.getElementById('sidsStars').checked;
    const pdc = document.getElementById('pdc').checked;
    const notams = document.getElementById('notams').value;
    
    const time = new Date().toISOString().slice(11,16).replace(':','') + 'z';
    
    let groundText = "Ground Acft Advise Receipt of Information " + code;
    if (parking) groundText += ", Stand Number on Initial Contact";
    if (acTypeGround) groundText += ", Aircraft Type";
    groundText += ".";
    
    let airText = "Airborne Acft Advise Receipt of Information " + code;
    if (airACType) airText += ", Aircraft Type";
    if (airAltitude) airText += ", Altitude";
    if (airAirspeed) airText += ", Airspeed";
    if (airHeading) airText += ", Heading";
    airText += " on Initial Contact.";
    
    let sidsText = sidsStars ? "SIDs/STARs are preferred.\n" : "";
    let pdcText = pdc ? "PDC available.\n" : "";

    const stationType = 'CTR';
    const chartsLink = charts == 'Offical' ? `https://github.com/Treelon/ptfs-charts/tree/main/${chartsLinkPathMap.get(airportSelector.value)}` : 'N/A';
    
    const atis =
`∎ IRFD ATIS Information ${code} ${time} ∎
**―――――――――――――――**
**Controller Callsign:** ${airportSelector.value}_${stationType}
**―――――――――――――――**
**Aerodrome:**
Max Taxi Speed: ${maxTaxi}kts
Arrival Runway(s):
Departure Runway(s):
Max Acft Size: N/A
QNH: ${qnh}

**NOTAMS:**
${groundText}
${airText}
VFR Acft say Direction of Flight and Intentions.
${notams ? notams + "\n" : ""}${sidsText}${pdcText}
**Charts:**
Chart Pack Author: ${charts}
Chart Pack Link: <${chartsLink}>
**―――――――――――――――**
∎ End of ATIS Information ${code} ∎`;

    document.getElementById('output').textContent = atis;
}

function copyATIS() {
    const text = document.getElementById('output').textContent;
    navigator.clipboard.writeText(text).then(() => {
        document.getElementById('copied-text').innerHTML = 'ATIS message copied';
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
            backButton.innerHTML = '↩'
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
    loadGroundChartSVG(airportSelector, groundView);
    setTimeout(() => {
        if (aircraftData != null) {
            updateGroundAircraftLayer(aircraftData, groundView);
        }
    }, 200);
}

//webSocket client to receive aircraft data
const secureProtocol = 's';
const serverAddress = 'atc24radar-server-production.up.railway.app';
//const serverAddress = `localhost:${PORT}`;

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
        updateArrivals(enrichedAircraftMap);
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


let departuresElements = {};
let departuresTimestamps = {};
function updateDepartures(data){
    const newIds = new Set();

    //add new rows
    for (const [id, info] of Object.entries(data)) {
        const fp = info.flightPlan;
        if (!fp || fp.departing !== airportSelector.value || (fp.flightStatus === "landed" || info.flightStatus === "desceding" || info.flightStatus === "inFlight")) continue;
        
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
            cell.appendChild(input);

        } else if (col.type === 'checkbox') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = col.name;
            input.checked = col.value === true;  // set checked state
            input.style.display = 'block';
            input.style.margin = '0 auto';
            cell.style.textAlign = 'center';
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
            cell.appendChild(input);
        } else {
            // Default text input
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value || '';
            input.style.width = '100%';
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
        if (!fp || fp.arriving !== airportSelector.value || info.isOnGround) continue;
        
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
            cell.appendChild(input);
        } else {
            // Default text input
            const input = document.createElement('input');
            input.type = 'text';
            input.name = col.name;
            input.value = col.value || '';
            input.style.width = '100%';
            cell.appendChild(input);
        }

        newRow.appendChild(cell);
    });

    tableBody.appendChild(newRow);
    arrivalsElements[id] = newRow;
}

function preserveFocusWhileUpdating(updateFunction) {
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.name) {
        // No focused input, just update normally
        updateFunction();
        return;
    }

    const inputName = activeEl.name;
    const inputValue = activeEl.value;
    const selectionStart = activeEl.selectionStart;
    const selectionEnd = activeEl.selectionEnd;

    updateFunction();

    const tableBody = document.querySelector('#departures-table tbody');
    const inputs = tableBody.querySelectorAll(`input[name="${inputName}"]`);

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
    }
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
            label.setAttribute('font-size', groundLabelFontSize * groundCurrentZoom * document.getElementById('label-size-slider').value);
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
        if (info.flightPlan.departing == airportSelector.value) {
            color = '#48b8fb';
        }
        if (info.flightPlan.arriving == airportSelector.value) {
            color = '#fce241';
        }
        if (info.flightPlan.flightrules == 'VFR' && (info.flightPlan.departing == airportSelector.value || info.flightPlan.arriving == airportSelector.value)){
            color = '#48fb99ff';
        }
        text.setAttribute("fill", color);
    }

    label.setAttribute('font-size', groundLabelFontSize * groundCurrentZoom * document.getElementById('label-size-slider').value);


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
        if (info.flightPlan.departing == airportSelector.value) {
            color = '#48b8fb';
        }
        if (info.flightPlan.arriving == airportSelector.value) {
            color = '#fce241';
        }
        if (info.flightPlan.flightrules == 'VFR' && (info.flightPlan.departing == airportSelector.value || info.flightPlan.arriving == airportSelector.value)){
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

    textStart.textContent = `${Math.round(heading)}°`;
    textStart.setAttribute("x", measuringLineStart.x - (20 * factor) * currentZoom);
    textStart.setAttribute("y", measuringLineStart.y + 4 * currentZoom);
    textStart.setAttribute("font-size", 12 * currentZoom);

    textEnd.textContent = `${Math.round(oppositeHeading)}°`;
    textEnd.setAttribute("x", x + (20 * factor) * currentZoom);
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
                    label.setAttribute('font-size', groundLabelFontSize * groundCurrentZoom * slider.value);
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