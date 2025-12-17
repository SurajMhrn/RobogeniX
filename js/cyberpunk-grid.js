
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.id = 'cyberpunk-grid';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';

let width, height;
// Target positions
let targetX = -1000;
let targetY = -1000;
// Current positions (smoothed) - used for fade trail only
let currentX = -1000;
let currentY = -1000;

// Config
const GRID_SIZE = 18; // Smaller grid (more dense)
const COLOR_PRIMARY = '59, 130, 246'; // Blue #3B82F6
const BASE_OPACITY = 0.15;
const FLASHLIGHT_RADIUS = 150;
const SMOOTHING = 0.12;
const MAX_LIFT = 60;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Calculate the vertical lift for any given point (x, y)
// Uses TARGET (raw) mouse position for instant responsiveness/centering
function getLift(x, y) {
    const dist = Math.hypot(x - targetX, y - targetY);
    if (dist > FLASHLIGHT_RADIUS) return 0;

    const normDist = dist / FLASHLIGHT_RADIUS;

    // Smooth Bell Curve (Cosine interpolation)
    const influence = (1 + Math.cos(normDist * Math.PI)) / 2;
    return MAX_LIFT * influence;
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Smooth trail for color opacity/fade
    currentX = lerp(currentX, targetX, SMOOTHING);
    currentY = lerp(currentY, targetY, SMOOTHING);

    // 1. Floor Glow (follows smoothed cursor for trailing light effect)
    const floorGlow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, FLASHLIGHT_RADIUS * 1.5);
    floorGlow.addColorStop(0, `rgba(${COLOR_PRIMARY}, 0.1)`);
    floorGlow.addColorStop(1, `rgba(${COLOR_PRIMARY}, 0)`);
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;

    const cols = Math.ceil(width / GRID_SIZE);
    const rows = Math.ceil(height / GRID_SIZE);

    for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
            const x = c * GRID_SIZE;
            const y = r * GRID_SIZE;

            // Current vertex lift
            const lift = getLift(x, y);
            const z = y - lift; // Visual Y position

            // Draw Horizontal Connection (Rightwards)
            if (c < cols) {
                const nextX = (c + 1) * GRID_SIZE;
                const nextY = y;
                const nextLift = getLift(nextX, nextY);
                const nextZ = nextY - nextLift;

                const alpha = Math.max(BASE_OPACITY, (lift + nextLift) / (2 * MAX_LIFT));
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${COLOR_PRIMARY}, ${alpha})`;
                ctx.moveTo(x, z);
                ctx.lineTo(nextX, nextZ);
                ctx.stroke();
            }

            // Draw Vertical Connection (Downwards)
            if (r < rows) {
                const nextX = x;
                const nextY = (r + 1) * GRID_SIZE;
                const nextLift = getLift(nextX, nextY);
                const nextZ = nextY - nextLift;

                const alpha = Math.max(BASE_OPACITY, (lift + nextLift) / (2 * MAX_LIFT));
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${COLOR_PRIMARY}, ${alpha})`;
                ctx.moveTo(x, z);
                ctx.lineTo(nextX, nextZ);
                ctx.stroke();
            }

            // Fill Mesh Quads (optional, for that "filled" look)
            if (c < cols && r < rows) {
                const x2 = (c + 1) * GRID_SIZE;
                const y2 = (r + 1) * GRID_SIZE;

                // Get lifts for all 4 corners
                const trLift = getLift(x2, y);
                const blLift = getLift(x, y2);
                const brLift = getLift(x2, y2);

                // Average lift creates opacity
                const avgLift = (lift + trLift + blLift + brLift) / 4;
                if (avgLift > 0.5) { // Only fill active area
                    const opacity = (avgLift / MAX_LIFT) * 0.4;
                    ctx.fillStyle = `rgba(${COLOR_PRIMARY}, ${opacity})`;

                    ctx.beginPath();
                    ctx.moveTo(x, y - lift);
                    ctx.lineTo(x2, y - trLift);
                    ctx.lineTo(x2, y2 - brLift);
                    ctx.lineTo(x, y2 - blLift);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }

    requestAnimationFrame(draw);
}

draw();
