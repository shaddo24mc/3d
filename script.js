// ==========================================
// 1. INITIALIZATION (Scene, Camera, Renderer)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 25, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// ==========================================
// 2. TEXTURES & HARDNESS
// ==========================================
const loader = new THREE.TextureLoader();
// Add your real image paths back here!
const grassSide = loader.load('grass_side.png');
const grassTop = loader.load('grass_top.png');
const dirt = loader.load('dirt.png');
const stone = loader.load('stone.png');
const ironore = loader.load('iron.png');
const coalore = loader.load('coal.png');
const copperore = loader.load('copper.png');
const logSide = loader.load('log_side.png');
const logTop = loader.load('log_top.png');
const leaves = loader.load('leaves.png');
const grassSideOverlay = loader.load('grass_overlay.png');
const destroyTextures = [loader.load('destroy_stage_0.png')]; 

const dirthardness = 500;
const stonehardness = 1500;
const coalhardness = 2000;
const ironhardness = 2500;
const copperhardness = 2000;
const loghardness = 1000;
const leafhardness = 200;


// ==========================================
// 3. MATERIALS
// ==========================================
const grass_color = 0x8db753;

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


// ==========================================
// 3.5. BLOCK REGISTRY
// ==========================================
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
    log:     { mat: log
