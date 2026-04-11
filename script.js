// 1. Woods Atmosphere Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Indev Woods Theme: Dark, gloomy green-gray sky
const woodsColor = 0x4a5a4a; 
renderer.setClearColor(woodsColor);
scene.fog = new THREE.Fog(woodsColor, 5, 45); // Thick fog for the "Woods" feel
document.body.appendChild(renderer.domElement);

// 2. Textures (Sharp Pixels)
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

// 3. Materials
const grass_mat = [new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassTop, color: 0x447744}), new THREE.MeshStandardMaterial({map: dirt}), new THREE.MeshStandardMaterial({map: grassSide}), new THREE.MeshStandardMaterial({map: grassSide})];
const log_mat = [new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logTop}), new THREE.MeshStandardMaterial({map: logTop}), new THREE.MeshStandardMaterial({map: logSide}), new THREE.MeshStandardMaterial({map: logSide})];
const dirt_mat = new THREE.MeshStandardMaterial({ map: dirt });
const stone_mat = new THREE.MeshStandardMaterial({ map: stone });
const leaf_mat = new THREE.MeshStandardMaterial({ map: leaves, transparent: true, opacity: 0.8, color: 0x335533 });

// 4. World Variables (Finite Indev Island)
const worldSize = 50;
const worldHeight = 30;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassIM = new THREE.InstancedMesh(geometry, grass_mat, 10000);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, 20000);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, 50000);
const logIM = new THREE.InstancedMesh(geometry, log_mat, 15000); // High capacity for woods
const leafIM = new THREE.InstancedMesh(geometry, leaf_mat, 50000);

let gIdx = 0, dIdx = 0, sIdx = 0, lIdx = 0, lfIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// Indev Tree Spawner
function spawnIndevTree(x, y, z) {
    const trunkH = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < trunkH; i++) {
        matrix.setPosition(x, y + i, z);
        logIM.setMatrixAt(lIdx++, matrix);
    }
    for (let ly = trunkH - 3; ly <= trunkH + 1; ly++) {
        let rad = (ly > trunkH - 1) ? 1 : 2;
        for (let lx = -rad; lx <= rad; lx++) {
            for (let lz = -rad; lz <= rad; lz++) {
                if (rad === 2 && Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
                matrix.setPosition(x + lx, y + ly, z + lz);
                leafIM.setMatrixAt(lfIdx++, matrix);
            }
        }
    }
}

// 5. Generate Woods Terrain
for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let n = noise.perlin2(x / 20, z / 20);
        let h = Math.floor(((n + 1) / 2) * 10) + 15;

        for (let y = 0; y <= h; y++) {
            matrix.setPosition(x, y, z);
            if (y === h) {
                grassIM.setMatrixAt(gIdx++, matrix);
                // DENSE WOODS: 8% chance for trees (Indev Woods was very thick)
                if (Math.random() < 0.08) spawnIndevTree(x, y + 1, z);
            } else if (y > h - 4) {
                dirtIM.setMatrixAt(dIdx++, matrix);
            } else {
                stoneIM.setMatrixAt(sIdx++, matrix);
            }
        }
    }
}

[grassIM, dirtIM, stoneIM, logIM, leafIM].forEach(m => {
    scene.add(m);
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
});

// 6. Dim Overcast Lighting
scene.add(new THREE.AmbientLight(0x666666, 0.8)); // Low light
const sun = new THREE.DirectionalLight(0xffffff, 0.4); // Weak sun
sun.position.set(5, 20, 5);
scene.add(sun);

// 7. Continuous Mining Logic
let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, req: 400 };
const ray = new THREE.Raycaster();
ray.far = 5;

function updateMining() {
    if (!mining.active) return;
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hit = ray.intersectObjects([grassIM, dirtIM, stoneIM, logIM, leafIM])[0];
    
    if (!hit || hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId) {
        if (hit) startMining(hit); else mining.active = false;
        return;
    }

    if (Date.now() - mining.startTime >= mining.req) {
        mining.targetMesh.setMatrixAt(mining.targetId, new THREE.Matrix4().makeTranslation(0,-1000,0));
        mining.targetMesh.instanceMatrix.needsUpdate = true;
        const next = ray.intersectObjects([grassIM, dirtIM, stoneIM, logIM, leafIM])[0];
        if (next) startMining(next); else mining.active = false;
    }
}

function startMining(hit) {
    mining = { active: true, startTime: Date.now(), targetMesh: hit.object, targetId: hit.instanceId,
               req: (hit.object === stoneIM) ? 1000 : (hit.object === logIM) ? 600 : 250 };
}

// 8. Controls & Loop
camera.position.set(worldSize/2, 35, worldSize/2);
let yaw = 0, pitch = 0, keys = {};
document.addEventListener('mousedown', (e) => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else if (e.button === 0) { const h = ray.intersectObjects([grassIM, dirtIM, stoneIM, logIM, leafIM])[0]; if (h) startMining(h); }
});
document.addEventListener('mouseup', () => mining.active = false);
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-1.5, Math.min(1.5, pitch - e.movementY * 0.002));
    }
});
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function animate() {
    requestAnimationFrame(animate);
    updateMining();
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0,1,0)).normalize();
    if (keys.w) camera.position.addScaledVector(fwd, -0.15);
    if (keys.s) camera.position.addScaledVector(fwd, 0.15);
    if (keys.a) camera.position.addScaledVector(rgt, -0.15);
    if (keys.d) camera.position.addScaledVector(rgt, 0.15);
    if (keys[' ']) camera.position.y += 0.15;
    if (keys.shift) camera.position.y -= 0.15;
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
}
animate();
