const targetlabel = document.getElementById("targetl"); 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const loader = new THREE.TextureLoader();
const texture = loader.load('./textures/dirt.png');
renderer.setSize(window.innerWidth, window.innerHeight);
// 1. Changed to white background
renderer.setClearColor(0xffffff); 
document.body.appendChild(renderer.domElement);

// 2. Add click listener to lock the mouse (required for movement to work)
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
);
scene.add(cube);

camera.position.z = 5;

let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    }
});
const keys = { w: false, a: false, s: false, d: false, ' ': false, shift: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});
const moveSpeed = 0.15;
function animate() {
    requestAnimationFrame(animate);

    // Direction you are looking
    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
    );

    // --- MINECRAFT MOVEMENT ---
    
    // 1. Get the horizontal forward vector (ignore Y)
    const flatForward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    
    // 2. Get the horizontal right vector
    const flatRight = new THREE.Vector3().crossVectors(flatForward, new THREE.Vector3(0, 1, 0)).normalize();

    // WASD - Move on the horizontal plane
    if (keys.w) camera.position.addScaledVector(flatForward, moveSpeed);
    if (keys.s) camera.position.addScaledVector(flatForward, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(flatRight, moveSpeed);
    if (keys.a) camera.position.addScaledVector(flatRight, -moveSpeed);

    // Space/Shift - Vertical flight
    if (keys[' ']) camera.position.y += moveSpeed;
    if (keys.shift) camera.position.y -= moveSpeed;

    // -----------------------

    const targetPoint = new THREE.Vector3().addVectors(camera.position, direction);
    if (targetlabel) {
        const x = direction.x.toFixed(2);
        const y = direction.y.toFixed(2);
        targetlabel.innerText = "X: " + x + " Y: " + y; // Using + instead of backticks to be safe
    }
    camera.lookAt(targetPoint);
    renderer.render(scene, camera);
}


animate();
