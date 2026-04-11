// 1. Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
document.body.appendChild(renderer.domElement);

// 2. Textures & Materials (Added Log and Leaves)
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
const logSide = loadTex('./textures/oak_log.png');
const logTop = loadTex('./textures/oak_log_top.png');
const leaves = loadTex('./textures/oak_leaves.png');

const grass_mat = [new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassTop, color: 0x55ab55}), new THREE.MeshStandardMaterial({map: dirt}), new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassSide})];
const log_mat = [new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logTop}), new THREE.MeshStandardMaterial({map: logTop}), new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logSide})];
const dirt_mat = new THREE.MeshStandardMaterial({ map: dirt });
const stone_mat = new THREE.MeshStandardMaterial({ map: stone });
const leaf_mat = new THREE.MeshStandardMaterial({ map: leaves, transparent: true, opacity: 0.9, color: 0x55ab55 });

// 3. World Generation Variables
const worldSize = 40;
const worldDepth = 64; // Much deeper
const heightScale = 15;
const noiseScale = 25;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const maxBlocks = 150000; // Increased capacity

const grassIM = new THREE.InstancedMesh(geometry, grass_mat, maxBlocks);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, maxBlocks);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, maxBlocks);
const logIM = new THREE.InstancedMesh(geometry, log_mat, 5000);
const leafIM = new THREE.InstancedMesh(geometry, leaf_mat, 20000);

let gIdx = 0, dIdx = 0, sIdx = 0, lIdx = 0, lfIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// Tree Function
function spawnTree(x, y, z) {
    for (let i = 0; i < 5; i++) { // Trunk
        matrix.setPosition(x, y + i, z);
        logIM.setMatrixAt(lIdx++, matrix);
    }
    for (let lx = -2; lx <= 2; lx++) { // Leaves
        for (let ly = 3; ly <= 6; ly++) {
            for (let lz = -2; lz <= 2; lz++) {
                if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly-5) > 3) continue;
                matrix.setPosition(x + lx, y + ly, z + lz);
                leafIM.setMatrixAt(lfIdx++, matrix);
            }
        }
    }
}

// Generate Terrain
for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let n = noise.perlin2(x / noiseScale, z / noiseScale);
        let h = Math.floor(((n + 1) / 2) * heightScale) + 20; // +20 so it's not at 0

        for (let y = 0; y <= h; y++) {
            matrix.setPosition(x, y, z);
            if (y === h) {
                grassIM.setMatrixAt(gIdx++, matrix);
                if (Math.random() < 0.02) spawnTree(x, y + 1, z);
            } 
            else if (y > h - 4) dirtIM.setMatrixAt(dIdx++, matrix);
            else stoneIM.setMatrixAt(sIdx++, matrix);
        }
    }
}

[grassIM, dirtIM, stoneIM, logIM, leafIM].forEach(m => { scene.add(m); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); });
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

// 4. Mining & Continuous Break Logic
let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };
const raycaster = new THREE.Raycaster();
raycaster.far = 5;

function getLookTarget() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([grassIM, dirtIM, stoneIM, logIM, leafIM]);
    return intersects.length > 0 ? intersects[0] : null;
}

function updateMining() {
    if (!mining.active) return;
    const hit = getLookTarget();

    // If we finished one block OR started looking at a new one while holding mouse
    if (!hit || (mining.targetMesh && (hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId))) {
        if (!hit) { resetMining(); return; }
        // NEW: If holding mouse and move to new block, start mining that new block
        startMining(hit);
        return;
    }

    const elapsed = Date.now() - mining.startTime;
    if (elapsed >= mining.requiredTime) {
        // BREAK BLOCK
        const m = new THREE.Matrix4().makeTranslation(0, -1000, 0);
        mining.targetMesh.setMatrixAt(mining.targetId, m);
        mining.targetMesh.instanceMatrix.needsUpdate = true;
        
        // CONTINUOUS MINE: Immediately look for the next block under the cursor
        const nextHit = getLookTarget();
        if (nextHit) startMining(nextHit);
        else resetMining();
    }
}

function startMining(hit) {
    mining.active = true;
    mining.startTime = Date.now();
    mining.targetMesh = hit.object;
    mining.targetId = hit.instanceId;
    if (hit.object === stoneIM) mining.requiredTime = 1000;
    else if (hit.object === logIM) mining.requiredTime = 700;
    else mining.requiredTime = 300;
}

function resetMining() { mining.active = false; mining.targetMesh = null; }

// 5. Controls & Animation
camera.position.set(worldSize / 2, 45, worldSize / 2);
let yaw = 0, pitch = 0;
const keys = {};

document.addEventListener('mousedown', (e) => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else if (e.button === 0) { const hit = getLookTarget(); if (hit) startMining(hit); }
});
document.addEventListener('mouseup', (e) => { if (e.button === 0) resetMining(); });
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch - e.movementY * 0.002));
    }
});
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function animate() {
    requestAnimationFrame(animate);
    updateMining();
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
