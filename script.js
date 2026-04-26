// ----------------------------------------------------
// 1. Scene & Renderer Setup
// ----------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1); 
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const moveSpeed = 10;
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

renderer.shadowMap.enabled = false; 

// ----------------------------------------------------
// 2. Texture & Material System
// ----------------------------------------------------
const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const t = loader.load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false; 
    return t;
};

// Texture Library (Ensure these paths are correct in your project folder)
const grassTop = loadTex('./textures/grass_block_top.png');
const grassSide = loadTex('./textures/grass_block_side.png');
const grassSideOverlay = loadTex('./textures/grass_block_side_overlay.png');
const dirt = loadTex('./textures/dirt.png');
const stone = loadTex('./textures/stone.png');
const logSide = loadTex('./textures/oak_log.png');
const logTop = loadTex('./textures/oak_log_top.png');
const leaves = loadTex('./textures/oak_leaves.png');
const coalore = loadTex('./textures/coal_ore.png');
const ironore = loadTex('./textures/iron_ore.png');
const copperore = loadTex('./textures/copper_ore.png');
const goldore = loadTex('./textures/gold_ore.png');
const redstoneore = loadTex('./textures/redstone_ore.png');
const emeraldore = loadTex('./textures/emerald_ore.png');
const lapisore = loadTex('./textures/lapis_ore.png');
const diamondore = loadTex('./textures/diamond_ore.png');
const deepslatetop = loadTex('./textures/deepslate_top.png');
const deepslate = loadTex('./textures/deepslate.png');
const deepslateironore = loadTex('./textures/deepslate_iron_ore.png');
const deepslatecoalore = loadTex('./textures/deepslate_coal_ore.png');
const deepslatecopperore = loadTex('./textures/deepslate_copper_ore.png');
const deepslategoldore = loadTex('./textures/deepslate_gold_ore.png');
const deepslateredstoneore = loadTex('./textures/deepslate_redstone_ore.png');
const deepslateemeraldore = loadTex('./textures/deepslate_emerald_ore.png');
const deepslatelapisore = loadTex('./textures/deepslate_lapis_ore.png');
const deepslatediamondore = loadTex('./textures/deepslate_diamond_ore.png');
const bedrock = loadTex('./textures/bedrock.png');
const sand = loadTex('./textures/sand.png'); 
const snow = loadTex('./textures/snow.png');
const snowyGrassSide = loadTex('./textures/grass_block_snow.png');
const sandstonetop = loadTex('./textures/sandstone_top.png');
const sandstoneside = loadTex('./textures/sandstone.png');
const sandstonebottom = loadTex('./textures/sandstone_bottom.png');

const destroyTextures = [];
for (let i = 0; i < 10; i++) {
    destroyTextures.push(loadTex(`./textures/destroy_stage_${i}.png`)); 
}

const grass_color = 0x8db753;
const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const fringeMat = new THREE.MeshStandardMaterial({ 
    map: grassSideOverlay, color: grass_color, transparent: true, alphaTest: 0.5 
});

const materials = {
    grass: [
        new THREE.MeshStandardMaterial({ map: grassSide }),
        new THREE.MeshStandardMaterial({ map: grassSide }),
        new THREE.MeshStandardMaterial({ map: grassTop, color: grass_color }),
        new THREE.MeshStandardMaterial({ map: dirt }),
        new THREE.MeshStandardMaterial({ map: grassSide }),
        new THREE.MeshStandardMaterial({ map: grassSide })
    ],
    snow_grass: [
        new THREE.MeshStandardMaterial({ map: snowyGrassSide }),
        new THREE.MeshStandardMaterial({ map: snowyGrassSide }),
        new THREE.MeshStandardMaterial({ map: snow }), 
        new THREE.MeshStandardMaterial({ map: dirt }),
        new THREE.MeshStandardMaterial({ map: snowyGrassSide }),
        new THREE.MeshStandardMaterial({ map: snowyGrassSide })
    ],
    overlay: [fringeMat, fringeMat, invisibleMat, invisibleMat, fringeMat, fringeMat],
    dirt: new THREE.MeshStandardMaterial({ map: dirt }),
    stone: new THREE.MeshStandardMaterial({ map: stone }),
    sand: new THREE.MeshStandardMaterial({ map: sand }),
    sandstone: [
        new THREE.MeshStandardMaterial({ map: sandstoneside}),
        new THREE.MeshStandardMaterial({ map: sandstoneside}),
        new THREE.MeshStandardMaterial({ map: sandstonetop}),
        new THREE.MeshStandardMaterial({ map: sandstonebottom}),
        new THREE.MeshStandardMaterial({ map: sandstoneside}),
        new THREE.MeshStandardMaterial({ map: sandstoneside})
    ],
    snow: new THREE.MeshStandardMaterial({ map: snow}), 
    coal: new THREE.MeshStandardMaterial({ map: coalore }),
    iron: new THREE.MeshStandardMaterial({ map: ironore }),
    copper: new THREE.MeshStandardMaterial({ map: copperore }),
    gold: new THREE.MeshStandardMaterial({map: goldore}),
    redstone: new THREE.MeshStandardMaterial({map: redstoneore}),
    emerald: new THREE.MeshStandardMaterial({map: emeraldore}),
    lapis: new THREE.MeshStandardMaterial({map: lapisore}),
    diamond: new THREE.MeshStandardMaterial({map: diamondore}),
    deepslate: [
        new THREE.MeshStandardMaterial({ map: deepslate }),
        new THREE.MeshStandardMaterial({ map: deepslate }),
        new THREE.MeshStandardMaterial({ map: deepslatetop}),
        new THREE.MeshStandardMaterial({ map: deepslatetop}),
        new THREE.MeshStandardMaterial({ map: deepslate }),
        new THREE.MeshStandardMaterial({ map: deepslate })
    ],
    deepslatecoal: new THREE.MeshStandardMaterial({ map: deepslatecoalore}),
    deepslatecopper: new THREE.MeshStandardMaterial({ map: deepslatecopperore}),
    deepslateiron: new THREE.MeshStandardMaterial({ map: deepslateironore}),
    deepslategold: new THREE.MeshStandardMaterial({ map: deepslategoldore}),
    deepslateredstone: new THREE.MeshStandardMaterial({ map: deepslateredstoneore}),
    deepslateemerald: new THREE.MeshStandardMaterial({ map: deepslateemeraldore}),
    deepslatelapis: new THREE.MeshStandardMaterial({ map: deepslatelapisore}),
    deepslatediamond: new THREE.MeshStandardMaterial({ map: deepslatediamondore}),
    bedrock: new THREE.MeshStandardMaterial({ map: bedrock}),
    oakleaves: new THREE.MeshStandardMaterial({ map: leaves, transparent: true, color: 0x7eb04d, alphaTest: 0.5 }),
    oaklog: [
        new THREE.MeshStandardMaterial({ map: logSide }),
        new THREE.MeshStandardMaterial({ map: logSide }),
        new THREE.MeshStandardMaterial({ map: logTop }),
        new THREE.MeshStandardMaterial({ map: logTop }),
        new THREE.MeshStandardMaterial({ map: logSide }),
        new THREE.MeshStandardMaterial({ map: logSide })
    ]
};

const destroyGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const destroyMat = new THREE.MeshBasicMaterial({ 
    map: destroyTextures[0], transparent: true, depthWrite: false, color: 0xA9A9A9, opacity: 0.8
});
const destroyMesh = new THREE.Mesh(destroyGeo, destroyMat);
destroyMesh.visible = false; 
scene.add(destroyMesh);

// ----------------------------------------------------
// 3. World Logic & Config
// ----------------------------------------------------
const BLOCK_HARDNESS = {
    stone: 7500, coal: 15000, iron: 15000, copper: 10000, gold: 15000, emerald: 15000, redstone: 15000, lapis: 15000, diamond: 15000,
    oaklog: 3000, oakleaves: 300, dirt: 750, grass: 750, overlay: 750, 
    snow_grass: 750, sand: 600, snow: 500, sandstone: 4000,
    deepslate: 20000, bedrock: 999999999
};

const ORE_CONFIG = {
    coal:    [{ min: 0,   max: 128, peak: 95,  threshold: 0.58, reduceAir: false }],
    iron:    [
        { min: -16, max: 80,  peak: 16,  threshold: 0.62, reduceAir: false },
        { min: 64,  max: 128, peak: 128, threshold: 0.55, reduceAir: false } 
    ],
    copper:  [{ min: 0,   max: 96,  peak: 48,  threshold: 0.60, reduceAir: false }],
    gold:    [{ min: 0,   max: 32,  peak: 5,   threshold: 0.78, reduceAir: true }],
    redstone:[{ min: 0,   max: 15,  peak: 0,   threshold: 0.80, reduceAir: true }],
    lapis:   [{ min: 0,   max: 64,  peak: 0,   threshold: 0.82, reduceAir: true }],
    diamond: [{ min: 0,   max: 16,  peak: 0,   threshold: 0.82, reduceAir: true }],
    emerald: [{ min: 64,  max: 256, peak: 128, threshold: 0.82, reduceAir: false }]
};

const BIOME_REGISTRY = [
    { name: "Forest", temp: 0.2, moist: 0.6, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.015, heightScale: 20 },
    { name: "Plains", temp: 0.1, moist: -0.2, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.0001, heightScale: 8 },
    { name: "Desert", temp: 0.8, moist: -0.8, depth: 0.0, topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 12 },
    { name: "Snowy Tundra", temp: -0.8, moist: 0.2, depth: 0.0, topBlock: 'snow_grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.002, heightScale: 15 },
    { name: "Mountains", temp: 0.5, moist: 0.5, depth: 0.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0.0, heightScale: 55 }
];

const chunkSize = 16;
const renderDistance = 2; 
const worldHeight = 384;
const minworldY = -64;
const geometry = new THREE.BoxGeometry(1, 1, 1);

const worldSeed = Math.random(); 
noise.seed(worldSeed);
const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

const activeChunks = {};
const chunkQueue = []; 
const interactableMeshes = [];
const brokenBlocks = new Set(); 

const TYPE = { 
    stone: 1, dirt: 2, grass: 3, sand: 4, sandstone: 5, snow: 6, snow_grass: 7, 
    coal: 8, iron: 9, copper: 10, gold: 11, redstone: 12, emerald: 13, lapis: 14, 
    diamond: 15, deepslate: 16, bedrock: 17, deepslatecoal: 18, deepslateiron: 19, 
    deepslatecopper: 20, deepslategold: 21, deepslateredstone: 22, 
    deepslateemerald: 23, deepslatelapis: 24, deepslatediamond: 25,
    oaklog: 26, oakleaves: 27
};
const REVERSE_TYPE = [
    null, 'stone', 'dirt', 'grass', 'sand', 'sandstone', 'snow', 'snow_grass',
    'coal', 'iron', 'copper', 'gold', 'redstone', 'emerald', 'lapis', 'diamond',
    'deepslate', 'bedrock', 'deepslatecoal', 'deepslateiron', 'deepslatecopper',
    'deepslategold', 'deepslateredstone', 'deepslateemerald', 'deepslatelapis',
    'deepslatediamond', 'oaklog', 'oakleaves'
];

// ----------------------------------------------------
// 4. Noise & Biome Helper Functions
// ----------------------------------------------------
function fbm2(x, z, octaves = 4, scale = 400) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin2((x / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5; frequency *= 2.0;
    }
    return total / maxValue;
}

function fbm3(x, y, z, octaves = 2, scale = 40) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin3((x / scale) * frequency, (y / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5; frequency *= 2.0;
    }
    return total / maxValue;
}

function getBiome(temp, moist) {
    let closestBiome = BIOME_REGISTRY[0];
    let minDist = Infinity;
    for (let b of BIOME_REGISTRY) {
        let dist = (temp - b.temp)**2 + (moist - b.moist)**2;
        if (dist < minDist) { minDist = dist; closestBiome = b; }
    }
    return closestBiome;
}

function getInterpolatedHeightScale(x, z) {
    const range = 8, step = 4; 
    let totalScale = 0, samples = 0;
    for (let offX = -range; offX <= range; offX += step) {
        for (let offZ = -range; offZ <= range; offZ += step) {
            let t = fbm2(x + offX + mapOffsetX, z + offZ + mapOffsetZ, 2, 800);
            let m = fbm2(x + offX + mapOffsetX + 10000, z + offZ + mapOffsetZ + 10000, 2, 800);
            totalScale += getBiome(t, m).heightScale;
            samples++;
        }
    }
    return totalScale / samples; 
}

function getDeterministicRandom(x, y, z) {
    let str = `${x},${y},${z},${worldSeed}`;
    let h = 2166136261; 
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

// ----------------------------------------------------
// 5. Trees & Generation
// ----------------------------------------------------
function spawnTree(x, y, z, chunkMeshes, indices) {
    const trunkH = 4 + Math.floor(getDeterministicRandom(x, y, z) * 2);
    const treeMatrix = new THREE.Matrix4();
    for (let i = 0; i < trunkH; i++) {
        let ay = y + i;
        if (brokenBlocks.has(`${x},${ay},${z}`)) continue;
        treeMatrix.setPosition(x, ay, z);
        chunkMeshes.oaklog.setMatrixAt(indices.oaklog++, treeMatrix);
    }
    for (let ly = y + trunkH - 3; ly <= y + trunkH + 1; ly++) {
        let radius = (ly > y + trunkH - 1) ? 1 : 2; 
        for (let lx = -radius; lx <= radius; lx++) {
            for (let lz = -radius; lz <= radius; lz++) {
                if (Math.abs(lx) === radius && Math.abs(lz) === radius) {
                    let trim = (ly === y + trunkH + 1) ? 1.0 : (ly === y + trunkH) ? 0.75 : 0.2;
                    if (getDeterministicRandom(x + lx, ly, z + lz) < trim) continue;
                }
                if (lx === 0 && lz === 0 && ly < y + trunkH) continue;
                if (brokenBlocks.has(`${x+lx},${ly},${z+lz}`)) continue;
                treeMatrix.setPosition(x + lx, ly, z + lz);
                chunkMeshes.oakleaves.setMatrixAt(indices.oakleaves++, treeMatrix);
            }
        }
    }
}

function generateChunk(chunkX, chunkZ) {
    const id = `${chunkX},${chunkZ}`;
    if (activeChunks[id]) {
        activeChunks[id].forEach(m => {
            scene.remove(m);
            const i = interactableMeshes.indexOf(m);
            if (i > -1) interactableMeshes.splice(i, 1);
            m.dispose();
        });
    }

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const meshes = {};
    const indices = {};
    for (const key in materials) {
        meshes[key] = new THREE.InstancedMesh(geometry, materials[key], 25000);
        meshes[key].name = key;
        meshes[key].chunkId = id;
        indices[key] = 0;
    }

    const blocks = new Uint8Array(16 * 16 * worldHeight);
    const getIdx = (x, y, z) => x + z * 16 + y * 256; 
    const trees = [];

    // PASS 1: BLOCK DATA
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let gx = startX + x, gz = startZ + z;
            let temp = fbm2(gx + mapOffsetX, gz + mapOffsetZ, 2, 800);
            let moist = fbm2(gx + mapOffsetX + 10000, gz + mapOffsetZ + 10000, 2, 800);
            let scale = getInterpolatedHeightScale(gx, gz);
            let elev = fbm2(gx + mapOffsetX, gz + mapOffsetZ, 4, 300);
            let baseH = ((elev + 1) / 2) * scale + 62;
            const bio = getBiome(temp, moist);

            for (let y = 0; y < worldHeight; y++) {
                let ay = y + minworldY;
                if (brokenBlocks.has(`${gx},${ay},${gz}`)) continue;

                let dens = (baseH - ay) + noise.perlin3(gx/50, ay/40, gz/50)*18 + noise.perlin3(gx/15, ay/15, gz/15)*5;

                if (dens > 0) {
                    if (ay <= minworldY + 4 && getDeterministicRandom(gx, ay, gz) < (minworldY+5-ay)/5) {
                        blocks[getIdx(x,y,z)] = TYPE.bedrock; continue;
                    }
                    let stoneType = ay < 8 + noise.perlin2(gx/16, gz/16)*4 ? 'deepslate' : 'stone';
                    if ((fbm3(gx, ay, gz)**2 + fbm3(gx+1000, ay+1000, gz+1000)**2) < 0.005) continue;

                    let type = stoneType;
                    let found = false;
                    for (const [ore, rules] of Object.entries(ORE_CONFIG)) {
                        if (found) break;
                        for (const conf of rules) {
                            if (ay >= conf.min && ay <= conf.max) {
                                let v = noise.perlin3(gx*0.2, ay*0.2, gz*0.2);
                                if (v > (conf.threshold + (1.0 - (1.0 - Math.abs(ay - conf.peak)/(ay > conf.peak ? conf.max-conf.peak : conf.peak-conf.min)))*0.15)) {
                                    if (ore === 'emerald' && bio.name !== "Mountains") continue;
                                    if (ore === 'iron' && conf.peak > 100 && bio.name !== "Mountains") continue;
                                    type = (stoneType === 'deepslate') ? `deepslate${ore}` : ore;
                                    found = true; break;
                                }
                            }
                        }
                    }
                    if (ay > baseH - 1 && type === stoneType) {
                        type = ay > 100 ? 'snow' : bio.topBlock;
                        if (bio.treeChance > 0 && getDeterministicRandom(gx, ay, gz) < bio.treeChance) trees.push({x, y, z, ay});
                    }
                    blocks[getIdx(x,y,z)] = TYPE[type] || TYPE.stone;
                }
            }
        }
    }

    // PASS 2: MESHING
    const mat4 = new THREE.Matrix4();
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let t = blocks[getIdx(x, y, z)];
                if (t === 0) continue;
                if (x > 0 && x < 15 && z > 0 && z < 15 && y > 0 && y < worldHeight - 1 &&
                    blocks[getIdx(x-1, y, z)] !== 0 && blocks[getIdx(x+1, y, z)] !== 0 &&
                    blocks[getIdx(x, y-1, z)] !== 0 && blocks[getIdx(x, y+1, z)] !== 0 &&
                    blocks[getIdx(x, y, z-1)] !== 0 && blocks[getIdx(x, y, z+1)] !== 0) continue;

                let name = REVERSE_TYPE[t];
                mat4.setPosition(startX + x, y + minworldY, startZ + z);
                meshes[name].setMatrixAt(indices[name]++, mat4);
            }
        }
    }

    trees.forEach(t => spawnTree(startX+t.x, t.ay+1, startZ+t.z, meshes, indices));

    activeChunks[id] = [];
    for (const key in meshes) {
        if (indices[key] > 0) {
            meshes[key].count = indices[key];
            meshes[key].instanceMatrix.needsUpdate = true;
            scene.add(meshes[key]);
            interactableMeshes.push(meshes[key]);
            activeChunks[id].push(meshes[key]);
        }
    }
}

// ----------------------------------------------------
// 6. Player, Controls & Mining Logic
// ----------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 20); 
scene.add(sunLight);

camera.position.set(0, 80, 0); 
const hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), new THREE.MeshStandardMaterial({ color: 0xd2a77d }));
hand.position.set(0.4, -0.4, -0.1);
hand.rotation.set(-Math.PI / 3, -Math.PI / 16, 0); 
camera.add(hand); scene.add(camera);

let yaw = 0, pitch = 0, keys = {};
const raycaster = new THREE.Raycaster(); raycaster.far = 6;
let mining = { active: false, start: 0, mesh: null, id: null };

function getTarget() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.intersectObjects(interactableMeshes);
    return hits.length > 0 ? hits[0] : null;
}

function updateMining() {
    if (!mining.active) { destroyMesh.visible = false; return; }
    const hit = getTarget();
    if (!hit || hit.object !== mining.mesh || hit.instanceId !== mining.id) {
        mining.active = false; return;
    }
    const elapsed = Date.now() - mining.start;
    const timeReq = BLOCK_HARDNESS[mining.mesh.name] || 1000;
    const stage = Math.floor(Math.min(elapsed / timeReq, 1) * 9);
    destroyMat.map = destroyTextures[stage]; 
    destroyMat.needsUpdate = true;

    if (elapsed >= timeReq) {
        const m = new THREE.Matrix4();
        mining.mesh.getMatrixAt(mining.id, m);
        const p = new THREE.Vector3().setFromMatrixPosition(m);
        brokenBlocks.add(`${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`);
        generateChunk(Math.floor(p.x/16), Math.floor(p.z/16));
        // Check chunk borders
        if (Math.round(p.x) % 16 === 0) generateChunk(Math.floor(p.x/16)-1, Math.floor(p.z/16));
        if (Math.round(p.x) % 16 === 15) generateChunk(Math.floor(p.x/16)+1, Math.floor(p.z/16));
        mining.active = false;
    }
}

document.addEventListener('mousedown', (e) => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else if (e.button === 0) {
        const hit = getTarget();
        if (hit) {
            mining = { active: true, start: Date.now(), mesh: hit.object, id: hit.instanceId };
            const m = new THREE.Matrix4(); hit.object.getMatrixAt(hit.instanceId, m);
            destroyMesh.position.setFromMatrixPosition(m);
            destroyMesh.visible = true;
        }
    }
});
document.addEventListener('mouseup', () => mining.active = false);
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002));
    }
});
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// ----------------------------------------------------
// 7. Render Loop
// ----------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); 
    
    // Chunk Loader
    const px = Math.floor(camera.position.x / 16), pz = Math.floor(camera.position.z / 16);
    for(let x = px - renderDistance; x <= px + renderDistance; x++) {
        for(let z = pz - renderDistance; z <= pz + renderDistance; z++) {
            if (!activeChunks[`${x},${z}`] && !chunkQueue.includes(`${x},${z}`)) chunkQueue.push(`${x},${z}`);
        }
    }
    if (chunkQueue.length > 0) {
        const next = chunkQueue.shift();
        const [cx, cz] = next.split(',').map(Number);
        generateChunk(cx, cz);
    }

    updateMining();

    if (mining.active) {
        hand.position.z = -0.2 + Math.cos(Date.now()*0.02) * 0.1;
    } else {
        hand.position.z = THREE.MathUtils.lerp(hand.position.z, -0.1, 0.1);
    }

    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    if (keys['KeyW']) camera.position.addScaledVector(fwd, -moveSpeed * delta);
    if (keys['KeyS']) camera.position.addScaledVector(fwd, moveSpeed * delta);
    if (keys['KeyA']) camera.position.addScaledVector(rgt, moveSpeed * delta);
    if (keys['KeyD']) camera.position.addScaledVector(rgt, -moveSpeed * delta);
    if (keys['Space']) camera.position.y += moveSpeed * delta;
    if (keys['ShiftLeft']) camera.position.y -= moveSpeed * delta;

    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
    stats.update();
}
animate();
