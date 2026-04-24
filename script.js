const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

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
    log: 3000, leaf: 300, dirt: 750, grass: 750, overlay: 750, 
    snow_grass: 750, sand: 600, snow: 500, sandstone: 4000,
    deepslate: deepslatecoal: 22500, deepslateiron: 22500, deepslatecopper: 15000, deepslategold, 22500: deepslateemerald: 22500, deepslateredstone: 22500, deepslatelapis: 22500, deepslatediamond: 22500,
    bedrock: 999999999999999999999999999999999999999999999999999
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
const deepslateironore = loadTex('./textures/deepslate_iron_ore');
const deepslatecoalore = loadTex('./textures/deepslate_coal_ore');
const deepslatecopperore = loadTex('./textures/deepslate_copper_ore');
const deepslategoldore = loadTex('./textures/deepslate_gold_ore');
const deepslateredstoneore = loadTex('./textures/deepslate_redstone_ore');
const deepslateemeraldore = loadTex('./textures/deepslate_emerald_ore');
const deepslatelapisore = loadTex('./textures/deepslate_lapis_ore');
const deepslatediamondore = loadTex('./textures/deepslate_diamond_ore');
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
    leaf: new THREE.MeshStandardMaterial({ map: leaves, transparent: true, color: 0x7eb04d, alphaTest: 0.5 }),
    log: [
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
const worldHeight = 128;
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
const TYPE = { stone: 1, dirt: 2, grass: 3, sand: 4, sandstone: 5, snow: 6, snow_grass: 7, coal: 8, iron: 9, copper: 10, gold: 11, redstone: 12, emerald: 13, lapis: 14, diamond: 15, deepslate: 16, bedrock: 17, deepslatecoal: 18, deepslateiron: 19, deepslatecopper: 20, deepslategold: 21, deepslateredstone: 22, deepslateemerald: 23, deepslatelapis: 24, deepslatediamond: 25};
const REVERSE_TYPE = [null, 'stone', 'dirt', 'grass', 'sand', 'sandstone', 'snow', 'snow_grass', 'coal', 'iron', 'copper'];

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
    
    for (let i = 0; i < trunkH; i++) {
        if (brokenBlocks.has(`${x},${y + i},${z}`)) continue;
        treeMatrix.setPosition(x, y + i, z);
        chunkMeshes.log.setMatrixAt(indices.log++, treeMatrix);
    }
    for (let ly = trunkH - 2; ly <= trunkH + 1; ly++) {
        let radius = (ly > trunkH - 1) ? 1 : 2; 
        for (let lx = -radius; lx <= radius; lx++) {
            for (let lz = -radius; lz <= radius; lz++) {
                if (Math.abs(lx) === radius && Math.abs(lz) === radius) {
                    let trimChance = (ly === trunkH + 1) ? 1.0 : (ly === trunkH) ? 0.75 : 0.2;
                    if (getDeterministicRandom(x + lx, y + ly, z + lz) < trimChance) continue;
                }
                if (lx === 0 && lz === 0 && ly < trunkH) continue;
                
                const bX = x + lx; const bY = y + ly; const bZ = z + lz;
                if (brokenBlocks.has(`${bX},${bY},${bZ}`)) continue;

                treeMatrix.setPosition(bX, bY, bZ);
                chunkMeshes.leaf.setMatrixAt(indices.leaf++, treeMatrix);
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

    // Max visible blocks kept low for performance
    const maxVisibleBlocks = 15000; 
    
    const meshes = {};
    for (const [key, mat] of Object.entries(materials)) {
        meshes[key] = new THREE.InstancedMesh(geometry, mat, key === 'leaf' || key === 'log' ? 1000 : maxVisibleBlocks);
        meshes[key].name = key;
        meshes[key].chunkId = chunkId;
        meshes[key].frustumCulled = true; 
    }

    const indices = {};
    for (const key of Object.keys(meshes)) indices[key] = 0;

    // 1D Array to map 3D Space (16 * 16 * 128 = 32768)
    const blocks = new Uint8Array(32768);
    const getIdx = (x, y, z) => x + z * 16 + y * 256;
    const treesToSpawn = [];
    
    // PASS 1: Math & Data Generation (Inside generateChunk)
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x; let globalZ = startZ + z;
        
        // Use smooth FBM for biomes
            let tempMap = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 2, 800);
            let moistMap = fbm2(globalX + mapOffsetX + 10000, globalZ + mapOffsetZ + 10000, 2, 800);
        
            let blendedScale = getInterpolatedHeightScale(globalX, globalZ);
        
        // Use 4-octave FBM for base elevation to get natural ridges and valleys
            let rawElevation = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 4, 300);
            let baseHeight = ((rawElevation + 1) / 2) * blendedScale + 64;
            baseHeight = Math.floor(baseHeight / 5) * 5 + (baseHeight % 5) * 0.4;

            let isAbsoluteTop = true;
            let subBlockDepth = 0;

            for (let y = 127; y >= 0; y--) {
            // --- MINECRAFT 3D DENSITY ---
            let cliffNoise = noise.perlin3(globalX / 50, y / 40, globalZ / 50) * 18; 

            // Small noise breaks up straight lines and makes the surface look organic
            let detailNoise = noise.perlin3(globalX / 15, y / 15, globalZ / 15) * 5;

            // The deeper you go, the more solid it is. Near the surface, 3D noise takes over.
            let depthSolidifier = Math.max(0, (60 - y) * 0.5); 

            let density = (baseHeight - y) + cliffNoise + detailNoise + depthSolidifier;
            
                if (density > 0) { 
                // --- IMPROVED CAVE LOGIC ---
                // Calculate a depth factor (0.0 at surface, 1.0 at bedrock)
                    let depthFactor = Math.max(0, Math.min(1, (70 - y) / 70));
                
                // Spaghetti Caves (Winding Tunnels) - wider at the bottom
                    let n1 = fbm3(globalX, y, globalZ, 2, 35);
                    let n2 = fbm3(globalX + 1000, y + 1000, globalZ + 1000, 2, 35);
                    let tunnelThickness = 0.002 + (depthFactor * 0.006);
                    let isTunnel = (n1 * n1 + n2 * n2) < tunnelThickness; 
                
                // Cheese Caves (Large Chambers) - more common at the bottom
                    let chamberNoise = fbm3(globalX, y, globalZ, 2, 50); 
                    let chamberThreshold = 0.65 - (depthFactor * 0.3); // Drops to 0.35 deep down
                    let isChamber = chamberNoise > chamberThreshold; 
                
                    if (isTunnel || isChamber) {
                        isAbsoluteTop = false; 
                        continue;
                    }

                    if (brokenBlocks.has(`${globalX},${y},${globalZ}`)) {
                        isAbsoluteTop = false; 
                        continue; 
                    }

                // --- MINECRAFT LAYER LOGIC ---
                    let blockType;
                    const localBiome = getBiome(tempMap, moistMap, 0);

                    if (isAbsoluteTop) {
                        // Natural snowy mountain peaks
                        let snowLine = 95 + (fbm2(globalX, globalZ, 2, 50) * 10);
                        blockType = y > snowLine ? 'snow' : localBiome.topBlock;
                    
                        isAbsoluteTop = false; 
                        subBlockDepth = 0;
                    
                        if (blockType !== 'snow' && localBiome.treeChance > 0 && getDeterministicRandom(globalX, y, globalZ) < localBiome.treeChance) {
                        treesToSpawn.push({ x, y, z });
                        }
                    } else if (subBlockDepth < 3) {
                        blockType = localBiome.subBlock;
                        subBlockDepth++;
                    } else {
                        let baseDeepBlock = subBlockDepth < 6 && localBiome.name === "Desert" ? 'sandstone' : 'stone';
                        subBlockDepth++;

                        if (baseDeepBlock === 'stone') {
                            // Ores spawn slightly more frequently deeper down
                            let oreNoise = noise.perlin3(globalX * 0.15, y * 0.15, globalZ * 0.15);
                            blockType = oreNoise > (0.75 - depthFactor*0.1) ? 'coal' : oreNoise < (-0.75 + depthFactor*0.1) ? 'iron' : 'stone';
                        } else {
                            blockType = baseDeepBlock;
                        }
                    }
                    blocks[getIdx(x, y, z)] = TYPE[blockType];
                } else {
                    isAbsoluteTop = true;
                }
            }
        }
    }

    // PASS 2: Mesh Population (Hidden Face Culling)
    const matrix = new THREE.Matrix4();
    const overlayMatrix = new THREE.Matrix4();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < 128; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;

                // Replace the 'visible = false;' logic in Pass 2 with this:

                let visible = false;

// If we are at the absolute edge of the chunk, only render if we are near the surface or caves
                if (x === 0 || x === 15 || z === 0 || z === 15) {
    // Only force render if it's high enough, preventing massive underground walls from rendering
                    if (y > 40) visible = true; 
                } 
                if (y === 0 || y === 127) {
                    visible = true; 
                } 

                // Normal neighbor culling for everything else
                if (!visible) {
                    if (blocks[getIdx(x-1, y, z)] === 0 || blocks[getIdx(x+1, y, z)] === 0 || 
                        blocks[getIdx(x, y-1, z)] === 0 || blocks[getIdx(x, y+1, z)] === 0 ||
                        blocks[getIdx(x, y, z-1)] === 0 || blocks[getIdx(x, y, z+1)] === 0) {
                        visible = true;
                    }
                }

                if (visible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (indices[bName] >= meshes[bName].count) continue; 

                    let gX = startX + x; let gZ = startZ + z;
                    matrix.setPosition(gX, y, gZ);
                    meshes[bName].setMatrixAt(indices[bName]++, matrix);
                    
                    if (bName === 'grass' && blocks[getIdx(x, Math.min(127, y+1), z)] === 0 && indices.overlay < meshes.overlay.count) {
                        overlayMatrix.makeScale(1.002, 1.002, 1.002);
                        overlayMatrix.setPosition(gX, y, gZ);
                        meshes.overlay.setMatrixAt(indices.overlay++, overlayMatrix);
                    }
                }
            }
        }
    }

    // Pass 3: Trees
    for (let t of treesToSpawn) spawnTree(startX + t.x, t.y + 1, startZ + t.z, meshes, indices);

    // Finalize meshes
    for (const [key, mesh] of Object.entries(meshes)) {
        mesh.count = indices[key];
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
        if (mesh.count > 0) interactableMeshes.push(mesh);
    }
    activeChunks[chunkId] = meshes;
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
            for (const mesh of Object.values(activeChunks[id])) {
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
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    
    const near = interactableMeshes.filter(m => {
        if (!m.chunkId) return false;
        const [cx, cz] = m.chunkId.split(',').map(Number);
        return Math.abs(cx - pX) <= 1 && Math.abs(cz - pZ) <= 1;
    });
    const hit = raycaster.intersectObjects(near);
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
        
        brokenBlocks.add(`${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`);
        
        // Hide block instantly instead of rebuilding chunk
        mat.setPosition(0, -9999, 0); 
        mining.targetMesh.setMatrixAt(mining.targetId, mat);
        mining.targetMesh.instanceMatrix.needsUpdate = true;

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
