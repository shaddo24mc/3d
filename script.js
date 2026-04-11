
const targetlabel = document.getElementById("targetl"); 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const loader = new THREE.TextureLoader();
const geometry = new THREE.BoxGeometry(1, 1, 1);






//grass
const grassside = loader.load('./textures/grass_block_side.png');
const grass = loader.load('./textures/grass_block_top.png');
const dirt = loader.load('./textures/dirt.png');dirt.magFilter = THREE.NearestFilter;

});
const grass_mat = [
  new THREE.MeshStandardMaterial({ map: grassside }),   // Right
  new THREE.MeshStandardMaterial({ map: grassside }),   // Left
  new THREE.MeshStandardMaterial({ map: grass, color: 0x55ab55 }), // Top (Tinted Green)
  new THREE.MeshStandardMaterial({ map: dirt }), // Bottom
  new THREE.MeshStandardMaterial({ map: grassside }),   // Front
  new THREE.MeshStandardMaterial({ map: grassside })    // Back
];
const grass_block = new THREE.Mesh(geometry, grass_mat);
//grass






//dirt
const dirt_mat = [
  new THREE.MeshStandardMaterial({ map: dirt }),   // Right
  new THREE.MeshStandardMaterial({ map: dirt }),   // Left
  new THREE.MeshStandardMaterial({ map: dirt }), // Top
  new THREE.MeshStandardMaterial({ map: dirt }), // Bottom
  new THREE.MeshStandardMaterial({ map: dirt }),   // Front
  new THREE.MeshStandardMaterial({ map: dirt })    // Back]
];
const dirt_block = new THREE.Mesh(geometry, dirt_mat)
//dirt

//stone
const stone = loader.load("./textures/stone.png")
const stone_mat = [
  new THREE.MeshStandardMaterial({ map: stone }),   // Right
  new THREE.MeshStandardMaterial({ map: stone }),   // Left
  new THREE.MeshStandardMaterial({ map: stone }), // top
  new THREE.MeshStandardMaterial({ map: stone }), // Bottom
  new THREE.MeshStandardMaterial({ map: stone }),   // Front
  new THREE.MeshStandardMaterial({ map: stone })    // Back]
];
const stone_block = new THREE.Mesh(geometry, stone_mat)
//stone


[grassside, grass, dirt, stone].forEach((t) => {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
renderer.setSize(window.innerWidth, window.innerHeight);
// 1. Changed to white background
renderer.setClearColor(0xffffff); 
document.body.appendChild(renderer.domElement);

// 2. Add click listener to lock the mouse (required for movement to work)
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockerror', () => {
    console.error("Pointer Lock failed. Try clicking again after the page fully loads.");
}, false);


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
// 1. Ambient Light (Lights up everything equally so there are no pitch-black shadows)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
scene.add(ambientLight);

// 2. Directional Light (Like the Sun - gives the block 3D shading)
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(5, 10, 2); // Position it above and to the side
scene.add(sunLight);
// 1. Set your world seed
noise.seed(Math.random()); // Or a fixed number like 12345

const worldSize = 25;    // Width and depth of your world
const heightScale = 10;  // Maximum height of your hills
const noiseScale = 30;   // Higher = smoother, wider hills

for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        
        // 2. Generate smooth noise (-1 to 1) 
        // We divide x and z by noiseScale to "zoom in" and get smooth hills
        let n = noise.perlin2(x / noiseScale, z / noiseScale);
        
        // 3. Convert -1...1 range to 0...1 range and scale to height
        let h = (n + 1) / 2;
        let surfaceY = Math.floor(h * heightScale);

        // 4. Fill the column with blocks
        for (let y = 0; y <= surfaceY; y++) {
            let block;
            
            if (y === surfaceY) {
                block = grass_block.clone(); // Top is grass
            } else if (y > surfaceY - 3) {
                block = dirt_block.clone();  // Middle is dirt
            } else {
                block = stone_block.clone(); // Bottom is stone
            }

            block.position.set(x, y, z);
            scene.add(block);
        }
    }
}




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
