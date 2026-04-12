// 1. Scene & Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1); // Set to 1 for maximum performance
document.body.appendChild(renderer.domElement);

// 2. Textures
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
const grass_mat = [
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassTop, color: 0xb2d67d  }),
    new THREE.MeshStandardMaterial({ map: dirt }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide })
];
const log_mat = [
    new THREE.MeshStandardMaterial({ map: logSide }),
    new THREE.MeshStandardMaterial({ map: logSide }),
    new THREE.MeshStandardMaterial({ map: logTop }),
    new THREE.MeshStandardMaterial({ map: logTop }),
    new THREE.MeshStandardMaterial({ map: logSide }),
    new THREE.MeshStandardMaterial({ map: logSide })
];
const dirt_mat = new THREE.MeshStandardMaterial({ map: dirt });
const stone_mat = new THREE.MeshStandardMaterial({ map: stone });
const leaf_mat = new THREE.MeshStandardMaterial({ map: leaves, transparent: true, opacity: 0.9, color: 0x91bd59 });

// 4. World Settings & Optimized Meshes
const worldSize = 40;
const worldDepth = 40;
const heightScale = 12;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const maxBlocks = 80000;

const grassIM = new THREE.InstancedMesh(geometry, grass_mat, maxBlocks);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, maxBlocks);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, maxBlocks);
const logIM = new THREE.InstancedMesh(geometry, log_mat, 2000);
const leafIM = new THREE.InstancedMesh(geometry, leaf_mat, 10000);

let gIdx = 0, dIdx = 0, sIdx = 0, lIdx = 0, lfIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// 5. Tree Logic (Minecraft Box Style)
function spawnTree(x, y, z) {
    const trunkH = 4 + Math.floor(Math.random() * 2);
    // Trunk
    for (let i = 0; i < trunkH; i++) {
        matrix.setPosition(x, y + i, z);
        logIM.setMatrixAt(lIdx++, matrix);
    }

    // Leaves (Layered Boxes)
    for (let ly = trunkH - 2; ly <= trunkH + 1; ly++) {
        let radius = (ly > trunkH - 1) ? 1 : 2; 

        for (let lx = -radius; lx <= radius; lx++) {
            for (let lz = -radius; lz <= radius; lz++) {
                
                // 1. Identify if we are at a corner
                const isCorner = Math.abs(lx) === radius && Math.abs(lz) === radius;

                if (isCorner) {
                    // 2. Define trim chance based on layer height
                    let trimChance = 0;
                    if (ly === trunkH + 1) trimChance = 1.0; // Top layer: always trim all 4 corners
                    else if (ly === trunkH) trimChance = 0.75; // 2nd layer: usually trims 3 corners, leaves 1
                    else if (ly === trunkH - 1) trimChance = 0.5; // 3rd layer: 50/50 chance per corner
                    else trimChance = 0.2; // Bottom layer: very bushy, rarely trims

                    if (Math.random() < trimChance) continue;
                }

                // Don't place inside the trunk
                if (lx === 0 && lz === 0 && ly < trunkH) continue;

                matrix.setPosition(x + lx, y + ly, z + lz);
                leafIM.setMatrixAt(lfIdx++, matrix);
            }
        }
    }
}


// 6. Terrain Generation with Culling
const terrain = [];
for (let x = 0; x < worldSize; x++) {
    terrain[x] = [];
    for (let z = 0; z < worldSize; z++) {
        let n = noise.perlin2(x / 25, z / 25);
        terrain[x][z] = Math.floor(((n + 1) / 2) * heightScale) + 10;
    }
}

for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        const h = terrain[x][z];
        for (let y = 0; y <= h; y++) {
            // CULLING CHECK: If block is surrounded on all sides, skip it
            const isHidden = (x > 0 && x < worldSize - 1 && z > 0 && z < worldSize - 1 && y < h &&
                             terrain[x+1][z] >= y && terrain[x-1][z] >= y &&
                             terrain[x][z+1] >= y && terrain[x][z-1] >= y);
            
            if (!isHidden) {
                matrix.setPosition(x, y, z);
                if (y === h) {
                    grassIM.setMatrixAt(gIdx++, matrix);
                    if (Math.random() < 0.02) spawnTree(x, y + 1, z);
                } 
                else if (y > h - 3) dirtIM.setMatrixAt(dIdx++, matrix);
                else stoneIM.setMatrixAt(sIdx++, matrix);
            }
        }
    }
}

[grassIM, dirtIM, stoneIM, logIM, leafIM].forEach(m => {
    scene.add(m);
    m.frustumCulled = false;
    // Set the draw count to the number of blocks actually placed
    if (m === grassIM) m.count = gIdx;
    if (m === dirtIM) m.count = dIdx;
    if (m === stoneIM) m.count = sIdx;
    if (m === logIM) m.count = lIdx;
    if (m === leafIM) m.count = lfIdx;
    
    m.instanceMatrix.needsUpdate = true;
});

scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// 7. Controls & Mining (Continuous)
camera.position.set(worldSize / 2, 25, worldSize / 2);
let yaw = 0, pitch = 0, keys = {};
const raycaster = new THREE.Raycaster();
raycaster.far = 6;

let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };

function getTarget() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hit = raycaster.intersectObjects([grassIM, dirtIM, stoneIM, logIM, leafIM]);
    return hit.length > 0 ? hit[0] : null;
}

function startMining(hit) {
    mining = {
        active: true,
        startTime: Date.now(),
        targetMesh: hit.object,
        targetId: hit.instanceId,
        requiredTime: (hit.object === stoneIM) ? 1000 : (hit.object === logIM) ? 700 : 300
    };
}

function updateMining() {
    if (!mining.active) return; 

    const hit = getTarget();
    if (!hit || hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId) {
        if (hit) startMining(hit);
        else mining.active = false;
        return;
    }

    if (Date.now() - mining.startTime >= mining.requiredTime) {
        const mesh = mining.targetMesh;
        const targetIdx = mining.targetId;
        const lastIdx = mesh.count - 1; 

        // Swap: Move the last block into the hole left by the broken block
        if (targetIdx !== lastIdx) {
            const lastMatrix = new THREE.Matrix4();
            mesh.getMatrixAt(lastIdx, lastMatrix);
            mesh.setMatrixAt(targetIdx, lastMatrix);
        }

        // Pop: Reduce count so the GPU ignores the last slot
        mesh.count--;
        mesh.instanceMatrix.needsUpdate = true;

        const next = getTarget();
        if (next) startMining(next);
        else mining.active = false;
    }
} // End of updateMining


// 8. Listeners & Loop
document.addEventListener('mousedown', (e) => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else if (e.button === 0) { const hit = getTarget(); if (hit) startMining(hit); }
});
document.addEventListener('mouseup', () => mining.active = false);
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002));
    }
});
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function animate() {
    requestAnimationFrame(animate);
    updateMining();
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
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
