//html elements
const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');
const airspaceButton = document.getElementById('airspace-bounds');
const displayButton = document.getElementById('display-button');
const resizer = document.getElementById('resizer');
const groundviewButton = document.getElementById('groundview-button');
const chartsButton = document.getElementById('charts-button');
const groundAircraftButton = document.getElementById('ground-aircraft');

//websocket localhost port
const PORT = 4000;

let zuluTime = false;
let airspaceBoundsVisible = true;
let sideDisplayToggle = false;
let isDragging = false;
let currentZoom = 1;
let labelFontSize = 10;
let aircraftData = {};
let groundAircraftHidden = false;
let labelPadding = 50;
let defaultLabelOffset = 10;
const aircraftTrails = {}; // Keyed by aircraft ID, array of positions
const maxTrailLength = 50; // Limit the number of trail points

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
    airspaceButton.style.border = airspaceBoundsVisible ? '3px solid #4B5DA3' : 'none';
});

groundAircraftButton.addEventListener('click', () => {
    groundAircraftHidden = !groundAircraftHidden;
    updateAircraftLayer(aircraftData);
    groundAircraftButton.style.background = !groundAircraftHidden ? '#4d4d4d' : '#3E3E3E';
    groundAircraftButton.style.border = !groundAircraftHidden ? '3px solid #4B5DA3' : 'none';
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
    const data = JSON.parse(event.data);
    aircraftData = data;
    updateAircraftLayer(aircraftData);
};

socket.onerror = err => console.error('WebSocket error:', err);

//aircraft fetures
let aircraftElements = {}; // Maps aircraft ID to <g> element

function updateAircraftLayer(aircraftData) {
    const newIds = new Set();
    const svg = document.getElementById('map-svg');

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
            label.setAttribute("y", 0); // offset for label

            const connector = document.createElementNS("http://www.w3.org/2000/svg", "line")
            connector.setAttribute("stroke", "white");
            connector.setAttribute("stroke-width", 0.5);
            connector.classList.add("label-connector");

            //event listeners for moveing
            label.addEventListener('mousedown', e => {
                if (e.button == 0){
                    isDragging = true;
                    start = { x: e.clientX, y: e.clientY };
                    e.preventDefault();
                }
            });

            label.addEventListener('mousemove', e => {
                if (!isDragging) return;
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
            });

            document.addEventListener('mouseup', e => {
                isDragging = false;
            });

            group.appendChild(icon);
            group.appendChild(label);
            group.insertBefore(connector, group.firstChild);
            svg.appendChild(group);

            aircraftElements[id] = group;
        }

        //update position
        group.setAttribute('transform', `translate(${x/100}, ${y/100})`);

        // Update trails
        if (!aircraftTrails[id]) {
            aircraftTrails[id] = [];
        }

        aircraftTrails[id].push({ x: x / 100, y: y / 100 });

        if (aircraftTrails[id].length > maxTrailLength) {
            aircraftTrails[id].shift(); // Keep trail length manageable
        }

        drawTrail(id, aircraftTrails[id])

        //hide/show ground aircraft
        group.style.display = groundAircraftHidden && isOnGround ? 'none' : 'block';

        //label stuff
        updateLabel(group, info, id);
        
        document.addEventListener('wheel', e => {
            updateLabel(group, info, id);
            document.querySelectorAll('.trail').forEach(trail => {
                trail.setAttribute('stroke-width', 1 * currentZoom);
            });
        });
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

function drawTrail(id, points) {
    const svg = document.getElementById('map-svg');
    let path = document.getElementById(`trail-${id}`);

    // Create path if it doesn't exist
    if (!path) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path.setAttribute('id', `trail-${id}`);
        path.classList.add("trail")
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'cyan');
        path.setAttribute('stroke-width', 0.5 * currentZoom);
        svg.insertBefore(path, svg.firstChild); // Place below aircraft icons
    }

    const pointString = points.map(p => `${p.x},${p.y}`).join(' ');
    path.setAttribute('points', pointString);
}

function updateConnector(group){
    const text = group.querySelector("text")
    const bbox = text.getBBox();
    const connector = group.querySelector(".label-connector")

    const circleCenter = { x: 0, y: 0 }; // center of group is (0, 0)

    // Determine nearest vertical edge


    // Pick the closest side to center
    const fromX = bbox.x;
    const fromY = bbox.y + bbox.height / 2;

    // Set line attributes (converted into group-relative coords)
    connector.setAttribute("x1", fromX);
    connector.setAttribute("y1", fromY);
    connector.setAttribute("x2", circleCenter.x);
    connector.setAttribute("y2", circleCenter.y);
}

function updateLabel(group, info, id){
    const text = group.querySelector("text")

    text.innerHTML = `
        <tspan dx="0" dy="0em" id="tspan1">${id}</tspan>
        <tspan dx="0" dy="0em" id="tspan2">${info.altitude}ftㅤ${info.speed}kt</tspan>
    `;

    const tspan1 = text.querySelector("#tspan1").getBBox().width;
    const tspan2 = text.querySelector("#tspan2").getBBox().width;

    // Now update the text content with aligned tspans
    text.innerHTML = `
        <tspan dx="0" dy="0em">${id}</tspan>
        <tspan dx="-${(tspan1 + 6 * currentZoom)}" dy="1.2em">${info.altitude}ftㅤ${info.speed}kt</tspan>
        <tspan dx="-${(tspan2 + 6 * currentZoom)}" dy="1.2em">${info.heading}°ㅤㅤ${info.aircraftType}</tspan>
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

            const planeIcons = svg.querySelectorAll('.aircraft-icon');

            planeIcons.forEach(child => {
                child.setAttribute('r', parseFloat(child.getAttribute('r')) * delta);
            });

            const labels = svg.querySelectorAll('.aircraft-label');
            labels.forEach(label => {
                label.setAttribute('font-size', label.getAttribute('font-size') * delta);
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