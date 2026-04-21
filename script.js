// 3. Materials & Block Registry
const grass_color = 0x8db753;

// I've added a few basic colored materials for new biomes (sand/snow)
// Feel free to swap these out with loadTex() later!
const sand_mat = new THREE.MeshStandardMaterial({ color: 0xeed382 });
const snow_mat = new THREE.MeshStandardMaterial({ color: 0xffffff });

const grass_mat = [
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassTop, color: grass_color }),
    new THREE.MeshStandardMaterial({ map: dirt }),
    new THREE.MeshStandardMaterial({ map: grassSide }),
    new THREE.MeshStandardMaterial({ map: grassSide })
];
const iron_mat = new THREE.MeshStandardMaterial({ map: ironore });
const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const fringeMat = new THREE.MeshStandardMaterial({ 
    map: grassSideOverlay, 
    color: grass_color,
    transparent: true, 
    alphaTest: 0.5 
});

const side_overlay_mat = [fringeMat, fringeMat, invisibleMat, invisibleMat, fringeMat, fringeMat];
const coal_mat = new THREE.MeshStandardMaterial({ map: coalore });
const copper_mat = new THREE.MeshStandardMaterial({ map: copperore });
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
const leaf_mat = new THREE.MeshStandardMaterial({ map: leaves, transparent: true, color: 0x7eb04d, alphaTest: 0.5 });

const destroyGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const destroyMat = new THREE.MeshBasicMaterial({ 
    map: destroyTextures[0], 
    transparent: true, 
    depthWrite: false, 
    color: 0xA9A9A9,
    opacity: 0.8
});
const destroyMesh = new THREE.Mesh(destroyGeo, destroyMat);
destroyMesh.visible = false; 
scene.add(destroyMesh);

// --- THE NEW MODULAR SYSTEMS ---

// 3.5 Block Registry
// Defines every block in the game, its material, and mining hardness in one spot.
const BLOCKS = {
    grass:   { mat: grass_mat,        hardness: dirthardness, shadow: true },
    overlay: { mat: side_overlay_mat, hardness: dirthardness, shadow: false },
    dirt:    { mat: dirt_mat,         hardness: dirthardness, shadow: true },
    stone:   { mat: stone_mat,        hardness: stonehardness, shadow: true },
    sand:    { mat: sand_mat,         hardness: dirthardness, shadow: true },
    snow:    { mat: snow_mat,         hardness: dirthardness, shadow: true },
    coal:    { mat: coal_mat,         hardness: coalhardness, shadow: true },
    iron:    { mat: iron_mat,         hardness: ironhardness, shadow: true },
    copper:  { mat: copper_mat,       hardness: copperhardness, shadow: true },
    log:     { mat: log_mat,          hardness: loghardness,  shadow: true },
    leaf:    { mat: leaf_mat,         hardness: leafhardness, shadow: true }
};

// 3.6 Biome Configuration
// Super easy to add new ones! Just copy/paste a block and tweak the numbers.
const BIOMES = {
    plains: {
        heightScale: 12,
        baseHeight: 10,
        surfaceBlock: 'grass',
        subSurfaceBlock: 'dirt',
        subSurfaceDepth: 3,
        deepBlock: 'stone',
        treeChance: 0.002, // Normal trees
        ores: [
            { type: 'coal', threshold: 0.65, scale: 0.15, offset: 0 },
            { type: 'copper', threshold: 0.68, scale: 0.15, offset: 200 },
            { type: 'iron', threshold: 0.72, scale: 0.15, offset: 100 }
        ]
    },
    desert: {
        heightScale: 4,     // Flatter terrain
        baseHeight: 12,
        surfaceBlock: 'sand',
        subSurfaceBlock: 'sand',
        subSurfaceDepth: 4, // Deeper sand before hitting stone
        deepBlock: 'stone',
        treeChance: 0.0,    // No trees in the desert!
        ores: [
            { type: 'coal', threshold: 0.70, scale: 0.15, offset: 0 } // Less ore
        ]
    },
    mountains: {
        heightScale: 35,    // Massive peaks
        baseHeight: 15,
        surfaceBlock: 'snow',
        subSurfaceBlock: 'stone', // Stone right under the snow
        subSurfaceDepth: 1,
        deepBlock: 'stone',
        treeChance: 0.0005, // Rare trees
        ores: [
            { type: 'iron', threshold: 0.60, scale: 0.15, offset: 100 }, // Lots of iron!
            { type: 'coal', threshold: 0.65, scale: 0.15, offset: 0 }
        ]
    }
};

// 4. World Variables, Master Seed & Memory System
const chunkSize = 16;
const renderDistance = 3;
const worldDepth = -32;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const worldSeed = Math.random(); 
noise.seed(worldSeed);

const activeChunks = {};
const interactableMeshes = [];
const brokenBlocks = new Set(); 

function getDeterministicRandom(x, y, z) {
    let str = `${x},${y},${z},${worldSeed}`;
    let h = 2166136261; 
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619); 
    }
    h ^= h >>> 13;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
}

// 4.5 Biome Selector function
function getBiome(x, z) {
    // We use a wider noise scale (150) so biomes are large and sweeping
    let temperature = noise.perlin2(x / 150, z / 150);
    
    if (temperature < -0.2) return BIOMES.desert;
    if (temperature > 0.3) return BIOMES.mountains;
    return BIOMES.plains;
}

// 5. Tree Logic (With Master Seed & Persistence)
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
                const isCorner = Math.abs(lx) === radius && Math.abs(lz) === radius;
                if (isCorner) {
                    let trimChance = (ly === trunkH + 1) ? 1.0 : (ly === trunkH) ? 0.75 : (ly === trunkH - 1) ? 0.4 : 0.1;
                    if (getDeterministicRandom(x + lx, y + ly, z + lz) < trimChance) continue;
                }
                if (lx === 0 && lz === 0 && ly < trunkH) continue;
                
                const blockX = x + lx;
                const blockY = y + ly;
                const blockZ = z + lz;
                if (brokenBlocks.has(`${blockX},${blockY},${blockZ}`)) continue;

                treeMatrix.setPosition(blockX, blockY, blockZ);
                chunkMeshes.leaf.setMatrixAt(indices.leaf++, treeMatrix);
            }
        }
    }
}

// 6. Chunk Generator
function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    // Dynamically create meshes based on our BLOCKS registry
    const meshes = {};
    const indices = {};
    
    for (const [blockName, blockData] of Object.entries(BLOCKS)) {
        // Give trees less buffer space to save memory, ground blocks get a larger buffer
        let maxInstances = (blockName === 'leaf' || blockName === 'log') ? 2000 : chunkSize * chunkSize * 40;
        meshes[blockName] = new THREE.InstancedMesh(geometry, blockData.mat, maxInstances);
        meshes[blockName].name = blockName;
        meshes[blockName].chunkId = chunkId;
        meshes[blockName].frustumCulled = true;
        
        meshes[blockName].castShadow = blockData.shadow;
        meshes[blockName].receiveShadow = blockData.shadow;
        
        indices[blockName] = 0; // Setup our counting index
    }

    const matrix = new THREE.Matrix4();
    const overlayMatrix = new THREE.Matrix4();
    
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;

    // Pre-calculate heights AND biomes for visibility checking
    const terrain = [];
    const chunkBiomes = [];
    for (let x = -1; x <= chunkSize; x++) {
        terrain[x + 1] = [];
        chunkBiomes[x + 1] = [];
        for (let z = -1; z <= chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            let biome = getBiome(globalX, globalZ);
            let n = noise.perlin2(globalX / 25, globalZ / 25);
            
            // Map the noise based on the specific biome's settings
            terrain[x + 1][z + 1] = Math.floor(((n + 1) / 2) * biome.heightScale) + biome.baseHeight;
            chunkBiomes[x + 1][z + 1] = biome;
        }
    }

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            let h = terrain[x + 1][z + 1];
            let biome = chunkBiomes[x + 1][z + 1];
            
            for (let y = worldDepth; y <= h; y++) {
                let isHidden = (
                    terrain[x + 2][z + 1] >= y && terrain[x][z + 1] >= y &&
                    terrain[x + 1][z + 2] >= y && terrain[x + 1][z] >= y && y < h
                );
                
                if (isHidden) {
                    if (brokenBlocks.has(`${globalX},${y + 1},${globalZ}`) || 
                        brokenBlocks.has(`${globalX},${y - 1},${globalZ}`) || 
                        brokenBlocks.has(`${globalX + 1},${y},${globalZ}`) || 
                        brokenBlocks.has(`${globalX - 1},${y},${globalZ}`) || 
                        brokenBlocks.has(`${globalX},${y},${globalZ + 1}`) || 
                        brokenBlocks.has(`${globalX},${y},${globalZ - 1}`))   
                    {
                        isHidden = false;
                    }
                }

                if (!isHidden) {
                    // Tree Spawning
                    if (y === h && getDeterministicRandom(globalX, 0, globalZ) < biome.treeChance) {
                        spawnTree(globalX, y + 1, globalZ, meshes, indices);
                    }

                    if (brokenBlocks.has(`${globalX},${y},${globalZ}`)) continue; 

                    matrix.setPosition(globalX, y, globalZ);
                    
                    // --- THE DYNAMIC PLACEMENT LOGIC ---
                    if (y === h) {
                        // Place Top Block (e.g. Grass, Sand, Snow)
                        meshes[biome.surfaceBlock].setMatrixAt(indices[biome.surfaceBlock]++, matrix);
                        
                        // Handle Grass Overlay Special Case
                        if (biome.surfaceBlock === 'grass') {
                            overlayMatrix.makeScale(1.002, 1.002, 1.002);
                            overlayMatrix.setPosition(globalX, y, globalZ);
                            meshes.overlay.setMatrixAt(indices.overlay++, overlayMatrix);
                        }
                    } else if (y > h - biome.subSurfaceDepth) {
                        // Place Subsurface Block (e.g. Dirt)
                        meshes[biome.subSurfaceBlock].setMatrixAt(indices[biome.subSurfaceBlock]++, matrix);
                    } else {
                        // Check Ores dynamically based on biome settings!
                        let placedOre = false;
                        for (let ore of biome.ores) {
                            let oreNoise = noise.perlin3((globalX + ore.offset) * ore.scale, (y + ore.offset) * ore.scale, (globalZ + ore.offset) * ore.scale);
                            if (oreNoise > ore.threshold) {
                                meshes[ore.type].setMatrixAt(indices[ore.type]++, matrix);
                                placedOre = true;
                                break; // Don't spawn two ores in the same block
                            }
                        }
                        
                        // Place Deep Block (e.g. Stone) if no ore was placed
                        if (!placedOre) {
                            meshes[biome.deepBlock].setMatrixAt(indices[biome.deepBlock]++, matrix);
                        }
                    }
                }
            }
        }
    }

    // Update counts and add to scene
    for (const [blockName, mesh] of Object.entries(meshes)) {
        mesh.count = indices[blockName];
        if (mesh.count > 0) {
            mesh.instanceMatrix.needsUpdate = true;
            scene.add(mesh);
            interactableMeshes.push(mesh);
        }
    }
    
    activeChunks[chunkId] = meshes;
}

// 7. Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(50, 100, 20); 
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 75;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.05;

const d = 50; 
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;

scene.add(sunLight);
let lastPlayerChunkX = -999;
let lastPlayerChunkZ = -999;

function updateChunks() {
    const playerChunkX = Math.floor(camera.position.x / chunkSize);
    const playerChunkZ = Math.floor(camera.position.z / chunkSize);

    if (playerChunkX === lastPlayerChunkX && playerChunkZ === lastPlayerChunkZ) return;
    lastPlayerChunkX = playerChunkX;
    lastPlayerChunkZ = playerChunkZ;

    const chunksToKeep = new Set();

    for (let x = playerChunkX - renderDistance; x <= playerChunkX + renderDistance; x++) {
        for (let z = playerChunkZ - renderDistance; z <= playerChunkZ + renderDistance; z++) {
            generateChunk(x, z);
            chunksToKeep.add(`${x},${z}`);
        }
    }

    for (const chunkId in activeChunks) {
        if (!chunksToKeep.has(chunkId)) {
            const meshes = activeChunks[chunkId];
            for (const mesh of Object.values(meshes)) {
                scene.remove(mesh);
                const index = interactableMeshes.indexOf(mesh);
                if (index > -1) interactableMeshes.splice(index, 1);
                mesh.dispose();
            }
            delete activeChunks[chunkId];
        }
    }
}

// 8. Controls, Hand Setup & Memory Mining
camera.position.set(0, 25, 0);

const handGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2); 
handGeo.translate(0, 0.4, 0); 

const handMat = new THREE.MeshStandardMaterial({ 
    color: 0xd2a77d, 
    roughness: 0.8 
});
const playerHand = new THREE.Mesh(handGeo, handMat);

playerHand.position.set(0.4, -0.4, -0.1);
playerHand.rotation.set(-Math.PI / 3, -Math.PI / 16, 0); 

camera.add(playerHand);
scene.add(camera);
// -------------------------------

let yaw = 0, pitch = 0, keys = {};
const raycaster = new THREE.Raycaster();
raycaster.far = 6;

let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };

function getTarget() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    
    const nearbyMeshes = interactableMeshes.filter(m => {
        if (!m.chunkId) return false;
        const [cx, cz] = m.chunkId.split(',').map(Number);
        return Math.abs(cx - pX) <= 1 && Math.abs(cz - pZ) <= 1;
    });

    const hit = raycaster.intersectObjects(nearbyMeshes);
    return hit.length > 0 ? hit[0] : null;
}

function startMining(hit) {
    // Because of our BLOCKS registry, finding mining time is now a single line!
    const blockConfig = BLOCKS[hit.object.name];
    
    mining = {
        active: true, 
        startTime: Date.now(), 
        targetMesh: hit.object, 
        targetId: hit.instanceId,
        requiredTime: blockConfig ? blockConfig.hardness : 1500
    };
};
