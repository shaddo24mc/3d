// ============================================================================
// MASSIVE BLOCK REGISTRY GENERATOR
// ============================================================================
const baseBlocks = [
    'air', 'stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite',
    'grass_block', 'dirt', 'coarse_dirt', 'podzol', 'rooted_dirt', 'mud', 'cobblestone', 'bedrock', 'sand', 'red_sand',
    'gravel', 'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore', 'copper_ore', 'deepslate_copper_ore',
    'gold_ore', 'deepslate_gold_ore', 'redstone_ore', 'deepslate_redstone_ore', 'emerald_ore', 'deepslate_emerald_ore',
    'lapis_ore', 'deepslate_lapis_ore', 'diamond_ore', 'deepslate_diamond_ore', 'nether_gold_ore', 'nether_quartz_ore',
    'coal_block', 'raw_iron_block', 'raw_copper_block', 'raw_gold_block', 'iron_block', 'copper_block', 'gold_block',
    'diamond_block', 'netherite_block', 'sponge', 'wet_sponge', 'glass', 'lapis_block', 'sandstone', 'chiseled_sandstone',
    'cut_sandstone', 'cobweb', 'grass', 'fern', 'dead_bush', 'seagrass', 'sea_pickle', 'dandelion', 'poppy', 'blue_orchid',
    'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower',
    'lily_of_the_valley', 'wither_rose', 'brown_mushroom', 'red_mushroom', 'bricks', 'bookshelf', 'mossy_cobblestone',
    'obsidian', 'torch', 'end_rod', 'chorus_plant', 'chorus_flower', 'purpur_block', 'purpur_pillar', 'spawner',
    'chest', 'crafting_table', 'farmland', 'furnace', 'ladder', 'snow', 'ice', 'snow_block', 'cactus', 'clay',
    'jukebox', 'pumpkin', 'netherrack', 'soul_sand', 'soul_soil', 'basalt', 'polished_basalt', 'soul_torch',
    'glowstone', 'jack_o_lantern', 'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks',
    'infested_stone', 'melon', 'mycelium', 'lily_pad', 'nether_bricks', 'end_stone', 'end_stone_bricks', 'dragon_egg',
    'emerald_block', 'beacon', 'redstone_block', 'quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'slime_block',
    'prismarine', 'prismarine_bricks', 'dark_prismarine', 'sea_lantern', 'hay_block', 'terracotta', 'packed_ice',
    'sunflower', 'lilac', 'rose_bush', 'peony', 'tall_grass', 'large_fern', 'magma_block', 'nether_wart_block',
    'red_nether_bricks', 'bone_block', 'kelp', 'dried_kelp_block', 'turtle_egg', 'dead_tube_coral_block',
    'dead_brain_coral_block', 'dead_bubble_coral_block', 'dead_fire_coral_block', 'dead_horn_coral_block',
    'tube_coral_block', 'brain_coral_block', 'bubble_coral_block', 'fire_coral_block', 'horn_coral_block', 'blue_ice',
    'conduit', 'bamboo', 'redstone_lamp', 'campfire', 'soul_campfire', 'sweet_berry_bush', 'warped_wart_block',
    'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines', 'twisting_vines', 'crimson_fungus',
    'warped_fungus', 'shroomlight', 'target', 'crying_obsidian', 'respawn_anchor', 'blackstone', 'gilded_blackstone',
    'polished_blackstone', 'chiseled_polished_blackstone', 'polished_blackstone_bricks', 'cracked_polished_blackstone_bricks',
    'amethyst_block', 'budding_amethyst', 'amethyst_cluster', 'tuff', 'calcite', 'tinted_glass', 'powder_snow', 'sculk',
    'sculk_vein', 'sculk_catalyst', 'sculk_shrieker', 'dripstone_block', 'pointed_dripstone', 'moss_block', 'moss_carpet',
    'azalea', 'flowering_azalea', 'hanging_roots', 'spore_blossom', 'glow_lichen', 'packed_mud', 'mud_bricks',
    'mangrove_roots', 'muddy_mangrove_roots', 'ochre_froglight', 'verdant_froglight', 'pearlescent_froglight',
    'suspicious_sand', 'suspicious_gravel', 'pink_petals', 'chiseled_bookshelf', 'decorated_pot', 'crafter', 'tuff_bricks',
    'chiseled_tuff', 'polished_tuff', 'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb',
    'trial_spawner', 'vault', 'heavy_core', 'snowy_grass_block' // Fixed!
];

const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'crimson', 'warped', 'bamboo'];

const generatedBlocks = [...baseBlocks];

// Dynamically generate all colored blocks
COLORS.forEach(c => {
    generatedBlocks.push(`${c}_wool`, `${c}_stained_glass`, `${c}_terracotta`, `${c}_concrete`, `${c}_concrete_powder`, `${c}_glazed_terracotta`, `${c}_carpet`, `${c}_stained_glass_pane`, `${c}_bed`, `${c}_shulker_box`);
});

// Dynamically generate all wood variants
WOODS.forEach(w => {
    let log = w === 'crimson' || w === 'warped' ? `${w}_stem` : w === 'bamboo' ? `${w}_block` : `${w}_log`;
    let wood = w === 'crimson' || w === 'warped' ? `${w}_hyphae` : `${w}_wood`;
    let planks = `${w}_planks`;
    let leaves = w === 'crimson' || w === 'warped' ? `${w}_wart_block` : w === 'bamboo' ? null : `${w}_leaves`;
    let sapling = w === 'crimson' || w === 'warped' ? `${w}_fungus` : w === 'mangrove' ? `mangrove_propagule` : w === 'bamboo' ? `bamboo_shoot` : `${w}_sapling`;
    
    generatedBlocks.push(log, wood, planks);
    if (leaves && !generatedBlocks.includes(leaves)) generatedBlocks.push(leaves);
    if (sapling && !generatedBlocks.includes(sapling)) generatedBlocks.push(sapling);
    generatedBlocks.push(`${w}_slab`, `${w}_stairs`, `${w}_fence`, `${w}_door`, `${w}_trapdoor`, `${w}_pressure_plate`, `${w}_button`, `${w}_sign`);
});

const ALL_BLOCKS = [...new Set(generatedBlocks)];

// Core ID mappings
const TYPE = {};
const REVERSE_TYPE = [null];
ALL_BLOCKS.forEach((b, i) => {
    let id = i + 1;
    TYPE[b] = id;
    REVERSE_TYPE.push(b);
});

// Custom Texture Mapping for Blocks with different sides
const CUSTOM_FACES = {
    'grass_block': ['grass_block_side', 'grass_block_side', 'grass_block_top', 'dirt', 'grass_block_side', 'grass_block_side'],
    'snowy_grass_block': ['grass_block_snow', 'grass_block_snow', 'snow', 'dirt', 'grass_block_snow', 'grass_block_snow'],
    'podzol': ['podzol_side', 'podzol_side', 'podzol_top', 'dirt', 'podzol_side', 'podzol_side'],
    'mycelium': ['mycelium_side', 'mycelium_side', 'mycelium_top', 'dirt', 'mycelium_side', 'mycelium_side'],
    'dirt_path': ['dirt_path_side', 'dirt_path_side', 'dirt_path_top', 'dirt', 'dirt_path_side', 'dirt_path_side'],
    'bookshelf': ['bookshelf', 'bookshelf', 'oak_planks', 'oak_planks', 'bookshelf', 'bookshelf'],
    'crafting_table': ['crafting_table_side', 'crafting_table_side', 'crafting_table_top', 'oak_planks', 'crafting_table_front', 'crafting_table_side'],
    'furnace': ['furnace_side', 'furnace_side', 'furnace_top', 'furnace_top', 'furnace_front', 'furnace_side'],
    'sandstone': ['sandstone', 'sandstone', 'sandstone_top', 'sandstone_bottom', 'sandstone', 'sandstone'],
    'deepslate': ['deepslate', 'deepslate', 'deepslate_top', 'deepslate_top', 'deepslate', 'deepslate']
};

WOODS.forEach(w => {
    let log = w === 'crimson' || w === 'warped' ? `${w}_stem` : w === 'bamboo' ? `${w}_block` : `${w}_log`;
    let top = w === 'crimson' || w === 'warped' ? `${w}_stem_top` : w === 'bamboo' ? `${w}_block_top` : `${w}_log_top`;
    CUSTOM_FACES[log] = [log, log, top, top, log, log];
});

const CROSS_BLOCKS = new Set([
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 
    'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose', 'brown_mushroom', 'red_mushroom', 'fern', 'dead_bush', 
    'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines', 'twisting_vines', 'sweet_berry_bush', 'cobweb', 
    'tall_grass', 'large_fern', 'grass'
]);
// Add all saplings to cross blocks
ALL_BLOCKS.forEach(b => { if (b.includes('sapling') || b.includes('propagule') || b.includes('shoot') || b.includes('fungus')) CROSS_BLOCKS.add(b); });

const TRANSPARENT_BLOCKS = new Set(['glass', 'ice', 'slime_block', 'honey_block', 'beacon']);

// Initialize Transparency Registry
const isTransparent = new Uint8Array(65535); // Supported up to 65k blocks
isTransparent[0] = 1; // Air is transparent
ALL_BLOCKS.forEach((b) => {
    if (CROSS_BLOCKS.has(b) || TRANSPARENT_BLOCKS.has(b) || b.includes('leaves') || b.includes('glass') || b.includes('door') || b.includes('trapdoor') || b.includes('fence')) {
        isTransparent[TYPE[b]] = 1;
    }
});

// ============================================================================
// THREE.JS SETUP & ASSET LOADER
// ============================================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1); 
renderer.shadowMap.enabled = false; 
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const moveSpeed = 10;
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// NEW PATH: Everything strictly loads from the blocks folder!
const TEX_PATH = 'assets/minecraft/textures/block/';
const loader = new THREE.TextureLoader();
const texCache = {};

const loadTex = (name) => {
    if (texCache[name]) return texCache[name];
    const t = loader.load(`${TEX_PATH}${name}.png`);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false; 
    texCache[name] = t;
    return t;
};

// Procedurally generate materials for every single block
const materials = {};
ALL_BLOCKS.forEach(b => {
    if (CUSTOM_FACES[b]) {
        materials[b] = CUSTOM_FACES[b].map(texName => new THREE.MeshLambertMaterial({ map: loadTex(texName) }));
        // Apply biome color tint to the top of standard grass
        if (b === 'grass_block') {
            materials[b][2].color.setHex(0x8db753); 
        }
    } else if (CROSS_BLOCKS.has(b) || b.includes('leaves') || b.includes('glass')) {
        let mat = new THREE.MeshLambertMaterial({ map: loadTex(b), transparent: true, alphaTest: 0.5 });
        if (CROSS_BLOCKS.has(b) || b.includes('door') || b.includes('trapdoor')) mat.side = THREE.DoubleSide;
        if (b.includes('leaves') && !b.includes('cherry') && !b.includes('azalea')) mat.color.setHex(0x7eb04d); // Biome tint
        materials[b] = mat;
    } else {
        materials[b] = new THREE.MeshLambertMaterial({ map: loadTex(b) });
    }
});

// Grass overlay material for the fringe 
const grassSideOverlay = loadTex('grass_block_side_overlay');
const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const fringeMat = new THREE.MeshLambertMaterial({ map: grassSideOverlay, color: 0x8db753, transparent: true, alphaTest: 0.5 });
materials['grass_block_overlay'] = [fringeMat, fringeMat, invisibleMat, invisibleMat, fringeMat, fringeMat];

const destroyTextures = [];
for (let i = 0; i < 10; i++) {
    destroyTextures.push(loadTex(`destroy_stage_${i}`)); 
}
const destroyGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const destroyMat = new THREE.MeshBasicMaterial({ map: destroyTextures[0], transparent: true, depthWrite: false, color: 0xA9A9A9, opacity: 0.8 });
const destroyMesh = new THREE.Mesh(destroyGeo, destroyMat);
destroyMesh.visible = false; 
scene.add(destroyMesh);

// ============================================================================
// UI & INVENTORY SYSTEM
// ============================================================================
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '20px';
crosshair.style.height = '20px';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.pointerEvents = 'none'; 
crosshair.style.zIndex = '100';
crosshair.innerHTML = '<div style="position:absolute;top:9px;left:0;width:20px;height:2px;background:rgba(255,255,255,0.8);"></div><div style="position:absolute;top:0;left:9px;width:2px;height:20px;background:rgba(255,255,255,0.8);"></div>';
document.body.appendChild(crosshair);

const INVENTORY_SIZE = ALL_BLOCKS.length + (9 - (ALL_BLOCKS.length % 9)) + 27; // Ensure padding
const inventory = Array(INVENTORY_SIZE).fill(null).map(() => ({ type: null, count: 0 }));

// Fill inventory with EVERY block!
ALL_BLOCKS.forEach((b, i) => {
    if (i < INVENTORY_SIZE) inventory[i] = { type: b, count: 64 };
});

let selectedSlot = 0;
let heldItem = { type: null, count: 0 }; 

function getItemImage(type) {
    if (!type) return 'none';
    let texName = type;
    if (CUSTOM_FACES[type]) texName = CUSTOM_FACES[type][0]; // Show side texture in UI
    if (type === 'grass_block') texName = 'grass_block_side';
    return `url(${TEX_PATH}${texName}.png)`;
}

const hotbarContainer = document.createElement('div');
hotbarContainer.id = 'hotbar';
hotbarContainer.style.position = 'absolute';
hotbarContainer.style.bottom = '20px';
hotbarContainer.style.left = '50%';
hotbarContainer.style.transform = 'translateX(-50%)';
hotbarContainer.style.display = 'flex';
hotbarContainer.style.gap = '4px';
hotbarContainer.style.padding = '6px';
hotbarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
hotbarContainer.style.border = '3px solid #444';
hotbarContainer.style.borderRadius = '4px';
document.body.appendChild(hotbarContainer);

const hotbarSlotsUI = [];
for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.style.width = '44px';
    slot.style.height = '44px';
    slot.style.border = '3px solid #888';
    slot.style.backgroundColor = 'rgba(200, 200, 200, 0.3)';
    slot.style.boxSizing = 'border-box';
    slot.style.position = 'relative';
    slot.style.cursor = 'pointer';
    
    const countLabel = document.createElement('span');
    countLabel.style.position = 'absolute';
    countLabel.style.bottom = '2px';
    countLabel.style.right = '4px';
    countLabel.style.color = 'white';
    countLabel.style.fontWeight = 'bold';
    countLabel.style.fontFamily = 'monospace';
    countLabel.style.fontSize = '14px';
    countLabel.style.textShadow = '1px 1px 0 #000';
    slot.appendChild(countLabel);
    
    slot.addEventListener('mousedown', () => {
        if (inventoryScreen.style.display === 'none') {
            selectedSlot = i;
            updateInventoryUI();
        }
    });

    hotbarContainer.appendChild(slot);
    hotbarSlotsUI.push({ div: slot, label: countLabel });
}

const inventoryScreen = document.createElement('div');
inventoryScreen.id = 'inventory-screen';
inventoryScreen.style.position = 'absolute';
inventoryScreen.style.top = '50%';
inventoryScreen.style.left = '50%';
inventoryScreen.style.transform = 'translate(-50%, -50%)';
inventoryScreen.style.backgroundColor = '#c6c6c6'; 
inventoryScreen.style.border = '4px solid #555';
inventoryScreen.style.padding = '20px';
inventoryScreen.style.display = 'none'; 
inventoryScreen.style.flexDirection = 'column';
inventoryScreen.style.gap = '15px';
inventoryScreen.style.boxShadow = 'inset -4px -4px 0 rgba(0,0,0,0.2), inset 4px 4px 0 rgba(255,255,255,0.5)';
inventoryScreen.style.zIndex = '200';
document.body.appendChild(inventoryScreen);

const invTitle = document.createElement('div');
invTitle.innerText = "Item Registry (All Blocks)";
invTitle.style.fontFamily = "monospace";
invTitle.style.fontWeight = "bold";
invTitle.style.color = "#333";
inventoryScreen.appendChild(invTitle);

// Scrollable wrapper for the massive inventory
const mainGridWrapper = document.createElement('div');
mainGridWrapper.id = 'inv-scroll';
mainGridWrapper.style.overflowY = 'auto';
mainGridWrapper.style.maxHeight = '400px'; 
mainGridWrapper.style.paddingRight = '5px';

const mainGrid = document.createElement('div');
mainGrid.style.display = 'grid';
mainGrid.style.gridTemplateColumns = 'repeat(9, 44px)';
mainGrid.style.gap = '4px';

mainGridWrapper.appendChild(mainGrid);
inventoryScreen.appendChild(mainGridWrapper);

const spacer = document.createElement('div');
spacer.style.height = '5px';
inventoryScreen.appendChild(spacer);

const invHotbarGrid = document.createElement('div');
invHotbarGrid.style.display = 'grid';
invHotbarGrid.style.gridTemplateColumns = 'repeat(9, 44px)';
invHotbarGrid.style.gap = '4px';
inventoryScreen.appendChild(invHotbarGrid);

const allSlotsUI = [];
const heldItemUI = document.createElement('div');
heldItemUI.style.position = 'absolute';
heldItemUI.style.width = '44px';
heldItemUI.style.height = '44px';
heldItemUI.style.pointerEvents = 'none';
heldItemUI.style.zIndex = '300';
heldItemUI.style.display = 'none';
const heldLabel = document.createElement('span');
heldLabel.style.position = 'absolute';
heldLabel.style.bottom = '2px';
heldLabel.style.right = '4px';
heldLabel.style.color = 'white';
heldLabel.style.fontWeight = 'bold';
heldLabel.style.fontFamily = 'monospace';
heldLabel.style.textShadow = '1px 1px 0 #000';
heldItemUI.appendChild(heldLabel);
document.body.appendChild(heldItemUI);

document.addEventListener('mousemove', (e) => {
    if (inventoryScreen.style.display === 'flex') {
        heldItemUI.style.left = e.clientX - 22 + 'px';
        heldItemUI.style.top = e.clientY - 22 + 'px';
    }
});

for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = document.createElement('div');
    slot.style.width = '44px';
    slot.style.height = '44px';
    slot.style.backgroundColor = '#8b8b8b';
    slot.style.boxShadow = 'inset -2px -2px 0 #fff, inset 2px 2px 0 #373737';
    slot.style.position = 'relative';
    slot.style.cursor = 'pointer';
    
    const countLabel = document.createElement('span');
    countLabel.style.position = 'absolute';
    countLabel.style.bottom = '2px';
    countLabel.style.right = '4px';
    countLabel.style.color = 'white';
    countLabel.style.fontWeight = 'bold';
    countLabel.style.fontFamily = 'monospace';
    countLabel.style.fontSize = '14px';
    countLabel.style.textShadow = '1px 1px 0 #000';
    slot.appendChild(countLabel);
    
    slot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (e.button === 0) { 
            let tempType = inventory[i].type;
            let tempCount = inventory[i].count;
            
            if (heldItem.type === inventory[i].type && heldItem.type !== null) {
                let space = 64 - inventory[i].count;
                let toMove = Math.min(space, heldItem.count);
                inventory[i].count += toMove;
                heldItem.count -= toMove;
                if (heldItem.count <= 0) heldItem.type = null;
            } else {
                inventory[i].type = heldItem.type;
                inventory[i].count = heldItem.count;
                heldItem.type = tempType;
                heldItem.count = tempCount;
            }
            updateInventoryUI();
        }
    });

    if (i < 9) {
        invHotbarGrid.appendChild(slot); 
    } else {
        mainGrid.appendChild(slot); 
    }
    allSlotsUI.push({ div: slot, label: countLabel });
}

function updateInventoryUI() {
    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const ui = hotbarSlotsUI[i];
        ui.div.style.backgroundImage = getItemImage(item.type);
        ui.div.style.backgroundSize = 'cover';
        ui.div.style.imageRendering = 'pixelated';
        ui.label.innerText = (item.count > 1) ? item.count : '';
        
        if (i === selectedSlot) {
            ui.div.style.border = '3px solid #fff';
            ui.div.style.transform = 'scale(1.15)';
            ui.div.style.zIndex = '10';
        } else {
            ui.div.style.border = '3px solid #888';
            ui.div.style.transform = 'scale(1)';
            ui.div.style.zIndex = '1';
        }
    }
    
    for (let i = 0; i < INVENTORY_SIZE; i++) {
        const item = inventory[i];
        const ui = allSlotsUI[i];
        ui.div.style.backgroundImage = getItemImage(item.type);
        ui.div.style.backgroundSize = 'cover';
        ui.div.style.imageRendering = 'pixelated';
        ui.label.innerText = (item.count > 1) ? item.count : '';
    }
    
    if (heldItem.type) {
        heldItemUI.style.display = 'block';
        heldItemUI.style.backgroundImage = getItemImage(heldItem.type);
        heldItemUI.style.backgroundSize = 'cover';
        heldItemUI.style.imageRendering = 'pixelated';
        heldLabel.innerText = (heldItem.count > 1) ? heldItem.count : '';
    } else {
        heldItemUI.style.display = 'none';
    }
}

function addItemToInventory(type, amount) {
    for (let i = 0; i < INVENTORY_SIZE; i++) {
        if (inventory[i].type === type && inventory[i].count < 64) {
            let space = 64 - inventory[i].count;
            let toAdd = Math.min(space, amount);
            inventory[i].count += toAdd;
            amount -= toAdd;
            if (amount <= 0) break;
        }
    }
    if (amount > 0) {
        for (let i = 0; i < INVENTORY_SIZE; i++) {
            if (inventory[i].type === null) {
                inventory[i].type = type;
                inventory[i].count = amount;
                amount = 0;
                break;
            }
        }
    }
    updateInventoryUI();
}

updateInventoryUI(); 

// ============================================================================
// WORLD GENERATION VARIABLES
// ============================================================================
const chunkSize = 16;
const renderDistance = 2; 
const worldHeight = 384;
const minworldY = -64;
const geometry = new THREE.BoxGeometry(1, 1, 1);

const crossGeo = new THREE.BufferGeometry();
const crossPositions = new Float32Array([
    -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5,  0.5, -0.5,
     0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    -0.5, -0.5,  0.5,   0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,  -0.5,  0.5,  0.5
]);
const crossUVs = new Float32Array([
    0,0,  1,0,  0,1,
    1,0,  1,1,  0,1,
    0,0,  1,0,  0,1,
    1,0,  1,1,  0,1
]);
crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPositions, 3));
crossGeo.setAttribute('uv', new THREE.BufferAttribute(crossUVs, 2));
crossGeo.computeVertexNormals();

const worldSeed = Math.random(); 
noise.seed(worldSeed);
const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

const activeChunks = {};
const chunkQueue = []; 
const interactableMeshes = [];
const chunksToRebuild = new Set(); 
const worldMods = {};

// Ultra-fast light array
const lightDX = new Int8Array(24);
const lightDZ = new Int8Array(24);
const lightDist = new Int8Array(24);
let lIdx = 0;
for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
        if (dx === 0 && dz === 0) continue;
        lightDX[lIdx] = dx;
        lightDZ[lIdx] = dz;
        lightDist[lIdx] = Math.abs(dx) + Math.abs(dz);
        lIdx++;
    }
}

// Memory Optimization: Dynamic allocation limits per block
function getMaxBlocks(key) {
    if (key === 'stone' || key === 'deepslate') return 25000;
    if (key === 'dirt' || key === 'sand') return 10000;
    if (key === 'grass_block' || key === 'snowy_grass_block') return 6000;
    if (key.includes('leaves') || key === 'water') return 6000;
    if (key.includes('log') || key.includes('ore')) return 1500;
    return 1000; // Creative registry items
}

function getGlobalBlock(gx, gy, gz) {
    if (gy < minworldY || gy >= minworldY + worldHeight) return null;
    let cx = Math.floor(gx / chunkSize);
    let cz = Math.floor(gz / chunkSize);
    let chunkId = cx + ',' + cz;
    let chunk = activeChunks[chunkId];
    if (!chunk) return null; 
    
    let lx = gx - (cx * chunkSize);
    let lz = gz - (cz * chunkSize);
    let ly = gy - minworldY;
    
    let idx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);
    return chunk.blocks[idx];
}

function setGlobalBlock(gx, gy, gz, type) {
    if (gy < minworldY || gy >= minworldY + worldHeight) return;
    
    let cx = Math.floor(gx / chunkSize);
    let cz = Math.floor(gz / chunkSize);
    let chunkId = cx + ',' + cz;
    
    let lx = gx - (cx * chunkSize);
    let lz = gz - (cz * chunkSize);
    let ly = gy - minworldY;
    let idx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);

    if (!worldMods[chunkId]) worldMods[chunkId] = new Map();
    worldMods[chunkId].set(idx, type);

    let chunk = activeChunks[chunkId];
    if (!chunk) return; 
    
    if (chunk.blocks[idx] !== type) {
        chunk.blocks[idx] = type;
    }
    
    chunksToRebuild.add(chunkId);
    if (lx === 0) chunksToRebuild.add((cx - 1) + ',' + cz);
    if (lx === chunkSize - 1) chunksToRebuild.add((cx + 1) + ',' + cz);
    if (lz === 0) chunksToRebuild.add(cx + ',' + (cz - 1));
    if (lz === chunkSize - 1) chunksToRebuild.add(cx + ',' + (cz + 1));
}

// Biome Logic
const BIOME_REGISTRY = [
    { name: "Forest", temp: 0.15, moist: 0.3, depth: 0.0, topBlock: 'grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.015, heightScale: 20, treeType: 'oak' },
    { name: "Plains", temp: 0.0, moist: -0.1, depth: 0.0, topBlock: 'grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.0001, heightScale: 8, treeType: 'oak' },
    { name: "Desert", temp: 0.35, moist: -0.35, depth: 0.0, topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 12, treeType: 'oak' },
    { name: "Snowy Tundra", temp: -0.35, moist: 0.1, depth: 0.0, topBlock: 'snowy_grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.002, heightScale: 15, treeType: 'spruce' },
    { name: "Mountains", temp: 0.3, moist: 0.3, depth: 0.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0.0, heightScale: 55, treeType: 'spruce' }
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
    const range = 8; const step = 4; let totalScale = 0; let samples = 0;
    for (let offX = -range; offX <= range; offX += step) {
        for (let offZ = -range; offZ <= range; offZ += step) {
            let temp = fbm2(x + offX + mapOffsetX, z + offZ + mapOffsetZ, 2, 400);
            let moist = fbm2(x + offX + mapOffsetX + 10000, z + offZ + mapOffsetZ + 10000, 2, 400);
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

function fbm2(x, z, octaves = 4, scale = 400) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin2((x / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude; amplitude *= 0.5; frequency *= 2.0;
    }
    return total / maxValue;
}

function fbm3(x, y, z, octaves = 2, scale = 40) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for(let i = 0; i < octaves; i++) {
        total += noise.perlin3((x / scale) * frequency, (y / scale) * frequency, (z / scale) * frequency) * amplitude;
        maxValue += amplitude; amplitude *= 0.5; frequency *= 2.0;
    }
    return total / maxValue;
}

function spawnTree(x, y, z, chunkMeshes, indices, treeType = 'oak') {
    const trunkH = treeType === 'spruce' 
        ? 6 + Math.floor(getDeterministicRandom(x, y, z) * 4) 
        : 4 + Math.floor(getDeterministicRandom(x, y, z) * 2);
        
    const treeMatrix = new THREE.Matrix4();
    const treeColor = new THREE.Color();
    const logType = `${treeType}_log`;
    const leavesType = `${treeType}_leaves`;
    
    for (let i = 0; i < trunkH; i++) {
        let actualY = y + i;
        let cCx = Math.floor(x / chunkSize);
        let cCz = Math.floor(z / chunkSize);
        let cId = cCx + ',' + cCz;
        let lx = x - (cCx * chunkSize);
        let lz = z - (cCz * chunkSize);
        let ly = actualY - minworldY;
        let bIdx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);
        
        if (worldMods[cId] && worldMods[cId].has(bIdx)) continue;
        
        treeMatrix.setPosition(x, actualY, z);
        let variation = getDeterministicRandom(x, actualY, z) * 0.05;
        treeColor.setRGB(0.95 - variation, 0.95 - variation, 0.95 - variation);
        if (chunkMeshes[logType]) {
            chunkMeshes[logType].setColorAt(indices[logType], treeColor);
            chunkMeshes[logType].setMatrixAt(indices[logType]++, treeMatrix);
        }
    }

    if (treeType === 'spruce') {
        let leafHeight = trunkH - (1 + Math.floor(getDeterministicRandom(x, y, z) * 2));
        let leafStart = y + trunkH - leafHeight;
        let topY = y + trunkH + 1;
        let currentRadius = 0; 
        
        for (let ly = topY; ly >= leafStart; ly--) {
            for (let lx = -currentRadius; lx <= currentRadius; lx++) {
                for (let lz = -currentRadius; lz <= currentRadius; lz++) {
                    if (Math.abs(lx) === currentRadius && Math.abs(lz) === currentRadius && currentRadius > 0) {
                        if (currentRadius === 2) continue; 
                        if (currentRadius === 1 && ly === topY - 1) continue; 
                    }
                    if (lx === 0 && lz === 0 && ly < y + trunkH) continue; 
                    
                    const bX = x + lx; const bY = ly; const bZ = z + lz;
                    let cCx = Math.floor(bX / chunkSize); let cCz = Math.floor(bZ / chunkSize);
                    let cId = cCx + ',' + cCz; let slx = bX - (cCx * chunkSize); let slz = bZ - (cCz * chunkSize); let sly = bY - minworldY;
                    let bIdx = slx + slz * chunkSize + sly * (chunkSize * chunkSize);
                    
                    if (worldMods[cId] && worldMods[cId].has(bIdx)) continue;
                    treeMatrix.setPosition(bX, bY, bZ);
                    let variation = getDeterministicRandom(bX, bY, bZ) * 0.05;
                    treeColor.setRGB(0.95 - variation, 0.95 - variation, 0.95 - variation);
                    if (chunkMeshes[leavesType]) {
                        chunkMeshes[leavesType].setColorAt(indices[leavesType], treeColor);
                        chunkMeshes[leavesType].setMatrixAt(indices[leavesType]++, treeMatrix);
                    }
                }
            }
            if (currentRadius === 0) currentRadius = 1; 
            else if (currentRadius === 1 && ly < topY - 1) currentRadius = 2; 
            else if (currentRadius === 2) currentRadius = 1; 
        }
    } else {
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
                    let cCx = Math.floor(bX / chunkSize); let cCz = Math.floor(bZ / chunkSize);
                    let cId = cCx + ',' + cCz; let slx = bX - (cCx * chunkSize); let slz = bZ - (cCz * chunkSize); let sly = bY - minworldY;
                    let bIdx = slx + slz * chunkSize + sly * (chunkSize * chunkSize);
                    
                    if (worldMods[cId] && worldMods[cId].has(bIdx)) continue;
                    treeMatrix.setPosition(bX, bY, bZ);
                    let variation = getDeterministicRandom(bX, bY, bZ) * 0.05;
                    treeColor.setRGB(0.95 - variation, 0.95 - variation, 0.95 - variation);
                    if (chunkMeshes[leavesType]) {
                        chunkMeshes[leavesType].setColorAt(indices[leavesType], treeColor);
                        chunkMeshes[leavesType].setMatrixAt(indices[leavesType]++, treeMatrix);
                    }
                }
            }
        }
    }
}

function generateChunk(chunkX, chunkZ) {
    const chunkId = chunkX + ',' + chunkZ;
    if (activeChunks[chunkId]) return;

    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    
    const meshes = {};
    const indices = {};
    for (const [key, mat] of Object.entries(materials)) {
        let maxBlocks = getMaxBlocks(key);
        let geo = CROSS_BLOCKS.has(key) ? crossGeo : geometry;
        meshes[key] = new THREE.InstancedMesh(geo, mat, maxBlocks);
        meshes[key].name = key;
        meshes[key].chunkId = chunkId;
        meshes[key].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        meshes[key].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxBlocks * 3), 3);
        indices[key] = 0;
    }

    // Upgraded array limits! Now supports 65k blocks instead of 255.
    const blocks = new Uint16Array(chunkSize * chunkSize * worldHeight);
    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);
    const treesToSpawn = [];

    // Terrain Gen
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            let blendedScale = getInterpolatedHeightScale(globalX, globalZ);
            let rawElevation = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 4, 300);
            let baseHeight = ((rawElevation + 1) / 2) * blendedScale + 62;

            let tempMap = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 2, 400);
            let moistMap = fbm2(globalX + mapOffsetX + 10000, globalZ + mapOffsetZ + 10000, 2, 400);
            let biomeJitterX = noise.perlin2(globalX / 8, globalZ / 8) * 0.08;
            let biomeJitterZ = noise.perlin2(globalX / 8 + 5000, globalZ / 8 + 5000) * 0.08;
            let localBiome = getBiome(tempMap + biomeJitterX, moistMap + biomeJitterZ, 0); 

            for (let y = 0; y < worldHeight; y++) {
                let actualY = y + minworldY;
                let blockIdx = getIdx(x, y, z);
                let cliffNoise = noise.perlin3(globalX / 50, actualY / 40, globalZ / 50) * 18;
                let density = (baseHeight - actualY) + cliffNoise;

                if (density > 0) {
                    if (actualY <= minworldY + 4 && getDeterministicRandom(globalX, actualY, globalZ) < ((minworldY + 5) - actualY) / 5) {
                        blocks[blockIdx] = TYPE.bedrock; continue;
                    }
                    if (actualY < baseHeight - 4) {
                        let isCave = (fbm3(globalX, actualY, globalZ, 2, 35)**2 + fbm3(globalX+1000, actualY+1000, globalZ+1000, 2, 35)**2) < 0.005;
                        if (isCave) continue;
                    }

                    let stoneType = actualY < 8 + (noise.perlin2(globalX / 16, globalZ / 16) * 4) ? 'deepslate' : 'stone';
                    let blockType = stoneType;

                    let actualYAbove = actualY + 1;
                    let densityAbove = (baseHeight - actualYAbove) + (noise.perlin3(globalX / 50, actualYAbove / 40, globalZ / 50) * 18);
                    
                    if (densityAbove <= 0) blockType = actualY > 100 ? 'snow' : localBiome.topBlock;
                    else if (densityAbove < 3) blockType = localBiome.subBlock;

                    blocks[blockIdx] = TYPE[blockType] || TYPE.stone;
                }
            } 
        }
    }

    // Top Layer Decorations
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;
            let tempMap = fbm2(globalX + mapOffsetX, globalZ + mapOffsetZ, 2, 400);
            let moistMap = fbm2(globalX + mapOffsetX + 10000, globalZ + mapOffsetZ + 10000, 2, 400);
            let biomeJitterX = noise.perlin2(globalX / 8, globalZ / 8) * 0.08;
            let biomeJitterZ = noise.perlin2(globalX / 8 + 5000, globalZ / 8 + 5000) * 0.08;
            let localBiome = getBiome(tempMap + biomeJitterX, moistMap + biomeJitterZ, 0); 
            
            let foundTop = false;
            for (let y = worldHeight - 1; y >= 0; y--) {
                let idx = getIdx(x, y, z);
                let b = blocks[idx];
                
                if (b === TYPE.dirt && y < worldHeight - 1 && blocks[getIdx(x, y + 1, z)] === 0) {
                    b = TYPE[localBiome.topBlock] || TYPE.grass_block;
                    blocks[idx] = b;
                }

                if (b !== 0 && !foundTop) { 
                    foundTop = true;
                    if ((b === TYPE.grass_block || b === TYPE.snowy_grass_block) && localBiome.treeChance > 0) {
                        let actualY = y + minworldY;
                        if (getDeterministicRandom(globalX, actualY, globalZ) < localBiome.treeChance) {
                            treesToSpawn.push({ x, y, z, actualY, treeType: localBiome.treeType });
                        }
                    }
                }
            }
        }
    }

    if (worldMods[chunkId]) {
        for (let [idx, type] of worldMods[chunkId].entries()) blocks[idx] = type;
    }

    rebuildChunkMeshes(chunkId, meshes, indices, blocks, treesToSpawn, startX, startZ, getIdx);
}

function rebuildChunkGeometry(chunkX, chunkZ) {
    const chunkId = chunkX + ',' + chunkZ;
    const chunkData = activeChunks[chunkId];
    if (!chunkData) return;

    const { meshes, blocks, treesToSpawn } = chunkData;
    const indices = {};
    for (const key in meshes) indices[key] = 0;
    
    rebuildChunkMeshes(chunkId, meshes, indices, blocks, treesToSpawn, chunkX * chunkSize, chunkZ * chunkSize, (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize));
}

function rebuildChunkMeshes(chunkId, meshes, indices, blocks, treesToSpawn, startX, startZ, getIdx) {
    const heightMap = new Int16Array(chunkSize * chunkSize);
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let hY = worldHeight - 1;
            while (hY >= 0) {
                let b = blocks[getIdx(x, hY, z)];
                if (b !== 0 && isTransparent[b] !== 1) break;
                hY--;
            }
            heightMap[x + z * chunkSize] = hY + minworldY;
        }
    }

    const paddedSize = chunkSize + 4;
    const expandedHeightMap = new Int16Array(paddedSize * paddedSize);
    for (let ex = -2; ex < chunkSize + 2; ex++) {
        for (let ez = -2; ez < chunkSize + 2; ez++) {
            let h = minworldY;
            if (ex >= 0 && ex < chunkSize && ez >= 0 && ez < chunkSize) {
                h = heightMap[ex + ez * chunkSize];
            } else {
                let chunkX = startX / chunkSize; let chunkZ = startZ / chunkSize;
                let nCx = chunkX; let nCz = chunkZ; let lnx = ex; let lnz = ez;
                if (ex < 0) { nCx--; lnx += chunkSize; } else if (ex >= chunkSize) { nCx++; lnx -= chunkSize; }
                if (ez < 0) { nCz--; lnz += chunkSize; } else if (ez >= chunkSize) { nCz++; lnz -= chunkSize; }
                
                let nId = nCx + "," + nCz;
                let nChunk = activeChunks[nId];
                if (nChunk && nChunk.heightMap) h = nChunk.heightMap[lnx + lnz * chunkSize];
                else h = heightMap[Math.max(0, Math.min(chunkSize - 1, ex)) + Math.max(0, Math.min(chunkSize - 1, ez)) * chunkSize];
            }
            expandedHeightMap[(ex + 2) + (ez + 2) * paddedSize] = h;
        }
    }

    const matrix = new THREE.Matrix4();
    const colorObj = new THREE.Color();
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;
                let actualY = y + minworldY;
                let globalX = startX + x;
                let globalZ = startZ + z;

                const isOpen = (nx, ny, nz) => {
                    if (ny < 0 || ny >= worldHeight) return true;
                    if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize) return isTransparent[blocks[nx + nz * chunkSize + ny * (chunkSize * chunkSize)]] === 1;
                    let b = getGlobalBlock(startX + nx, ny + minworldY, startZ + nz);
                    if (b === null) return false; 
                    return isTransparent[b] === 1;
                };

                let isVisible = isOpen(x-1, y, z) || isOpen(x+1, y, z) || isOpen(x, y-1, z) || isOpen(x, y+1, z) || isOpen(x, y, z-1) || isOpen(x, y, z+1);

                if (isVisible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (meshes[bName] && indices[bName] < meshes[bName].count !== undefined ? meshes[bName].instanceMatrix.count : 999999) {
                        let localHighest = expandedHeightMap[(x + 2) + (z + 2) * paddedSize];
                        let lightLevel = 1.0;

                        if (actualY < localHighest) {
                            let isCeiling = y + 1 < worldHeight && blocks[getIdx(x, y + 1, z)] !== 0 && isTransparent[blocks[getIdx(x, y + 1, z)]] !== 1;
                            let minLightDist = 999; 
                            for (let i = 0; i < 24; i++) {
                                let dist = lightDist[i];
                                let nHighest = expandedHeightMap[(x + lightDX[i] + 2) + (z + lightDZ[i] + 2) * paddedSize];
                                if (nHighest <= actualY) { if (dist < minLightDist) minLightDist = dist; }
                                else if (!isCeiling && nHighest <= actualY + 3) { let totalDist = dist + (nHighest - actualY); if (totalDist < minLightDist) minLightDist = totalDist; }
                            }
                            lightLevel = Math.max(0.05, 1.0 - (minLightDist * 0.20));
                        } else {
                            lightLevel = Math.max(0.2, 1.0 - (getDeterministicRandom(globalX, actualY, globalZ) * 0.04));
                        }
                        
                        colorObj.setRGB(lightLevel, lightLevel, lightLevel);
                        matrix.setPosition(globalX, actualY, globalZ);
                        
                        try {
                            meshes[bName].setMatrixAt(indices[bName], matrix);
                            meshes[bName].setColorAt(indices[bName], colorObj);
                            indices[bName]++;
                            if (bName === 'grass_block' && meshes['grass_block_overlay']) {
                                meshes['grass_block_overlay'].setMatrixAt(indices['grass_block_overlay'], matrix);
                                meshes['grass_block_overlay'].setColorAt(indices['grass_block_overlay'], colorObj);
                                indices['grass_block_overlay']++;
                            }
                        } catch (e) { /* Max block instance limit hit */ }
                    }
                }
            }
        }
    }

    for (let t of treesToSpawn) spawnTree(startX + t.x, t.actualY + 1, startZ + t.z, meshes, indices, t.treeType);

    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        if (meshes[key].instanceColor) meshes[key].instanceColor.needsUpdate = true;
        if (!scene.children.includes(meshes[key])) {
            scene.add(meshes[key]);
            if (key !== 'grass_block_overlay') interactableMeshes.push(meshes[key]);
        }
    }
    
    if (!activeChunks[chunkId]) activeChunks[chunkId] = { meshes, blocks, treesToSpawn, heightMap };
    else activeChunks[chunkId].heightMap = heightMap;
}

let lastPlayerChunkX = -999; let lastPlayerChunkZ = -999;
function updateChunks() {
    const pX = Math.floor(camera.position.x / chunkSize);
    const pZ = Math.floor(camera.position.z / chunkSize);
    if (pX === lastPlayerChunkX && pZ === lastPlayerChunkZ) return;
    lastPlayerChunkX = pX; lastPlayerChunkZ = pZ;

    const chunksToKeep = new Set();
    for (let x = pX - renderDistance; x <= pX + renderDistance; x++) {
        for (let z = pZ - renderDistance; z <= pZ + renderDistance; z++) {
            const id = x + ',' + z;
            chunksToKeep.add(id);
            if (!activeChunks[id] && !chunkQueue.includes(id)) chunkQueue.push(id);
        }
    }

    for (const id in activeChunks) {
        if (!chunksToKeep.has(id)) {
            for (const mesh of Object.values(activeChunks[id].meshes)) {
                scene.remove(mesh);
                const i = interactableMeshes.indexOf(mesh);
                if (i > -1) interactableMeshes.splice(i, 1);
            }
            delete activeChunks[id];
        }
    }
}

// ============================================================================
// CONTROLS & LOOP
// ============================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65); scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffee, 1.0); sunLight.position.set(50, 150, 50); scene.add(sunLight);

camera.position.set(0, 80, 0);

const handGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2); handGeo.translate(0, 0.4, 0); 
const playerHand = new THREE.Mesh(handGeo, new THREE.MeshLambertMaterial({ color: 0xd2a77d }));
playerHand.position.set(0.4, -0.4, -0.1);
playerHand.rotation.set(-Math.PI / 3, -Math.PI / 16, 0); 
camera.add(playerHand); scene.add(camera);

let yaw = 0, pitch = 0, keys = {};
let isLeftMouseDown = false; 

const raycaster = new THREE.Raycaster(); raycaster.far = 6;
let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#inventory-screen') || e.target.closest('#hotbar')) return; 
    if (!document.pointerLockElement && inventoryScreen.style.display === 'none') {
        renderer.domElement.requestPointerLock();
    } else if (document.pointerLockElement) {
        if (e.button === 0) {
            isLeftMouseDown = true; 
        } else if (e.button === 2) { 
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const hit = raycaster.intersectObjects(interactableMeshes)[0];
            if (!hit) return;
            const mat = new THREE.Matrix4(); hit.object.getMatrixAt(hit.instanceId, mat);
            const p = new THREE.Vector3().setFromMatrixPosition(mat);
            const placeX = Math.round(p.x + hit.face.normal.x);
            const placeY = Math.round(p.y + hit.face.normal.y);
            const placeZ = Math.round(p.z + hit.face.normal.z);
            if (getGlobalBlock(placeX, placeY, placeZ) === 0) {
                const selectedItem = inventory[selectedSlot];
                if (selectedItem.type && TYPE[selectedItem.type]) {
                    setGlobalBlock(placeX, placeY, placeZ, TYPE[selectedItem.type]);
                    selectedItem.count--;
                    if (selectedItem.count <= 0) { selectedItem.type = null; selectedItem.count = 0; }
                    updateInventoryUI();
                }
            }
        }
    }
});

document.addEventListener('mouseup', (e) => { if (e.button === 0) { isLeftMouseDown = false; mining.active = false; destroyMesh.visible = false; }});
document.addEventListener('mousemove', (e) => { if (document.pointerLockElement) { yaw -= e.movementX * 0.002; pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002)); }});

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e') {
        if (inventoryScreen.style.display === 'none') {
            inventoryScreen.style.display = 'flex';
            crosshair.style.display = 'none';
            document.exitPointerLock();
            keys = {}; 
        } else {
            inventoryScreen.style.display = 'none';
            crosshair.style.display = 'block';
            if (heldItem.type) { addItemToInventory(heldItem.type, heldItem.count); heldItem = { type: null, count: 0 }; updateInventoryUI(); }
            renderer.domElement.requestPointerLock();
        }
    }
    if (e.key >= '1' && e.key <= '9' && inventoryScreen.style.display === 'none') {
        selectedSlot = parseInt(e.key) - 1; updateInventoryUI();
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let lastScrollTime = 0; 
window.addEventListener('wheel', (e) => {
    if (document.pointerLockElement && inventoryScreen.style.display === 'none') {
        const now = Date.now(); if (now - lastScrollTime < 50) return; lastScrollTime = now;
        selectedSlot = e.deltaY > 0 ? (selectedSlot + 1) % 9 : (selectedSlot - 1 + 9) % 9;
        updateInventoryUI();
    }
});

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); 
    updateChunks();

    if (chunksToRebuild.size > 0) {
        let chunkId = chunksToRebuild.values().next().value;
        let parts = chunkId.split(',');
        rebuildChunkGeometry(parseInt(parts[0]), parseInt(parts[1]));
        chunksToRebuild.delete(chunkId);
    } else if (chunkQueue.length > 0) {
        const next = chunkQueue.shift();
        let parts = next.split(',');
        generateChunk(parseInt(parts[0]), parseInt(parts[1]));
    }

    if (isLeftMouseDown && !mining.active && document.pointerLockElement && inventoryScreen.style.display === 'none') {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hit = raycaster.intersectObjects(interactableMeshes)[0];
        if (hit) {
            mining = { active: true, startTime: Date.now(), targetMesh: hit.object, targetId: hit.instanceId, requiredTime: 300 };
            destroyMesh.visible = true;
        }
    }

    if (mining.active) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hit = raycaster.intersectObjects(interactableMeshes)[0];
        if (!hit || hit.object !== mining.targetMesh || hit.instanceId !== mining.targetId) {
            mining.active = false; destroyMesh.visible = false;
        } else {
            const elapsed = Date.now() - mining.startTime;
            const phase = Math.floor(Math.min(elapsed / mining.requiredTime, 1.0) * 9.99); 
            if (destroyMat.map !== destroyTextures[phase]) { destroyMat.map = destroyTextures[phase]; destroyMat.needsUpdate = true; }
            
            const mat = new THREE.Matrix4(); hit.object.getMatrixAt(hit.instanceId, mat);
            destroyMesh.position.setFromMatrixPosition(mat);

            if (elapsed >= mining.requiredTime) {
                setGlobalBlock(Math.round(destroyMesh.position.x), Math.round(destroyMesh.position.y), Math.round(destroyMesh.position.z), 0);
                mining.active = false; destroyMesh.visible = false;
            }
        }
    }

    if (mining.active) {
        const t = Date.now() * 0.025; 
        playerHand.rotation.x = (-Math.PI / 3) + Math.sin(t) * 0.25;
        playerHand.position.z = -0.2 + Math.cos(t) * 0.15;
    } else {
        playerHand.rotation.x = THREE.MathUtils.lerp(playerHand.rotation.x, -Math.PI / 3, 0.2);
        playerHand.position.z = THREE.MathUtils.lerp(playerHand.position.z, -0.1, 0.2);
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