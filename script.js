// 1. Scene & Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1);
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
const grasssideoverlay = loadTex('./textures/grass_block_side_overlay.png');
const dirt = loadTex('./textures/dirt.png');
const stone = loadTex('./textures/stone.png');
const logSide = loadTex('./textures/oak_log.png');
const logTop = loadTex('./textures/oak_log_top.png');
const leaves = loadTex('./textures/oak_leaves.png');

// 3. Materials
const grass_mat = [
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassTop, color: 0x90b953 }),
    new THREE.MeshStandardMaterial({ map: dirt }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide })
];

const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

const fringeMat = new THREE.MeshStandardMaterial({ 
    map: grasssideoverlay, 
    color: 0x90b953, 
    transparent: true, 
    alphaTest: 0.5 
});

const side_overlay_mat = [
    fringeMat, fringeMat, invisibleMat, invisibleMat, fringeMat, fringeMat
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

// 4. World Settings
const worldSize = 40;
const heightScale = 12;
const geometry = new THREE.BoxGeometry(1, 1, 1);

const grassIM = new THREE.InstancedMesh(geometry, grass_mat, 80000);
const dirtIM = new THREE.InstancedMesh(geometry, dirt_mat, 80000);
const stoneIM = new THREE.InstancedMesh(geometry, stone_mat, 80000);

// 🔧 Increased limits so trees don't get cut off
const logIM = new THREE.InstancedMesh(geometry, log_mat, 5000);
const leafIM = new THREE.InstancedMesh(geometry, leaf_mat, 20000);

const sideOverlayIM = new THREE.InstancedMesh(geometry, side_overlay_mat, 80000);
scene.add(sideOverlayIM);

let gIdx = 0, dIdx = 0, sIdx = 0, lIdx = 0, lfIdx = 0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

// 🌳 Tree Function
function spawnTree(x, y, z) {
    const trunkH = 4 + Math.floor(Math.random() * 2);

    for (let i = 0; i < trunkH; i++) {
        matrix.setPosition(x, y + i, z);
        logIM.setMatrixAt(lIdx++, matrix);
    }

    for (let ly = trunkH - 2; ly <= trunkH + 1; ly++) {
        let radius = (ly > trunkH - 1) ? 1 : 2;

        for (let lx = -radius; lx <= radius; lx++) {
            for (let lz = -radius; lz <= radius; lz++) {
                const isCorner = Math.abs(lx) === radius && Math.abs(lz) === radius;

                if (isCorner) {
                    let trimChance = 0;
                    if (ly === trunkH + 1) trimChance = 1.0;
                    else if (ly === trunkH) trimChance = 0.75;
                    else if (ly === trunkH - 1) trimChance = 0.5;
                    else trimChance = 0.2;

                    if (Math.random() < trimChance) continue;
                }

                if (lx === 0 && lz === 0 && ly < trunkH) continue;

                matrix.setPosition(x + lx, y + ly, z + lz);
                leafIM.setMatrixAt(lfIdx++, matrix);
            }
        }
    }
}

// 6. Terrain
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
            const isHidden =
                (x > 0 && x < worldSize - 1 && z > 0 && z < worldSize - 1 && y < h &&
                terrain[x+1][z] >= y && terrain[x-1][z] >= y &&
                terrain[x][z+1] >= y && terrain[x][z-1] >= y);

            if (!isHidden) {
                matrix.setPosition(x, y, z);

                if (y === h) {
                    grassIM.setMatrixAt(gIdx, matrix);

                    // 🌳 TREE SPAWN HERE
                    if (Math.random() < 0.02) {
                        spawnTree(x, y + 1, z);
                    }

                    const overlayMatrix = new THREE.Matrix4();
                    overlayMatrix.makeScale(1.002, 1.002, 1.002);
                    overlayMatrix.setPosition(x, y, z);
                    sideOverlayIM.setMatrixAt(gIdx, overlayMatrix);

                    gIdx++;
                }
                else if (y > h - 3) dirtIM.setMatrixAt(dIdx++, matrix);
                else stoneIM.setMatrixAt(sIdx++, matrix);
            }
        }
    }
}

// Add meshes
[grassIM, dirtIM, stoneIM, logIM, leafIM].forEach(m => {
    scene.add(m);
    m.frustumCulled = false;

    if (m === grassIM) m.count = gIdx;
    if (m === dirtIM) m.count = dIdx;
    if (m === stoneIM) m.count = sIdx;
    if (m === logIM) m.count = lIdx;
    if (m === leafIM) m.count = lfIdx;

    m.instanceMatrix.needsUpdate = true;
});

scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// Controls
camera.position.set(worldSize / 2, 25, worldSize / 2);
let yaw = 0, pitch = 0, keys = {};
const raycaster = new THREE.Raycaster();
raycaster.far = 6;

function animate() {
    requestAnimationFrame(animate);

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
