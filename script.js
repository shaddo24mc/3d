const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

// Performance: Limit pixel ratio to 1 (prevents massive slowdowns on Retina/mobile screens)
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

// Shadows completely disabled. They are too heavy for InstancedMesh terrain.
renderer.shadowMap.enabled = false; 

// ----------------------------------------------------
// 1. Centralized Block & Material System
// ----------------------------------------------------
const BLOCK_HARDNESS = {
    stone: 7500, coal: 15000, iron: 15000, copper: 10000, gold: 15000, emerald: 15000, redstone: 15000, lapis: 15000, diamond: 15000,
    oaklog: 3000, oakleaves: 300, dirt: 750, grass: 750, overlay: 750, 
    snow_grass: 750, sand: 600, snow: 500, sandstone: 4000,
    deepslate: 20000, 
    deepslatecoal: 22500, deepslateiron: 22500, deepslatecopper: 15000, 
    deepslategold: 22500, deepslateemerald: 22500, deepslateredstone: 22500, 
    deepslatelapis: 22500, deepslatediamond: 22500,
    bedrock: 999999999
};
const ORE_CONFIG = {
    coal:    [{ min: 0,   max: 128, peak: 95,  threshold: 0.45, reduceAir: false }],
    // Iron: One peaks at Y=16 (underground), one peaks at Y=128+ (mountains)
    iron:    [
        { min: -64, max: 80,  peak: 16,  threshold: 0.50, reduceAir: false },
        { min: 64,  max: 320, peak: 128, threshold: 0.48, reduceAir: false } 
    ],
    copper:  [{ min: -16, max: 112, peak: 48,  threshold: 0.52, reduceAir: false }],
    gold:    [{ min: -64, max: 32,  peak: -16, threshold: 0.58, reduceAir: true }],
    redstone:[{ min: -64, max: 15,  peak: -32, threshold: 0.58, reduceAir: true }],
    lapis:   [{ min: -64, max: 64,  peak: 0,   threshold: 0.60, reduceAir: true }],
    diamond: [{ min: -64, max: 16,  peak: -54, threshold: 0.62, reduceAir: true }],
    emerald: [{ min: 32,  max: 320, peak: 128, threshold: 0.65, reduceAir: false }]
};
const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const t = loader.load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false; 
    return t;
};

// Textures
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
// 2. BIOME REGISTRY (Vanilla Minecraft Tweaks)
// ----------------------------------------------------
const BIOME_REGISTRY = [
    { name: "Forest", temp: 0.2, moist: 0.6, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.015, heightScale: 20 },
    { name: "Plains", temp: 0.1, moist: -0.2, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.0001, heightScale: 8 },
    { name: "Desert", temp: 0.8, moist: -0.8, depth: 0.0, topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 12 },
    { name: "Snowy Tundra", temp: -0.8, moist: 0.2, depth: 0.0, topBlock: 'snow_grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.002, heightScale: 15 },
    { name: "Mountains", temp: 0.5, moist: 0.5, depth: 0.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0.0, heightScale: 55 }
];

// ----------------------------------------------------
// 3. World Variables
// ----------------------------------------------------
const chunkSize = 16;
const renderDistance = 2; // Keep at 2 to limit active chunks for JS
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

// Fast lookup arrays for Culling memory
const TYPE = { 
    stone: 1, dirt: 2, grass: 3, sand: 4, sandstone: 5, snow: 6, snow_grass: 7, 
    coal: 8, iron: 9, copper: 10, gold: 11, redstone: 12, emerald: 13, lapis: 14, 
    diamond: 15, deepslate: 16, bedrock: 17, deepslatecoal: 18, deepslateiron: 19, 
    deepslatecopper: 20, deepslategold: 21, deepslateredstone: 22, 
    deepslateemerald: 23, deepslatelapis: 24, deepslatediamond: 25,
    oaklog: 26, oakleaves: 27
};
const REVERSE_TYPE = [
    null,                // 0 (Air/Empty)
    'stone',             // 1
    'dirt',              // 2
    'grass',             // 3
    'sand',              // 4
    'sandstone',         // 5
    'snow',              // 6
    'snow_grass',        // 7
    'coal',              // 8
    'iron',              // 9
    'copper',            // 10
    'gold',              // 11
    'redstone',          // 12
    'emerald',           // 13
    'lapis',             // 14
    'diamond',           // 15
    'deepslate',         // 16
    'bedrock',           // 17
    'deepslatecoal',     // 18
    'deepslateiron',     // 19
    'deepslatecopper',   // 20
    'deepslategold',     // 21
    'deepslateredstone', // 22
    'deepslateemerald',  // 23
    'deepslatelapis',    // 24
    'deepslatediamond',  // 25
    'oaklog',               // 26
    'oakleaves'               // 27
];

function getBiome(temp, moist, depth) {
    let closestBiome = BIOME_REGISTRY[0];
    let minDist = Infinity;
    for (let b of BIOME_REGISTRY) {
        let dist = (temp - b.temp)*(temp - b.temp) + (moist - b.moist)*(moist - b.moist);
        if (dist < minDist) { minDist = dist; closestBiome = b; }
    }
    return closestBiome;
}

function getInterpolatedHeightScale(x, z) {
    const range = 8; // Widened range for smoother biome blending
    const step = 4; 
    let totalScale = 0; 
    let samples = 0;
    
    for (let offX = -range; offX <= range; offX += step) {
        for (let offZ = -range; offZ <= range; offZ += step) {
            // Use FBM for temp/moist maps so biomes transition naturally
            let temp = fbm2(x + offX + mapOffsetX, z + offZ + mapOffsetZ, 2, 800);
            let moist = fbm2(x + offX + mapOffsetX + 10000, z + offZ + mapOffsetZ + 10000, 2, 800);
            totalScale += getBiome(temp, moist, 0).heightScale;
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

function spawnTree(x, y, z, chunkMeshes, indices) {
    const trunkH = 4 + Math.floor(getDeterministicRandom(x, y, z) * 2);
    const treeMatrix = new THREE.Matrix4();
    
    // TRUNK
    for (let i = 0; i < trunkH; i++) {
        let actualY = y + i;
        if (brokenBlocks.has(`${x},${actualY},${z}`)) continue;
        treeMatrix.setPosition(x, actualY, z);
        chunkMeshes.oaklog.setMatrixAt(indices.oaklog++, treeMatrix);
    }

    // LEAVES
    for (let ly = y + trunkH - 2; ly <= y + trunkH + 1; ly++) {
        let radius = (ly > y + trunkH - 1) ? 1 : 2; 
        for (let lx = -radius; lx <= radius; lx++) {
            for (let lz = -radius; lz <= radius; lz++) {
                if (Math.abs(lx) === radius && Math.abs(lz) === radius) {
                    let trimChance = (ly === y + trunkH + 1) ? 1.0 : (ly === y + trunkH) ? 0.75 : 0.2;
                    if (getDeterministicRandom(x + lx, ly, z + lz) < trimChance) continue;
                }
                if (lx === 0 && lz === 0 && ly < y + trunkH) continue;
                
                const bX = x + lx; const bY = ly; const bZ = z + lz;
                if (brokenBlocks.has(`${bX},${bY},${bZ}`)) continue;

                treeMatrix.setPosition(bX, bY, bZ);
                chunkMeshes.oakleaves.setMatrixAt(indices.oakleaves++, treeMatrix);
            }
        }
    }
}

// ----------------------------------------------------
// 4. Chunk Generator
// ----------------------------------------------------
// Fractal Brownian Motion for natural 2D terrain (elevation, temp, moisture)
function fbm2(x, z, octaves = 4, scale = 400) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin2((x / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return total / maxValue;
}
// Fractal Brownian Motion for natural 3D shapes (caves)
function fbm3(x, y, z, octaves = 2, scale = 40) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin3((x / scale) * frequency, (y / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return total / maxValue;
}
function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const maxVisibleBlocks = 25000; 

    // 1. Initialize Meshes
    const meshes = {};
    const indices = {};
    for (const [key, mat] of Object.entries(materials)) {
        meshes[key] = new THREE.InstancedMesh(geometry, mat, (key === 'oakleaves' || key === 'oaklog') ? 2000 : maxVisibleBlocks);
        meshes[key].name = key;
        meshes[key].chunkId = chunkId;
        meshes[key].instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Allows for real-time hiding
        indices[key] = 0;
    }

    const blocks = new Uint8Array(chunkSize * chunkSize * worldHeight);
    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);
    const treesToSpawn = [];

    // PASS 1: DATA GENERATION
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;

            let tempMap = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 2, 800);
            let moistMap = fbm2(globalX + mapOffsetX + 10000, globalZ + mapOffsetZ + 10000, 2, 800);
            let blendedScale = getInterpolatedHeightScale(globalX, globalZ);
            let rawElevation = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 4, 300);
            let baseHeight = ((rawElevation + 1) / 2) * blendedScale + 62;

            for (let y = 0; y < worldHeight; y++) {
                let actualY = y + minworldY;
                let blockIdx = getIdx(x, y, z);

                // Density Check
                let cliffNoise = noise.perlin3(globalX / 50, actualY / 40, globalZ / 50) * 18;
                let detailNoise = noise.perlin3(globalX / 15, actualY / 15, globalZ / 15) * 5;
                let density = (baseHeight - actualY) + cliffNoise + detailNoise;

                if (density > 0) {
                    // Bedrock
                    if (actualY <= minworldY + 4) {
                        if (getDeterministicRandom(globalX, actualY, globalZ) < ((minworldY + 5) - actualY) / 5) {
                            blocks[blockIdx] = TYPE.bedrock; continue;
                        }
                    }

                    // Stone & Caves
                    let stoneType = actualY < 8 + (noise.perlin2(globalX / 16, globalZ / 16) * 4) ? 'deepslate' : 'stone';
                    let isCave = (fbm3(globalX, actualY, globalZ, 2, 35)**2 + fbm3(globalX+1000, actualY+1000, globalZ+1000, 2, 35)**2) < 0.005;

                    if (isCave || brokenBlocks.has(`${globalX},${actualY},${globalZ}`)) continue;

                    // Ore Pass
                    let blockType = stoneType;
                    let foundOre = false;
                    for (const [oreName, rules] of Object.entries(ORE_CONFIG)) {
                        if (foundOre) break;
                        for (const conf of rules) {
                            if (actualY >= conf.min && actualY <= conf.max) {
                                let veinNoise = noise.perlin3(globalX * 0.2, actualY * 0.2, globalZ * 0.2);
                                if (veinNoise > (conf.threshold + (Math.abs(actualY - conf.peak) / 100) * 0.15)) {
                                    blockType = (stoneType === 'deepslate') ? `deepslate${oreName}` : oreName;
                                    foundOre = true; break;
                                }
                            }
                        }
                    }

                    // SURFACE LOGIC 
                    let actualYAbove = actualY + 1;
                    let densityAbove = (baseHeight - actualYAbove) + 
                                       (noise.perlin3(globalX / 50, actualYAbove / 40, globalZ / 50) * 18) + 
                                       (noise.perlin3(globalX / 15, actualYAbove / 15, globalZ / 15) * 5);

                    if (densityAbove <= 0) { // TRUE TOP BLOCK
                        const localBiome = getBiome(tempMap, moistMap, 0);
                        blockType = actualY > 100 ? 'snow' : localBiome.topBlock;
                        
                        // FIX: Ensure we are actually near surface to spawn trees, not in caves
                        const isNearSurface = actualY >= baseHeight - 10;
                        if (isNearSurface && blockType !== 'snow' && localBiome.treeChance > 0) {
                            if (getDeterministicRandom(globalX, actualY, globalZ) < localBiome.treeChance) {
                                 treesToSpawn.push({ x, y, z, actualY });
                            }
                        }
                    } else if (densityAbove < 3) { // DIRT CRUST
                        blockType = getBiome(tempMap, moistMap, 0).subBlock;
                    }

                    blocks[blockIdx] = TYPE[blockType] || TYPE.stone;
                }
            }
        }
    }

    // PASS 2: MESH GENERATION & CULLING
    const matrix = new THREE.Matrix4();
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;

                // Neighbor Culling (Make neighbors visible logic)
                // We render a block if any of its 6 neighbors are AIR (0)
                let isVisible = (x === 0 || x === 15 || z === 0 || z === 15 || y === 0 || y === worldHeight - 1) ||
                                (blocks[getIdx(x-1, y, z)] === 0 || blocks[getIdx(x+1, y, z)] === 0 ||
                                 blocks[getIdx(x, y-1, z)] === 0 || blocks[getIdx(x, y+1, z)] === 0 ||
                                 blocks[getIdx(x, y, z-1)] === 0 || blocks[getIdx(x, y, z+1)] === 0);

                if (isVisible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (meshes[bName]) {
                        matrix.setPosition(startX + x, y + minworldY, startZ + z);
                        meshes[bName].setMatrixAt(indices[bName]++, matrix);

                        // GRASS OVERLAY logic
                        if (bName === 'grass' && meshes['overlay']) {
                            meshes['overlay'].setMatrixAt(indices['overlay']++, matrix);
                        }
                    }
                }
            }
        }
    }

    // Pass 3: Trees
    for (let t of treesToSpawn) spawnTree(startX + t.x, t.actualY + 1, startZ + t.z, meshes, indices);

    // Finalize
    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        scene.add(meshes[key]);
        if (meshes[key].count > 0) interactableMeshes.push(meshes[key]);
    }
    
    // FIX: Save blocks and trees for future unculling
    activeChunks[chunkId] = { meshes, blocks, treesToSpawn };
}

// ----------------------------------------------------
// 4.5. Chunk Rebuilding (Unculling)
// ----------------------------------------------------
function rebuildChunkGeometry(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    const chunkData = activeChunks[chunkId];
    if (!chunkData) return;

    const { meshes, blocks, treesToSpawn } = chunkData;
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);

    const indices = {};
    for (const key in meshes) indices[key] = 0;

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;

                let globalX = startX + x;
                let actualY = y + minworldY;
                let globalZ = startZ + z;

                if (brokenBlocks.has(`${globalX},${actualY},${globalZ}`)) continue;

                // Culling helper: Check if neighbor is air, broken, or outside the chunk
                const isOpen = (nx, ny, nz) => {
                    if (nx < 0 || nx >= chunkSize || nz < 0 || nz >= chunkSize || ny < 0 || ny >= worldHeight) return true;
                    if (blocks[getIdx(nx, ny, nz)] === 0) return true;
                    return brokenBlocks.has(`${startX + nx},${ny + minworldY},${startZ + nz}`);
                };

                let isVisible = isOpen(x-1, y, z) || isOpen(x+1, y, z) ||
                                isOpen(x, y-1, z) || isOpen(x, y+1, z) ||
                                isOpen(x, y, z-1) || isOpen(x, y, z+1);

                if (isVisible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (meshes[bName]) {
                        matrix.setPosition(globalX, actualY, globalZ);
                        meshes[bName].setMatrixAt(indices[bName]++, matrix);

                        if (bName === 'grass' && meshes['overlay']) {
                            meshes['overlay'].setMatrixAt(indices['overlay']++, matrix);
                        }
                    }
                }
            }
        }
    }

    // Re-add trees for this chunk
    for (let t of treesToSpawn) spawnTree(startX + t.x, t.actualY + 1, startZ + t.z, meshes, indices);

    // Tell GPU to update the visible counts
    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
    }
}

// ----------------------------------------------------
// 5. Light & Engine Core
// ----------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 20); 
scene.add(sunLight);

let lastPlayerChunkX = -999; let lastPlayerChunkZ = -999;

function updateChunks() {
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);

    if (pX === lastPlayerChunkX && pZ === lastPlayerChunkZ) return;
    lastPlayerChunkX = pX; lastPlayerChunkZ = pZ;

    const chunksToKeep = new Set();
    for (let x = pX - renderDistance; x <= pX + renderDistance; x++) {
        for (let z = pZ - renderDistance; z <= pZ + renderDistance; z++) {
            const id = `${x},${z}`;
            chunksToKeep.add(id);
            if (!activeChunks[id] && !chunkQueue.includes(id)) chunkQueue.push(id);
        }
    }

    for (const id in activeChunks) {
        if (!chunksToKeep.has(id)) {
            // FIX: Point to .meshes to avoid memory leaks
            for (const mesh of Object.values(activeChunks[id].meshes)) {
                scene.remove(mesh);
                const i = interactableMeshes.indexOf(mesh);
                if (i > -1) interactableMeshes.splice(i, 1);
                mesh.dispose();
            }
            delete activeChunks[id];
        }
    }
}

// ----------------------------------------------------
// 6. Player, Controls & Mining
// ----------------------------------------------------
const spawnX = 0; const spawnZ = 0; let safeSpawnY = 127; 
for (let y = 127; y >= 0; y--) {
    let bs = getInterpolatedHeightScale(spawnX, spawnZ);
    let baseH = ((noise.perlin2(spawnX/400, spawnZ/400) + 1) / 2) * bs + 64; 
    if ((baseH - y) + (noise.perlin3(0, y/40, 0)*20) > 0) { safeSpawnY = y; break; }
}

camera.position.set(spawnX, safeSpawnY + 2, spawnZ);

const handGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2); handGeo.translate(0, 0.4, 0); 
const playerHand = new THREE.Mesh(handGeo, new THREE.MeshStandardMaterial({ color: 0xd2a77d, roughness: 0.8 }));
playerHand.position.set(0.4, -0.4, -0.1);
playerHand.rotation.set(-Math.PI / 3, -Math.PI / 16, 0); 
camera.add(playerHand); scene.add(camera);

let yaw = 0, pitch = 0, keys = {};
const raycaster = new THREE.Raycaster(); raycaster.far = 6;
let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };

function getTarget() {
    // 1. Point ray at the center of the screen
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // 2. Optimization: Find which chunk the player is in
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    
    // 3. Only intersect meshes from the chunk the player is standing in 
    //    and the 8 chunks surrounding them.
    const nearbyMeshes = interactableMeshes.filter(m => {
        if (!m.chunkId) return false;
        const [cx, cz] = m.chunkId.split(',').map(Number);
        return Math.abs(cx - pX) <= 1 && Math.abs(cz - pZ) <= 1;
    });

    // 4. Run the intersection only on those nearby meshes
    const hit = raycaster.intersectObjects(nearbyMeshes);
    
    return hit.length > 0 ? hit[0] : null;
}

function startMining(hit) {
    mining = { active: true, startTime: Date.now(), targetMesh: hit.object, targetId: hit.instanceId, requiredTime: BLOCK_HARDNESS[hit.object.name] || 1000 };
    destroyMat.map = destroyTextures[0]; destroyMat.needsUpdate = true;
    const mat = new THREE.Matrix4(); hit.object.getMatrixAt(hit.instanceId, mat);
    destroyMesh.position.setFromMatrixPosition(mat);
    destroyMesh.visible = true; 
}

function updateMining() {
    if (!mining.active) { destroyMesh.visible = false; return; }
    const hit = getTarget();
    if (!hit || hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId) {
        mining.active = false; destroyMesh.visible = false;
        if (hit) startMining(hit); return;
    }

    const elapsed = Date.now() - mining.startTime;
    const phase = Math.floor(Math.min(elapsed / mining.requiredTime, 1.0) * 9.99); 
    if (destroyMat.map !== destroyTextures[phase]) { destroyMat.map = destroyTextures[phase]; destroyMat.needsUpdate = true; }

    if (elapsed >= mining.requiredTime) {
        destroyMesh.visible = false; 
        const mat = new THREE.Matrix4(); mining.targetMesh.getMatrixAt(mining.targetId, mat);
        const p = new THREE.Vector3().setFromMatrixPosition(mat);
        
        // Add to broken blocks
        brokenBlocks.add(`${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`);
        
        // FIX: Calculate chunk and rebuild to un-cull hidden neighbors
        const bX = Math.round(p.x);
        const bZ = Math.round(p.z);
        const cX = Math.floor(bX / chunkSize);
        const cZ = Math.floor(bZ / chunkSize);

        // Rebuild the main chunk
        rebuildChunkGeometry(cX, cZ);

        // If block is on the edge of a chunk, update the neighbor chunk too
        const localX = bX - (cX * chunkSize);
        const localZ = bZ - (cZ * chunkSize);
        if (localX === 0) rebuildChunkGeometry(cX - 1, cZ);
        if (localX === chunkSize - 1) rebuildChunkGeometry(cX + 1, cZ);
        if (localZ === 0) rebuildChunkGeometry(cX, cZ - 1);
        if (localZ === chunkSize - 1) rebuildChunkGeometry(cX, cZ + 1);

        const next = getTarget();
        if (next) startMining(next); else mining.active = false;
    }
}

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.btn')) return; 
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------------------------------------------
// 7. Loop
// ----------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); 

    updateChunks();
    if (chunkQueue.length > 0) {
        const next = chunkQueue.shift();
        const [cx, cz] = next.split(',').map(Number);
        generateChunk(cx, cz);
    }

    updateMining();
    doRandomTicks();

    // Batch process all visual chunk updates at once
    for (let chunkId of chunksToRebuild) {
        let [cx, cz] = chunkId.split(',').map(Number);
        rebuildChunkGeometry(cx, cz);
    }
    chunksToRebuild.clear();
    
    if (mining.active) {
        const t = Date.now() * 0.025; 
        playerHand.rotation.x = (-Math.PI / 3) + Math.sin(t) * 0.25;
        playerHand.position.z = -0.2 + Math.cos(t) * 0.15;
        playerHand.position.y = -0.25 + Math.sin(t) * 0.04;
    } else {
        playerHand.rotation.x = THREE.MathUtils.lerp(playerHand.rotation.x, -Math.PI / 3, 0.2);
        playerHand.position.z = THREE.MathUtils.lerp(playerHand.position.z, -0.1, 0.2);
        playerHand.position.y = THREE.MathUtils.lerp(playerHand.position.y, -0.4, 0.2);
    }

    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    
    if (keys.w) camera.position.addScaledVector(fwd, -moveSpeed * delta);
    if (keys.s) camera.position.addScaledVector(fwd, moveSpeed * delta);
    if (keys.a) camera.position.addScaledVector(rgt, moveSpeed * delta);
    if (keys.d) camera.position.addScaledVector(rgt, -moveSpeed * delta);
    if (keys[' ']) camera.position.y += moveSpeed * delta;
    if (keys.shift) camera.position.y -= moveSpeed * delta;
    
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    renderer.render(scene, camera);
    stats.update();
}

animate();
