const container = document.getElementById('svg-container');
const timeDisplay = document.getElementById('time');
const timeButton = document.getElementById('time-button');

let zuluTime = false;

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
    timeButton.textContent = zuluTime ? 'UTC' : 'Local';
    updateTime();
});

fetch('assets/coast.svg')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load SVG: ' + response.status);
        }
        return response.text();
    })
    .then(svgText => {
        container.innerHTML = svgText;

        const svg = container.querySelector('svg');
        if (!svg) throw new Error('No <svg> element found in file');

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

