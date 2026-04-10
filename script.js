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

function animate() {
    requestAnimationFrame(animate);

    // 3. Added '-' to the Z math so you look TOWARD the cube at the start
    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch) 
    );

    if (targetlabel) {
        targetlabel.innerText = `Direction: ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}`;
    }

    const targetPoint = new THREE.Vector3().addVectors(camera.position, direction);
    camera.lookAt(targetPoint);

    renderer.render(scene, camera);
}
animate();
