// 1. Core Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb); // Sky blue
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Performance cap
document.body.appendChild(renderer.domElement);

// 2. Texture Loading (Pixel Art Style)
const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const t = loader.load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
};

const grassTop = loadTex('./textures/grass_block_top.png');
const grassSide = loadTex('./textures/grass_block_side.png');
const dirt = loadTex('./textures/dirt.png');
const stone = loadTex('./textures/stone.png');

// 3. Materials
const grass_mat = [
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassTop, color: 0x55ab55 }), // Green tint
    new THREE.MeshStandardMaterial({ map: dirt }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide })
];
const dirt_mat = new THREE.MeshStandardMaterial({ map: dirt });
const stone_mat = new THREE.MeshStandardMaterial({ map: stone });

// 4. World Generation Variables
const worldSize = 40;
const heightScale = 12;
const noiseScale = 25;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const maxBlocks = worldSize * worldSize * heightScale; // Total space for stones, dirt, and grass

// 5. Optimized Meshes (InstancedMesh)
const grassIM = new THREE.InstancedMesh(geometry, grass_mat, maxBlocks);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, maxBlocks);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, maxBlocks);

let gIdx = 0, dIdx = 0, sIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// Generation Loop
for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let n = noise.perlin2(x / noiseScale, z / noiseScale);
        let h = Math.floor(((n + 1) / 2) * heightScale);

        for (let y = 0; y <= h; y++) {
            matrix.setPosition(x, y, z);
            if (y === h) grassIM.setMatrixAt(gIdx++, matrix);
            else if (y > h - 3) dirtIM.setMatrixAt(dIdx++, matrix);
            else stoneIM.setMatrixAt(sIdx++, matrix);
        }
    }
}

// 6. Finalizing Meshes (Fixes Stone and Lag)
[grassIM, dirtIM, stoneIM].forEach((mesh, i) => {
    mesh.count = [gIdx, dIdx, sIdx][i]; // Only render blocks created
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere(); // Removes lag when looking away
    scene.add(mesh);
});

scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// 7. Controls & Raycasting (Breaking Blocks)
camera.position.set(worldSize/2, heightScale + 5, worldSize/2);
let yaw = 0, pitch = 0;
const keys = {};
const raycaster = new THREE.Raycaster();
raycaster.far = 5; // Real MC reach distance

function breakBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([grassIM, dirtIM, stoneIM]);

    if (intersects.length > 0) {
        const { object, instanceId } = intersects[0];
        // Move the broken block far away (cleaner than scaling to 0)
        const emptyMatrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
        object.setMatrixAt(instanceId, emptyMatrix);
        object.instanceMatrix.needsUpdate = true;
    }
}

// 8. Event Listeners
document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement && e.button === 0) breakBlock();
    else renderer.domElement.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002));
    }
});

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// 9. Main Loop
function animate() {
    requestAnimationFrame(animate);
    const speed = 0.15;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.w) camera.position.addScaledVector(fwd, -speed);
    if (keys.s) camera.position.addScaledVector(fwd, speed);
    if (keys.a) camera.position.addScaledVector(rgt, -speed);
    if (keys.d) camera.position.addScaledVector(rgt, speed);
    if (keys[' ']) camera.position.y += speed;
    if (keys.shift) camera.position.y -= speed;

    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
}
animate();
