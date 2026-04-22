/**
 * FULL MINECRAFT-STYLE GENERATOR
 * Features: Snowy Peaks, Weighted Biomes, and Biome-Specific Ore Rates.
 */

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
// 1. Centralized Block & Material System
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
    snow: new THREE.MeshStandardMaterial({ map: loadTex('./textures/snow.png') }),
    coal: new THREE.MeshStandardMaterial({ map: loadTex('./textures/coal_ore.png') }),
    iron: new THREE.MeshStandardMaterial({ map: loadTex('./textures/iron_ore.png') }),
    copper: new THREE.MeshStandardMaterial({ map: loadTex('./textures/copper_ore.png') }),
    log: new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_log.png') }),
    leaf: new THREE.MeshStandardMaterial({ map: loadTex('./textures/oak_leaves.png'), transparent: true, alphaTest: 0.5, color: 0x7eb04d })
};

// ----------------------------------------------------
// 2. BIOME REGISTRY (Now with occurrences and ore rates)
// ----------------------------------------------------
const BIOME_REGISTRY = [
    { 
        name: "Forest", 
        temp: 0.2, moist: 0.6, occurrence: 1.0, 
        topBlock: 'grass', subBlock: 'dirt', 
        treeChance: 0.006, heightScale: 40,
        oreRates: { coal: 0.15, iron: 0.05, copper: 0.05 }
    },
    { 
        name: "Plains", 
        temp: 0.1, moist: -0.2, occurrence: 1.5, 
        topBlock: 'grass', subBlock: 'dirt', 
        treeChance: 0.0002, heightScale: 30,
        oreRates: { coal: 0.10, iron: 0.04, copper: 0.02 }
    },
    { 
        name: "Desert", 
        temp: 0.8, moist: -0.8, occurrence: 0.8, 
        topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone',
        treeChance: 0.0, heightScale: 25,
        oreRates: { coal: 0.02, iron: 0.02, copper: 0.20 }
    },
    { 
        name: "Snowy Tundra", 
        temp: -0.8, moist: 0.2, occurrence: 0.7, 
        topBlock: 'snow_grass', subBlock: 'dirt',
        treeChance: 0.001, heightScale: 35,
        oreRates: { coal: 0.10, iron: 0.08, copper: 0.02 }
    },
    { 
        name: "Mountains", 
        temp: 0.5, moist: 0.5, occurrence: 0.5, 
        topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone',
        treeChance: 0, heightScale: 120,
        oreRates: { coal: 0.20, iron: 0.15, copper: 0.05 }
    },
    { 
        name: "Snowy Peak", 
        temp: -0.5, moist: 0.5, occurrence: 0.3, 
        topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone',
        treeChance: 0, heightScale: 130, // Tallest!
        oreRates: { coal: 0.15, iron: 0.20, copper: 0.02 }
    }
];

// ----------------------------------------------------
// 3. World Generation Setup
// ----------------------------------------------------
const chunkSize = 16;
const renderDistance = 3;
const worldSeed = Math.random();
noise.seed(worldSeed);
const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

const activeChunks = {};
const geometry = new THREE.BoxGeometry(1, 1, 1);
const brokenBlocks = new Set();
const interactableMeshes = [];

function getBiome(x, z) {
    let rawTemp = noise.perlin2((x + mapOffsetX) / 500, (z + mapOffsetZ) / 500);
    let rawMoist = noise.perlin2((x + mapOffsetX + 10000) / 500, (z + mapOffsetZ + 10000) / 500);

    let tempMap = Math.sign(rawTemp) * Math.pow(Math.abs(rawTemp), 0.7);
    let moistMap = Math.sign(rawMoist) * Math.pow(Math.abs(rawMoist), 0.7);

    let closestBiome = BIOME_REGISTRY[0];
    let minWeightedDist = Infinity;

    for (let b of BIOME_REGISTRY) {
        let dist = Math.pow(tempMap - b.temp, 2) + Math.pow(moistMap - b.moist, 2);
        let weightedDist = dist * (1 / (b.occurrence || 1.0));
        if (weightedDist < minWeightedDist) {
            minWeightedDist = weightedDist;
            closestBiome = b;
        }
    }
    return closestBiome;
}

function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const meshes = {};
    const indices = {};

    for (const key in materials) {
        meshes[key] = new THREE.InstancedMesh(geometry, materials[key], 18000);
        meshes[key].chunkId = chunkId;
        meshes[key].name = key;
        indices[key] = 0;
    }

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const gX = startX + x;
            const gZ = startZ + z;
            const localBiome = getBiome(gX, gZ);
            
            const rawElev = noise.perlin2((gX + mapOffsetX) / 400, (gZ + mapOffsetZ) / 400);
            const h = Math.floor(((rawElev + 1) / 2) * localBiome.heightScale + 64);

            for (let y = -16; y <= h; y++) {
                if (brokenBlocks.has(`${gX},${y},${gZ}`)) continue;
                matrix.setPosition(gX, y, gZ);
                const depth = h - y;

                if (depth === 0) {
                    let type = localBiome.topBlock;
                    // SNOWY PEAKS LOGIC
                    if (localBiome.name === "Snowy Peak" && y > 110) type = 'snow';
                    else if (localBiome.name === "Mountains" && y > 115) type = 'snow';
                    
                    meshes[type].setMatrixAt(indices[type]++, matrix);
                } 
                else if (depth > 0 && depth <= 3) {
                    let sub = localBiome.subBlock || 'dirt';
                    meshes[sub].setMatrixAt(indices[sub]++, matrix);
                } 
                else {
                    // BIOME SPECIFIC ORE SPAWNING
                    let oreNoise = (noise.perlin3(gX * 0.15, y * 0.15, gZ * 0.15) + 1) / 2;
                    let placed = false;

                    for (const [ore, rate] of Object.entries(localBiome.oreRates)) {
                        if (oreNoise < rate) {
                            meshes[ore].setMatrixAt(indices[ore]++, matrix);
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
// 4. Execution Loop
// ----------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    for(let x = pX-2; x <= pX+2; x++) {
        for(let z = pZ-2; z <= pZ+2; z++) generateChunk(x, z);
    }
    renderer.render(scene, camera);
}

camera.position.set(0, 100, 0);
animate();
