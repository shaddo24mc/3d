const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 40, 80);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();
const moveSpeed = 10;
const stats = new Stats();
stats.showPanel(0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(stats.dom);

// ----------------------------------------------------
// 1. Block & Material System
// ----------------------------------------------------
const BLOCK_HARDNESS = {
    stone: 7500, coal: 15000, iron: 15000, copper: 10000,
    log: 3000, leaf: 300,
    dirt: 750, grass: 750, overlay: 750, snow_grass: 750, 
    sand: 600, snow: 500, sandstone: 4000
};

const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const t = loader.load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
};

const grass_color = 0x8db753;
const materials = {
    grass: [
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_side.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_side.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_top.png'), color: grass_color }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/dirt.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_side.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_side.png') })
    ],
    snow_grass: [
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_snow.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_snow.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/snow.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/dirt.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_snow.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/grass_block_snow.png') })
    ],
    dirt: new THREE.MeshStandardMaterial({ map: loadTex('./textures/dirt.png') }),
    stone: new THREE.MeshStandardMaterial({ map: loadTex('./textures/stone.png') }),
    sand: new THREE.MeshStandardMaterial({ map: loadTex('./textures/sand.png') }),
    sandstone: [
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone_top.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone_bottom.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/sandstone.png') })
    ],
    snow: new THREE.MeshStandardMaterial({ map: loadTex('./textures/snow.png') }), 
    coal: new THREE.MeshStandardMaterial({ map: loadTex('./textures/coal_ore.png') }),
    iron: new THREE.MeshStandardMaterial({ map: loadTex('./textures/iron_ore.png') }),
    copper: new THREE.MeshStandardMaterial({ map: loadTex('./textures/copper_ore.png') }),
    leaf: new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_leaves.png'), transparent: true, color: 0x7eb04d, alphaTest: 0.5 }),
    log: [
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log_top.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log_top.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log.png') }),
        new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log.png') })
    ]
};

// ----------------------------------------------------
// 2. BIOME REGISTRY (Integrated Occurrences & Ore Rates)
// ----------------------------------------------------
const BIOME_REGISTRY = [
    { 
        name: "Forest", temp: 0.2, moist: 0.6, occurrence: 1.0, 
        topBlock: 'grass', subBlock: 'dirt', treeChance: 0.006, heightScale: 40,
        oreRates: { coal: 0.12, iron: 0.04, copper: 0.04 }
    },
    { 
        name: "Plains", temp: 0.1, moist: -0.2, occurrence: 1.5, 
        topBlock: 'grass', subBlock: 'dirt', treeChance: 0.0002, heightScale: 30,
        oreRates: { coal: 0.08, iron: 0.03, copper: 0.02 }
    },
    { 
        name: "Desert", temp: 0.8, moist: -0.8, occurrence: 0.9, 
        topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 25,
        oreRates: { coal: 0.01, iron: 0.02, copper: 0.18 }
    },
    { 
        name: "Snowy Tundra", temp: -0.8, moist: 0.2, occurrence: 0.7, 
        topBlock: 'snow_grass', subBlock: 'dirt', treeChance: 0.001, heightScale: 35,
        oreRates: { coal: 0.08, iron: 0.08, copper: 0.02 }
    },
    { 
        name: "Mountains", temp: 0.5, moist: 0.5, occurrence: 0.5, 
        topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0, heightScale: 120,
        oreRates: { coal: 0.20, iron: 0.15, copper: 0.05 }
    },
    { 
        name: "Snowy Peak", temp: -0.5, moist: 0.5, occurrence: 0.4, 
        topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0, heightScale: 130,
        oreRates: { coal: 0.15, iron: 0.20, copper: 0.02 }
    }
];

// ----------------------------------------------------
// 3. World Generation Setup
// ----------------------------------------------------
const chunkSize = 16;
const renderDistance = 4;
const worldSeed = Math.random();
noise.seed(worldSeed);

const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

const activeChunks = {};
const interactableMeshes = [];
const brokenBlocks = new Set();
const geometry = new THREE.BoxGeometry(1, 1, 1);

function getBiome(x, z) {
    let rawTemp = noise.perlin2((x + mapOffsetX) / 450, (z + mapOffsetZ) / 450);
    let rawMoist = noise.perlin2((x + mapOffsetX + 10000) / 450, (z + mapOffsetZ + 10000) / 450);

    // Normalize noise distribution
    let t = Math.sign(rawTemp) * Math.pow(Math.abs(rawTemp), 0.75);
    let m = Math.sign(rawMoist) * Math.pow(Math.abs(rawMoist), 0.75);

    let closestBiome = BIOME_REGISTRY[0];
    let minWeightedDist = Infinity;

    for (let b of BIOME_REGISTRY) {
        let dist = Math.pow(t - b.temp, 2) + Math.pow(m - b.moist, 2);
        let weightedDist = dist * (1 / (b.occurrence || 1.0));
        if (weightedDist < minWeightedDist) {
            minWeightedDist = weightedDist;
            closestBiome = b;
        }
    }
    return closestBiome;
}

function getInterpolatedHeightScale(x, z) {
    const range = 8;
    let totalScale = 0, samples = 0;
    for (let offX = -range; offX <= range; offX += 4) {
        for (let offZ = -range; offZ <= range; offZ += 4) {
            totalScale += (getBiome(x + offX, z + offZ).heightScale || 40);
            samples++;
        }
    }
    return totalScale / samples;
}

// ----------------------------------------------------
// 4. Chunk Generation Core
// ----------------------------------------------------
function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const meshes = {};
    const indices = {};

    for (const key in materials) {
        meshes[key] = new THREE.InstancedMesh(geometry, materials[key], 20000);
        meshes[key].name = key;
        meshes[key].chunkId = chunkId;
        indices[key] = 0;
    }

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const gX = startX + x;
            const gZ = startZ + z;
            const localBiome = getBiome(gX, gZ);
            const blendedScale = getInterpolatedHeightScale(gX, gZ);
            
            const rawElev = noise.perlin2((gX + mapOffsetX) / 400, (gZ + mapOffsetZ) / 400);
            const roughness = noise.perlin2((gX + mapOffsetX) / 20, (gZ + mapOffsetZ) / 20) * 3;
            const h = Math.floor(((rawElev + 1) / 2) * blendedScale + roughness + 64);

            for (let y = -16; y <= h; y++) {
                if (brokenBlocks.has(`${gX},${y},${gZ}`)) continue;
                matrix.setPosition(gX, y, gZ);
                const depth = h - y;

                if (depth === 0) {
                    let type = localBiome.topBlock;
                    if ((localBiome.name === "Snowy Peak" || localBiome.name === "Mountains") && y > 110) {
                        type = 'snow';
                    }
                    meshes[type].setMatrixAt(indices[type]++, matrix);
                } 
                else if (depth > 0 && depth <= 3) {
                    let sub = localBiome.subBlock || 'dirt';
                    meshes[sub].setMatrixAt(indices[sub]++, matrix);
                } 
                else {
                    // BIOME-SPECIFIC ORES
                    let oreNoise = (noise.perlin3(gX * 0.12, y * 0.12, gZ * 0.12) + 1) / 2;
                    let placed = false;
                    for (const [oreName, rate] of Object.entries(localBiome.oreRates)) {
                        if (oreNoise < rate) {
                            meshes[oreName].setMatrixAt(indices[oreName]++, matrix);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) meshes.stone.setMatrixAt(indices.stone++, matrix);
                }
            }
        }
    }

    for (const key in meshes) {
        if (indices[key] > 0) {
            meshes[key].count = indices[key];
            meshes[key].instanceMatrix.needsUpdate = true;
            scene.add(meshes[key]);
            interactableMeshes.push(meshes[key]);
        }
    }
    activeChunks[chunkId] = meshes;
}

// ----------------------------------------------------
// 5. Update, Mining & Controls (Keep your logic)
// ----------------------------------------------------

// [Add your raycast, mining, and mobile control logic here as per your original file]

function animate() {
    requestAnimationFrame(animate);
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    for(let x = pX - 2; x <= pX + 2; x++) {
        for(let z = pZ - 2; z <= pZ + 2; z++) generateChunk(x, z);
    }
    renderer.render(scene, camera);
    stats.update();
}

camera.position.set(0, 100, 0);
animate();
