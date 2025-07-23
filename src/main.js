const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');
const airspaceButton = document.getElementById('airspace-bounds');

let zuluTime = false;
let airspaceBoundsVisible = true;

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
    airspaceButton.style.borderRight = airspaceBoundsVisible ? '3px solid rgb(99, 99, 99)' : '3px solid rgb(56, 56, 56)';
    airspaceButton.style.borderBottom = airspaceBoundsVisible ? '3px solid rgb(99, 99, 99)' : '3px solid rgb(56, 56, 56)';
    airspaceButton.style.borderTop = airspaceBoundsVisible ? '3px solid rgb(56, 56, 56)' : '3px solid rgb(99, 99, 99)';
    airspaceButton.style.borderLeft = airspaceBoundsVisible ? '3px solid rgb(56, 56, 56)' : '3px solid rgb(99, 99, 99)';
});

function createPlaneIcon(callsign = '0', alt = '0', speed = '0', heading = '0', type = '0', player = '0') {
    const planeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    planeIcon.setAttribute('id', 'plane-icon');
    planeIcon.setAttribute('callsign', callsign);
    planeIcon.setAttribute('alt', alt);
    planeIcon.setAttribute('speed', speed);
    planeIcon.setAttribute('heading', heading);
    planeIcon.setAttribute('type', type);
    planeIcon.setAttribute('player', player);
    return planeIcon;
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
        container.innerHTML = svgText;

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

            console.log(rect);

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