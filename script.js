const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 30, 60);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();
const moveSpeed = 10;
const stats = new Stats();
stats.showPanel(0);

// Optimize shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // Cheaper than PCFSoftShadowMap
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
    t.generateMipmaps = false; // Performance boost for pixel art
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

// Biome Textures
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
// 2. 3D MULTI-NOISE BIOME REGISTRY
// ----------------------------------------------------
const BIOME_REGISTRY = [
    { name: "Forest", temp: 0.2, moist: 0.6, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.008, heightScale: 35 },
    { name: "Plains", temp: 0.1, moist: -0.2, depth: 0.0, topBlock: 'grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.0002, heightScale: 15 },
    { name: "Desert", temp: 0.8, moist: -0.8, depth: 0.0, topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 20 },
    { name: "Snowy Tundra", temp: -0.8, moist: 0.2, depth: 0.0, topBlock: 'snow_grass', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.001, heightScale: 25 },
    { name: "Mountains", temp: 0.5, moist: 0.5, depth: 0.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0, heightScale: 120 },
    { name: "Deep Sandy Caves", temp: 0.8, moist: -0.8, depth: 1.0, topBlock: 'sand', subBlock: 'sandstone', deepSubBlock: 'sandstone', treeChance: 0, heightScale: 0 },
    { name: "Standard Caves", temp: 0.0, moist: 0.0, depth: 1.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0, heightScale: 0 }
];

// ----------------------------------------------------
// 3. World Variables & Generators
// ----------------------------------------------------
const chunkSize = 16;
const renderDistance = 3; // Reduced slightly for stable FPS
const worldDepth = -64;
const worldHeight = 128;
const geometry = new THREE.BoxGeometry(1, 1, 1);

const worldSeed = Math.random(); 
noise.seed(worldSeed);

const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

const activeChunks = {};
const chunkQueue = []; // Queue to prevent main thread freezing
const interactableMeshes = [];
const brokenBlocks = new Set(); 

function getBiome(temp, moist, depth) {
    let closestBiome = BIOME_REGISTRY[0];
    let minDist = Infinity;
    for (let b of BIOME_REGISTRY) {
        let dist = Math.pow(temp - b.temp, 2) + Math.pow(moist - b.moist, 2) + Math.pow(depth - b.depth, 2);
        if (dist < minDist) {
            minDist = dist;
            closestBiome = b;
        }
    }
    return closestBiome;
}

function getInterpolatedHeightScale(x, z) {
    // OPTIMIZATION: Reduced sample points from 25 to 9
    const range = 4; 
    const step = 4;  
    let totalScale = 0;
    let samples = 0;

    for (let offX = -range; offX <= range; offX += step) {
        for (let offZ = -range; offZ <= range; offZ += step) {
            let temp = noise.perlin2((x + offX + mapOffsetX) / 400, (z + offZ + mapOffsetZ) / 400);
            let moist = noise.perlin2((x + offX + mapOffsetX + 10000) / 400, (z + offZ + mapOffsetZ + 10000) / 400);
            totalScale += getBiome(temp, moist, 0.0).heightScale;
            samples++;
        }
    }
    return totalScale / samples; 
}

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

// ----------------------------------------------------
// 4. Chunk Generator Core
// ----------------------------------------------------
function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;

    // Reduced buffers to save memory
    const maxSurfaceBlocks = chunkSize * chunkSize * 10; 
    const maxDeepBlocks = chunkSize * chunkSize * 80; 
    
    const meshes = {};
    for (const [key, mat] of Object.entries(materials)) {
        let count = (key === 'leaf' || key === 'log') ? 1000 : 
                    (key === 'grass' || key === 'snow_grass' || key === 'overlay' || key === 'snow' || key === 'sand') ? maxSurfaceBlocks : 
                    maxDeepBlocks; 
        
        meshes[key] = new THREE.InstancedMesh(geometry, mat, count);
        meshes[key].name = key;
        meshes[key].chunkId = chunkId;
        meshes[key].frustumCulled = true; // Enabled for performance
        
        // Optimize Shadows: Only surface blocks cast shadows
        const isSurfaceType = ['grass', 'snow_grass', 'sand', 'snow', 'leaf', 'log'].includes(key);
        meshes[key].castShadow = isSurfaceType;
        meshes[key].receiveShadow = true;
    }

    const indices = {};
    for (const key of Object.keys(meshes)) indices[key] = 0;

    const matrix = new THREE.Matrix4();
    const overlayMatrix = new THREE.Matrix4();
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            
            let tempMap = noise.perlin2((globalX + mapOffsetX) / 400, (globalZ + mapOffsetZ) / 400);
            let moistMap = noise.perlin2((globalX + mapOffsetX + 10000) / 400, (globalZ + mapOffsetZ + 10000) / 400);
            
            let blendedScale = getInterpolatedHeightScale(globalX, globalZ);
            let rawElevation = noise.perlin2((globalX + mapOffsetX) / 400, (globalZ + mapOffsetZ) / 400);
            let baseHeight = ((rawElevation + 1) / 2) * blendedScale + 64; 

            let columnMaxY = Math.min(worldHeight, Math.floor(baseHeight + 25));

            for (let y = worldDepth; y <= columnMaxY; y++) {
                let noise3D = noise.perlin3(globalX / 40, y / 40, globalZ / 40) * 20; 
                let density = (baseHeight - y) + noise3D;

                let caveNoise = noise.perlin3(globalX / 30, y / 30, globalZ / 30);
                let isCave = caveNoise > 0.4; 

                if (density > 0 && !isCave) {
                    let depthParam = Math.max(0, Math.min(1.0, (64 - y) / 128));
                    const localBiome = getBiome(tempMap, moistMap, depthParam);

                    let densityAbove = (baseHeight - (y + 1)) + (noise.perlin3(globalX / 40, (y + 1) / 40, globalZ / 40) * 20);
                    let isSurface = densityAbove <= 0;

                    let blockType = 'stone'; 

                    if (isSurface) {
                        blockType = localBiome.topBlock;
                        if (y > 110) blockType = 'snow'; 

                        if (localBiome.treeChance > 0 && getDeterministicRandom(globalX, y, globalZ) < localBiome.treeChance) {
                            spawnTree(globalX, y + 1, globalZ, meshes, indices);
                        }
                    } else if (densityAbove <= 3) {
                        blockType = localBiome.subBlock;
                    } else {
                        let oreNoise = noise.perlin3(globalX * 0.15, y * 0.15, globalZ * 0.15);
                        if (oreNoise > 0.65) {
                            blockType = 'coal';
                        } else if (oreNoise < -0.65) {
                            blockType = 'iron';
                        } else {
                            blockType = localBiome.deepSubBlock;
                        }
                    }

                    if (brokenBlocks.has(`${globalX},${y},${globalZ}`)) continue;
                    
                    // Safety check to prevent exceeding instance limits
                    if (indices[blockType] >= meshes[blockType].count) continue;

                    matrix.setPosition(globalX, y, globalZ);
                    meshes[blockType].setMatrixAt(indices[blockType]++, matrix);
                    
                    if (blockType === 'grass' && isSurface && indices.overlay < meshes.overlay.count) {
                        overlayMatrix.makeScale(1.002, 1.002, 1.002);
                        overlayMatrix.setPosition(globalX, y, globalZ);
                        meshes.overlay.setMatrixAt(indices.overlay++, overlayMatrix);
                    }
                }
            }
        }
    }

    for (const [key, mesh] of Object.entries(meshes)) {
        mesh.count = indices[key];
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
        if (mesh.count > 0) interactableMeshes.push(mesh);
    }
    activeChunks[chunkId] = meshes;
}

// ----------------------------------------------------
// 5. Rendering, Lighting, & Updates
// ----------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(50, 100, 20); 
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 512; // Reduced for performance
sunLight.shadow.mapSize.height = 512;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 150;
sunLight.shadow.bias = -0.001;

const d = 60; 
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

    // Queue up missing chunks instead of generating all at once
    for (let x = playerChunkX - renderDistance; x <= playerChunkX + renderDistance; x++) {
        for (let z = playerChunkZ - renderDistance; z <= playerChunkZ + renderDistance; z++) {
            const chunkId = `${x},${z}`;
            chunksToKeep.add(chunkId);
            if (!activeChunks[chunkId] && !chunkQueue.includes(chunkId)) {
                chunkQueue.push(chunkId);
            }
        }
    }

    // Unload distant chunks
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

// ----------------------------------------------------
// 6. Mining & Controls
// ----------------------------------------------------
const spawnX = 0;
const spawnZ = 0;
let safeSpawnY = 128; 

for (let y = worldHeight; y >= worldDepth; y--) {
    let blendedScale = getInterpolatedHeightScale(spawnX, spawnZ);
    let rawElevation = noise.perlin2((spawnX + mapOffsetX) / 400, (spawnZ + mapOffsetZ) / 400);
    let baseHeight = ((rawElevation + 1) / 2) * blendedScale + 64; 
    let noise3D = noise.perlin3(spawnX / 40, y / 40, spawnZ / 40) * 20;
    
    if ((baseHeight - y) + noise3D > 0) {
        safeSpawnY = y;
        break;
    }
}

const playerHeight = 2;
camera.position.set(spawnX, safeSpawnY + playerHeight, spawnZ);

const handGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2); 
handGeo.translate(0, 0.4, 0); 

const handMat = new THREE.MeshStandardMaterial({ color: 0xd2a77d, roughness: 0.8 });
const playerHand = new THREE.Mesh(handGeo, handMat);
playerHand.position.set(0.4, -0.4, -0.1);
playerHand.rotation.set(-Math.PI / 3, -Math.PI / 16, 0); 

camera.add(playerHand);
scene.add(camera);

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
    let blockHardness = BLOCK_HARDNESS[hit.object.name] || 1000;

    mining = {
        active: true, startTime: Date.now(), targetMesh: hit.object, targetId: hit.instanceId, requiredTime: blockHardness
    };

    destroyMat.map = destroyTextures[0];
    destroyMat.needsUpdate = true;

    const blockMatrix = new THREE.Matrix4();
    hit.object.getMatrixAt(hit.instanceId, blockMatrix);
    const pos = new THREE.Vector3().setFromMatrixPosition(blockMatrix);
    
    destroyMesh.position.copy(pos);
    destroyMesh.visible = true; 
}

function updateMining() {
    if (!mining.active) {
        destroyMesh.visible = false;
        return;
    }
    
    const hit = getTarget();
    if (!hit || hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId) {
        mining.active = false;
        destroyMesh.visible = false;
        if (hit) startMining(hit); 
        return;
    }

    const elapsed = Date.now() - mining.startTime;
    const progress = Math.min(elapsed / mining.requiredTime, 1.0); 
    const phaseIndex = Math.floor(progress * 9.99); 

    if (destroyMat.map !== destroyTextures[phaseIndex]) {
        destroyMat.map = destroyTextures[phaseIndex];
        destroyMat.needsUpdate = true; 
    }

    if (elapsed >= mining.requiredTime) {
        const mesh = mining.targetMesh;
        const targetIdx = mining.targetId;

        destroyMesh.visible = false; 

        const blockMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(targetIdx, blockMatrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(blockMatrix);
        
        brokenBlocks.add(`${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`);
        
        // OPTIMIZATION: Instead of rebuilding the chunk, instantly hide the block
        // by moving its matrix far out of the map bounds and updating.
        blockMatrix.setPosition(0, -9999, 0); 
        mesh.setMatrixAt(targetIdx, blockMatrix);
        mesh.instanceMatrix.needsUpdate = true;

        const next = getTarget();
        if (next) startMining(next); else mining.active = false;
    }
}

// Controls
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
// 7. Main Game Loop
// ----------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); 

    updateChunks();

    // Process chunk queue slowly to prevent freezing
    if (chunkQueue.length > 0) {
        const nextChunk = chunkQueue.shift();
        const [cx, cz] = nextChunk.split(',').map(Number);
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
