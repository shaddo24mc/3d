// 1. Core Scene & Bright Atmosphere
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Change: Bright sky blue and distant fog so you can see clearly
const skyColor = 0x87CEEB; 
renderer.setClearColor(skyColor);
scene.fog = new THREE.Fog(skyColor, 20, 100); // Fog starts much further away
document.body.appendChild(renderer.domElement);

// 2. Inventory & Game State
const inventory = { log: 10, stone: 0, ironOre: 0, ironIngot: 0, furnaceCount: 0 };
const droppedItems = [];
let smelting = { active: false, progress: 0, total: 3000 }; 

// 3. Texture & Material Setup
const loader = new THREE.TextureLoader();
const loadTex = (u) => { 
    const t = loader.load(u); 
    t.magFilter = THREE.NearestFilter; 
    t.minFilter = THREE.NearestFilter;
    return t; 
};

const mats = {
    grass: [
        new THREE.MeshStandardMaterial({map: loadTex('./textures/grass_block_side.png')}),
        new THREE.MeshStandardMaterial({map: loadTex('./textures/grass_block_side.png')}),
        new THREE.MeshStandardMaterial({map: loadTex('./textures/grass_block_top.png'), color: 0x55ab55}), // Bright Green
        new THREE.MeshStandardMaterial({map: loadTex('./textures/dirt.png')}),
        new THREE.MeshStandardMaterial({map: loadTex('./textures/grass_block_side.png')}),
        new THREE.MeshStandardMaterial({map: loadTex('./textures/grass_block_side.png')})
    ],
    stone: new THREE.MeshStandardMaterial({map: loadTex('./textures/stone.png')}),
    iron: new THREE.MeshStandardMaterial({map: loadTex('./textures/iron_ore.png')}),
    log: new THREE.MeshStandardMaterial({map: loadTex('./textures/oak_log.png')}),
    furnace: new THREE.MeshStandardMaterial({map: loadTex('./textures/furnace_front_on.png')}),
    leaf: new THREE.MeshStandardMaterial({map: loadTex('./textures/oak_leaves.png'), transparent: true, opacity: 0.8, color: 0x44aa44}) // Bright Leaves
};

// 4. Optimized World Generation
const worldSize = 40;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const grassIM = new THREE.InstancedMesh(geometry, mats.grass, 10000);
const stoneIM = new THREE.InstancedMesh(geometry, mats.stone, 50000);
const ironIM = new THREE.InstancedMesh(geometry, mats.iron, 2000);
const logIM = new THREE.InstancedMesh(geometry, mats.log, 5000);
const leafIM = new THREE.InstancedMesh(geometry, mats.leaf, 20000);
const furnaceIM = new THREE.InstancedMesh(geometry, mats.furnace, 100);

let gI=0, sI=0, irI=0, lI=0, lfI=0, fI=0;
const matrix = new THREE.Matrix4();
noise.seed(Math.random());

for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let h = Math.floor(((noise.perlin2(x/20, z/20)+1)/2) * 12) + 10;
        for (let y = 0; y <= h; y++) {
            matrix.setPosition(x, y, z);
            if (y === h) { 
                grassIM.setMatrixAt(gI++, matrix); 
                if(Math.random() < 0.05) { // Normal tree density
                    for(let i=1; i<=5; i++) { 
                        matrix.setPosition(x, y+i, z); 
                        logIM.setMatrixAt(lI++, matrix); 
                    }
                }
            } else if (y < h - 8 && Math.random() < 0.02) {
                ironIM.setMatrixAt(irI++, matrix);
            } else {
                stoneIM.setMatrixAt(sI++, matrix);
            }
        }
    }
}

const allMeshes = [grassIM, stoneIM, ironIM, logIM, leafIM, furnaceIM];
allMeshes.forEach(m => { scene.add(m); m.instanceMatrix.needsUpdate=true; m.computeBoundingSphere(); });

// Change: Brighter sunlight
scene.add(new THREE.AmbientLight(0xffffff, 0.9)); 
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 20, 10);
scene.add(sun);

// 5. Mining, Items & Smelting
const ray = new THREE.Raycaster(); ray.far = 6;

function dropItem(type, pos) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), mats[type === 'log' ? 'log' : type === 'ironOre' ? 'iron' : 'stone']);
    mesh.position.copy(pos);
    mesh.userData = { type, vel: new THREE.Vector3((Math.random()-0.5)*0.1, 0.2, (Math.random()-0.5)*0.1) };
    scene.add(mesh); droppedItems.push(mesh);
}

function breakBlock() {
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(allMeshes);
    if (hits.length > 0) {
        const hit = hits[0];
        if (hit.object === furnaceIM) return; 
        
        let type = 'stone';
        if (hit.object === logIM) type = 'log';
        if (hit.object === ironIM) type = 'ironOre';
        
        dropItem(type, hit.point);
        hit.object.setMatrixAt(hit.instanceId, new THREE.Matrix4().makeTranslation(0,-1000,0));
        hit.object.instanceMatrix.needsUpdate = true;
    }
}

// 6. Controls & Input
camera.position.set(worldSize/2, 30, worldSize/2);
let yaw = 0, pitch = 0, keys = {};

document.addEventListener('mousedown', (e) => {
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
    else if (e.button === 0) breakBlock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-1.5, Math.min(1.5, pitch - e.movementY * 0.002));
    }
});

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if(e.key === 'f' && inventory.stone >= 8) { 
        inventory.stone -= 8; inventory.furnaceCount++;
        ray.setFromCamera(new THREE.Vector2(0,0), camera);
        const hits = ray.intersectObject(grassIM);
        if (hits.length > 0) {
            matrix.setPosition(hits[0].point.x, hits[0].point.y + 1, hits[0].point.z);
            furnaceIM.setMatrixAt(fI++, matrix); 
            furnaceIM.instanceMatrix.needsUpdate = true;
        }
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// 7. Game Loop
function animate() {
    requestAnimationFrame(animate);

    if (inventory.furnaceCount > 0 && inventory.ironOre > 0 && inventory.log > 0) {
        smelting.active = true; smelting.progress += 20; 
        if (smelting.progress >= smelting.total) {
            inventory.ironOre--; inventory.log--; inventory.ironIngot++;
            smelting.progress = 0;
        }
    } else { smelting.active = false; smelting.progress = 0; }

    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0,1,0)).normalize();
    const speed = 0.15;
    if (keys.w) camera.position.addScaledVector(fwd, -speed);
    if (keys.s) camera.position.addScaledVector(fwd, speed);
    if (keys.a) camera.position.addScaledVector(rgt, -speed);
    if (keys.d) camera.position.addScaledVector(rgt, speed);
    if (keys[' ']) camera.position.y += speed;
    if (keys.shift) camera.position.y -= speed;
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const item = droppedItems[i];
        item.position.add(item.userData.vel);
        item.userData.vel.y -= 0.01;
        item.rotation.y += 0.05;
        if (item.position.y < 0) { item.position.y = 0; item.userData.vel.set(0,0,0); }
        if (camera.position.distanceTo(item.position) < 1.5) {
            inventory[item.userData.type]++;
            scene.remove(item);
            droppedItems.splice(i, 1);
        }
    }

    let smeltBar = smelting.active ? ` | Smelting: ${Math.floor((smelting.progress/smelting.total)*100)}%` : "";
    document.getElementById('ui').innerText = 
        `Log: ${inventory.log} | Stone: ${inventory.stone} | Iron Ore: ${inventory.ironOre} | Iron Ingot: ${inventory.ironIngot}\n` +
        `[F] Place Furnace (8 Stone)${smeltBar}`;

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
