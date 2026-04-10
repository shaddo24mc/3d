const targetlabel = document.getElementById("targetl"); // Fix 1: lowercase 'g'
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Set to Black so you can see the Green cube
document.body.appendChild(renderer.domElement);

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
);
scene.add(cube);

let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    }
});

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);

    // Create the direction vector
    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
    );

    // Fix 2: Use innerText instead of overwriting the variable
    if (targetlabel) {
        targetlabel.innerText = `Direction: ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}`;
    }

    // Fix 3: Look at a point IN FRONT of the camera
    const targetPoint = new THREE.Vector3().addVectors(camera.position, direction);
    camera.lookAt(targetPoint);

    renderer.render(scene, camera);
}
animate();
