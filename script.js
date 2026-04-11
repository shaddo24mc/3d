// 1. Scene & Camera Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb); // Sky blue
document.body.appendChild(renderer.domElement);

// 2. Texture & Material Setup
const loader = new THREE.TextureLoader();
const loadTex = (path) => {
    const t = loader.load(path);
    t.magFilter = THREE.NearestFilter; // Keep pixels sharp
    t.minFilter = THREE.NearestFilter;
    return t;
};

const grassTop = loadTex('./textures/grass_block_top.png');
const grassSide = loadTex('./textures/grass_block_side.png');
const dirt = loadTex('./textures/dirt.png');
const stone = loadTex('./textures/stone.png');

const grass_mat = [
    new THREE.MeshStandardMaterial({ map: grassSide }), // Right
    new THREE.MeshStandardMaterial({ map: grassSide }), // Left
    new THREE.MeshStandardMaterial({ map: grassTop, color: 0x55ab55 }), // Top
    new THREE.MeshStandardMaterial({ map: dirt }), // Bottom
    new THREE.MeshStandardMaterial({ map: grassSide }), // Front
    new THREE.MeshStandardMaterial({ map: grassSide })  // Back
];
const dirt_mat = new THREE.MeshStandardMaterial({ map: dirt });
const stone_mat = new THREE.MeshStandardMaterial({ map: stone });

// 3. Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.0));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, 10);
scene.add(sun);

// 4. World Generation (Optimized with InstancedMesh)
const worldSize = 50;
const heightScale = 12;
const noiseScale = 25;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const maxBlocks = worldSize * worldSize * heightScale;

// Create 3 meshes (one for each material)
const grassIM = new THREE.InstancedMesh(geometry, grass_mat, maxBlocks);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, maxBlocks);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, maxBlocks);

let gIdx = 0, dIdx = 0, sIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// Occlusion check: Don't render blocks completely surrounded
const isSurface = (x, y, z) => {
    const h = Math.floor(((noise.perlin2(x / noiseScale, z / noiseScale) + 1) / 2) * heightScale);
    return y >= h;
};

for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        const h = Math.floor(((noise.perlin2(x / noiseScale, z / noiseScale) + 1) / 2) * heightScale);
        for (let y = 0; y <= h; y++) {
            // Optimization: Only render if top face or sides might be visible
            if (y === h || isSurface(x+1,y,z) || isSurface(x-1,y,z) || isSurface(x,y,z+1) || isSurface(x,y,z-1)) {
                matrix.setPosition(x, y, z);
                if (y === h) grassIM.setMatrixAt(gIdx++, matrix);
                else if (y > h - 3) dirtIM.setMatrixAt(dIdx++, matrix);
                else stoneIM.setMatrixAt(sIdx++, matrix);
            }
        }
    }
}
scene.add(grassIM, dirtIM, stoneIM);

// 5. Controls & Movement
camera.position.set(worldSize/2, heightScale + 5, worldSize/2);
let yaw = 0, pitch = 0;
const keys = {};

document.addEventListener('mousedown', () => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else breakBlock(); // Break block on click if locked
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002));
    }
});

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// 6. Block Breaking Logic
const raycaster = new THREE.Raycaster();
const centerMouse = new THREE.Vector2(0, 0);

function breakBlock() {
    raycaster.setFromCamera(centerMouse, camera);
    const intersects = raycaster.intersectObjects([grassIM, dirtIM, stoneIM]);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object;
        const instanceId = hit.instanceId;

        // Hide instance by scaling to 0
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(instanceId, tempMatrix);
        mesh.instanceMatrix.needsUpdate = true; // Required to see change
    }
}

// 7. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.15;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.w) camera.position.addScaledVector(forward, -moveSpeed);
    if (keys.s) camera.position.addScaledVector(forward, moveSpeed);
    if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.d) camera.position.addScaledVector(right, moveSpeed);
    if (keys[' ']) camera.position.y += moveSpeed;
    if (keys.shift) camera.position.y -= moveSpeed;

    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
}
animate();
