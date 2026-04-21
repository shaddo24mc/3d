// ==========================================
// 1. BASIC SETUP & ENGINE
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ==========================================
// 2. LIGHTING
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(100, 200, 50);
scene.add(dirLight);

// ==========================================
// 3. MATERIALS
// ==========================================
const grass_mat = new THREE.MeshLambertMaterial({ color: 0x3b8526 });
const dirt_mat = new THREE.MeshLambertMaterial({ color: 0x5e4028 });
const stone_mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
const log_mat = new THREE.MeshLambertMaterial({ color: 0x3d2314 });
const leaf_mat = new THREE.MeshLambertMaterial({ color: 0x2d6118 });
const coal_mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
const iron_mat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
const copper_mat = new THREE.MeshLambertMaterial({ color: 0xc4693b });
const side_overlay_mat = new THREE.MeshBasicMaterial({ color: 0x4caf50, transparent: true, opacity: 0.2 });

// ==========================================
// 4. WORLD VARIABLES & DATA TRACKING
// ==========================================
const chunkSize = 16;
const renderDistance = 3;
const worldDepth = -10; 
const geometry = new THREE.BoxGeometry(1, 1, 1);
const worldSeed = Math.random(); 
noise.seed(worldSeed);

const activeChunks = {};
const brokenBlocks = new Set();
const interactableMeshes = [];

function getDeterministicRandom(x, y, z) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
}

// ==========================================
// 4.5 BIOME SYSTEM
// ==========================================
const biomes = [
    { name: "Plains", temperature: 0.25, baseHeight: 10, heightScale: 4, treeChance: 0.0005, surfaceMat: 'grass', dirtMat: 'dirt' },
    { name: "Forest", temperature: 0.50, baseHeight: 12, heightScale: 8, treeChance: 0.03, surfaceMat: 'grass', dirtMat: 'dirt' },
    { name: "Mountains", temperature: 0.85, baseHeight: 18, heightScale: 35, treeChance: 0.002, surfaceMat: 'stone', dirtMat: 'stone' }
];

biomes.sort((a, b) => a.temperature - b.temperature);
const biomeScale = 50 + (Math.random() * 300); 

function getBiomeData(globalX, globalZ) {
    let tempNoise = (noise.perlin2(globalX / biomeScale, globalZ / biomeScale) + 1) / 2; 
    
    if (tempNoise <= biomes[0].temperature) return { baseHeight: biomes[0].baseHeight, heightScale: biomes[0].heightScale, dominantBiome: biomes[0] };
    if (tempNoise >= biomes[biomes.length - 1].temperature) return { baseHeight: biomes[biomes.length - 1].baseHeight, heightScale: biomes[biomes.length - 1].heightScale, dominantBiome: biomes[biomes.length - 1] };

    let biome1 = biomes[0];
    let biome2 = biomes[1];
    let blendFactor = 0;

    for (let i = 0; i < biomes.length - 1; i++) {
        if (tempNoise >= biomes[i].temperature && tempNoise <= biomes[i+1].temperature) {
            biome1 = biomes[i];
            biome2 = biomes[i+1];
            blendFactor = (tempNoise - biome1.temperature) / (biome2.temperature - biome1.temperature);
            break;
        }
    }

    let smoothBlend = (1 - Math.cos(blendFactor * Math.PI)) / 2; 

    return {
        baseHeight: biome1.baseHeight + (biome2.baseHeight - biome1.baseHeight) * smoothBlend,
        heightScale: biome1.heightScale + (biome2.heightScale - biome1.heightScale) * smoothBlend,
        dominantBiome: blendFactor < 0.5 ? biome1 : biome2 
    };
}

// ==========================================
// 5. TREE LOGIC
// ==========================================
function spawnTree(x, y, z, chunkMeshes, indices) {
    const trunkH = 4 + Math.floor(getDeterministicRandom(x, y, z) * 2);
    const treeMatrix = new THREE.Matrix4();
    
    for (let i = 0; i < trunkH; i++) {
        if (brokenBlocks.has(`${x},${y + i},${z}`)) continue;
        treeMatrix.setPosition(x, y + i, z);
        chunkMeshes.log.setMatrixAt(indices.l++, treeMatrix);
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
                chunkMeshes.leaf.setMatrixAt(indices.lf++, treeMatrix);
            }
        }
    }
}

// ==========================================
// 6. CHUNK GENERATOR
// ==========================================
function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;

    const maxSurfaceBlocks = chunkSize * chunkSize;
    const maxDeepBlocks = chunkSize * chunkSize * 30; 
    
    const meshes = {
        grass: new THREE.InstancedMesh(geometry, grass_mat, maxSurfaceBlocks),
        overlay: new THREE.InstancedMesh(geometry, side_overlay_mat, maxSurfaceBlocks),
        dirt: new THREE.InstancedMesh(geometry, dirt_mat, maxDeepBlocks),
        stone: new THREE.InstancedMesh(geometry, stone_mat, maxDeepBlocks),
        coal: new THREE.InstancedMesh(geometry, coal_mat, maxDeepBlocks),
        iron: new THREE.InstancedMesh(geometry, iron_mat, maxDeepBlocks),
        copper: new THREE.InstancedMesh(geometry, copper_mat, maxDeepBlocks),
        log: new THREE.InstancedMesh(geometry, log_mat, 500),
        leaf: new THREE.InstancedMesh(geometry, leaf_mat, 2000)
    };

    for (const [key, mesh] of Object.entries(meshes)) {
        mesh.name = key;
        mesh.chunkId = chunkId;
    }

    const indices = { g: 0, d: 0, s: 0, l: 0, lf: 0, c: 0, i: 0, cop: 0 };
    const matrix = new THREE.Matrix4();
    const overlayMatrix = new THREE.Matrix4();
    
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;

    const terrain = [];
    const biomeMap = []; 

    for (let x = -1; x <= chunkSize; x++) {
        terrain[x + 1] = [];
        biomeMap[x + 1] = [];
        for (let z = -1; z <= chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            
            let biomeData = getBiomeData(globalX, globalZ);
            biomeMap[x + 1][z + 1] = biomeData.dominantBiome; 

            let n = noise.perlin2(globalX / 25, globalZ / 25);
            terrain[x + 1][z + 1] = Math.floor(((n + 1) / 2) * biomeData.heightScale + biomeData.baseHeight);
        }
    }

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            let h = terrain[x + 1][z + 1];
            let currentBiome = biomeMap[x + 1][z + 1]; 
            
            for (let y = worldDepth; y <= h; y++) {
                let isHidden = (
                    terrain[x + 2][z + 1] >= y && terrain[x][z + 1] >= y &&
                    terrain[x + 1][z + 2] >= y && terrain[x + 1][z] >= y && y < h
                );

                if (!isHidden) {
                    if (y === h && getDeterministicRandom(globalX, 0, globalZ) < currentBiome.treeChance) {
                        spawnTree(globalX, y + 1, globalZ, meshes, indices);
                    }

                    if (brokenBlocks.has(`${globalX},${y},${globalZ}`)) continue; 

                    matrix.setPosition(globalX, y, globalZ);
                    
                    if (y === h) {
                        if (currentBiome.surfaceMat === 'grass') {
                            meshes.grass.setMatrixAt(indices.g, matrix);
                            overlayMatrix.makeScale(1.002, 1.002, 1.002);
                            overlayMatrix.setPosition(globalX, y, globalZ);
                            meshes.overlay.setMatrixAt(indices.g, overlayMatrix);
                            indices.g++;
                        } else if (currentBiome.surfaceMat === 'stone') {
                            meshes.stone.setMatrixAt(indices.s++, matrix);
                        } else {
                            meshes.dirt.setMatrixAt(indices.d++, matrix);
                        }
                    } else if (y > h - 3) {
                        if (currentBiome.dirtMat === 'stone') {
                            meshes.stone.setMatrixAt(indices.s++, matrix);
                        } else {
                            meshes.dirt.setMatrixAt(indices.d++, matrix);
                        }
                    } else {
                        let oreNoise = noise.perlin3(globalX * 0.15, y * 0.15, globalZ * 0.15);
                        if (oreNoise > 0.65 && y <= 10) meshes.coal.setMatrixAt(indices.c++, matrix);
                        else meshes.stone.setMatrixAt(indices.s++, matrix);
                    }
                }
            }
        }
    }

    meshes.grass.count = meshes.overlay.count = indices.g;
    meshes.dirt.count = indices.d;
    meshes.stone.count = indices.s;
    meshes.log.count = indices.l;
    meshes.leaf.count = indices.lf;
    meshes.coal.count = indices.c;

    for (const mesh of Object.values(meshes)) {
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
        interactableMeshes.push(mesh);
    }
    activeChunks[chunkId] = meshes;
}

// ==========================================
// 7. CHUNK MANAGER
// ==========================================
function updateChunks() {
    const playerChunkX = Math.floor(camera.position.x / chunkSize);
    const playerChunkZ = Math.floor(camera.position.z / chunkSize);

    for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
            generateChunk(playerChunkX + x, playerChunkZ + z);
        }
    }
}

// ==========================================
// 8. PLAYER CONTROLS
// ==========================================
camera.position.set(0, 40, 0);
let pitch = 0, yaw = 0;
const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
const speed = 0.4;

document.body.addEventListener('click', () => document.body.requestPointerLock());
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === ' ') keys.space = true;
    if (e.shiftKey) keys.shift = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 'd') keys.d = false;
    if (e.key === ' ') keys.space = false;
    if (!e.shiftKey) keys.shift = false;
});

function handleMovement() {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; direction.normalize();
    right.crossVectors(camera.up, direction).normalize();

    if (keys.w) camera.position.addScaledVector(direction, speed);
    if (keys.s) camera.position.addScaledVector(direction, -speed);
    if (keys.a) camera.position.addScaledVector(right, speed);
    if (keys.d) camera.position.addScaledVector(right, -speed);
    if (keys.space) camera.position.y += speed;
    if (keys.shift) camera.position.y -= speed;
}

// ==========================================
// 9. ANIMATION LOOP
// ==========================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement === document.body) {
        handleMovement();
        updateChunks();
    }
    renderer.render(scene, camera);
}

// Initial setup
updateChunks();
animate();
