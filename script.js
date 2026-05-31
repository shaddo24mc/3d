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
// 3D INVENTORY ICON GENERATOR (AUTHENTIC MINECRAFT PIPELINE)
// ----------------------------------------------------
const iconRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
iconRenderer.setSize(64, 64);
const iconScene = new THREE.Scene();

// Authentic GUI orthographic camera looking straight down the Z axis
// Zoomed in from 0.8 to 0.55 so the 3D blocks fill the inventory slots beautifully
const iconCamera = new THREE.OrthographicCamera(-0.55, 0.55, 0.55, -0.55, 0.1, 10);
iconCamera.position.set(0, 0, 5); 
iconCamera.lookAt(0, 0, 0);

// Authentic inventory lighting (two directional lights simulating the GUI)
iconScene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(1, 1, 2);
iconScene.add(dirLight);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-1, -1, 2);
iconScene.add(dirLight2);

const iconCache = {};

async function getBlockIcon(type) {
    if (!type) return 'none';
    if (iconCache[type]) return iconCache[type];
    
    // Items, tools, and cross blocks use flat 2D textures
    const isItem = type.includes('pickaxe') || type === 'coal' || type.includes('raw') || type === 'diamond' || type === 'emerald' || type === 'lapis_lazuli' || type === 'redstone' || type === 'snowball' || type === 'search_icon' || (type.includes('door') && !type.includes('trapdoor')) || type === 'kelp';
    
    if (isItem || (CROSS_BLOCKS && CROSS_BLOCKS.has(type))) {
        let filename = type;
        if (type === 'diamond_pickaxe') filename = 'diamond_pickaxe';
        if (type === 'redstone') filename = 'redstone_dust';
        if (type === 'lapis_lazuli') filename = 'lapis_lazuli';
        if (type === 'search_icon') {
            const svgUrl = `url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>)`;
            iconCache[type] = svgUrl;
            return svgUrl;
        }
        
        const folder = isItem ? ITEM_TEX_DIR : BLOCK_TEX_DIR;
        const url = `url(${folder}${filename}.png)`;
        iconCache[type] = url;
        return url;
    }

    // Ensure the 3D JSON geometry and materials are fully loaded
    if (!customGeometries[type]) {
        await loadCustomModel(type);
    }
    
    const geo = customGeometries[type];
    const mat = materials[type];
    if (!geo || !mat) return 'none';
    
    const mesh = new THREE.Mesh(geo, mat);
    iconScene.add(mesh);
    
    // Reset mesh transforms
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);

    // Grab the exact display settings parsed from the JSON model files!
    let guiConfig = { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] };
    if (geo.userData && geo.userData.display && geo.userData.display.gui) {
        guiConfig = geo.userData.display.gui;
    }

    // Apply authentic Minecraft transformations
    // We subtract 180 degrees from the Y axis to correct the coordinate system difference
    // between Three.js (Right-Handed) and Minecraft (Left-Handed), showing the correct faces!
    if (guiConfig.rotation) {
        mesh.rotation.set(
            THREE.MathUtils.degToRad(guiConfig.rotation[0]),
            THREE.MathUtils.degToRad(guiConfig.rotation[1] - 180),
            THREE.MathUtils.degToRad(guiConfig.rotation[2]),
            'XYZ'
        );
    }
    if (guiConfig.scale) {
        mesh.scale.set(guiConfig.scale[0], guiConfig.scale[1], guiConfig.scale[2]);
    }
    if (guiConfig.translation) {
        mesh.position.set(
            guiConfig.translation[0] / 16,
            guiConfig.translation[1] / 16,
            guiConfig.translation[2] / 16
        );
    }
    
    // Render and snapshot
    iconRenderer.render(iconScene, iconCamera);
    const dataUrl = iconRenderer.domElement.toDataURL('image/png');
    iconScene.remove(mesh);
    
    const url = `url(${dataUrl})`;
    iconCache[type] = url;
    return url;
}

// Safely apply icons without race conditions during fast scrolling/typing
function applyIcon(element, type) {
    element.dataset.iconType = type || 'none';
    if (!type) {
        element.style.backgroundImage = 'none';
        return;
    }
    getBlockIcon(type).then(url => {
        if (element.dataset.iconType === type) {
            element.style.backgroundImage = url;
        }
    });
}

// ----------------------------------------------------
// Base Configuration & Directories
// ----------------------------------------------------
const BLOCK_TEX_DIR = 'assets/minecraft/textures/block/';
const ITEM_TEX_DIR = 'assets/minecraft/textures/item/';
const GUI_TEX_DIR = 'assets/minecraft/textures/gui/container/creative_inventory/';

// ----------------------------------------------------
// JSON BLOCKSTATE & MODEL READER ENGINE
// ----------------------------------------------------
const JSONReader = {
    blockstates: {},
    models: {},
    
    async fetchJSON(path) {
        try {
            const res = await fetch(path);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getBlockstate(blockName) {
        if (this.blockstates[blockName]) return this.blockstates[blockName];
        const path = `${BLOCK_TEX_DIR.replace('textures/block/', 'blockstates/')}${blockName}.json`;
        const data = await this.fetchJSON(path);
        if (data) this.blockstates[blockName] = data;
        return data;
    },

    async getModel(modelName) {
        if (this.models[modelName]) return this.models[modelName];
        const path = `${BLOCK_TEX_DIR.replace('textures/block/', 'models/block/')}${modelName}.json`;
        const data = await this.fetchJSON(path);
        if (data) this.models[modelName] = data;
        return data;
    },
    
    getRotationForAxis(axis) {
        if (axis === 'x') return [0, 0, Math.PI / 2];
        if (axis === 'z') return [Math.PI / 2, 0, 0];
        return [0, 0, 0]; 
    }
};

// ----------------------------------------------------
// MASSIVE BLOCK REGISTRY DATABASE
// ----------------------------------------------------
const baseBlocks = [
    'air', 'stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite',
    'grass_block', 'dirt', 'coarse_dirt', 'podzol', 'rooted_dirt', 'mud', 'cobblestone', 'bedrock', 'sand', 'red_sand',
    'gravel', 'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore', 'copper_ore', 'deepslate_copper_ore',
    'gold_ore', 'deepslate_gold_ore', 'redstone_ore', 'deepslate_redstone_ore', 'emerald_ore', 'deepslate_emerald_ore',
    'lapis_ore', 'deepslate_lapis_ore', 'diamond_ore', 'deepslate_diamond_ore', 'nether_gold_ore', 'nether_quartz_ore',
    'ancient_debris', 'coal_block', 'raw_iron_block', 'raw_copper_block', 'raw_gold_block', 'iron_block', 'copper_block',
    'gold_block', 'diamond_block', 'netherite_block', 'sponge', 'wet_sponge', 'glass', 'lapis_block', 'sandstone',
    'chiseled_sandstone', 'cut_sandstone', 'cobweb', 'grass', 'fern', 'dead_bush', 'seagrass', 'sea_pickle', 'dandelion',
    'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy',
    'cornflower', 'lily_of_the_valley', 'wither_rose', 'brown_mushroom', 'red_mushroom', 'bricks', 'bookshelf',
    'mossy_cobblestone', 'obsidian', 'torch', 'end_rod', 'chorus_plant', 'chorus_flower', 'purpur_block', 'purpur_pillar',
    'spawner', 'chest', 'crafting_table', 'farmland', 'furnace', 'ladder', 'snow', 'ice', 'snow_block', 'cactus', 'clay',
    'jukebox', 'pumpkin', 'netherrack', 'soul_sand', 'soul_soil', 'basalt', 'polished_basalt', 'soul_torch', 'glowstone',
    'jack_o_lantern', 'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks', 'infested_stone',
    'melon', 'mycelium', 'lily_pad', 'nether_bricks', 'end_stone', 'end_stone_bricks', 'dragon_egg', 'emerald_block',
    'beacon', 'redstone_block', 'quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'slime_block', 'prismarine',
    'prismarine_bricks', 'dark_prismarine', 'sea_lantern', 'hay_block', 'terracotta', 'packed_ice', 'sunflower', 'lilac',
    'rose_bush', 'peony', 'tall_grass', 'large_fern', 'magma_block', 'nether_wart_block', 'red_nether_bricks', 'bone_block',
    'kelp', 'dried_kelp_block', 'turtle_egg', 'dead_cube_coral_block', 'dead_brain_coral_block', 'dead_bubble_coral_block',
    'dead_fire_coral_block', 'dead_horn_coral_block', 'tube_coral_block', 'brain_coral_block', 'bubble_coral_block',
    'fire_coral_block', 'horn_coral_block', 'blue_ice', 'conduit', 'bamboo', 'redstone_lamp', 'campfire', 'soul_campfire',
    'sweet_berry_bush', 'warped_wart_block', 'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines',
    'twisting_vines', 'crimson_fungus', 'warped_fungus', 'shroomlight', 'target', 'crying_obsidian', 'respawn_anchor',
    'blackstone', 'gilded_blackstone', 'polished_blackstone', 'chiseled_polished_blackstone', 'polished_blackstone_bricks',
    'cracked_polished_blackstone_bricks', 'amethyst_block', 'budding_amethyst', 'amethyst_cluster', 'tuff', 'calcite',
    'tinted_glass', 'powder_snow', 'sculk', 'sculk_vein', 'sculk_catalyst', 'sculk_shrieker', 'sculk_sensor',
    'calibrated_sculk_sensor', 'dripstone_block', 'pointed_dripstone', 'moss_block', 'moss_carpet', 'azalea',
    'flowering_azalea', 'hanging_roots', 'spore_blossom', 'glow_lichen', 'packed_mud', 'mud_bricks', 'mangrove_roots',
    'muddy_mangrove_roots', 'ochre_froglight', 'verdant_froglight', 'pearlescent_froglight', 'suspicious_sand',
    'suspicious_gravel', 'pink_petals', 'chiseled_bookshelf', 'decorated_pot', 'crafter', 'tuff_bricks', 'chiseled_tuff',
    'polished_tuff', 'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb',
    'trial_spawner', 'vault', 'heavy_core', 'snowy_grass_block', 'cobbled_deepslate'
];

const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'crimson', 'warped', 'bamboo'];
const STONE_TYPES = ['stone', 'cobblestone', 'mossy_cobblestone', 'stone_brick', 'mossy_stone_brick', 'granite', 'diorite', 'andesite', 'sandstone', 'red_sandstone', 'brick', 'prismarine', 'dark_prismarine', 'nether_brick', 'end_stone_brick', 'blackstone', 'polished_blackstone', 'deepslate_brick', 'deepslate_tile', 'tuff', 'polished_tuff', 'mud_brick'];

const generatedBlocks = [...baseBlocks];

COLORS.forEach(c => {
    generatedBlocks.push(
        `${c}_wool`, `${c}_stained_glass`, `${c}_terracotta`, `${c}_concrete`, 
        `${c}_concrete_powder`, `${c}_glazed_terracotta`, `${c}_carpet`, 
        `${c}_stained_glass_pane`, `${c}_shulker_box`, `${c}_candle`
    );
});

WOODS.forEach(w => {
    let log = w === 'crimson' || w === 'warped' ? `${w}_stem` : w === 'bamboo' ? `${w}_block` : `${w}_log`;
    let wood = w === 'crimson' || w === 'warped' ? `${w}_hyphae` : `${w}_wood`;
    let planks = `${w}_planks`;
    let leaves = w === 'crimson' || w === 'warped' ? `${w}_wart_block` : w === 'bamboo' ? null : `${w}_leaves`;
    let sapling = w === 'crimson' || w === 'warped' ? `${w}_fungus` : w === 'mangrove' ? `mangrove_propagule` : w === 'bamboo' ? `bamboo_shoot` : `${w}_sapling`;
    
    generatedBlocks.push(log, wood, planks);
    if (leaves && !generatedBlocks.includes(leaves)) generatedBlocks.push(leaves);
    if (sapling && !generatedBlocks.includes(sapling)) generatedBlocks.push(sapling);
    
    generatedBlocks.push(
        `${w}_slab`, `${w}_stairs`, `${w}_fence`, `${w}_door`, `${w}_trapdoor`
    );
});

STONE_TYPES.forEach(st => {
    generatedBlocks.push(`${st}_slab`, `${st}_stairs`, `${st}_wall`);
});

const allBaseBlocks = [...new Set(generatedBlocks)];
const extendedBlocks = [];
// Automatically register virtual inner/outer variants for all stairs
allBaseBlocks.forEach(b => {
    extendedBlocks.push(b);
    if (b.includes('stairs')) {
        extendedBlocks.push(`${b}_inner`);
        extendedBlocks.push(`${b}_outer`);
    }
});

const ALL_BLOCKS = [...new Set(extendedBlocks)];

const TYPE = {};
const REVERSE_TYPE = [null];
ALL_BLOCKS.forEach((b, i) => {
    let id = i + 1;
    TYPE[b] = id;
    REVERSE_TYPE.push(b);
});

const CROSS_BLOCKS = new Set([
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 
    'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose', 'brown_mushroom', 'red_mushroom', 'fern', 'dead_bush', 
    'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines', 'twisting_vines', 'sweet_berry_bush', 'cobweb', 
    'tall_grass', 'large_fern', 'grass'
]);
ALL_BLOCKS.forEach(b => { if (b.includes('sapling') || b.includes('propagule') || b.includes('shoot') || b.includes('fungus')) CROSS_BLOCKS.add(b); });

const TRANSPARENT_BLOCKS = new Set(['glass', 'ice', 'slime_block', 'beacon', 'sculk_shrieker', 'sculk_sensor']);
const isTransparent = new Uint8Array(65535);
isTransparent[0] = 1; // Air is transparent
ALL_BLOCKS.forEach((b) => {
    if (CROSS_BLOCKS.has(b) || TRANSPARENT_BLOCKS.has(b) || b.includes('leaves') || b.includes('glass') || b.includes('door') || b.includes('trapdoor') || b.includes('fence')) {
        isTransparent[TYPE[b]] = 1;
    }
});

// ----------------------------------------------------
// UI: Crosshair, Hotbar, & Full Inventory
// ----------------------------------------------------
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

const INVENTORY_SIZE = 9; // Only Hotbar needed for underlying array in Creative
const inventory = Array(INVENTORY_SIZE).fill(null).map(() => ({ type: null, count: 0 }));

// Initial Hotbar loadout
inventory[0] = { type: 'stone', count: 64 };
inventory[1] = { type: 'dirt', count: 64 };
inventory[2] = { type: 'grass_block', count: 64 };
inventory[3] = { type: 'sculk_shrieker', count: 64 };
inventory[4] = { type: 'sculk_sensor', count: 64 };
inventory[5] = { type: 'acacia_stairs', count: 64 };
inventory[6] = { type: 'magma_block', count: 64 };
inventory[7] = { type: 'cobblestone', count: 64 };
inventory[8] = { type: 'diamond_pickaxe', count: 1 };

let selectedSlot = 0;
let heldItem = { type: null, count: 0 };

// ----------------------------------------------------
// HOTBAR UI
// ----------------------------------------------------
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
hotbarContainer.style.zIndex = '50';
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
        if (creativeInventoryScreen.style.display === 'none') {
            selectedSlot = i;
            updateInventoryUI();
        }
    });

    hotbarContainer.appendChild(slot);
    hotbarSlotsUI.push({ div: slot, label: countLabel });
}

// ----------------------------------------------------
// CREATIVE INVENTORY UI
// ----------------------------------------------------
// Categorization Logic
const CATEGORIES = {
    building: { name: 'Building Blocks', icon: 'bricks', blocks: [] },
    colored: { name: 'Colored Blocks', icon: 'cyan_wool', blocks: [] },
    natural: { name: 'Natural Blocks', icon: 'grass_block', blocks: [] },
    functional: { name: 'Functional Blocks', icon: 'crafting_table', blocks: [] },
    redstone: { name: 'Redstone Blocks', icon: 'redstone', blocks: [] },
    tools: { name: 'Tools & Utilities', icon: 'diamond_pickaxe', blocks: [] },
    search: { name: 'Search Items', icon: 'search_icon', blocks: [] }
};

ALL_BLOCKS.forEach(b => {
    if (b.includes('_inner') || b.includes('_outer')) return; // Hide virtual stairs
    if (b === 'air') return;

    if (b.includes('wool') || b.includes('concrete') || b.includes('terracotta') || b.includes('stained_glass')) {
        CATEGORIES.colored.blocks.push(b);
    } else if (b.includes('pickaxe') || b.includes('axe') || b.includes('sword') || b.includes('shovel')) {
        CATEGORIES.tools.blocks.push(b);
    } else if (b.includes('redstone') || b.includes('piston') || b.includes('door') || b.includes('trapdoor') || b.includes('sensor') || b.includes('lamp')) {
        CATEGORIES.redstone.blocks.push(b);
    } else if (['chest', 'crafting_table', 'furnace', 'spawner', 'beacon', 'anvil', 'loom', 'shulker_box'].some(kw => b.includes(kw))) {
        CATEGORIES.functional.blocks.push(b);
    } else if (['dirt', 'grass', 'sand', 'gravel', 'ore', 'log', 'leaves', 'sapling', 'coral', 'plant', 'flower', 'mushroom', 'sponge', 'bedrock', 'stone', 'granite', 'diorite', 'andesite', 'tuff', 'deepslate', 'ice', 'snow'].some(kw => b.includes(kw)) && !b.includes('bricks') && !b.includes('stairs') && !b.includes('slab')) {
        CATEGORIES.natural.blocks.push(b);
    } else {
        CATEGORIES.building.blocks.push(b);
    }
});

let currentCategory = 'building';

const creativeInventoryScreen = document.createElement('div');
creativeInventoryScreen.id = 'creative-inventory-screen';
creativeInventoryScreen.style.position = 'absolute';
creativeInventoryScreen.style.top = '50%';
creativeInventoryScreen.style.left = '50%';
creativeInventoryScreen.style.transform = 'translate(-50%, -50%)';
creativeInventoryScreen.style.display = 'none';
creativeInventoryScreen.style.flexDirection = 'column';
creativeInventoryScreen.style.zIndex = '200';
creativeInventoryScreen.style.width = '390px';
creativeInventoryScreen.style.userSelect = 'none';
document.body.appendChild(creativeInventoryScreen);

// Top Tabs
const topTabsRow = document.createElement('div');
topTabsRow.style.display = 'flex';
topTabsRow.style.paddingLeft = '0px';
topTabsRow.style.gap = '2px';
topTabsRow.style.position = 'relative';
topTabsRow.style.top = '4px';
topTabsRow.style.zIndex = '1';
creativeInventoryScreen.appendChild(topTabsRow);

// Main Body
const invBody = document.createElement('div');
invBody.style.width = '390px';
invBody.style.height = '272px';
invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_items.png)`;
invBody.style.backgroundSize = '512px 512px';
invBody.style.backgroundPosition = 'top left';
invBody.style.imageRendering = 'pixelated';
invBody.style.position = 'relative';
invBody.style.zIndex = '10';
creativeInventoryScreen.appendChild(invBody);

// Search Bar Row (Hidden by default)
const searchRow = document.createElement('div');
searchRow.style.display = 'none';
searchRow.style.position = 'absolute';
searchRow.style.left = '164px';
searchRow.style.top = '12px';
searchRow.style.width = '178px';
searchRow.style.height = '24px';
const searchInput = document.createElement('input');
searchInput.id = 'creative-search';
searchInput.type = 'text';
searchInput.style.width = '100%';
searchInput.style.height = '100%';
searchInput.style.padding = '0 6px';
searchInput.style.backgroundColor = 'transparent';
searchInput.style.color = '#fff';
searchInput.style.border = 'none';
searchInput.style.fontFamily = 'monospace';
searchInput.style.fontSize = '14px';
searchInput.style.outline = 'none';
searchRow.appendChild(searchInput);
invBody.appendChild(searchRow);

searchInput.addEventListener('keydown', (e) => e.stopPropagation()); // Prevent player movement while typing
searchInput.addEventListener('input', () => populateCreativeGrid());

// Title
const creativeTitle = document.createElement('div');
creativeTitle.innerText = "Building Blocks";
creativeTitle.style.fontFamily = "monospace";
creativeTitle.style.fontSize = "16px";
creativeTitle.style.color = "#3f3f3f";
creativeTitle.style.position = 'absolute';
creativeTitle.style.left = '16px';
creativeTitle.style.top = '12px';
invBody.appendChild(creativeTitle);

// Item Grid
const creativeGridContainer = document.createElement('div');
creativeGridContainer.id = 'creative-grid-container';
creativeGridContainer.style.position = 'absolute';
creativeGridContainer.style.left = '18px';
creativeGridContainer.style.top = '36px';
creativeGridContainer.style.width = '360px'; 
creativeGridContainer.style.height = '180px';
creativeGridContainer.style.overflowY = 'scroll';
creativeGridContainer.style.backgroundColor = 'transparent';
creativeGridContainer.style.padding = '0';

const creativeGrid = document.createElement('div');
creativeGrid.style.display = 'grid';
creativeGrid.style.gridTemplateColumns = 'repeat(9, 36px)';
creativeGrid.style.gridAutoRows = '36px';
creativeGrid.style.gap = '0px';
creativeGridContainer.appendChild(creativeGrid);
invBody.appendChild(creativeGridContainer);

// Hotbar Area inside Creative
const creativeHotbarGrid = document.createElement('div');
creativeHotbarGrid.style.position = 'absolute';
creativeHotbarGrid.style.left = '18px';
creativeHotbarGrid.style.top = '224px';
creativeHotbarGrid.style.width = '324px';
creativeHotbarGrid.style.height = '36px';
creativeHotbarGrid.style.display = 'grid';
creativeHotbarGrid.style.gridTemplateColumns = 'repeat(9, 36px)';
creativeHotbarGrid.style.gap = '0px';
invBody.appendChild(creativeHotbarGrid);

// Bottom Tabs (for parity, though we map all our categories to the top for simplicity here)
const bottomTabsRow = document.createElement('div');
bottomTabsRow.style.display = 'flex';
bottomTabsRow.style.paddingLeft = '0px';
bottomTabsRow.style.gap = '2px';
bottomTabsRow.style.position = 'relative';
bottomTabsRow.style.top = '-4px';
creativeInventoryScreen.appendChild(bottomTabsRow);

// Held Item UI
const heldItemUI = document.createElement('div');
heldItemUI.style.position = 'absolute';
heldItemUI.style.width = '36px';
heldItemUI.style.height = '36px';
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
heldLabel.style.fontSize = '12px';
heldLabel.style.textShadow = '1px 1px 0 #000';
heldItemUI.appendChild(heldLabel);
document.body.appendChild(heldItemUI);

document.addEventListener('mousemove', (e) => {
    if (creativeInventoryScreen.style.display === 'flex') {
        heldItemUI.style.left = e.clientX - 18 + 'px';
        heldItemUI.style.top = e.clientY - 18 + 'px';
    }
});

// Create Tabs Function
const allTabsUI = [];
function createTab(catKey, isTop) {
    const cat = CATEGORIES[catKey];
    const tab = document.createElement('div');
    tab.style.width = '56px';
    tab.style.height = '56px';
    tab.style.backgroundColor = '#8b8b8b';
    tab.style.border = '4px solid #555';
    if (isTop) {
        tab.style.borderBottom = 'none';
        tab.style.borderRadius = '8px 8px 0 0';
    } else {
        tab.style.borderTop = 'none';
        tab.style.borderRadius = '0 0 8px 8px';
    }
    tab.style.cursor = 'pointer';
    tab.style.position = 'relative';
    tab.style.display = 'flex';
    tab.style.alignItems = 'center';
    tab.style.justifyContent = 'center';
    tab.style.marginBottom = isTop ? '-4px' : '0';
    tab.style.marginTop = isTop ? '0' : '-4px';
    tab.style.zIndex = '1';
    
    const icon = document.createElement('div');
    icon.style.width = '32px';
    icon.style.height = '32px';
    applyIcon(icon, cat.icon);
    icon.style.backgroundSize = 'cover';
    icon.style.imageRendering = 'pixelated';
    tab.appendChild(icon);

    tab.addEventListener('mousedown', () => {
        currentCategory = catKey;
        updateTabsUI();
        populateCreativeGrid();
    });

    if (isTop) topTabsRow.appendChild(tab);
    else bottomTabsRow.appendChild(tab);
    
    allTabsUI.push({ key: catKey, elem: tab, isTop: isTop });
}

// Layout Tabs
const topKeys = ['building', 'colored', 'natural', 'functional', 'redstone', 'tools', 'search'];
topKeys.forEach(k => createTab(k, true));

function updateTabsUI() {
    allTabsUI.forEach(tabObj => {
        if (tabObj.key === currentCategory) {
            tabObj.elem.style.backgroundColor = '#c6c6c6';
            tabObj.elem.style.height = '64px';
            tabObj.elem.style.zIndex = '10';
        } else {
            tabObj.elem.style.backgroundColor = '#8b8b8b';
            tabObj.elem.style.height = '56px';
            tabObj.elem.style.zIndex = '1';
        }
    });

    creativeTitle.innerText = CATEGORIES[currentCategory].name;
    
    if (currentCategory === 'search') {
        invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_item_search.png)`;
        searchRow.style.display = 'block';
        creativeTitle.style.display = 'none';
        creativeGridContainer.style.top = '48px'; 
        creativeGridContainer.style.height = '144px';
        setTimeout(() => searchInput.focus(), 50);
    } else {
        invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_items.png)`;
        searchRow.style.display = 'none';
        creativeTitle.style.display = 'block';
        creativeGridContainer.style.top = '36px';
        creativeGridContainer.style.height = '180px';
    }
}

// Populate Grid
function populateCreativeGrid() {
    creativeGrid.innerHTML = '';
    
    let blocksToShow = CATEGORIES[currentCategory].blocks;
    
    if (currentCategory === 'search') {
        const query = searchInput.value.toLowerCase();
        blocksToShow = ALL_BLOCKS.filter(b => 
            !b.includes('_inner') && !b.includes('_outer') && b !== 'air' && b.includes(query)
        );
    }

    blocksToShow.forEach(bName => {
        const slot = document.createElement('div');
        slot.style.width = '36px';
        slot.style.height = '36px';
        slot.style.backgroundColor = 'transparent';
        slot.style.position = 'relative';
        slot.style.cursor = 'pointer';
        slot.style.boxSizing = 'border-box';
        slot.style.padding = '2px';
        slot.style.backgroundOrigin = 'content-box';
        slot.style.backgroundClip = 'content-box';
        applyIcon(slot, bName);
        slot.style.backgroundSize = 'cover';
        slot.style.imageRendering = 'pixelated';

        slot.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (e.button === 0) {
                if (heldItem.type === bName) {
                    heldItem.count = 64; // Max stack
                } else if (!heldItem.type || heldItem.type !== bName) {
                    heldItem.type = bName;
                    heldItem.count = 64;
                }
                updateInventoryUI();
            }
        });
        
        creativeGrid.appendChild(slot);
    });
}

// Setup Hotbar slots inside Creative UI
const creativeHotbarSlotsUI = [];
for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.style.width = '36px';
    slot.style.height = '36px';
    slot.style.backgroundColor = 'transparent';
    slot.style.position = 'relative';
    slot.style.cursor = 'pointer';
    slot.style.boxSizing = 'border-box';
    slot.style.padding = '2px';
    slot.style.backgroundOrigin = 'content-box';
    slot.style.backgroundClip = 'content-box';
    
    const countLabel = document.createElement('span');
    countLabel.style.position = 'absolute';
    countLabel.style.bottom = '2px';
    countLabel.style.right = '4px';
    countLabel.style.color = 'white';
    countLabel.style.fontWeight = 'bold';
    countLabel.style.fontFamily = 'monospace';
    countLabel.style.fontSize = '12px';
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

    creativeHotbarGrid.appendChild(slot);
    creativeHotbarSlotsUI.push({ div: slot, label: countLabel });
}

function updateInventoryUI() {
    // Update main game Hotbar
    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const ui = hotbarSlotsUI[i];
        applyIcon(ui.div, item.type);
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
    
    // Update Creative UI Hotbar
    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const ui = creativeHotbarSlotsUI[i];
        applyIcon(ui.div, item.type);
        ui.div.style.backgroundSize = 'cover';
        ui.div.style.imageRendering = 'pixelated';
        ui.label.innerText = (item.count > 1) ? item.count : '';
    }
    
    // Update Held Item Cursor
    if (heldItem.type) {
        heldItemUI.style.display = 'block';
        applyIcon(heldItemUI, heldItem.type);
        heldItemUI.style.backgroundSize = 'cover';
        heldItemUI.style.imageRendering = 'pixelated';
        heldLabel.innerText = (heldItem.count > 1) ? heldItem.count : '';
    } else {
        heldItemUI.style.display = 'none';
    }
}

// Clicking outside inventory to drop held item (Creative Mode Delete)
document.addEventListener('mousedown', (e) => {
    if (creativeInventoryScreen.style.display === 'flex' && heldItem.type) {
        if (!creativeInventoryScreen.contains(e.target)) {
            heldItem.type = null;
            heldItem.count = 0;
            updateInventoryUI();
        }
    }
});

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

// Init
updateTabsUI();
populateCreativeGrid();
updateInventoryUI();

// ----------------------------------------------------
// REAL MINECRAFT BLOCK HARDNESS & TOOLS
// ----------------------------------------------------
const REAL_MINECRAFT_HARDNESS = {
    air: 0.0, grass: 0.0, fern: 0.0, dead_bush: 0.0, dandelion: 0.0, poppy: 0.0, blue_orchid: 0.0,
    allium: 0.0, azure_bluet: 0.0, red_tulip: 0.0, orange_tulip: 0.0, white_tulip: 0.0, pink_tulip: 0.0,
    oxeye_daisy: 0.0, cornflower: 0.0, lily_of_the_valley: 0.0, wither_rose: 0.0,
    dirt: 0.5, coarse_dirt: 0.5, podzol: 0.5, rooted_dirt: 0.5, mud: 0.5, grass_block: 0.6,
    snowy_grass_block: 0.6, sand: 0.5, red_sand: 0.5, gravel: 0.6, clay: 0.6, soul_sand: 0.5, soul_soil: 0.5,
    stone: 1.5, granite: 1.5, polished_granite: 1.5, diorite: 1.5, polished_diorite: 1.5,
    andesite: 1.5, polished_andesite: 1.5, cobblestone: 2.0, mossy_cobblestone: 2.0,
    deepslate: 3.0, cobbled_deepslate: 3.5, tuff: 1.8, calcite: 0.75, basalt: 1.25, polished_basalt: 1.25,
    obsidian: 50.0, crying_obsidian: 50.0, sandstone: 0.8, red_sandstone: 0.8,
    stone_bricks: 1.5, mossy_stone_bricks: 1.5, cracked_stone_bricks: 1.5, chiseled_stone_bricks: 1.5,
    oak_log: 2.0, spruce_log: 2.0, birch_log: 2.0, jungle_log: 2.0, acacia_log: 2.0, dark_oak_log: 2.0,
    oak_planks: 2.0, spruce_planks: 2.0, birch_planks: 2.0, jungle_planks: 2.0,
    coal_ore: 3.0, iron_ore: 3.0, copper_ore: 3.0, gold_ore: 3.0, redstone_ore: 3.0,
    emerald_ore: 3.0, lapis_ore: 3.0, diamond_ore: 3.0,
    deepslate_coal_ore: 4.5, deepslate_iron_ore: 4.5, deepslate_copper_ore: 4.5,
    deepslate_gold_ore: 4.5, deepslate_redstone_ore: 4.5, deepslate_emerald_ore: 4.5,
    deepslate_lapis_ore: 4.5, deepslate_diamond_ore: 4.5,
    chest: 2.5, crafting_table: 2.5, furnace: 3.5, bookshelf: 1.5, bricks: 2.0,
    glass: 0.3, tinted_glass: 0.3, ice: 0.5, packed_ice: 0.5, blue_ice: 0.5,
    oak_leaves: 0.2, spruce_leaves: 0.2, birch_leaves: 0.2, jungle_leaves: 0.2,
    glowstone: 0.3, sea_lantern: 0.3, snow: 0.1, snow_block: 0.2,
    bedrock: -1.0
};

const BLOCK_TOOL_CLASSIFICATION = {
    stone: 'pickaxe', cobblestone: 'pickaxe', deepslate: 'pickaxe', cobbled_deepslate: 'pickaxe',
    granite: 'pickaxe', diorite: 'pickaxe', andesite: 'pickaxe', sandstone: 'pickaxe', red_sandstone: 'pickaxe',
    tuff: 'pickaxe', basalt: 'pickaxe', stone_bricks: 'pickaxe', bricks: 'pickaxe', furnace: 'pickaxe',
    coal_ore: 'pickaxe', iron_ore: 'pickaxe', copper_ore: 'pickaxe', gold_ore: 'pickaxe', redstone_ore: 'pickaxe',
    emerald_ore: 'pickaxe', lapis_ore: 'pickaxe', diamond_ore: 'pickaxe',
    deepslate_coal_ore: 'pickaxe', deepslate_iron_ore: 'pickaxe', deepslate_copper_ore: 'pickaxe',
    deepslate_gold_ore: 'pickaxe', deepslate_redstone_ore: 'pickaxe', deepslate_emerald_ore: 'pickaxe',
    deepslate_lapis_ore: 'pickaxe', deepslate_diamond_ore: 'pickaxe',
    obsidian: 'pickaxe', crying_obsidian: 'pickaxe',
    dirt: 'shovel', coarse_dirt: 'shovel', podzol: 'shovel', grass_block: 'shovel', snowy_grass_block: 'shovel',
    sand: 'shovel', red_sand: 'shovel', gravel: 'shovel', clay: 'shovel', snow: 'shovel', snow_block: 'shovel',
    soul_sand: 'shovel', soul_soil: 'shovel',
    oak_log: 'axe', spruce_log: 'axe', birch_log: 'axe', jungle_log: 'axe', acacia_log: 'axe', dark_oak_log: 'axe',
    oak_planks: 'axe', spruce_planks: 'axe', birch_planks: 'axe', chest: 'axe', crafting_table: 'axe', bookshelf: 'axe'
};

const BLOCK_DROPS = {
    grass_block: { item: 'dirt', count: 1 },
    snowy_grass_block: { item: 'dirt', count: 1 },
    dirt: { item: 'dirt', count: 1 },
    sand: { item: 'sand', count: 1 },
    sandstone: { item: 'sandstone', count: 1 },
    snow_block: { item: 'snowball', count: 4 },
    oak_sapling: { item: 'oak_sapling', count: 1 },
    spruce_sapling: { item: 'spruce_sapling', count: 1 },
    stone: { item: 'cobblestone', count: 1 },
    deepslate: { item: 'cobbled_deepslate', count: 1 },
    cobblestone: { item: 'cobblestone', count: 1 },
    cobbled_deepslate: { item: 'cobbled_deepslate', count: 1 },
    coal_ore: { item: 'coal', count: 1 },
    iron_ore: { item: 'raw_iron', count: 1 },
    copper_ore: { item: 'raw_copper', count: () => 2 + Math.floor(Math.random() * 4) },
    gold_ore: { item: 'raw_gold', count: 1 },
    diamond_ore: { item: 'diamond', count: 1 },
    lapis_ore: { item: 'lapis_lazuli', count: () => 4 + Math.floor(Math.random() * 6) },
    redstone_ore: { item: 'redstone', count: () => 4 + Math.floor(Math.random() * 2) },
    emerald_ore: { item: 'emerald', count: 1 },
    deepslate_coal_ore: { item: 'coal', count: 1 },
    deepslate_iron_ore: { item: 'raw_iron', count: 1 },
    deepslate_copper_ore: { item: 'raw_copper', count: () => 2 + Math.floor(Math.random() * 4) },
    deepslate_gold_ore: { item: 'raw_gold', count: 1 },
    deepslate_diamond_ore: { item: 'diamond', count: 1 },
    deepslate_lapis_ore: { item: 'lapis_lazuli', count: () => 4 + Math.floor(Math.random() * 6) },
    deepslate_redstone_ore: { item: 'redstone', count: () => 4 + Math.floor(Math.random() * 2) },
    deepslate_emerald_ore: { item: 'emerald', count: 1 },
    oak_log: { item: 'oak_log', count: 1 },
    spruce_log: { item: 'spruce_log', count: 1 },
    oak_leaves: { item: 'oak_sapling', count: () => Math.random() < 0.05 ? 1 : 0 },
    spruce_leaves: { item: 'spruce_sapling', count: () => Math.random() < 0.05 ? 1 : 0 },
    bedrock: null
};

const TOOL_MULTIPLIERS = {
    hand: 1.0, wood: 2.0, stone: 4.0, iron: 6.0, diamond: 8.0, netherite: 9.0, gold: 12.0
};

function isMatchingTool(blockName, heldItemType) {
    const requiredToolClass = BLOCK_TOOL_CLASSIFICATION[blockName];
    if (!requiredToolClass) return true; 
    if (!heldItemType) return false;
    return heldItemType.includes(requiredToolClass);
}

function canHarvestBlock(blockName, heldItemType) {
    const requiredToolClass = BLOCK_TOOL_CLASSIFICATION[blockName];
    if (!requiredToolClass) return true; 
    
    if (requiredToolClass === 'pickaxe') {
        if (!heldItemType || !heldItemType.includes('pickaxe')) return false;
        if (blockName === 'obsidian' || blockName === 'crying_obsidian') {
            return heldItemType.includes('diamond') || heldItemType.includes('netherite');
        }
        if (blockName.includes('diamond') || blockName.includes('redstone') || blockName.includes('emerald') || blockName.includes('lapis')) {
            return heldItemType.includes('iron') || heldItemType.includes('diamond') || heldItemType.includes('netherite');
        }
        if (blockName.includes('iron') || blockName.includes('copper') || blockName.includes('lapis')) {
            return heldItemType.includes('stone') || heldItemType.includes('iron') || heldItemType.includes('diamond') || heldItemType.includes('netherite');
        }
        return true; 
    }
    return isMatchingTool(blockName, heldItemType);
}

function calculateMiningTime(blockName, heldItemType) {
    const hardness = REAL_MINECRAFT_HARDNESS[blockName] !== undefined ? REAL_MINECRAFT_HARDNESS[blockName] : 1.5;
    if (hardness < 0) return Infinity; 
    if (hardness === 0) return 0; 
    
    let speedMultiplier = 1.0;
    const matching = isMatchingTool(blockName, heldItemType);
    
    if (matching && heldItemType) {
        let tier = 'wood';
        if (heldItemType.includes('stone')) tier = 'stone';
        else if (heldItemType.includes('iron')) tier = 'iron';
        else if (heldItemType.includes('diamond')) tier = 'diamond';
        else if (heldItemType.includes('netherite')) tier = 'netherite';
        else if (heldItemType.includes('gold')) tier = 'gold';
        speedMultiplier = TOOL_MULTIPLIERS[tier] || 1.0;
    }
    
    const constantMultiplier = matching ? 1.5 : 5.0;
    const timeInSeconds = (hardness * constantMultiplier) / speedMultiplier;
    return timeInSeconds * 1000; 
}

const ORE_CONFIG = {
    emerald_ore: [{ min: -16, max: 320, peak: 232, threshold: 0.78 }],
    diamond_ore: [{ min: -64, max: 16,  peak: -64, threshold: 0.72 }],
    lapis_ore:   [
        { min: -64, max: 64,  peak: 0, threshold: 0.68 }, 
        { min: -32, max: 32,  threshold: 0.65 } 
    ],
    gold_ore:    [{ min: -64, max: 32,  peak: -16, threshold: 0.68 }],
    redstone_ore:[
        { min: -64, max: 15,  threshold: 0.65 },
        { min: -64, max: -32, peak: -64, threshold: 0.62 }
    ],
    copper_ore:  [{ min: -16, max: 112, peak: 48, threshold: 0.60 }],
    iron_ore:    [
        { min: -64, max: 72,  peak: 16, threshold: 0.55 },
        { min: 80,  max: 320, peak: 232, threshold: 0.55 },
        { min: -64, max: -32, threshold: 0.58 }
    ],
    coal_ore:    [
        { min: 0,   max: 192, peak: 96, threshold: 0.50 },
        { min: 136, max: 320, threshold: 0.55 }
    ],
};

const animatedTextures = [];
const imageLoader = new THREE.ImageLoader();
imageLoader.setCrossOrigin('anonymous');

const loadTex = (filename, isItem = false) => {
    const dir = isItem ? ITEM_TEX_DIR : BLOCK_TEX_DIR;
    
    const cvs = document.createElement('canvas');
    cvs.width = 16; cvs.height = 16;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    
    const t = new THREE.CanvasTexture(cvs);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;

    // We attach a promise so the icon generator knows when the image is fully downloaded
    t.loadPromise = new Promise((resolve) => {
        imageLoader.load(
            `${dir}${filename}.png`,
            (image) => {
                const fw = image.width;
                const fh = image.height;
                const totalFrames = Math.round(fh / fw);

                if (totalFrames > 1) {
                    cvs.width = fw; cvs.height = fw;
                    t.needsUpdate = true;

                    let animData = {
                        texture: t,
                        ctx: ctx,
                        sourceImage: image,
                        frames: Array.from({length: totalFrames}, (_, i) => i),
                        defaultTickRate: 2,
                        totalFrames: totalFrames,
                        currentArrayIdx: 0,
                        timer: 0,
                        interpolate: true, 
                        frameWidth: fw
                    };
                    animatedTextures.push(animData);
                    
                    ctx.drawImage(image, 0, 0, fw, fw, 0, 0, fw, fw);

                    fetch(`${dir}${filename}.png.mcmeta`).then(r => r.ok ? r.json() : null)
                    .then(mcmeta => {
                        if (mcmeta && mcmeta.animation) {
                            if (mcmeta.animation.frames) animData.frames = mcmeta.animation.frames;
                            if (mcmeta.animation.frametime) animData.defaultTickRate = mcmeta.animation.frametime;
                            if (mcmeta.animation.interpolate !== undefined) animData.interpolate = mcmeta.animation.interpolate;
                        }
                        resolve(t);
                    }).catch(e => { resolve(t); });
                    
                } else {
                    cvs.width = fw; cvs.height = fh;
                    ctx.drawImage(image, 0, 0);
                    t.needsUpdate = true;
                    resolve(t);
                }
            },
            undefined,
            (err) => {
                cvs.width = 16; cvs.height = 16;
                ctx.fillStyle = '#ff00ff'; ctx.fillRect(0, 0, 8, 8); ctx.fillRect(8, 8, 8, 8);
                ctx.fillStyle = '#000000'; ctx.fillRect(8, 0, 8, 8); ctx.fillRect(0, 8, 8, 8);
                t.needsUpdate = true;
                resolve(t);
            }
        );
    });
    
    return t;
};

const materials = {};

const destroyTextures = [];
for (let i = 0; i < 10; i++) {
    destroyTextures.push(loadTex(`destroy_stage_${i}`));
}

const destroyGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const destroyMat = new THREE.MeshBasicMaterial({ 
    map: destroyTextures[0], transparent: true, depthWrite: false, color: 0xA9A9A9, opacity: 0.8
});
const destroyMesh = new THREE.Mesh(destroyGeo, destroyMat);
destroyMesh.visible = false; 
scene.add(destroyMesh);

const BIOME_REGISTRY = [
    { name: "Forest", temp: 0.15, moist: 0.3, depth: 0.0, topBlock: 'grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.015, heightScale: 20, treeType: 'oak' },
    { name: "Plains", temp: 0.0, moist: -0.1, depth: 0.0, topBlock: 'grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.0001, heightScale: 8, treeType: 'oak' },
    { name: "Desert", temp: 0.35, moist: -0.35, depth: 0.0, topBlock: 'sand', subBlock: 'sand', deepSubBlock: 'sandstone', treeChance: 0.0, heightScale: 12, treeType: 'oak' },
    { name: "Snowy Tundra", temp: -0.35, moist: 0.1, depth: 0.0, topBlock: 'grass_block', subBlock: 'dirt', deepSubBlock: 'stone', treeChance: 0.002, heightScale: 15, treeType: 'spruce' },
    { name: "Mountains", temp: 0.3, moist: 0.3, depth: 0.0, topBlock: 'stone', subBlock: 'stone', deepSubBlock: 'stone', treeChance: 0.0, heightScale: 55, treeType: 'spruce' }
];

const chunkSize = 16;
const renderDistance = 2; 
const worldHeight = 256;
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
const brokenBlocks = new Set(); 
const placedBlocks = new Map(); 
const treeOverhangs = new Map(); 
const chunksToRebuild = new Set(); 

// Direction vectors mapping to Minecraft facing: 0:East, 1:North, 2:West, 3:South
const DIRS = [ [1,0,0], [0,0,-1], [-1,0,0], [0,0,1] ];

function getStairData(x, y, z) {
    let k = `${x},${y},${z}`;
    if (placedBlocks.has(k)) {
        let data = placedBlocks.get(k);
        if (data && data.isStair) {
            let typeId = data.type;
            let bName = REVERSE_TYPE[typeId];
            if (bName.includes('_inner')) bName = bName.replace('_inner', '');
            if (bName.includes('_outer')) bName = bName.replace('_outer', '');
            return { ...data, baseName: bName };
        }
    }
    return null;
}

function evaluateStair(x, y, z) {
    let s = getStairData(x, y, z);
    if (!s) return;
    
    let f = s.facing;
    let backDir = (f + 2) % 4;
    let frontDir = f;
    
    let sFront = getStairData(x + DIRS[frontDir][0], y, z + DIRS[frontDir][2]);
    let sBack = getStairData(x + DIRS[backDir][0], y, z + DIRS[backDir][2]);
    
    let shape = 'straight';
    let leftOfF = (f + 1) % 4;

    // Helper: checks if the block in `checkDir` prevents a corner from forming
    const canTakeShape = (checkDir) => {
        let n = getStairData(x + DIRS[checkDir][0], y, z + DIRS[checkDir][2]);
        // If it's a stair of the same half facing the exact same way as us, we cannot take the shape
        if (n && n.half === s.half && n.facing === f) {
            return false;
        }
        return true;
    };
    
    // 1. Evaluate FRONT for OUTER corners (Real Minecraft prioritizes Outer first)
    if (sFront && sFront.half === s.half && sFront.facing !== f && (sFront.facing % 2 !== f % 2)) {
        let oppFrontDir = (sFront.facing + 2) % 4;
        if (canTakeShape(oppFrontDir)) {
            if (sFront.facing === leftOfF) shape = 'outer_left';
            else shape = 'outer_right';
        }
    }
    
    // 2. Evaluate BACK for INNER corners
    if (shape === 'straight') {
        if (sBack && sBack.half === s.half && sBack.facing !== f && (sBack.facing % 2 !== f % 2)) {
            let backDirFace = sBack.facing;
            if (canTakeShape(backDirFace)) {
                if (sBack.facing === leftOfF) shape = 'inner_left';
                else shape = 'inner_right';
            }
        }
    }
    
    let rotY = 0;
    if (f === 0) rotY = 0; 
    else if (f === 1) rotY = Math.PI/2; 
    else if (f === 2) rotY = Math.PI; 
    else if (f === 3) rotY = -Math.PI/2; 
    
    if (s.half === 'top') {
        rotY = -rotY;
    }
    
    let finalType = s.baseName;
    let finalRotY = rotY;
    
    if (shape === 'inner_left') { finalType += '_inner'; finalRotY = rotY + Math.PI/2; }
    else if (shape === 'inner_right') { finalType += '_inner'; finalRotY = rotY; }
    else if (shape === 'outer_left') { finalType += '_outer'; finalRotY = rotY + Math.PI/2; }
    else if (shape === 'outer_right') { finalType += '_outer'; finalRotY = rotY; }

    let rx = s.half === 'top' ? Math.PI : 0;
    
    let existing = placedBlocks.get(`${x},${y},${z}`);
    let targetTypeId = TYPE[finalType];
    
    // Optimization: Only push the update if the stair's visual state actually changed
    if (!existing || existing.type !== targetTypeId || !existing.rotation || existing.rotation[0] !== rx || existing.rotation[1] !== finalRotY) {
        setGlobalBlock(x, y, z, { ...existing, type: targetTypeId, rotation: [rx, finalRotY, 0] });
    }
}

function updateStairConnections(x, y, z) {
    evaluateStair(x, y, z);
    evaluateStair(x+1, y, z);
    evaluateStair(x-1, y, z);
    evaluateStair(x, y, z+1);
    evaluateStair(x, y, z-1);
}

function getGlobalBlock(gx, gy, gz) {
    if (gy < minworldY || gy >= minworldY + worldHeight) return null;
    let cx = Math.floor(gx / chunkSize);
    let cz = Math.floor(gz / chunkSize);
    let chunkId = `${cx},${cz}`;
    let chunk = activeChunks[chunkId];
    if (!chunk || chunk.pending) return null; 
    
    let lx = gx - (cx * chunkSize);
    let lz = gz - (cz * chunkSize);
    let ly = gy - minworldY;
    
    let idx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);
    return chunk.blocks[idx];
}

function setGlobalBlock(gx, gy, gz, typeData) {
    if (gy < minworldY || gy >= minworldY + worldHeight) return;
    
    let blockKey = `${gx},${gy},${gz}`;
    let typeId = typeof typeData === 'object' ? typeData.type : typeData;

    if (typeId === 0) {
        brokenBlocks.add(blockKey);
        placedBlocks.delete(blockKey);
    } else {
        brokenBlocks.delete(blockKey);
        placedBlocks.set(blockKey, typeData);
    }

    let cx = Math.floor(gx / chunkSize);
    let cz = Math.floor(gz / chunkSize);
    let chunkId = `${cx},${cz}`;
    let chunk = activeChunks[chunkId];
    
    if (!chunk || chunk.pending) return; 
    
    let lx = gx - (cx * chunkSize);
    let lz = gz - (cz * chunkSize);
    let ly = gy - minworldY;
    let idx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);
    
    if (chunk.blocks[idx] !== typeId) {
        chunk.blocks[idx] = typeId;
    }
    
    chunksToRebuild.add(chunkId);
    if (lx === 0) chunksToRebuild.add(`${cx - 1},${cz}`);
    if (lx === chunkSize - 1) chunksToRebuild.add(`${cx + 1},${cz}`);
    if (lz === 0) chunksToRebuild.add(`${cx},${cz - 1}`);
    if (lz === chunkSize - 1) chunksToRebuild.add(`${cx},${cz + 1}`);
}

function checkIsSnowy(gx, gy, gz) {
    const blockAbove = getGlobalBlock(gx, gy + 1, gz);
    if (blockAbove === TYPE.snow || blockAbove === TYPE.snow_block || blockAbove === TYPE.powder_snow) {
        return true;
    }
    return false;
}

function doRandomTicks() {
    for (const chunkId in activeChunks) {
        const chunk = activeChunks[chunkId];
        if (!chunk || chunk.pending || !chunk.blocks) continue;

        const [cx, cz] = chunkId.split(',').map(Number);
        
        for (let i = 0; i < 3; i++) {
            let lx = Math.floor(Math.random() * chunkSize);
            let lz = Math.floor(Math.random() * chunkSize);
            let ly = Math.floor(Math.random() * worldHeight);
            
            let idx = lx + lz * chunkSize + ly * (chunkSize * chunkSize);
            let blockType = chunk.blocks[idx];

            if (blockType === TYPE.grass_block || blockType === TYPE.snowy_grass_block) {
                let gx = (cx * chunkSize) + lx;
                let gy = ly + minworldY;
                let gz = (cz * chunkSize) + lz;

                let above = getGlobalBlock(gx, gy + 1, gz);
                
                if (above !== null && above !== 0 && above !== TYPE.oak_leaves && above !== TYPE.spruce_leaves && above !== TYPE.snow_block && above !== TYPE.oak_sapling && above !== TYPE.spruce_sapling) {
                    setGlobalBlock(gx, gy, gz, TYPE.dirt);
                } 
                else if (above === 0 || above === TYPE.oak_leaves || above === TYPE.spruce_leaves || above === TYPE.snow_block) {
                    let ox = Math.floor(Math.random() * 3) - 1; 
                    let oz = Math.floor(Math.random() * 3) - 1;
                    let oy = Math.floor(Math.random() * 5) - 3; 
                    
                    let tx = gx + ox;
                    let ty = gy + oy;
                    let tz = gz + oz;
                    
                    let target = getGlobalBlock(tx, ty, tz);
                    if (target === TYPE.dirt) {
                        let targetAbove = getGlobalBlock(tx, ty + 1, tz);
                        if (targetAbove === 0 || targetAbove === TYPE.oak_leaves || targetAbove === TYPE.spruce_leaves || targetAbove === TYPE.snow_block || targetAbove === TYPE.oak_sapling || targetAbove === TYPE.spruce_sapling) {
                            const snowy = checkIsSnowy(tx, ty, tz);
                            setGlobalBlock(tx, ty, tz, snowy ? TYPE.snowy_grass_block : TYPE.grass_block);
                        }
                    }
                }
            } 
        }
    }
}

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
    const range = 8; 
    const step = 4; 
    let totalScale = 0; 
    let samples = 0;
    
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

function getBlockCapacity(key) {
    if (key === 'stone' || key === 'deepslate') return 45000;
    if (key === 'dirt' || key === 'grass_block' || key === 'snow_block' || key === 'snowy_grass_block' || key === 'sand' || key === 'bedrock') return 15000;
    if (key.includes('leaves') || key.includes('log')) return 8000;
    return 4000;
}

function mergeBufferGeometries(geos) {
    let vertexCount = 0;
    let indexCount = 0;
    for (let g of geos) {
        vertexCount += g.attributes.position.count;
        indexCount += g.index ? g.index.count : g.attributes.position.count;
    }
    
    let posArray = new Float32Array(vertexCount * 3);
    let normArray = new Float32Array(vertexCount * 3);
    let uvArray = new Float32Array(vertexCount * 2);
    let indArray = new Uint32Array(indexCount);
    
    let vOff = 0;
    let iOff = 0;
    let groupStart = 0;
    const mergedGeo = new THREE.BufferGeometry();
    
    for (let g of geos) {
        posArray.set(g.attributes.position.array, vOff * 3);
        normArray.set(g.attributes.normal.array, vOff * 3);
        uvArray.set(g.attributes.uv.array, vOff * 2);
        
        if (g.index) {
            for(let i=0; i<g.index.count; i++) indArray[iOff + i] = g.index.array[i] + vOff;
        } else {
            for(let i=0; i<g.attributes.position.count; i++) indArray[iOff + i] = i + vOff;
        }
        
        for (let grp of g.groups) {
            mergedGeo.addGroup(groupStart + grp.start, grp.count, grp.materialIndex);
        }
        
        vOff += g.attributes.position.count;
        iOff += g.index ? g.index.count : g.attributes.position.count;
        groupStart += g.index ? g.index.count : g.attributes.position.count;
    }
    
    mergedGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
    mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    mergedGeo.setIndex(new THREE.BufferAttribute(indArray, 1));
    
    return mergedGeo;
}

function computeChunkLight(blocks) {
    const lightMap = new Uint8Array(chunkSize * chunkSize * worldHeight);
    const queue = new Int32Array(chunkSize * chunkSize * worldHeight * 2);
    let head = 0, tail = 0;
    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let currentLight = 15;
            for (let y = worldHeight - 1; y >= 0; y--) {
                let idx = getIdx(x, y, z);
                let b = blocks[idx];
                
                if (b !== 0 && !isTransparent[b]) {
                    currentLight = 0;
                } else if (b === TYPE.oak_leaves || b === TYPE.spruce_leaves || b === TYPE.water) {
                    currentLight = Math.max(0, currentLight - 2); 
                }

                lightMap[idx] = currentLight;
                if (currentLight > 0) {
                    queue[tail++] = idx;
                }
            }
        }
    }

    while (head < tail) {
        let idx = queue[head++];
        let light = lightMap[idx];
        if (light <= 1) continue;

        let x = idx % chunkSize;
        let z = Math.floor(idx / chunkSize) % chunkSize;
        let y = Math.floor(idx / (chunkSize * chunkSize));

        let nextLight = light - 1;

        const processN = (nx, ny, nz) => {
            if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize && ny >= 0 && ny < worldHeight) {
                let nIdx = getIdx(nx, ny, nz);
                let b = blocks[nIdx];
                if ((b === 0 || isTransparent[b]) && lightMap[nIdx] < nextLight) {
                    let drop = 1;
                    if (b === TYPE.oak_leaves || b === TYPE.spruce_leaves || b === TYPE.water) drop = 2;
                    let targetLight = light - drop;
                    
                    if (targetLight > lightMap[nIdx]) {
                        lightMap[nIdx] = targetLight;
                        queue[tail++] = nIdx;
                    }
                }
            }
        };

        processN(x - 1, y, z);
        processN(x + 1, y, z);
        processN(x, y - 1, z);
        processN(x, y + 1, z);
        processN(x, y, z - 1);
        processN(x, y, z + 1);
    }
    return lightMap;
}

const customGeometries = {};

async function loadCustomModel(bName) {
    if (customGeometries[bName]) return; 

    if (CROSS_BLOCKS.has(bName)) {
        const tex = loadTex(bName);
        let mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, depthWrite: false });
        if (bName === 'grass' || bName === 'tall_grass' || bName === 'fern' || bName === 'large_fern' || bName === 'vine') {
            mat.color.setHex(0x71b054);
        }
        materials[bName] = mat;
        customGeometries[bName] = crossGeo;
        return;
    }

    try {
        let isInner = bName.endsWith('_inner');
        let isOuter = bName.endsWith('_outer');
        let baseName = bName;
        if (isInner) baseName = bName.replace('_inner', '');
        if (isOuter) baseName = bName.replace('_outer', '');

        let modelPath = baseName;

        const state = await JSONReader.getBlockstate(baseName);
        
        if (state && state.variants) {
            let variantKey = "";
            let keys = Object.keys(state.variants);
            
            // FIX: Explicitly search for the requested shape to prevent all stairs defaulting to inner corners
            let targetShape = isInner ? 'inner_left' : isOuter ? 'outer_left' : 'straight';
            
            for (let k of keys) {
                if (k.includes(`shape=${targetShape}`) && k.includes('half=bottom')) {
                    variantKey = k;
                    break;
                }
            }
            if (!variantKey) variantKey = keys[0]; 
            
            let variant = state.variants[variantKey];
            if (Array.isArray(variant)) variant = variant[0]; 
            
            if (variant.model) modelPath = variant.model.replace('minecraft:block/', '').replace('block/', '');
        } else if (state && state.multipart) {
            let part = state.multipart[0]; 
            let variant = part.apply;
            if (Array.isArray(variant)) variant = variant[0];
            
            if (variant.model) modelPath = variant.model.replace('minecraft:block/', '').replace('block/', '');
        }

        let currentModel = await JSONReader.getModel(modelPath);
        let elements = currentModel ? currentModel.elements : null;
        let textures = currentModel && currentModel.textures ? { ...currentModel.textures } : {};
        
        // Capture the authentic Minecraft display data
        let display = currentModel && currentModel.display ? JSON.parse(JSON.stringify(currentModel.display)) : {};

        let depth = 0;
        while (currentModel && currentModel.parent && depth < 10) {
            let parentPath = currentModel.parent;
            if (parentPath.includes(':')) parentPath = parentPath.split(':')[1]; 
            parentPath = parentPath.replace('block/', '');
            
            currentModel = await JSONReader.getModel(parentPath);
            if (currentModel) {
                if (!elements && currentModel.elements) elements = currentModel.elements;
                if (currentModel.textures) {
                    for (let k in currentModel.textures) {
                        if (!textures[k]) textures[k] = currentModel.textures[k];
                    }
                }
                // Merge display properties up the parent hierarchy
                if (currentModel.display) {
                    for (let k in currentModel.display) {
                        if (!display[k]) display[k] = JSON.parse(JSON.stringify(currentModel.display[k]));
                    }
                }
            }
            depth++;
        }

        const resolveTexture = (texStr) => {
            if (!texStr) return null;
            if (texStr.startsWith('#')) {
                let key = texStr.substring(1);
                let safe = 10;
                while (textures[key] && textures[key].startsWith('#') && safe > 0) {
                    key = textures[key].substring(1);
                    safe--;
                }
                return textures[key];
            }
            return texStr;
        };

        const matArray = [];
        const texMap = {};
        let matIndexCounter = 0;

        const getMaterialForTex = (texPath) => {
            // FIX: Always use baseName so texture loader doesn't look for acacia_stairs_inner.png
            if (!texPath) texPath = baseName; 
            texPath = texPath.replace('minecraft:', '').replace('block/', '');
            
            if (texMap[texPath] !== undefined) return texMap[texPath];
            
            let tex = loadTex(texPath);
            let mat;
            let isOverlay = texPath.includes('overlay');

            if (TRANSPARENT_BLOCKS.has(baseName) || texPath.includes('leaves') || texPath.includes('glass') || isOverlay) {
                mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
                if (isOverlay) mat.depthWrite = false; 
            } else {
                mat = new THREE.MeshStandardMaterial({ map: tex });
            }
            
            if (texPath === 'grass_block_top' || texPath === 'vine' || texPath === 'grass_block_side_overlay') {
                mat.color.setHex(0x71b054); 
            } else if (texPath.includes('leaves')) {
                mat.color.setHex(0x71b054);
                if (texPath.includes('spruce')) mat.color.setHex(0x619961);
                if (texPath.includes('birch')) mat.color.setHex(0x80a755);
            }
            
            matArray.push(mat);
            texMap[texPath] = matIndexCounter;
            return matIndexCounter++;
        };

        if (elements && elements.length > 0) {
            const elementGeometries = [];
            for (let el of elements) {
                const w = (el.to[0] - el.from[0]) / 16;
                const h = (el.to[1] - el.from[1]) / 16;
                const d = (el.to[2] - el.from[2]) / 16;
                
                let hasOverlay = false;
                if (el.faces) {
                    for (const mcFace in el.faces) {
                        if (!el.faces[mcFace]) continue;
                        let texRef = el.faces[mcFace].texture;
                        let texPath = resolveTexture(texRef);
                        if (texPath && texPath.includes('overlay')) hasOverlay = true;
                    }
                }
                
                let expand = hasOverlay ? 0.002 : 0;
                
                const geo = new THREE.BoxGeometry(
                    Math.max(0.001, w + expand), 
                    Math.max(0.001, h + expand), 
                    Math.max(0.001, d + expand)
                );
                
                geo.translate((el.from[0] + el.to[0])/32 - 0.5, (el.from[1] + el.to[1])/32 - 0.5, (el.from[2] + el.to[2])/32 - 0.5);
                geo.clearGroups();

                if (el.faces) {
                    const uvs = geo.attributes.uv;
                    const faceMap = { east: 0, west: 1, up: 2, down: 3, south: 4, north: 5 };
                    
                    for (const [mcFace, faceIdx] of Object.entries(faceMap)) {
                        const faceData = el.faces[mcFace];
                        if (!faceData) continue;

                        let texRef = faceData.texture;
                        let texPath = resolveTexture(texRef);
                        let matIdx = getMaterialForTex(texPath);

                        geo.addGroup(faceIdx * 6, 6, matIdx);

                        let u1 = 0, v1 = 0, u2 = 1, v2 = 1;
                        if (faceData.uv) {
                            u1 = faceData.uv[0] / 16;
                            v1 = faceData.uv[1] / 16;
                            u2 = faceData.uv[2] / 16;
                            v2 = faceData.uv[3] / 16;
                        } else {
                            if (mcFace === 'up' || mcFace === 'down') {
                                u1 = el.from[0]/16; v1 = el.from[2]/16; u2 = el.to[0]/16; v2 = el.to[2]/16;
                            } else if (mcFace === 'north' || mcFace === 'south') {
                                u1 = el.from[0]/16; v1 = 1 - el.to[1]/16; u2 = el.to[0]/16; v2 = 1 - el.from[1]/16;
                            } else {
                                u1 = el.from[2]/16; v1 = 1 - el.to[1]/16; u2 = el.to[2]/16; v2 = 1 - el.from[1]/16;
                            }
                        }

                        let tv1 = 1 - v1;
                        let tv2 = 1 - v2;
                        let vIdx = faceIdx * 4;
                        
                        let rot = faceData.rotation || 0;
                        if (rot === 0) {
                            uvs.setXY(vIdx + 0, u1, tv1); uvs.setXY(vIdx + 1, u2, tv1);
                            uvs.setXY(vIdx + 2, u1, tv2); uvs.setXY(vIdx + 3, u2, tv2);
                        } else if (rot === 90) {
                            uvs.setXY(vIdx + 0, u1, tv2); uvs.setXY(vIdx + 1, u1, tv1);
                            uvs.setXY(vIdx + 2, u2, tv2); uvs.setXY(vIdx + 3, u2, tv1);
                        } else if (rot === 180) {
                            uvs.setXY(vIdx + 0, u2, tv2); uvs.setXY(vIdx + 1, u1, tv2);
                            uvs.setXY(vIdx + 2, u2, tv1); uvs.setXY(vIdx + 3, u1, tv1);
                        } else if (rot === 270) {
                            uvs.setXY(vIdx + 0, u2, tv1); uvs.setXY(vIdx + 1, u2, tv2);
                            uvs.setXY(vIdx + 2, u1, tv1); uvs.setXY(vIdx + 3, u1, tv2);
                        }
                    }
                }
                elementGeometries.push(geo);
            }
            
            materials[bName] = matArray;
            if (elementGeometries.length === 1) {
                customGeometries[bName] = elementGeometries[0];
            } else if (elementGeometries.length > 1) {
                customGeometries[bName] = mergeBufferGeometries(elementGeometries);
            }
            
            // Attach the parsed display settings to the geometry for the Icon Generator
            customGeometries[bName].userData = { display: display };
            
        } else {
            throw new Error("No elements found");
        }
    } catch(e) {
        const tex = loadTex(bName);
        let mat;
        if (TRANSPARENT_BLOCKS.has(bName)) {
            mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.8 });
        } else {
            mat = new THREE.MeshStandardMaterial({ map: tex });
        }
        materials[bName] = mat;
        
        // Clone the fallback geometry so we can safely attach default display settings
        customGeometries[bName] = geometry.clone(); 
        customGeometries[bName].userData = {
            display: { gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] } }
        };
    }
    
    // Ensure all textures are fully loaded before letting the icon generator take a snapshot
    const promises = [];
    if (Array.isArray(materials[bName])) {
        materials[bName].forEach(mat => { if (mat.map && mat.map.loadPromise) promises.push(mat.map.loadPromise); });
    } else if (materials[bName] && materials[bName].map && materials[bName].map.loadPromise) {
        promises.push(materials[bName].map.loadPromise);
    }
    await Promise.all(promises);
}

async function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;
    activeChunks[chunkId] = { pending: true };

    const blocks = new Uint16Array(chunkSize * chunkSize * worldHeight);
    const treesToSpawn = [];
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;

    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            let globalX = startX + x;
            let globalZ = startZ + z;

            let temp = fbm2(globalX, globalZ, 2, 400);
            let moist = fbm2(globalX + 10000, globalZ + 10000, 2, 400);
            let localBiome = getBiome(temp, moist, 0);

            let bs = getInterpolatedHeightScale(globalX, globalZ);
            let baseHeight = Math.floor(((noise.perlin2(globalX/400, globalZ/400) + 1) / 2) * bs + 64);
            
            let densityMap = new Float32Array(worldHeight);
            for(let y = 0; y < worldHeight; y++) {
                let actualY = y + minworldY;
                let n = noise.perlin3(globalX / 40, actualY / 40, globalZ / 40) * 20;
                densityMap[y] = (baseHeight - actualY) + n;
            }

            for (let y = 0; y < worldHeight; y++) {
                let actualY = y + minworldY;
                let blockIdx = getIdx(x, y, z);
                let density = densityMap[y];
                
                if (density > 0) {
                    let densityAbove = y < worldHeight - 1 ? densityMap[y+1] : -1;
                    
                    let stoneType = 'stone';
                    if (actualY <= 0) {
                        stoneType = 'deepslate';
                    } else if (actualY < 8) {
                        let mixNoise = noise.perlin3(globalX / 8, actualY / 8, globalZ / 8);
                        if (mixNoise > (actualY / 8) - 0.2) stoneType = 'deepslate';
                    }
                    
                    if (stoneType === 'stone' && densityAbove < 10 && localBiome.deepSubBlock !== 'stone') {
                        stoneType = localBiome.deepSubBlock;
                    }

                    let isCave = false;
                    if (density > 5 && actualY < 100) {
                        isCave = (fbm3(globalX, actualY, globalZ, 2, 35)**2 + fbm3(globalX+1000, actualY+1000, globalZ+1000, 2, 35)**2) < 0.005;
                    }

                    if (isCave) continue;

                    let baseBlockType = stoneType;
                    if (densityAbove <= 0) { 
                        baseBlockType = actualY > 100 ? 'snow' : localBiome.topBlock;
                    } else if (densityAbove < 3) {
                        baseBlockType = localBiome.subBlock;
                    }

                    let blockType = baseBlockType;

                    if (baseBlockType === 'stone' || baseBlockType === 'deepslate') {
                        let foundOre = false;
                        let oreIndex = 0; 
                        
                        for (const [oreName, rules] of Object.entries(ORE_CONFIG)) {
                            if (foundOre) break;
                            oreIndex++; 
                            for (const conf of rules) {
                                if (actualY >= conf.min && actualY <= conf.max) {
                                    let offset = (oreIndex * 1000); 
                                    let veinNoise = noise.perlin3((globalX + offset) * 0.25, (actualY + offset) * 0.25, (globalZ + offset) * 0.25);
                                    let currentThreshold = conf.threshold;
                                    
                                    if (conf.peak !== undefined) {
                                        let maxDist = Math.max(Math.abs(conf.max - conf.peak), Math.abs(conf.min - conf.peak));
                                        let dist = Math.abs(actualY - conf.peak);
                                        let penalty = (dist / maxDist) * 0.15; 
                                        currentThreshold += penalty;
                                    }
                                    
                                    if (veinNoise > currentThreshold) {
                                        blockType = (baseBlockType === 'deepslate') ? `deepslate_${oreName}` : oreName;
                                        foundOre = true; break;
                                    }
                                }
                            }
                        }
                    }
                    blocks[blockIdx] = TYPE[blockType] || TYPE.stone;
                }
            } 

            for (let y = worldHeight - 1; y >= 0; y--) {
                let b = blocks[getIdx(x, y, z)];
                if (b !== 0) { 
                    if ((b === TYPE.grass_block || b === TYPE.snowy_grass_block) && localBiome.treeChance > 0) {
                        let actualY = y + minworldY;
                        if (getDeterministicRandom(globalX, actualY, globalZ) < localBiome.treeChance) {
                            treesToSpawn.push({ x, y, z, actualY, treeType: localBiome.treeType });
                        }
                    }
                    break; 
                }
            }
        }
    }

    const placeTreeIntoBlocks = (localX, localY, localZ, treeType) => {
        const trunkH = treeType === 'spruce' 
            ? 6 + Math.floor(getDeterministicRandom(localX, localY, localZ) * 4) 
            : 4 + Math.floor(getDeterministicRandom(localX, localY, localZ) * 2);
            
        const logType = TYPE[`${treeType}_log`];
        const leavesType = TYPE[`${treeType}_leaves`];
        
        const setLocalB = (x, y, z, t, force=false) => {
            let gx = startX + x;
            let gy = y + minworldY;
            let gz = startZ + z;

            if (x >= 0 && x < chunkSize && z >= 0 && z < chunkSize && y >= 0 && y < worldHeight) {
                let idx = getIdx(x, y, z);
                let currentB = blocks[idx];
                if (force || currentB === 0 || currentB === TYPE.snow || isTransparent[currentB]) {
                    blocks[idx] = t;
                }
            } else {
                let blockKey = `${gx},${gy},${gz}`;
                if (!placedBlocks.has(blockKey) && !brokenBlocks.has(blockKey)) {
                    treeOverhangs.set(blockKey, t);
                    
                    let cx = Math.floor(gx / chunkSize);
                    let cz = Math.floor(gz / chunkSize);
                    let chunkId = `${cx},${cz}`;
                    if (activeChunks[chunkId] && !activeChunks[chunkId].pending) {
                        let lx = gx - (cx * chunkSize);
                        let lz = gz - (cz * chunkSize);
                        let idx = lx + lz * chunkSize + y * (chunkSize * chunkSize);
                        let currentB = activeChunks[chunkId].blocks[idx];
                        if (force || currentB === 0 || currentB === TYPE.snow || isTransparent[currentB]) {
                            activeChunks[chunkId].blocks[idx] = t;
                            chunksToRebuild.add(chunkId);
                        }
                    }
                }
            }
        };

        for (let i = 0; i < trunkH; i++) setLocalB(localX, localY + i, localZ, logType, true);

        if (treeType === 'spruce') {
            let leafHeight = trunkH - (1 + Math.floor(getDeterministicRandom(localX, localY, localZ) * 2));
            let leafStart = localY + trunkH - leafHeight;
            let topY = localY + trunkH + 1;
            let currentRadius = 0; 
            for (let ly = topY; ly >= leafStart; ly--) {
                for (let lx = -currentRadius; lx <= currentRadius; lx++) {
                    for (let lz = -currentRadius; lz <= currentRadius; lz++) {
                        if (Math.abs(lx) === currentRadius && Math.abs(lz) === currentRadius && currentRadius > 0) {
                            if (currentRadius === 2) continue; 
                            if (currentRadius === 1 && ly === topY - 1) continue; 
                        }
                        if (lx === 0 && lz === 0 && ly < localY + trunkH) continue; 
                        setLocalB(localX + lx, ly, localZ + lz, leavesType);
                    }
                }
                if (currentRadius === 0) currentRadius = 1; 
                else if (currentRadius === 1 && ly < topY - 1) currentRadius = 2; 
                else if (currentRadius === 2) currentRadius = 1; 
            }
        } else {
            for (let ly = localY + trunkH - 3; ly <= localY + trunkH + 1; ly++) {
                let radius = (ly > localY + trunkH - 1) ? 1 : 2; 
                for (let lx = -radius; lx <= radius; lx++) {
                    for (let lz = -radius; lz <= radius; lz++) {
                        if (Math.abs(lx) === radius && Math.abs(lz) === radius) {
                            let trimChance = (ly === localY + trunkH + 1) ? 1.0 : (ly === localY + trunkH) ? 0.75 : 0.2;
                            if (getDeterministicRandom(localX + lx, ly, localZ + lz) < trimChance) continue;
                        }
                        if (lx === 0 && lz === 0 && ly < localY + trunkH) continue;
                        setLocalB(localX + lx, ly, localZ + lz, leavesType);
                    }
                }
            }
        }
    };

    for (let t of treesToSpawn) placeTreeIntoBlocks(t.x, t.actualY - minworldY + 1, t.z, t.treeType);

    for (let [key, t] of treeOverhangs.entries()) {
        let [gx, gy, gz] = key.split(',').map(Number);
        if (gx >= startX && gx < startX + chunkSize && gz >= startZ && gz < startZ + chunkSize) {
            let lx = gx - startX;
            let lz = gz - startZ;
            let ly = gy - minworldY;
            if (ly >= 0 && ly < worldHeight) {
                let idx = getIdx(lx, ly, lz);
                let currentB = blocks[idx];
                if (currentB === 0 || currentB === TYPE.snow || isTransparent[currentB]) {
                    blocks[idx] = t;
                }
            }
        }
    }

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let gx = startX + x;
                let gy = y + minworldY;
                let gz = startZ + z;
                let key = `${gx},${gy},${gz}`;
                let idx = getIdx(x, y, z);
                
                if (brokenBlocks.has(key)) {
                    blocks[idx] = 0;
                } else if (placedBlocks.has(key)) {
                    let typeData = placedBlocks.get(key);
                    blocks[idx] = typeof typeData === 'object' ? typeData.type : typeData;
                }
            }
        }
    }

    const lightMap = computeChunkLight(blocks);

    const uniqueTypes = new Set();
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i] !== 0) uniqueTypes.add(blocks[i]);
    }
    
    for (let typeId of uniqueTypes) {
        let bName = REVERSE_TYPE[typeId];
        if (!customGeometries[bName]) await loadCustomModel(bName);
    }

    const meshes = {};
    const indices = {};
    
    for (let typeId of uniqueTypes) {
        let bName = REVERSE_TYPE[typeId];
        let geo = customGeometries[bName];
        let mat = materials[bName];
        let cap = getBlockCapacity(bName);
        
        meshes[bName] = new THREE.InstancedMesh(geo, mat, cap);
        meshes[bName].name = bName;
        meshes[bName].chunkId = chunkId;
        meshes[bName].maxCapacity = cap;
        meshes[bName].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        meshes[bName].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
        indices[bName] = 0;
    }

    const matrix = new THREE.Matrix4();
    const colorObj = new THREE.Color();
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;
                let actualY = y + minworldY;

                const isOpen = (nx, ny, nz) => {
                    if (ny < 0 || ny >= worldHeight) return true;
                    if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize) {
                        let b = blocks[getIdx(nx, ny, nz)];
                        return b === 0 || isTransparent[b];
                    }
                    let gb = getGlobalBlock(startX + nx, ny + minworldY, startZ + nz);
                    if (gb === null) return true; 
                    return gb === 0 || isTransparent[gb];
                };

                let isVisible = isOpen(x-1, y, z) || isOpen(x+1, y, z) ||
                                isOpen(x, y-1, z) || isOpen(x, y+1, z) ||
                                isOpen(x, y, z-1) || isOpen(x, y, z+1);

                if (isVisible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (meshes[bName] && indices[bName] < meshes[bName].maxCapacity) {
                        
                        let maxAdjLight = 0;
                        let selfBlock = blocks[getIdx(x, y, z)];
                        
                        if (isTransparent[selfBlock]) {
                            maxAdjLight = lightMap[getIdx(x, y, z)];
                        } else {
                            const checkL = (nx, ny, nz) => {
                                if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize && ny >= 0 && ny < worldHeight) {
                                    let nIdx = getIdx(nx, ny, nz);
                                    if (blocks[nIdx] === 0 || isTransparent[blocks[nIdx]]) {
                                        maxAdjLight = Math.max(maxAdjLight, lightMap[nIdx]);
                                    }
                                } else {
                                    let gy = ny + minworldY;
                                    let gb = getGlobalBlock(startX + nx, gy, startZ + nz);
                                    if (gb === null || gb === 0 || isTransparent[gb]) {
                                        maxAdjLight = Math.max(maxAdjLight, gy > 62 ? 15 : 0);
                                    }
                                }
                            };
                            
                            checkL(x-1, y, z); checkL(x+1, y, z);
                            checkL(x, y-1, z); checkL(x, y+1, z);
                            checkL(x, y, z-1); checkL(x, y, z+1);
                        }

                        let lightLevel = Math.max(0.05, maxAdjLight / 15.0);
                        lightLevel = Math.pow(lightLevel, 1.4); 
                        lightLevel = Math.max(0.08, lightLevel);
                        colorObj.setRGB(lightLevel, lightLevel, lightLevel);

                        let rot = [0, 0, 0];
                        let blockKey = `${startX + x},${actualY},${startZ + z}`;
                        
                        if (placedBlocks.has(blockKey)) {
                            let placed = placedBlocks.get(blockKey);
                            if (typeof placed === 'object' && placed.rotation) {
                                rot = placed.rotation;
                            }
                        } else {
                            if (['grass_block', 'stone', 'dirt', 'coarse_dirt', 'sand', 'red_sand', 'deepslate', 'bedrock', 'netherrack', 'end_stone'].includes(bName)) {
                                let rHash = Math.floor(getDeterministicRandom(startX + x, actualY, startZ + z) * 4);
                                rot = [0, rHash * (Math.PI / 2), 0];
                            }
                        }

                        matrix.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
                        matrix.setPosition(startX + x, actualY, startZ + z);
                        meshes[bName].setMatrixAt(indices[bName], matrix);
                        meshes[bName].setColorAt(indices[bName], colorObj); 
                        indices[bName]++;
                    }
                }
            }
        }
    }

    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        if (meshes[key].instanceColor) meshes[key].instanceColor.needsUpdate = true;
        meshes[key].computeBoundingSphere(); 
        scene.add(meshes[key]);
        interactableMeshes.push(meshes[key]);
    }
    
    activeChunks[chunkId] = { meshes, blocks, treesToSpawn };
}

async function rebuildChunkGeometry(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    const chunkData = activeChunks[chunkId];
    if (!chunkData || chunkData.pending) return;

    const { meshes, blocks } = chunkData;
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    const getIdx = (x, y, z) => x + z * chunkSize + y * (chunkSize * chunkSize);

    const lightMap = computeChunkLight(blocks);

    const uniqueTypes = new Set();
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i] !== 0) uniqueTypes.add(blocks[i]);
    }

    for (let typeId of uniqueTypes) {
        let bName = REVERSE_TYPE[typeId];
        if (!customGeometries[bName]) await loadCustomModel(bName);
        
        if (!meshes[bName]) {
            let geo = customGeometries[bName];
            let mat = materials[bName];
            let cap = getBlockCapacity(bName);
            meshes[bName] = new THREE.InstancedMesh(geo, mat, cap);
            meshes[bName].name = bName;
            meshes[bName].chunkId = chunkId;
            meshes[bName].maxCapacity = cap;
            meshes[bName].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            meshes[bName].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
            scene.add(meshes[bName]);
            interactableMeshes.push(meshes[bName]);
        }
    }

    const indices = {};
    for (const key in meshes) indices[key] = 0;

    const matrix = new THREE.Matrix4();
    const colorObj = new THREE.Color();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let typeId = blocks[getIdx(x, y, z)];
                if (typeId === 0) continue;

                let globalX = startX + x;
                let actualY = y + minworldY;
                let globalZ = startZ + z;

                if (brokenBlocks.has(`${globalX},${actualY},${globalZ}`)) continue;

                const isOpen = (nx, ny, nz) => {
                    if (ny < 0 || ny >= worldHeight) return true;
                    if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize) {
                        let b = blocks[getIdx(nx, ny, nz)];
                        return b === 0 || isTransparent[b];
                    }
                    let gb = getGlobalBlock(startX + nx, ny + minworldY, startZ + nz);
                    if (gb === null) return true; 
                    return gb === 0 || isTransparent[gb];
                };

                let isVisible = isOpen(x-1, y, z) || isOpen(x+1, y, z) ||
                                isOpen(x, y-1, z) || isOpen(x, y+1, z) ||
                                isOpen(x, y, z-1) || isOpen(x, y, z+1);

                if (isVisible) {
                    let bName = REVERSE_TYPE[typeId];
                    if (meshes[bName] && indices[bName] < meshes[bName].maxCapacity) {
                        
                        let maxAdjLight = 0;
                        let selfBlock = blocks[getIdx(x, y, z)];
                        
                        if (isTransparent[selfBlock]) {
                            maxAdjLight = lightMap[getIdx(x, y, z)];
                        } else {
                            const checkL = (nx, ny, nz) => {
                                if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize && ny >= 0 && ny < worldHeight) {
                                    let nIdx = getIdx(nx, ny, nz);
                                    if (blocks[nIdx] === 0 || isTransparent[blocks[nIdx]]) {
                                        maxAdjLight = Math.max(maxAdjLight, lightMap[nIdx]);
                                    }
                                } else {
                                    let gy = ny + minworldY;
                                    let gb = getGlobalBlock(startX + nx, gy, startZ + nz);
                                    if (gb === null || gb === 0 || isTransparent[gb]) {
                                        maxAdjLight = Math.max(maxAdjLight, gy > 62 ? 15 : 0);
                                    }
                                }
                            };
                            
                            checkL(x-1, y, z); checkL(x+1, y, z);
                            checkL(x, y-1, z); checkL(x, y+1, z);
                            checkL(x, y, z-1); checkL(x, y, z+1);
                        }

                        let lightLevel = Math.max(0.05, maxAdjLight / 15.0);
                        lightLevel = Math.pow(lightLevel, 1.4);
                        lightLevel = Math.max(0.08, lightLevel);
                        colorObj.setRGB(lightLevel, lightLevel, lightLevel);

                        let rot = [0, 0, 0];
                        let blockKey = `${globalX},${actualY},${globalZ}`;
                        
                        if (placedBlocks.has(blockKey)) {
                            let placed = placedBlocks.get(blockKey);
                            if (typeof placed === 'object' && placed.rotation) {
                                rot = placed.rotation;
                            }
                        } else {
                            if (['grass_block', 'stone', 'dirt', 'coarse_dirt', 'sand', 'red_sand', 'deepslate', 'bedrock', 'netherrack', 'end_stone'].includes(bName)) {
                                let rHash = Math.floor(getDeterministicRandom(globalX, actualY, globalZ) * 4);
                                rot = [0, rHash * (Math.PI / 2), 0];
                            }
                        }

                        matrix.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
                        matrix.setPosition(globalX, actualY, globalZ);
                        meshes[bName].setMatrixAt(indices[bName], matrix);
                        meshes[bName].setColorAt(indices[bName], colorObj);
                        indices[bName]++;
                    }
                }
            }
        }
    }

    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        if (meshes[key].instanceColor) meshes[key].instanceColor.needsUpdate = true;
        meshes[key].computeBoundingSphere(); 
    }
}

// ----------------------------------------------------
// Solar & Sky Mechanics (Day / Night Simulation)
// ----------------------------------------------------
let timeOfDay = Math.PI / 2; 
const dayCycleSpeed = Math.PI / 600; 

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffee, 0.8);
scene.add(sunLight);

const sunGeo = new THREE.BoxGeometry(6, 6, 6);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa }); 
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

const moonLight = new THREE.DirectionalLight(0xaaccff, 0.2); 
scene.add(moonLight);

const moonGeo = new THREE.BoxGeometry(4, 4, 4);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

const starsGeo = new THREE.BufferGeometry();
const starVertices = [];
for(let i=0; i<1500; i++) {
    let x = THREE.MathUtils.randFloatSpread(300);
    let y = THREE.MathUtils.randFloatSpread(300);
    let z = THREE.MathUtils.randFloatSpread(300);
    if(Math.abs(x) > 50 || Math.abs(y) > 50 || Math.abs(z) > 50) {
        starVertices.push(x, y, z);
    }
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starsMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.8, transparent: true, opacity: 0}); 
const starsMesh = new THREE.Points(starsGeo, starsMat);
scene.add(starsMesh);

function updateDayNightCycle(delta) {
    timeOfDay += delta * dayCycleSpeed;
    if (timeOfDay > Math.PI * 2) timeOfDay -= Math.PI * 2;

    const orbitRadius = 150;
    
    sunMesh.position.x = camera.position.x + Math.cos(timeOfDay) * orbitRadius;
    sunMesh.position.y = camera.position.y + Math.sin(timeOfDay) * orbitRadius;
    sunMesh.position.z = camera.position.z + 50; 
    sunLight.position.copy(sunMesh.position);

    moonMesh.position.x = camera.position.x + Math.cos(timeOfDay + Math.PI) * orbitRadius;
    moonMesh.position.y = camera.position.y + Math.sin(timeOfDay + Math.PI) * orbitRadius;
    moonMesh.position.z = camera.position.z + 50;
    moonLight.position.copy(moonMesh.position);

    starsMesh.position.copy(camera.position);
    starsMesh.rotation.z = timeOfDay * 0.5;

    let cycle = Math.sin(timeOfDay); 
    let skyColor = new THREE.Color();

    if (cycle > 0.2) { 
        skyColor.setHex(0x87ceeb); 
        ambientLight.intensity = 0.5;
        sunLight.intensity = 0.8;
        moonLight.intensity = 0;
        starsMat.opacity = 0; 
    } 
    else if (cycle > 0.0) { 
        let interp = cycle / 0.2; 
        skyColor.setHex(0xffaa00).lerp(new THREE.Color(0x87ceeb), interp); 
        ambientLight.intensity = 0.2 + (0.3 * interp);
        sunLight.intensity = 0.8 * interp; 
        moonLight.intensity = 0;
        starsMat.opacity = 1 - interp; 
    } 
    else if (cycle > -0.2) { 
        let interp = Math.abs(cycle) / 0.2; 
        skyColor.setHex(0xffaa00).lerp(new THREE.Color(0x000011), interp); 
        ambientLight.intensity = 0.2 - (0.1 * interp);
        sunLight.intensity = 0;
        moonLight.intensity = 0.2 * interp; 
        starsMat.opacity = interp;
    } 
    else { 
        skyColor.setHex(0x000011); 
        ambientLight.intensity = 0.1; 
        sunLight.intensity = 0;
        moonLight.intensity = 0.2;
        starsMat.opacity = 1; 
    }

    scene.fog.color.copy(skyColor);
    renderer.setClearColor(skyColor);
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
            const id = `${x},${z}`;
            chunksToKeep.add(id);
            if (!activeChunks[id] && !chunkQueue.includes(id)) chunkQueue.push(id);
        }
    }

    for (const id in activeChunks) {
        if (!chunksToKeep.has(id)) {
            if (activeChunks[id].pending) continue; 
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
// Player Movement, Physics, Placing & Destroying Blocks
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
let isLeftMouseDown = false; 

const raycaster = new THREE.Raycaster(); raycaster.far = 6;
let mining = { active: false, startTime: 0, targetMesh: null, targetId: null, requiredTime: 500 };

const droppedItems = [];
const itemGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);

function spawnDroppedItem(x, y, z, blockName) {
    if (!materials[blockName]) return; 
    let mat = Array.isArray(materials[blockName]) ? materials[blockName][0] : materials[blockName];

    const mesh = new THREE.Mesh(itemGeometry, mat);
    mesh.position.set(x, y, z);
    
    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        3 + Math.random() * 2,
        (Math.random() - 0.5) * 4
    );

    scene.add(mesh);
    droppedItems.push({ mesh, velocity, blockName, lifeTime: 0 });
}

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
    const blockName = hit.object.name;
    const heldItemType = inventory[selectedSlot].type;
    
    const requiredTime = calculateMiningTime(blockName, heldItemType);
    if (requiredTime === Infinity) return; 

    mining = { active: true, startTime: Date.now(), targetMesh: hit.object, targetId: hit.instanceId, requiredTime: requiredTime };
    destroyMat.map = destroyTextures[0]; destroyMat.needsUpdate = true;
    const mat = new THREE.Matrix4(); hit.object.getMatrixAt(hit.instanceId, mat);
    destroyMesh.position.setFromMatrixPosition(mat);
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
        return;
    }

    const elapsed = Date.now() - mining.startTime;
    const phase = Math.floor(Math.min(elapsed / mining.requiredTime, 1.0) * 9.99); 
    if (destroyMat.map !== destroyTextures[phase]) { 
        destroyMat.map = destroyTextures[phase]; 
        destroyMat.needsUpdate = true; 
    }

    if (elapsed >= mining.requiredTime) {
        const mat = new THREE.Matrix4(); 
        mining.targetMesh.getMatrixAt(mining.targetId, mat);
        const p = new THREE.Vector3().setFromMatrixPosition(mat);
        const blockName = mining.targetMesh.name; 
        
        let pX = Math.round(p.x); let pY = Math.round(p.y); let pZ = Math.round(p.z);
        setGlobalBlock(pX, pY, pZ, 0);
        
        const heldItemType = inventory[selectedSlot].type;
        const harvestable = canHarvestBlock(blockName, heldItemType);

        if (harvestable) {
            const dropData = BLOCK_DROPS[blockName];

            if (dropData !== null) {
                const item = dropData?.item || blockName;
                let count = dropData?.count || 1;

                if (typeof count === 'function') count = count();

                for (let i = 0; i < count; i++) {
                    spawnDroppedItem(p.x, p.y, p.z, item);
                }
            }
        }
        
        if (mining.targetMesh && mining.targetMesh.chunkId) {
            chunksToRebuild.add(mining.targetMesh.chunkId);
        }
        
        // Breaking a block might disconnect an adjacent stair, trigger neighbor rebuilds
        updateStairConnections(pX+1, pY, pZ);
        updateStairConnections(pX-1, pY, pZ);
        updateStairConnections(pX, pY, pZ+1);
        updateStairConnections(pX, pY, pZ-1);

        mining.active = false;
        destroyMesh.visible = false;
    }
}

function isPlayerCollidingWithBlock(bx, by, bz, blockName) {
    if (CROSS_BLOCKS.has(blockName)) return false;

    const playerMinX = camera.position.x - 0.3;
    const playerMaxX = camera.position.x + 0.3;
    const playerMinY = camera.position.y - 1.6;
    const playerMaxY = camera.position.y + 0.2;
    const playerMinZ = camera.position.z - 0.3;
    const playerMaxZ = camera.position.z + 0.3;

    const blockMinX = bx - 0.5;
    const blockMaxX = bx + 0.5;
    const blockMinY = by - 0.5;
    const blockMaxY = by + 0.5;
    const blockMinZ = bz - 0.5;
    const blockMaxZ = bz + 0.5;

    return (playerMinX < blockMaxX && playerMaxX > blockMinX) &&
           (playerMinY < blockMaxY && playerMaxY > blockMinY) &&
           (playerMinZ < blockMaxZ && playerMaxZ > blockMinZ);
}

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#creative-inventory-screen') || e.target.closest('#hotbar')) return; 
    
    if (!document.pointerLockElement && creativeInventoryScreen.style.display === 'none') {
        renderer.domElement.requestPointerLock();
    } else if (document.pointerLockElement) {
        if (e.button === 0) {
            isLeftMouseDown = true; 
        } else if (e.button === 2) { 
            const hit = getTarget(); 
            if (!hit) return;
            
            const mat = new THREE.Matrix4(); 
            hit.object.getMatrixAt(hit.instanceId, mat);
            const p = new THREE.Vector3().setFromMatrixPosition(mat);
            
            const placeX = Math.round(p.x + hit.face.normal.x);
            const placeY = Math.round(p.y + hit.face.normal.y);
            const placeZ = Math.round(p.z + hit.face.normal.z);
            
            const selectedItem = inventory[selectedSlot];
            
            if (selectedItem.type && getGlobalBlock(placeX, placeY, placeZ) === 0) {
                if (!isPlayerCollidingWithBlock(placeX, placeY, placeZ, selectedItem.type)) {
                    
                    let rotation = [0, 0, 0];
                    let t = selectedItem.type;
                    let stairData = null;
                    
                    if (t.includes('log') || t.includes('pillar') || t === 'basalt' || t === 'polished_basalt' || t === 'bone_block' || t === 'purpur_pillar' || t === 'quartz_pillar' || t === 'hay_block') {
                        let axis = 'y';
                        if (Math.abs(hit.face.normal.x) > 0.5) axis = 'x';
                        if (Math.abs(hit.face.normal.z) > 0.5) axis = 'z';
                        rotation = JSONReader.getRotationForAxis(axis);
                    } 
                    else if (t.includes('stairs')) {
                        let ry = yaw % (Math.PI * 2);
                        if (ry < 0) ry += Math.PI * 2;
                        
                        let facing = 0;
                        if (ry >= 7*Math.PI/4 || ry < Math.PI/4) facing = 1; // North
                        else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) facing = 2; // West
                        else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) facing = 3; // South
                        else facing = 0; // East

                        let isTop = (hit.face.normal.y === -1 || (hit.face.normal.y === 0 && hit.point.y - Math.floor(hit.point.y) > 0.5));
                        
                        stairData = { isStair: true, facing: facing, half: isTop ? 'top' : 'bottom' };
                    }
                    else if (t.includes('furnace') || t === 'chest' || t === 'carved_pumpkin' || t === 'jack_o_lantern' || t === 'loom' || t === 'observer' || t === 'dispenser' || t === 'dropper') {
                        let ry = yaw % (Math.PI * 2);
                        if (ry < 0) ry += Math.PI * 2;
                        
                        let rotY = 0;
                        if (ry >= 7*Math.PI/4 || ry < Math.PI/4) rotY = Math.PI; 
                        else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) rotY = -Math.PI/2; 
                        else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) rotY = 0; 
                        else rotY = Math.PI/2; 
                        
                        rotation = [0, rotY, 0];
                    }
                    
                    let placedData = { type: TYPE[selectedItem.type], rotation: rotation };
                    if (stairData) placedData = { ...placedData, ...stairData };
                    
                    setGlobalBlock(placeX, placeY, placeZ, placedData);
                    
                    // If it's a stair, actively calculate corners for it and all adjacent blocks!
                    if (stairData) {
                        updateStairConnections(placeX, placeY, placeZ);
                    }
                    
                    selectedItem.count--;
                    if (selectedItem.count <= 0) {
                        selectedItem.type = null;
                        selectedItem.count = 0;
                    }
                    updateInventoryUI();
                }
            }
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isLeftMouseDown = false;
        mining.active = false;
        destroyMesh.visible = false;
    }
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        yaw -= e.movementX * 0.002;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - e.movementY * 0.002));
    }
});

window.addEventListener('keydown', (e) => {
    // Only capture movement keys if we aren't typing in the search bar
    if (document.activeElement !== searchInput) {
        keys[e.key.toLowerCase()] = true;
    }
    
    if (e.key.toLowerCase() === 'e') {
        if (document.activeElement === searchInput) {
            // If typing 'e' in search, do nothing (let it type)
            return;
        }
        
        if (creativeInventoryScreen.style.display === 'none') {
            creativeInventoryScreen.style.display = 'flex';
            crosshair.style.display = 'none';
            document.exitPointerLock();
            keys = {}; 
            populateCreativeGrid();
        } else {
            creativeInventoryScreen.style.display = 'none';
            crosshair.style.display = 'block';
            
            if (heldItem.type) {
                // Drop held item if closing inventory
                heldItem = { type: null, count: 0 };
                updateInventoryUI();
            }
            renderer.domElement.requestPointerLock();
        }
    }

    if (e.key >= '1' && e.key <= '9' && creativeInventoryScreen.style.display === 'none') {
        selectedSlot = parseInt(e.key) - 1;
        updateInventoryUI();
    }
});

window.addEventListener('keyup', (e) => {
    if (document.activeElement !== searchInput) {
        keys[e.key.toLowerCase()] = false;
    }
});

let lastScrollTime = 0; 
window.addEventListener('wheel', (e) => {
    if (document.pointerLockElement && creativeInventoryScreen.style.display === 'none') {
        const now = Date.now();
        if (now - lastScrollTime < 50) return; 
        lastScrollTime = now;

        if (e.deltaY > 0) {
            selectedSlot = (selectedSlot + 1) % 9;
        } else {
            selectedSlot = (selectedSlot - 1 + 9) % 9;
        }
        updateInventoryUI();
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------------------------------------------
// Core Update Loop
// ----------------------------------------------------
let isGeneratingChunk = false;
let isRebuildingChunk = false;

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta(); 
    
    if (delta > 0.1) delta = 0.1;

    updateChunks();
    updateDayNightCycle(delta); 

    const deltaMs = delta * 1000;
    for (let anim of animatedTextures) {
        anim.timer += deltaMs;
        
        let currentFrameData = anim.frames[anim.currentArrayIdx];
        let tickDuration = anim.defaultTickRate;
        
        if (typeof currentFrameData === 'object') {
            tickDuration = currentFrameData.time;
        }
        
        const frameDurationMs = Math.max(1, tickDuration * 50); 
        let frameChanged = false;

        if (anim.timer >= frameDurationMs) {
            let framesToAdvance = Math.floor(anim.timer / frameDurationMs);
            anim.timer = anim.timer % frameDurationMs; 
            anim.currentArrayIdx = (anim.currentArrayIdx + framesToAdvance) % anim.frames.length;
            frameChanged = true;
        }

        if (anim.interpolate || frameChanged) {
            let nextArrayIdx = (anim.currentArrayIdx + 1) % anim.frames.length;
            
            let cData = anim.frames[anim.currentArrayIdx];
            let nData = anim.frames[nextArrayIdx];
            
            let cIndex = typeof cData === 'object' ? cData.index : cData;
            let nIndex = typeof nData === 'object' ? nData.index : nData;
            
            let fw = anim.frameWidth;
            
            anim.ctx.clearRect(0, 0, fw, fw);
            
            anim.ctx.globalAlpha = 1.0;
            anim.ctx.drawImage(anim.sourceImage, 0, cIndex * fw, fw, fw, 0, 0, fw, fw);
            
            if (anim.interpolate) {
                let fadeRatio = anim.timer / frameDurationMs;
                anim.ctx.globalAlpha = fadeRatio;
                anim.ctx.drawImage(anim.sourceImage, 0, nIndex * fw, fw, fw, 0, 0, fw, fw);
            }
            
            anim.texture.needsUpdate = true;
        }
    }

    if (chunkQueue.length > 0 && !isGeneratingChunk) {
        isGeneratingChunk = true;
        const next = chunkQueue.shift();
        const [cx, cz] = next.split(',').map(Number);
        generateChunk(cx, cz).then(() => { isGeneratingChunk = false; });
    }

    if (isLeftMouseDown && !mining.active && document.pointerLockElement && creativeInventoryScreen.style.display === 'none') {
        const hit = getTarget();
        if (hit) startMining(hit);
    }

    updateMining();
    doRandomTicks();

    if (chunksToRebuild.size > 0 && !isRebuildingChunk) {
        isRebuildingChunk = true;
        const chunkId = chunksToRebuild.values().next().value;
        chunksToRebuild.delete(chunkId);
        let [cx, cz] = chunkId.split(',').map(Number);
        rebuildChunkGeometry(cx, cz).then(() => { isRebuildingChunk = false; });
    }
    
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        let item = droppedItems[i];
        item.lifeTime += delta;
        
        item.velocity.y -= 15 * delta; 
        
        let nx = item.mesh.position.x + item.velocity.x * delta;
        let ny = item.mesh.position.y + item.velocity.y * delta;
        let nz = item.mesh.position.z + item.velocity.z * delta;

        let bX = Math.round(nx);
        let bY = Math.round(ny - 0.25); 
        let bZ = Math.round(nz);

        let blockBelow = getGlobalBlock(bX, bY, bZ);

        if (blockBelow === null) {
            item.velocity.set(0, 0, 0);
            nx = item.mesh.position.x;
            ny = item.mesh.position.y;
            nz = item.mesh.position.z;
        } 
        else if (blockBelow !== 0) {
            ny = bY + 0.5 + 0.125; 
            item.velocity.y = 0;
            item.velocity.x *= 0.5; 
            item.velocity.z *= 0.5;
        } 
        else {
            let wallBlock = getGlobalBlock(bX, Math.round(ny), bZ);
            if (wallBlock !== 0 && wallBlock !== null) {
                item.velocity.x *= -0.5; 
                item.velocity.z *= -0.5;
                nx = item.mesh.position.x;
                nz = item.mesh.position.z;
            }
        }

        item.mesh.position.set(nx, ny, nz);
        item.mesh.rotation.y += delta * 2;
        
        if (item.velocity.y === 0) {
            item.mesh.position.y += Math.sin(item.lifeTime * 4) * 0.002;
        }
        
        const dist = camera.position.distanceTo(item.mesh.position);
        if (dist < 1.5) {
            scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            droppedItems.splice(i, 1);
            addItemToInventory(item.blockName, 1);
        } else if (item.mesh.position.y < minworldY - 20) {
            scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            droppedItems.splice(i, 1);
        }
    }

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