const targetlabel = document.getElementById("targetl"); 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

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

    // 1. Direction the camera is actually looking
    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
    );

    // 2. MINECRAFT STABLE MOVEMENT
    // We calculate "Forward" purely based on the yaw rotation
    const forwardX = Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    
    // This is our 'flat' forward (horizontal only)
    const flatForward = new THREE.Vector3(forwardX, 0, forwardZ).normalize();
    
    // The 'Right' vector is always 90 degrees to the flatForward
    // Crossing (X, 0, Z) with (0, 1, 0) always gives a consistent Right
    const flatRight = new THREE.Vector3().crossVectors(flatForward, new THREE.Vector3(0, 1, 0));

    // Move the camera body
    if (keys.w) camera.position.addScaledVector(flatForward, moveSpeed);
    if (keys.s) camera.position.addScaledVector(flatForward, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(flatRight, moveSpeed);
    if (keys.a) camera.position.addScaledVector(flatRight, -moveSpeed);

    // Vertical flight
    if (keys[' ']) camera.position.y += moveSpeed;
    if (keys.shift) camera.position.y -= moveSpeed;

    // 3. Update Camera Look
    const targetPoint = new THREE.Vector3().addVectors(camera.position, direction);
    camera.lookAt(targetPoint);

    renderer.render(scene, camera);
}

animate();
