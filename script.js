const BLOCK_TEX_DIR = 'assets/minecraft/textures/block/';
const ITEM_TEX_DIR = 'assets/minecraft/textures/item/';
const GUI_TEX_DIR = 'assets/minecraft/textures/gui/container/creative_inventory/';
const GUI_WIDGETS_DIR = 'assets/minecraft/textures/gui/';
const SPRITE_CREATIVE_DIR = 'assets/minecraft/textures/gui/sprites/container/creative_inventory/';
const SPRITE_HUD_DIR = 'assets/minecraft/textures/gui/sprites/hud/';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.shadowMap.enabled = false; 
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const moveSpeed = 10;
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Render at perfect 64x64 to match MC's GUI scale constraints and avoid browser downscaling blur!
const iconRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
iconRenderer.setSize(64, 64);
iconRenderer.setPixelRatio(1);
const iconScene = new THREE.Scene();
// Adjusted the camera boundaries from 0.8 down to 0.55 so blocks appear larger in the inventory!
const iconCamera = new THREE.OrthographicCamera(-0.55, 0.55, 0.55, -0.55, 0.1, 10);
iconCamera.position.set(0, 0, 5); 
iconCamera.lookAt(0, 0, 0);

// Accurate Minecraft GUI Orthographic Lighting
iconScene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(-1, 2, 1); 
iconScene.add(dirLight);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(1, 0.5, 1); 
iconScene.add(dirLight2);

// Environment Lighting & Celestial Bodies
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffee, 0.8);
scene.add(sunLight);
const moonLight = new THREE.DirectionalLight(0xaaccff, 0.2);
scene.add(moonLight);

const sunGeo = new THREE.PlaneGeometry(30, 30);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, side: THREE.DoubleSide, fog: false });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

const moonGeo = new THREE.PlaneGeometry(20, 20);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff, side: THREE.DoubleSide, fog: false });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

const starsGeo = new THREE.BufferGeometry();
const starsPos = new Float32Array(1000 * 3);
for(let i=0; i<3000; i++) starsPos[i] = (Math.random() - 0.5) * 400;
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true });
const starsMesh = new THREE.Points(starsGeo, starsMat);
scene.add(starsMesh);

// ============================================================================
// 2. REGISTRIES (BLOCKS, ITEMS, TYPES)
// ============================================================================
const ITEMS = [
    'apple', 'arrow', 'baked_potato', 'beef', 'blaze_powder', 'blaze_rod', 'bone', 'bone_meal', 'book', 'bow', 'bowl', 'bread', 'brick', 'bucket', 'carrot', 'charcoal', 'chicken', 'clay_ball', 'clock', 'coal', 'compass', 'cooked_beef', 'cooked_chicken', 'cooked_cod', 'cooked_mutton', 'cooked_porkchop', 'cooked_rabbit', 'cooked_salmon', 'cookie', 'copper_ingot', 'diamond', 'diamond_axe', 'diamond_boots', 'diamond_chestplate', 'diamond_helmet', 'diamond_hoe', 'diamond_leggings', 'diamond_pickaxe', 'diamond_shovel', 'diamond_sword', 'egg', 'emerald', 'ender_eye', 'ender_pearl', 'feather', 'flint', 'flint_and_steel', 'glowstone_dust', 'gold_ingot', 'gold_nugget', 'golden_apple', 'golden_axe', 'golden_boots', 'golden_chestplate', 'golden_helmet', 'golden_hoe', 'golden_leggings', 'golden_pickaxe', 'golden_shovel', 'golden_sword', 'gunpowder', 'iron_axe', 'iron_boots', 'iron_chestplate', 'iron_helmet', 'iron_hoe', 'iron_ingot', 'iron_leggings', 'iron_nugget', 'iron_pickaxe', 'iron_shovel', 'iron_sword', 'lapis_lazuli', 'leather', 'melon_slice', 'netherite_axe', 'netherite_boots', 'netherite_chestplate', 'netherite_helmet', 'netherite_hoe', 'netherite_leggings', 'netherite_pickaxe', 'netherite_shovel', 'netherite_sword', 'painting', 'paper', 'porkchop', 'potato', 'quartz', 'raw_copper', 'raw_gold', 'raw_iron', 'redstone', 'rotten_flesh', 'saddle', 'slime_ball', 'snowball', 'stick', 'stone_axe', 'stone_hoe', 'stone_pickaxe', 'stone_shovel', 'stone_sword', 'string', 'sugar', 'wheat', 'wooden_axe', 'wooden_hoe', 'wooden_pickaxe', 'wooden_shovel', 'wooden_sword', 'creeper_head', 'zombie_head', 'skeleton_skull', 'wither_skeleton_skull', 'player_head', 'dragon_head', 'command_block', 'oak_sign', 'sweet_berries',
    'angler_pottery_sherd', 'archer_pottery_sherd', 'arms_up_pottery_sherd', 'blade_pottery_sherd', 'brewer_pottery_sherd', 'burn_pottery_sherd', 'danger_pottery_sherd', 'explorer_pottery_sherd', 'friend_pottery_sherd', 'heart_pottery_sherd', 'heartbreak_pottery_sherd', 'howl_pottery_sherd', 'miner_pottery_sherd', 'mourner_pottery_sherd', 'plenty_pottery_sherd', 'prize_pottery_sherd', 'sheaf_pottery_sherd', 'shelter_pottery_sherd', 'skull_pottery_sherd', 'snort_pottery_sherd'
];
const STRICT_ITEMS = new Set(ITEMS);

const flatItems = new Set([...STRICT_ITEMS]);
['creeper_head', 'zombie_head', 'skeleton_skull', 'wither_skeleton_skull', 'player_head', 'dragon_head', 'command_block'].forEach(k => flatItems.delete(k));

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
    'kelp', 'dried_kelp_block', 'turtle_egg', 'dead_brain_coral_block', 'dead_bubble_coral_block',
    'dead_fire_coral_block', 'dead_horn_coral_block', 'dead_tube_coral_block', 'tube_coral_block', 'brain_coral_block', 'bubble_coral_block',
    'fire_coral_block', 'horn_coral_block', 'blue_ice', 'conduit', 'bamboo', 'redstone_lamp', 'campfire', 'soul_campfire',
    'warped_wart_block', 'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines',
    'twisting_vines', 'crimson_fungus', 'warped_fungus', 'shroomlight', 'target', 'crying_obsidian', 'respawn_anchor',
    'blackstone', 'gilded_blackstone', 'polished_blackstone', 'chiseled_polished_blackstone', 'polished_blackstone_bricks',
    'cracked_polished_blackstone_bricks', 'amethyst_block', 'budding_amethyst', 'amethyst_cluster', 'tuff', 'calcite',
    'tinted_glass', 'powder_snow', 'sculk', 'sculk_vein', 'sculk_catalyst', 'sculk_shrieker', 'sculk_sensor',
    'calibrated_sculk_sensor', 'dripstone_block', 'pointed_dripstone', 'moss_block', 'moss_carpet', 'azalea',
    'flowering_azalea', 'hanging_roots', 'spore_blossom', 'glow_lichen', 'packed_mud', 'mud_bricks', 'mangrove_roots',
    'muddy_mangrove_roots', 'ochre_froglight', 'verdant_froglight', 'pearlescent_froglight', 'suspicious_sand',
    'suspicious_gravel', 'pink_petals', 'chiseled_bookshelf', 'decorated_pot', 'crafter', 'tuff_bricks', 'chiseled_tuff',
    'polished_tuff', 'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb',
    'trial_spawner', 'vault', 'heavy_core', 'snowy_grass_block', 'cobbled_deepslate', ...ITEMS
];

const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'crimson', 'warped', 'bamboo'];
const STONE_TYPES = ['stone', 'cobblestone', 'mossy_cobblestone', 'stone_brick', 'mossy_stone_brick', 'granite', 'diorite', 'andesite', 'sandstone', 'red_sandstone', 'brick', 'prismarine', 'dark_prismarine', 'nether_brick', 'end_stone_brick', 'blackstone', 'polished_blackstone', 'deepslate_brick', 'deepslate_tile', 'tuff', 'polished_tuff', 'mud_brick'];

const generatedBlocks = [...baseBlocks];

COLORS.forEach(c => {
    generatedBlocks.push(`${c}_wool`, `${c}_stained_glass`, `${c}_terracotta`, `${c}_concrete`, `${c}_concrete_powder`, `${c}_glazed_terracotta`, `${c}_carpet`, `${c}_stained_glass_pane`, `${c}_shulker_box`, `${c}_candle`);
});

WOODS.forEach(w => {
    let log = w === 'crimson' || w === 'warped' ? `${w}_stem` : w === 'bamboo' ? `${w}_block` : `${w}_log`;
    let wood = w === 'crimson' || w === 'warped' ? `${w}_hyphae` : w === 'bamboo' ? null : `${w}_wood`;
    let planks = `${w}_planks`;
    let leaves = w === 'crimson' ? 'nether_wart_block' : w === 'warped' ? 'warped_wart_block' : w === 'bamboo' ? null : `${w}_leaves`;
    let sapling = w === 'crimson' || w === 'warped' ? `${w}_fungus` : w === 'mangrove' ? `mangrove_propagule` : w === 'bamboo' ? `bamboo` : `${w}_sapling`;
    
    generatedBlocks.push(log, planks);
    if (wood) generatedBlocks.push(wood);
    if (leaves && !generatedBlocks.includes(leaves)) generatedBlocks.push(leaves);
    if (sapling && !generatedBlocks.includes(sapling)) generatedBlocks.push(sapling);
    generatedBlocks.push(`${w}_slab`, `${w}_stairs`, `${w}_fence`, `${w}_door`, `${w}_door_top`, `${w}_trapdoor`);
});

STONE_TYPES.forEach(st => {
    generatedBlocks.push(`${st}_slab`, `${st}_stairs`);
    if (st !== 'dark_prismarine' && st !== 'stone') generatedBlocks.push(`${st}_wall`);
});

generatedBlocks.push('iron_door', 'iron_door_top');

const allBaseBlocks = [...new Set(generatedBlocks)];
const extendedBlocks = [];
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
ALL_BLOCKS.forEach((b, i) => { let id = i + 1; TYPE[b] = id; REVERSE_TYPE.push(b); });

const CROSS_BLOCKS = new Set([
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 
    'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose', 'brown_mushroom', 'red_mushroom', 'fern', 'dead_bush', 
    'crimson_roots', 'warped_roots', 'nether_sprouts', 'weeping_vines', 'twisting_vines', 'sweet_berries', 'cobweb', 
    'tall_grass', 'large_fern', 'grass', 'short_grass'
]);
ALL_BLOCKS.forEach(b => { if (b.includes('sapling') || b.includes('propagule') || b.includes('shoot') || b.includes('fungus')) CROSS_BLOCKS.add(b); });

const TRANSPARENT_BLOCKS = new Set(['glass', 'ice', 'slime_block', 'beacon', 'sculk_shrieker', 'sculk_sensor', 'snow', 'cactus', 'spawner', 'vault', 'trial_spawner', 'heavy_core']);
const isTransparent = new Uint8Array(65535);
isTransparent[0] = 1; 
ALL_BLOCKS.forEach((b) => {
    if (CROSS_BLOCKS.has(b) || TRANSPARENT_BLOCKS.has(b) || 
        ['leaves', 'glass', 'door', 'trapdoor', 'fence', 'stairs', 'slab', 'wall', 'pane', 'candle', 'campfire', 'chest', 'lantern', 'torch', 'cobweb', 'chain', 'iron_bars', 'carpet', 'lily_pad', 'mushroom', 'sapling', 'roots', 'vines', 'coral', 'cactus', 'spawner', 'vault', 'trial_spawner', 'heavy_core', 'cluster', 'azalea', 'lilac', 'peony'].some(kw => b.includes(kw))) {
        isTransparent[TYPE[b]] = 1;
    }
});

const CATEGORIES = {
    building: { name: 'Building Blocks', icon: 'bricks', blocks: [] },
    colored: { name: 'Colored Blocks', icon: 'cyan_wool', blocks: [] },
    natural: { name: 'Natural Blocks', icon: 'grass_block', blocks: [] },
    functional: { name: 'Functional Blocks', icon: 'oak_sign', blocks: [] },
    redstone: { name: 'Redstone Blocks', icon: 'redstone', blocks: [] },
    misc: { name: 'Miscellaneous', icon: 'bookshelf', blocks: [] },
    search: { name: 'Search Items', icon: 'compass_tab', blocks: [] },
    tools: { name: 'Tools', icon: 'iron_pickaxe', blocks: [] },
    combat: { name: 'Combat', icon: 'iron_sword', blocks: [] },
    food: { name: 'Food & Drinks', icon: 'golden_apple', blocks: [] },
    materials: { name: 'Materials', icon: 'iron_ingot', blocks: [] },
    spawns: { name: 'Spawn Eggs', icon: 'creeper_head', blocks: [] },
    operator: { name: 'Operator Utilities', icon: 'command_block', blocks: [] },
    inventory: { name: 'Survival Inventory', icon: 'chest', blocks: [] }
};

ALL_BLOCKS.forEach(b => {
    if (b.includes('_inner') || b.includes('_outer') || b.includes('_top') || b === 'air') return;

    if (STRICT_ITEMS.has(b)) {
        if (b.includes('sword') || b.includes('bow') || b.includes('arrow') || b.includes('armor') || b.includes('helmet') || b.includes('chestplate') || b.includes('leggings') || b.includes('boots')) CATEGORIES.combat.blocks.push(b);
        else if (['apple', 'beef', 'bread', 'porkchop', 'potato', 'chicken', 'mutton', 'rabbit', 'salmon', 'cod', 'cookie', 'melon_slice'].some(k=>b.includes(k))) CATEGORIES.food.blocks.push(b);
        else if (b.includes('pickaxe') || b.includes('axe') || b.includes('shovel') || b.includes('hoe') || b === 'compass' || b === 'clock' || b === 'flint_and_steel') CATEGORIES.tools.blocks.push(b);
        else if (b.includes('head') || b.includes('skull') || b === 'egg') CATEGORIES.spawns.blocks.push(b);
        else if (b === 'command_block') CATEGORIES.operator.blocks.push(b);
        else CATEGORIES.materials.blocks.push(b);
    } else if (b.includes('wool') || b.includes('concrete') || b.includes('terracotta') || b.includes('stained_glass')) {
        CATEGORIES.colored.blocks.push(b);
    } else if (b.includes('redstone') || b.includes('piston') || b.includes('door') || b.includes('trapdoor') || b.includes('sensor') || b.includes('lamp')) {
        CATEGORIES.redstone.blocks.push(b);
    } else if (['chest', 'crafting_table', 'furnace', 'spawner', 'beacon', 'anvil', 'loom', 'shulker_box', 'sign'].some(kw => b.includes(kw))) {
        CATEGORIES.functional.blocks.push(b);
    } else if (['dirt', 'grass', 'sand', 'gravel', 'ore', 'log', 'leaves', 'sapling', 'coral', 'plant', 'flower', 'mushroom', 'sponge', 'bedrock', 'stone', 'granite', 'diorite', 'andesite', 'tuff', 'deepslate', 'ice', 'snow'].some(kw => b.includes(kw)) && !b.includes('bricks') && !b.includes('stairs') && !b.includes('slab')) {
        CATEGORIES.natural.blocks.push(b);
    } else {
        CATEGORIES.building.blocks.push(b);
    }
});

// ============================================================================
// 3. GLOBAL VARIABLES
// ============================================================================
let currentCategory = 'building';
let selectedSlot = 0;
let heldItem = { type: null, count: 0 };
let currentGuiScale = 2;
let currentCreativeRow = 0; // State variable tracking discrete row scrolling

const INVENTORY_SIZE = 9; 
const inventory = Array(INVENTORY_SIZE).fill(null).map(() => ({ type: null, count: 0 }));

inventory[0] = { type: 'stone', count: 64 };
inventory[1] = { type: 'dirt', count: 64 };
inventory[2] = { type: 'grass_block', count: 64 };
inventory[3] = { type: 'compass', count: 1 };
inventory[4] = { type: 'sculk_sensor', count: 64 };
inventory[5] = { type: 'acacia_stairs', count: 64 };
inventory[6] = { type: 'magma_block', count: 64 };
inventory[7] = { type: 'creeper_head', count: 64 };
inventory[8] = { type: 'diamond_pickaxe', count: 1 };

const activeChunks = {};
const chunkQueue = [];
const placedBlocks = new Map();
const brokenBlocks = new Set();
const treeOverhangs = new Map();
const chunksToRebuild = new Set();
const interactableMeshes = [];

const customGeometries = {};
const materials = {};
const iconCache = {};
const animatedTextures = [];
const allTabsUI = [];

// ============================================================================
// 4. TEXTURE LOADERS & PATH RESOLVERS
// ============================================================================
const imageLoader = new THREE.ImageLoader();
imageLoader.setCrossOrigin('anonymous');

function resolveTexturePath(name) {
    let folder = BLOCK_TEX_DIR;
    let filename = name;
    let is2D = false;

    // Explicitly 2D filtering for items, plants, foods, etc.
    const explicit2D = new Set([
        'torch', 'soul_torch', 'kelp', 'sweet_berries', 'ladder', 'glow_lichen', 'sculk_vein', 'seagrass',
        'candle', 'sea_pickle', 'bamboo', 'lilac', 'peony', 'turtle_egg', 'pink_petals', 'soul_campfire', 'campfire',
        'amethyst_cluster', 'pointed_dripstone', 'weeping_vines', 'twisting_vines', 'crimson_roots', 'warped_roots',
        'crimson_fungus', 'warped_fungus', 'nether_sprouts', 'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet',
        'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose',
        'brown_mushroom', 'red_mushroom', 'fern', 'dead_bush', 'tall_grass', 'large_fern', 'grass', 'short_grass',
        'oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling',
        'mangrove_propagule', 'cherry_sapling', 'pale_oak_sapling'
    ]);

    if (flatItems.has(name) || name === 'compass_tab' || (name.includes('door') && !name.includes('trapdoor')) || explicit2D.has(name) || name.includes('sign') || name.includes('pane')) {
        is2D = true;
    }

    if (is2D) {
        const itemFolderOverrides = ['kelp', 'sweet_berries', 'campfire', 'soul_campfire', 'bamboo', 'turtle_egg', 'weeping_vines', 'twisting_vines', 'pink_petals'];
        if (flatItems.has(name) || name === 'compass_tab' || (name.includes('door') && !name.includes('trapdoor')) || itemFolderOverrides.includes(name) || name.includes('sign')) {
            folder = ITEM_TEX_DIR;
        }
    }

    // Force strictly block directories for certain 2D items to fix 404s
    const blockFolderOverrides = ['ladder', 'glow_lichen', 'sculk_vein', 'seagrass', 'lily_pad', 'cobweb', 'vine', 'sprouts', 'chain', 'iron_bars', 'torch', 'soul_torch', 'poppy', 'dandelion', 'lily_of_the_valley', 'fungus', 'roots', 'fern', 'mushroom', 'sapling', 'allium', 'orchid', 'tulip', 'daisy', 'bluet', 'rose', 'sea_pickle', 'amethyst_cluster', 'pointed_dripstone', 'candle', 'propagule'];
    if (blockFolderOverrides.some(kw => name.includes(kw)) && !['weeping_vines', 'twisting_vines', 'pink_petals'].includes(name) && !name.includes('mangrove_roots')) {
        folder = BLOCK_TEX_DIR;
    }

    // Exact filename Overrides
    if (name === 'compass') filename = 'compass_00';
    else if (name === 'compass_tab') filename = 'compass_01';
    else if (name === 'redstone') { folder = ITEM_TEX_DIR; filename = 'redstone'; }
    else if (name === 'sweet_berries') { folder = ITEM_TEX_DIR; filename = 'sweet_berries'; }
    else if (name === 'rose_bush') { folder = BLOCK_TEX_DIR; filename = 'rose_bush_top'; }
    else if (name === 'large_fern') { folder = BLOCK_TEX_DIR; filename = 'large_fern_top'; }
    else if (name === 'tall_grass') { folder = BLOCK_TEX_DIR; filename = 'tall_grass_top'; }
    else if (name === 'grass' || name === 'short_grass') { folder = BLOCK_TEX_DIR; filename = 'short_grass'; }
    else if (name === 'clock') { folder = ITEM_TEX_DIR; filename = 'clock_00'; }
    else if (name.includes('pane')) { folder = BLOCK_TEX_DIR; filename = name.replace('_pane', ''); } 
    else if (name === 'flowering_azalea') { folder = BLOCK_TEX_DIR; filename = 'flowering_azalea_side'; }
    else if (name === 'sunflower') { folder = BLOCK_TEX_DIR; filename = 'sunflower_front'; } 
    else if (name === 'peony') { folder = BLOCK_TEX_DIR; filename = 'peony_top'; }
    else if (name === 'lilac') { folder = BLOCK_TEX_DIR; filename = 'lilac_top'; }
    else if (name.includes('candle') && !name.includes('cake')) { filename = name; } 

    return { folder, filename, is2D };
}

const loadTex = (filename, explicitFolder = null) => {
    if (!filename) filename = 'missingno';
    
    // Resolve robust path
    let { folder, filename: parsedFilename } = resolveTexturePath(filename);
    if (explicitFolder) folder = explicitFolder;

    const cvs = document.createElement('canvas');
    cvs.width = 16; cvs.height = 16;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false; // Strictly Disable CSS Blur Inside Canvas
    
    const t = new THREE.CanvasTexture(cvs);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;

    t.loadPromise = new Promise((resolve) => {
        imageLoader.load(
            `${folder}${parsedFilename}.png`,
            (image) => {
                const fw = image.width;
                const fh = image.height;
                if (fw === 0 || fh === 0) return resolve(t); 
                const totalFrames = Math.max(1, Math.floor(fh / fw));
                const isStandardSkin = ['creeper', 'zombie', 'skeleton', 'steve'].some(kw => parsedFilename.includes(kw));

                if (totalFrames > 1 && fh % fw === 0 && !isStandardSkin) {
                    cvs.width = fw; cvs.height = fw;
                    ctx.imageSmoothingEnabled = false;
                    t.needsUpdate = true;

                    let animData = {
                        texture: t, ctx: ctx, sourceImage: image,
                        frames: Array.from({length: totalFrames}, (_, i) => i),
                        defaultTickRate: 2, totalFrames: totalFrames,
                        currentArrayIdx: 0, timer: 0, interpolate: true, frameWidth: fw
                    };
                    animatedTextures.push(animData);
                    
                    ctx.drawImage(image, 0, 0, fw, fw, 0, 0, fw, fw);

                    fetch(`${folder}${parsedFilename}.png.mcmeta`).then(r => r.ok ? r.json() : null)
                    .then(mcmeta => {
                        if (mcmeta && mcmeta.animation) {
                            if (mcmeta.animation.frames) animData.frames = mcmeta.animation.frames;
                            if (mcmeta.animation.frametime) animData.defaultTickRate = mcmeta.animation.frametime;
                            if (mcmeta.animation.interpolate !== undefined) animData.interpolate = mcmeta.animation.interpolate;
                        }
                        resolve(t);
                    }).catch(e => { resolve(t); });
                } else {
                    cvs.width = isStandardSkin ? 64 : fw;
                    cvs.height = isStandardSkin ? 64 : fh;
                    ctx.imageSmoothingEnabled = false;
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

function resolveFallbackTexture(name) {
    if (!name) return 'stone';
    if (name === 'grass_block' || name === 'snowy_grass_block') return 'grass_block_side';
    if (name === 'chest') return 'oak_planks'; 
    if (name === 'crafting_table') return 'crafting_table_top';
    if (name === 'furnace') return 'furnace_front';
    if (name.includes('shulker_box')) return 'shulker_box';
    if (name.includes('anvil')) return 'anvil_base';
    if (name === 'packed_mud') return 'mud';
    
    // Correctly map mob heads and custom model overrides to their raw layout locations
    if (name === 'creeper_head') return '../entity/creeper/creeper';
    if (name === 'zombie_head') return '../entity/zombie/zombie';
    if (name === 'skeleton_skull') return '../entity/skeleton/skeleton';
    if (name === 'wither_skeleton_skull') return '../entity/skeleton/wither_skeleton';
    if (name === 'dragon_head') return '../entity/enderdragon/dragon';
    if (name === 'player_head') return '../entity/player/wide/steve';
    if (name === 'decorated_pot') return '../entity/decorated_pot/decorated_pot_side';
    
    return resolveTexturePath(name).filename;
}

function setFallbackBg(element, urls, configOnSuccess) {
    let i = 0;
    function tryNext() {
        if (i >= urls.length) return;
        let img = new Image();
        img.onload = () => {
            element.style.backgroundImage = `url(${urls[i]})`;
            if(configOnSuccess) configOnSuccess(i);
        };
        img.onerror = () => { i++; tryNext(); };
        img.src = urls[i];
    }
    tryNext();
}

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

async function loadCustomModel(bName) {
    if (customGeometries[bName]) return; 

    // Handle Skull Model generation overriding directly (avoid 404 fetching)
    const hardcodedModels = new Set(['creeper_head', 'zombie_head', 'skeleton_skull', 'wither_skeleton_skull', 'dragon_head', 'player_head']);
    if (hardcodedModels.has(bName)) {
        const fallbackName = resolveFallbackTexture(bName);
        const tex = loadTex(fallbackName);
        let mat = new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5 });
        
        const buildMCModel = (parts, tS) => {
            const geos = [];
            const px = 1/16;
            for (let p of parts) {
                const { w, h, d, mcX, mcY, mcZ, uX, uY, pivot, rotX } = p;
                const geo = new THREE.BoxGeometry(w * px, h * px, d * px);
                geo.clearGroups();
                const uvs = geo.attributes.uv.array;

                const setF = (faceIdx, u, v, fw, fh) => {
                    const u1 = u / tS, u2 = (u + fw) / tS;
                    const v1 = 1 - (v + fh) / tS, v2 = 1 - v / tS;
                    const i = faceIdx * 8;
                    uvs[i]=u1; uvs[i+1]=v2; uvs[i+2]=u2; uvs[i+3]=v2; uvs[i+4]=u1; uvs[i+5]=v1; uvs[i+6]=u2; uvs[i+7]=v1;
                };

                setF(1, uX, uY + d, d, h);                 // Left viewing side
                setF(4, uX + d, uY + d, w, h);             // Front viewing side
                setF(0, uX + d + w, uY + d, d, h);         // Right viewing side
                setF(5, uX + d + w + d, uY + d, w, h);     // Back viewing side
                setF(2, uX + d, uY, w, d);                 // Top
                setF(3, uX + d + w, uY, w, d);             // Bottom

                geo.translate((mcX + w/2) * px, (mcY + h/2) * px, (mcZ + d/2) * px);

                if (pivot && rotX) {
                    geo.translate(-pivot[0]*px, -pivot[1]*px, -pivot[2]*px);
                    geo.rotateX(rotX);
                    geo.translate(pivot[0]*px, pivot[1]*px, pivot[2]*px);
                }
                geos.push(geo);
            }
            return mergeBufferGeometries(geos);
        };

        let headGeo;
        if (bName === 'dragon_head') {
            const parts = [
                { w: 16, h: 16, d: 16, mcX: -8, mcY: 0, mcZ: -8, uX: 112, uY: 0 },
                { w: 12, h: 5,  d: 16, mcX: -6, mcY: 3, mcZ: -24, uX: 112, uY: 24 }, // Upper snout
                { w: 12, h: 4,  d: 16, mcX: -6, mcY: -1, mcZ: -24, uX: 176, uY: 65, pivot: [0, -1, -8], rotX: 0.15 }, // Jaw opened!
                { w: 2,  h: 4,  d: 6,  mcX: -5, mcY: 16, mcZ: -4, uX: 0, uY: 0 }, // Right Horn
                { w: 2,  h: 4,  d: 6,  mcX: 3,  mcY: 16, mcZ: -4, uX: 0, uY: 0 }, // Left Horn
                { w: 2,  h: 2,  d: 4,  mcX: -5, mcY: 5, mcZ: -26, uX: 112, uY: 0 }, // Right Nostril
                { w: 2,  h: 2,  d: 4,  mcX: 3,  mcY: 5, mcZ: -26, uX: 112, uY: 0 }  // Left Nostril
            ];
            headGeo = buildMCModel(parts, 256);
            headGeo.scale(0.75, 0.75, 0.75); 
            headGeo.translate(0, -0.15, 0.25); // Push slightly forward so it sits perfectly in UI
        } else {
            const parts = [ { w: 8, h: 8, d: 8, mcX: -4, mcY: 0, mcZ: -4, uX: 0, uY: 0 } ];
            headGeo = buildMCModel(parts, 64);
            headGeo.translate(0, -0.25, 0); 
        }

        materials[bName] = mat;
        customGeometries[bName] = headGeo;
        return;
    }

    // Custom geometry interception for Torches & Campfires
    if (bName === 'torch' || bName === 'soul_torch') {
        const tex = loadTex(bName);
        let mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
        let geo = new THREE.BoxGeometry(2/16, 10/16, 2/16);
        geo.translate(0, -3/16, 0);
        
        const uvs = geo.attributes.uv.array;
        const setUV = (faceIdx, u1, v1, u2, v2) => {
            const i = faceIdx * 8;
            uvs[i]=u1/16; uvs[i+1]=1-v2/16; uvs[i+2]=u2/16; uvs[i+3]=1-v2/16;
            uvs[i+4]=u1/16; uvs[i+5]=1-v1/16; uvs[i+6]=u2/16; uvs[i+7]=1-v1/16;
        };
        for(let i=0; i<6; i++) setUV(i, 7, 6, 9, 16); 
        setUV(2, 7, 6, 9, 8); // Top
        setUV(3, 7, 14, 9, 16); // Bottom

        materials[bName] = mat;
        customGeometries[bName] = geo;
        return;
    }

    if (bName === 'campfire' || bName === 'soul_campfire') {
        const texLog = loadTex(bName === 'campfire' ? 'campfire_log_lit' : 'soul_campfire_log_lit');
        let mat = new THREE.MeshStandardMaterial({ map: texLog });
        let geo = new THREE.BoxGeometry(1, 7/16, 1);
        geo.translate(0, -4.5/16, 0);
        materials[bName] = mat;
        customGeometries[bName] = geo;
        return;
    }

    if (CROSS_BLOCKS.has(bName)) {
        const fallbackTex = resolveFallbackTexture(bName);
        const tex = loadTex(fallbackTex);
        let mat = new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, depthWrite: true });
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
        let isTop = bName.endsWith('_top');
        let baseName = bName;
        if (isInner) baseName = bName.replace('_inner', '');
        if (isOuter) baseName = bName.replace('_outer', '');
        if (isTop) baseName = bName.replace('_top', '');

        let modelPath = baseName;
        const state = await JSONReader.getBlockstate(baseName);
        
        if (state && state.variants) {
            let variantKey = "";
            let keys = Object.keys(state.variants);
            let targetShape = isInner ? 'inner_left' : isOuter ? 'outer_left' : 'straight';
            let targetHalf = isTop ? 'upper' : (baseName.includes('door') ? 'lower' : 'bottom');
            
            for (let k of keys) {
                let matchHalf = k.includes(`half=${targetHalf}`);
                if (!k.includes('half=')) matchHalf = true;
                
                let matchShape = k.includes(`shape=${targetShape}`);
                if (!k.includes('shape=')) matchShape = true;
                
                if (matchHalf && matchShape) {
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
        let display = currentModel && currentModel.display ? JSON.parse(JSON.stringify(currentModel.display)) : {};

        let depth = 0;
        while (currentModel && currentModel.parent && depth < 10) {
            let parentPath = currentModel.parent;
            if (parentPath.includes(':')) parentPath = parentPath.split(':')[1]; 
            parentPath = parentPath.replace('block/', '');
            
            if (parentPath.startsWith('builtin/')) break;
            
            currentModel = await JSONReader.getModel(parentPath);
            if (currentModel) {
                if (!elements && currentModel.elements) elements = currentModel.elements;
                if (currentModel.textures) {
                    for (let k in currentModel.textures) {
                        if (!textures[k]) textures[k] = currentModel.textures[k];
                    }
                }
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
            let key = texStr.startsWith('#') ? texStr.substring(1) : texStr;
            
            if (textures[key]) {
                let safe = 10;
                while (textures[key] && textures[key].startsWith('#') && safe > 0) {
                    key = textures[key].substring(1);
                    safe--;
                }
                if (textures[key]) return textures[key];
            }
            
            if (texStr.startsWith('#')) return resolveFallbackTexture(baseName);
            return texStr;
        };

        const matArray = [];
        const texMap = {};
        let matIndexCounter = 0;

        const getMaterialForTex = (texPath) => {
            if (!texPath) texPath = resolveFallbackTexture(baseName); 
            texPath = texPath.replace('minecraft:', '').replace('block/', '');
            
            if (texMap[texPath] !== undefined) return texMap[texPath];
            
            let tex = loadTex(texPath);
            let mat;
            let isOverlay = texPath.includes('overlay');

            const isTranslucent = texPath.includes('glass') || texPath.includes('water') || texPath.includes('ice');
            const isCutout = CROSS_BLOCKS.has(baseName) || ['leaves', 'door', 'trapdoor', 'ladder', 'rail', 'torch', 'lantern', 'campfire', 'fire', 'bush', 'plant', 'flower', 'mushroom', 'sapling', 'roots', 'vines', 'coral', 'chain', 'bars', 'sculk', 'sprouts', 'stem', 'cactus', 'spawner', 'vault', 'cluster', 'lilac', 'azalea', 'peony', 'allium', 'orchid', 'tulip', 'daisy', 'cornflower', 'lily', 'rose'].some(kw => texPath.includes(kw) || baseName.includes(kw));

            if (isTranslucent || isOverlay) {
                mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: !isOverlay });
            } else if (isCutout) {
                mat = new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
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
            
            customGeometries[bName].userData = { display: display };
            
        } else {
            throw new Error("No elements found");
        }
    } catch(e) {
        const fallbackName = resolveFallbackTexture(bName);
        const tex = loadTex(fallbackName);
        let mat;
        
        const isTranslucent = fallbackName.includes('glass') || fallbackName.includes('water') || fallbackName.includes('ice') || fallbackName.includes('slime');
        const isCutout = CROSS_BLOCKS.has(bName) || ['leaves', 'door', 'trapdoor', 'ladder', 'rail', 'torch', 'lantern', 'campfire', 'fire', 'bush', 'plant', 'flower', 'mushroom', 'sapling', 'roots', 'vines', 'coral', 'chain', 'bars', 'sculk', 'sprouts', 'stem', 'cactus', 'spawner', 'vault', 'cluster', 'lilac', 'azalea', 'peony', 'allium', 'orchid', 'tulip', 'daisy', 'cornflower', 'lily', 'rose', 'heavy_core'].some(kw => fallbackName.includes(kw) || bName.includes(kw));

        if (isTranslucent) {
            mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false });
        } else if (isCutout) {
            mat = new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
        } else {
            mat = new THREE.MeshStandardMaterial({ map: tex });
        }
        materials[bName] = mat;
        
        let customGeo = geometry.clone(); 
        if (bName === 'heavy_core') {
            customGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            customGeo.translate(0, -0.25, 0);
        }
        customGeometries[bName] = customGeo; 
    }
    
    const promises = [];
    if (Array.isArray(materials[bName])) {
        materials[bName].forEach(mat => { if (mat.map && mat.map.loadPromise) promises.push(mat.map.loadPromise); });
    } else if (materials[bName] && materials[bName].map && materials[bName].map.loadPromise) {
        promises.push(materials[bName].map.loadPromise);
    }
    await Promise.all(promises);
}

async function getBlockIcon(type) {
    if (!type) return 'none';
    if (iconCache[type]) return iconCache[type];
    
    let pathInfo = resolveTexturePath(type);
    
    // Explicit 2D items (Uses a pure HTMLCanvas element rendering for flawless 1:1 crisp pixels)
    if (pathInfo.is2D) {
        let tex = loadTex(pathInfo.filename, pathInfo.folder);
        await tex.loadPromise;
        
        const cvs = document.createElement('canvas');
        cvs.width = 16; cvs.height = 16;
        const ctx = cvs.getContext('2d');
        ctx.imageSmoothingEnabled = false; // Strictly Disable Canvas Blur
        if (tex.image) {
            ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
        }
        const url = `url(${cvs.toDataURL('image/png')})`;
        iconCache[type] = url;
        return url;
    }

    if (!customGeometries[type]) await loadCustomModel(type);
    const geo = customGeometries[type];
    const mat = materials[type];
    if (!geo || !mat) return 'none';
    
    const mesh = new THREE.Mesh(geo, mat);
    iconScene.add(mesh);
    
    mesh.position.set(0, 0, 0);
    
    // Apply Authentic Minecraft GUI JSON Transformations
    let guiConfig = { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] };
    if (geo.userData && geo.userData.display && geo.userData.display.gui) {
        guiConfig = geo.userData.display.gui;
    }

    if (guiConfig.rotation) {
        let rx = guiConfig.rotation[0];
        let ry = guiConfig.rotation[1];
        let rz = guiConfig.rotation[2];
        
        // Fix for Minecraft's bizarre internal GUI JSON angles mapping to clean ThreeJS Euler angles.
        let threeRy = 0;
        if (ry === 225) threeRy = Math.PI / 4; 
        else threeRy = THREE.MathUtils.degToRad(ry);
        
        mesh.rotation.set(
            THREE.MathUtils.degToRad(rx),
            threeRy,
            THREE.MathUtils.degToRad(rz),
            'XYZ'
        );
    }
    
    if (guiConfig.scale) {
        // Boost generic JSON scaling since it tends to be too small on isolated canvases
        mesh.scale.set(guiConfig.scale[0] * 1.3, guiConfig.scale[1] * 1.3, guiConfig.scale[2] * 1.3);
    }
    
    if (guiConfig.translation) {
        mesh.position.set(
            (guiConfig.translation[0] / 16) * 0.65,
            (guiConfig.translation[1] / 16) * 0.65,
            (guiConfig.translation[2] / 16) * 0.65
        );
    }
    
    iconRenderer.render(iconScene, iconCamera);
    const dataUrl = iconRenderer.domElement.toDataURL('image/png');
    iconScene.remove(mesh);
    
    const url = `url(${dataUrl})`;
    iconCache[type] = url;
    return url;
}

function applyIcon(element, type) {
    element.dataset.iconType = type || 'none';
    if (!type) { element.style.backgroundImage = 'none'; return; }
    
    if (type === 'compass') return;
    
    getBlockIcon(type).then(url => {
        if (element.dataset.iconType === type) element.style.backgroundImage = url;
    });
}


// ============================================================================
// 5. DOM UI CREATION & STRUCTURING 
// ============================================================================

const guiScaleWrapper = document.createElement('div');
guiScaleWrapper.id = 'gui-scale-wrapper';
guiScaleWrapper.style.position = 'absolute';
guiScaleWrapper.style.top = '0';
guiScaleWrapper.style.left = '0';
guiScaleWrapper.style.width = '100vw';
guiScaleWrapper.style.height = '100vh';
guiScaleWrapper.style.transformOrigin = 'top left';
guiScaleWrapper.style.pointerEvents = 'none'; 
guiScaleWrapper.style.zIndex = '100';
document.body.appendChild(guiScaleWrapper);

function calculateGuiScale() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let scale = 1;
    while (scale < 4 && w / (scale + 1) >= 320 && h / (scale + 1) >= 240) scale++;
    currentGuiScale = scale;
    guiScaleWrapper.style.transform = `scale(${currentGuiScale})`;
    guiScaleWrapper.style.width = `${w / currentGuiScale}px`;
    guiScaleWrapper.style.height = `${h / currentGuiScale}px`;
}

function formatName(str) {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const hotbarContainer = document.createElement('div');
hotbarContainer.id = 'hotbar';
hotbarContainer.className = 'pixelated';
hotbarContainer.style.position = 'absolute';
hotbarContainer.style.bottom = '2px';
hotbarContainer.style.left = '50%';
hotbarContainer.style.transform = 'translateX(-50%)';
hotbarContainer.style.width = '182px';
hotbarContainer.style.height = '22px';
hotbarContainer.style.pointerEvents = 'auto';
guiScaleWrapper.appendChild(hotbarContainer);

const hotbarSelector = document.createElement('div');
hotbarSelector.className = 'pixelated';
hotbarSelector.style.position = 'absolute';
hotbarSelector.style.top = '-1px';
hotbarSelector.style.left = '-1px';
hotbarSelector.style.width = '24px';
hotbarSelector.style.height = '24px';
hotbarSelector.style.zIndex = '2';
hotbarContainer.appendChild(hotbarSelector);

const hotbarSlotsUI = [];
for (let i = 0; i < 9; i++) {
    const slotWrap = document.createElement('div');
    slotWrap.style.position = 'absolute';
    slotWrap.style.left = `${3 + i * 20}px`;
    slotWrap.style.top = '3px';
    slotWrap.style.width = '16px';
    slotWrap.style.height = '16px';
    slotWrap.style.zIndex = '1';

    const itemSprite = document.createElement('div');
    itemSprite.className = 'pixelated';
    itemSprite.style.width = '100%';
    itemSprite.style.height = '100%';
    itemSprite.style.backgroundSize = 'contain';
    itemSprite.style.backgroundPosition = 'center';
    itemSprite.style.backgroundRepeat = 'no-repeat';
    slotWrap.appendChild(itemSprite);

    const countLabel = document.createElement('span');
    countLabel.className = 'mc-text';
    countLabel.style.position = 'absolute';
    countLabel.style.bottom = '-4px';
    countLabel.style.right = '-1px';
    countLabel.style.color = 'white';
    slotWrap.appendChild(countLabel);

    slotWrap.addEventListener('mouseenter', () => {
        if (creativeScaleCenter.style.display !== 'none' && inventory[i].type) {
            tooltip.innerText = formatName(inventory[i].type);
            tooltip.style.display = 'block';
        }
    });
    slotWrap.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

    hotbarContainer.appendChild(slotWrap);
    hotbarSlotsUI.push({ div: itemSprite, label: countLabel });
}

const crosshair = document.createElement('div');
crosshair.id = 'crosshair';
crosshair.className = 'pixelated';
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.width = '15px';
crosshair.style.height = '15px';
crosshair.style.pointerEvents = 'none';
guiScaleWrapper.appendChild(crosshair);

setFallbackBg(crosshair, 
    [`${SPRITE_HUD_DIR}crosshair.png`, `${GUI_WIDGETS_DIR}icons.png`],
    (idx) => {
        crosshair.style.backgroundSize = idx === 0 ? '15px 15px' : '256px 256px';
        crosshair.style.backgroundPosition = idx === 0 ? '0 0' : '0 0';
    }
);

const creativeScaleCenter = document.createElement('div');
creativeScaleCenter.id = 'creative-scale-center';
creativeScaleCenter.style.position = 'absolute';
creativeScaleCenter.style.top = '50%'; // EXACTLY CENTERED on screen
creativeScaleCenter.style.left = '50%';
creativeScaleCenter.style.display = 'none'; // Hidden initially
guiScaleWrapper.appendChild(creativeScaleCenter);

const creativeInventoryScreen = document.createElement('div');
creativeInventoryScreen.id = 'creative-inventory-screen';
creativeInventoryScreen.style.position = 'absolute';
creativeInventoryScreen.style.left = '-97.5px'; 
creativeInventoryScreen.style.top = '-68px'; 
creativeInventoryScreen.style.width = '195px'; 
creativeInventoryScreen.style.height = '136px';
creativeInventoryScreen.style.userSelect = 'none';
creativeScaleCenter.appendChild(creativeInventoryScreen);

const topTabsRow = document.createElement('div');
topTabsRow.style.display = 'flex';
topTabsRow.style.alignItems = 'flex-end'; 
topTabsRow.style.position = 'absolute';
topTabsRow.style.top = '-28px'; 
topTabsRow.style.left = '0';
topTabsRow.style.width = '100%';
topTabsRow.style.zIndex = '1';
creativeInventoryScreen.appendChild(topTabsRow);

const invBody = document.createElement('div');
invBody.className = 'pixelated';
invBody.style.position = 'absolute';
invBody.style.inset = '0';
invBody.style.width = '100%';
invBody.style.height = '100%';
invBody.style.pointerEvents = 'auto';
invBody.style.zIndex = '10';
creativeInventoryScreen.appendChild(invBody);

const searchRow = document.createElement('div');
searchRow.style.display = 'none';
searchRow.style.position = 'absolute';
searchRow.style.left = '82px';
searchRow.style.top = '4px';
searchRow.style.width = '89px';
searchRow.style.height = '12px';
const searchInput = document.createElement('input');
searchInput.id = 'creative-search';
searchInput.type = 'text';
searchInput.style.width = '100%';
searchInput.style.height = '100%';
searchInput.style.padding = '0 2px';
searchInput.style.backgroundColor = 'transparent';
searchInput.style.color = '#fff';
searchInput.style.border = 'none';
searchInput.style.fontFamily = 'monospace';
searchInput.style.fontSize = '8px';
searchInput.style.outline = 'none';
searchRow.appendChild(searchInput);
invBody.appendChild(searchRow);

const creativeTitle = document.createElement('div');
creativeTitle.className = 'mc-title';
creativeTitle.innerText = "Building Blocks";
creativeTitle.style.position = 'absolute';
creativeTitle.style.left = '8px';
creativeTitle.style.top = '6px';
invBody.appendChild(creativeTitle);

const creativeGridContainer = document.createElement('div');
creativeGridContainer.id = 'creative-grid-container';
creativeGridContainer.style.position = 'absolute';
creativeGridContainer.style.left = '9px';
creativeGridContainer.style.top = '18px';
creativeGridContainer.style.width = '162px'; 
creativeGridContainer.style.height = '90px'; 
creativeGridContainer.style.overflowY = 'hidden'; 
creativeGridContainer.style.backgroundColor = 'transparent';
creativeGridContainer.style.display = 'grid';
creativeGridContainer.style.gridTemplateColumns = 'repeat(9, 18px)';
creativeGridContainer.style.gridAutoRows = '18px';
invBody.appendChild(creativeGridContainer);

const scrollTrack = document.createElement('div');
scrollTrack.style.position = 'absolute';
scrollTrack.style.right = '8px';
scrollTrack.style.top = '18px';
scrollTrack.style.width = '14px'; 
scrollTrack.style.height = '112px'; 
invBody.appendChild(scrollTrack);

const scrollThumb = document.createElement('div');
scrollThumb.className = 'pixelated';
scrollThumb.style.position = 'absolute';
scrollThumb.style.left = '1px';
scrollThumb.style.top = '0px';
scrollThumb.style.width = '12px'; 
scrollThumb.style.height = '15px'; 
scrollTrack.appendChild(scrollThumb);

const creativeHotbarGrid = document.createElement('div');
creativeHotbarGrid.style.position = 'absolute';
creativeHotbarGrid.style.left = '9px';
creativeHotbarGrid.style.top = '112px'; 
creativeHotbarGrid.style.width = '162px';
creativeHotbarGrid.style.height = '18px';
creativeHotbarGrid.style.display = 'grid';
creativeHotbarGrid.style.gridTemplateColumns = 'repeat(9, 18px)';
invBody.appendChild(creativeHotbarGrid);

const bottomTabsRow = document.createElement('div');
bottomTabsRow.style.display = 'flex';
bottomTabsRow.style.alignItems = 'flex-start'; 
bottomTabsRow.style.position = 'absolute';
bottomTabsRow.style.bottom = '-28px';
bottomTabsRow.style.left = '0';
bottomTabsRow.style.width = '100%';
bottomTabsRow.style.zIndex = '1';
creativeInventoryScreen.appendChild(bottomTabsRow);

const heldItemWrapper = document.createElement('div');
heldItemWrapper.id = 'held-item-wrapper';
heldItemWrapper.style.position = 'absolute';
heldItemWrapper.style.pointerEvents = 'none';
heldItemWrapper.style.zIndex = '10000';
heldItemWrapper.style.display = 'none';
guiScaleWrapper.appendChild(heldItemWrapper);

const heldItemUI = document.createElement('div');
heldItemUI.id = 'held-item-ui';
heldItemUI.className = 'pixelated';
heldItemUI.style.position = 'absolute';
heldItemUI.style.left = '-8px';
heldItemUI.style.top = '-8px';
heldItemUI.style.width = '16px';
heldItemUI.style.height = '16px';
heldItemUI.style.transformOrigin = 'center';
heldItemWrapper.appendChild(heldItemUI);

const heldLabel = document.createElement('span');
heldLabel.className = 'mc-text';
heldLabel.style.position = 'absolute';
heldLabel.style.bottom = '-4px';
heldLabel.style.right = '-1px';
heldItemUI.appendChild(heldLabel);

const tooltip = document.createElement('div');
tooltip.id = 'mc-tooltip';
tooltip.className = 'mc-text';
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(16, 0, 16, 0.95)';
tooltip.style.border = '2px solid #37007C';
tooltip.style.borderStyle = 'outset';
tooltip.style.color = '#fff';
tooltip.style.padding = '2px 4px';
tooltip.style.fontSize = '10px';
tooltip.style.pointerEvents = 'none';
tooltip.style.zIndex = '100000';
tooltip.style.display = 'none';
guiScaleWrapper.appendChild(tooltip);


// ============================================================================
// 6. UI FUNCTIONS
// ============================================================================
function updateScrollThumbVisuals(disabled) {
    const sprite = disabled ? 'scroller_disabled.png' : 'scroller.png';
    const legacyX = disabled ? -244 : -232;
    setFallbackBg(scrollThumb, 
        [`${SPRITE_CREATIVE_DIR}${sprite}`, `${GUI_TEX_DIR}tabs.png`],
        (idx) => {
            scrollThumb.style.backgroundSize = idx === 0 ? '12px 15px' : '256px 256px';
            scrollThumb.style.backgroundPosition = idx === 0 ? '0 0' : `${legacyX}px 0`;
        }
    );
}

function updateCreativeScrollView() {
    let totalRows = Math.ceil(creativeGridContainer.children.length / 9);
    let maxRow = Math.max(0, totalRows - 5);

    currentCreativeRow = Math.max(0, Math.min(currentCreativeRow, maxRow));

    creativeGridContainer.scrollTop = currentCreativeRow * 18;

    if (maxRow <= 0) {
        updateScrollThumbVisuals(true);
        scrollThumb.style.top = '0px';
    } else {
        updateScrollThumbVisuals(false);
        const scrollPct = currentCreativeRow / maxRow;
        scrollThumb.style.top = (scrollPct * 97) + 'px';
    }
}

function createTab(catKey, isTop, isRightAlign = false, colIndex = 0) {
    const cat = CATEGORIES[catKey];
    const tab = document.createElement('div');
    tab.className = 'pixelated';
    tab.style.width = '28px'; 
    tab.style.cursor = 'pointer';
    tab.style.position = 'relative';
    tab.style.display = 'flex';
    tab.style.alignItems = 'center';
    tab.style.justifyContent = 'center';
    tab.style.pointerEvents = 'auto';
    if (isRightAlign) tab.style.marginLeft = 'auto';
    
    const icon = document.createElement('div');
    icon.className = 'pixelated';
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.backgroundSize = 'contain';
    icon.style.backgroundPosition = 'center';
    icon.style.backgroundRepeat = 'no-repeat';
    applyIcon(icon, cat.icon);
    tab.appendChild(icon);

    tab.addEventListener('mousedown', () => {
        currentCategory = catKey;
        updateTabsUI();
        populateCreativeGrid();
    });

    if (isTop) topTabsRow.appendChild(tab);
    else bottomTabsRow.appendChild(tab);
    
    allTabsUI.push({ key: catKey, elem: tab, icon: icon, isTop: isTop, colIndex: colIndex });
}

function updateTabsUI() {
    allTabsUI.forEach(tabObj => {
        const isSelected = tabObj.key === currentCategory;
        const col = tabObj.colIndex;
        const isTop = tabObj.isTop;
        
        tabObj.elem.style.zIndex = isSelected ? '20' : '1';
        tabObj.elem.style.height = isSelected ? '32px' : '28px';
        
        if (isSelected) {
            tabObj.icon.style.transform = 'translateY(0px)';
        } else {
            tabObj.icon.style.transform = isTop ? 'translateY(2px)' : 'translateY(-2px)';
        }

        const legacyX = -(col * 28);
        const legacyY = isTop ? (isSelected ? -32 : 0) : (isSelected ? -96 : -64);
        
        const spritePrefix = `${SPRITE_CREATIVE_DIR}tab_${isTop ? 'top' : 'bottom'}_${isSelected ? 'selected' : 'unselected'}_${col + 1}.png`;
        const legacyPath = `${GUI_TEX_DIR}tabs.png`;

        setFallbackBg(tabObj.elem, [spritePrefix, legacyPath], (idx) => {
            if (idx === 0) { 
                tabObj.elem.style.backgroundSize = isSelected ? '28px 32px' : '28px 28px';
                tabObj.elem.style.backgroundPosition = '0 0';
            } else { 
                tabObj.elem.style.backgroundSize = '256px 256px';
                tabObj.elem.style.backgroundPosition = `${legacyX}px ${legacyY}px`;
            }
        });
    });

    creativeTitle.innerText = CATEGORIES[currentCategory].name;
    
    if (currentCategory === 'search') {
        invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_item_search.png)`;
        searchRow.style.display = 'block';
        creativeTitle.style.display = 'none';
        creativeGridContainer.style.display = 'grid';
        scrollTrack.style.display = 'block';
        setTimeout(() => searchInput.focus(), 50);
    } else if (currentCategory === 'inventory') {
        invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_inventory.png)`;
        searchRow.style.display = 'none';
        creativeTitle.style.display = 'none';
        creativeGridContainer.style.display = 'none'; 
        scrollTrack.style.display = 'none';
    } else {
        invBody.style.backgroundImage = `url(${GUI_TEX_DIR}tab_items.png)`;
        searchRow.style.display = 'none';
        creativeTitle.style.display = 'block';
        creativeGridContainer.style.display = 'grid';
        scrollTrack.style.display = 'block';
    }
}

function createItemSlot(bName, i, sourceArray) {
    const slotWrap = document.createElement('div');
    slotWrap.style.width = '18px';
    slotWrap.style.height = '18px';
    slotWrap.style.position = 'relative';
    slotWrap.style.cursor = 'pointer';
    slotWrap.style.pointerEvents = 'auto';
    
    const itemSprite = document.createElement('div');
    itemSprite.className = 'pixelated';
    itemSprite.style.position = 'absolute';
    itemSprite.style.left = '1px';
    itemSprite.style.top = '1px';
    itemSprite.style.width = '16px';
    itemSprite.style.height = '16px';
    itemSprite.style.backgroundSize = 'contain';
    itemSprite.style.backgroundPosition = 'center';
    itemSprite.style.backgroundRepeat = 'no-repeat';
    applyIcon(itemSprite, bName);
    slotWrap.appendChild(itemSprite);

    const highlight = document.createElement('div');
    highlight.style.position = 'absolute';
    highlight.style.inset = '1px';
    highlight.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    highlight.style.display = 'none';
    highlight.style.zIndex = '5';
    slotWrap.appendChild(highlight);

    slotWrap.addEventListener('mouseenter', () => {
        highlight.style.display = 'block';
        let currentItem = sourceArray ? sourceArray[i].type : bName;
        if (currentItem) {
            tooltip.innerText = formatName(currentItem);
            tooltip.style.display = 'block';
        }
    });
    
    slotWrap.addEventListener('mouseleave', () => {
        highlight.style.display = 'none';
        tooltip.style.display = 'none';
    });

    slotWrap.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (e.button === 0) {
            if (sourceArray) { 
                let tempType = sourceArray[i].type;
                let tempCount = sourceArray[i].count;
                
                if (heldItem.type === sourceArray[i].type && heldItem.type !== null) {
                    let space = 64 - sourceArray[i].count;
                    let toMove = Math.min(space, heldItem.count);
                    sourceArray[i].count += toMove;
                    heldItem.count -= toMove;
                    if (heldItem.count <= 0) heldItem.type = null;
                } else {
                    sourceArray[i].type = heldItem.type;
                    sourceArray[i].count = heldItem.count;
                    heldItem.type = tempType;
                    heldItem.count = tempCount;
                }
            } else { 
                if (heldItem.type === bName) {
                    heldItem.count = 64; 
                } else if (!heldItem.type || heldItem.type !== bName) {
                    heldItem.type = bName;
                    heldItem.count = 64;
                }
            }
            updateInventoryUI();
            
            let currentItemAfter = sourceArray ? sourceArray[i].type : bName;
            if (currentItemAfter) {
                tooltip.innerText = formatName(currentItemAfter);
                tooltip.style.display = 'block';
            } else {
                tooltip.style.display = 'none';
            }
        }
    });
    
    return slotWrap;
}

function populateCreativeGrid() {
    creativeGridContainer.innerHTML = '';
    currentCreativeRow = 0; 
    
    let blocksToShow = CATEGORIES[currentCategory].blocks;
    
    if (currentCategory === 'search') {
        const query = searchInput.value.toLowerCase();
        blocksToShow = ALL_BLOCKS.filter(b => 
            !b.includes('_inner') && !b.includes('_outer') && !b.includes('_top') && b !== 'air' && b.includes(query)
        );
    }

    blocksToShow.forEach(bName => {
        creativeGridContainer.appendChild(createItemSlot(bName, null, null));
    });
    
    updateCreativeScrollView();
}

function updateInventoryUI() {
    hotbarSelector.style.left = `${-1 + selectedSlot * 20}px`; 

    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const ui = hotbarSlotsUI[i];
        applyIcon(ui.div, item.type);
        ui.label.innerText = (item.count > 1) ? item.count : '';
    }
    
    for (let i = 0; i < 9; i++) {
        const item = inventory[i];
        const ui = creativeHotbarSlotsUI[i];
        applyIcon(ui.div, item.type);
        ui.label.innerText = (item.count > 1) ? item.count : '';
    }
    
    if (heldItem.type) {
        heldItemWrapper.style.display = 'block';
        applyIcon(heldItemUI, heldItem.type);
        heldLabel.innerText = (heldItem.count > 1) ? heldItem.count : '';
    } else {
        heldItemWrapper.style.display = 'none';
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


// ============================================================================
// 7. INITIALIZATION EXECUTION
// ============================================================================

setFallbackBg(hotbarContainer, 
    [`${SPRITE_HUD_DIR}hotbar.png`, `${GUI_WIDGETS_DIR}widgets.png`],
    (idx) => { hotbarContainer.style.backgroundSize = idx === 0 ? '182px 22px' : '256px 256px'; }
);

setFallbackBg(hotbarSelector, 
    [`${SPRITE_HUD_DIR}hotbar_selection.png`, `${GUI_WIDGETS_DIR}widgets.png`],
    (idx) => {
        hotbarSelector.style.backgroundSize = idx === 0 ? '24px 24px' : '256px 256px';
        hotbarSelector.style.backgroundPosition = idx === 0 ? '0 0' : '0 -22px';
    }
);

updateScrollThumbVisuals(false);

const topKeys = ['building', 'colored', 'natural', 'functional', 'redstone', 'misc'];
topKeys.forEach((k, i) => createTab(k, true, false, i));
createTab('search', true, true, 6); 

const bottomKeys = ['tools', 'combat', 'food', 'materials', 'spawns', 'operator', 'inventory'];
bottomKeys.forEach((k, i) => createTab(k, false, false, i));

const creativeHotbarSlotsUI = [];
for (let i = 0; i < 9; i++) {
    const slotWrap = createItemSlot(null, i, inventory);
    const countLabel = document.createElement('span');
    countLabel.className = 'mc-text';
    countLabel.style.position = 'absolute';
    countLabel.style.bottom = '-4px';
    countLabel.style.right = '-1px';
    countLabel.style.zIndex = '6';
    slotWrap.appendChild(countLabel);

    creativeHotbarGrid.appendChild(slotWrap);
    creativeHotbarSlotsUI.push({ div: slotWrap.firstChild, label: countLabel });
}

searchInput.addEventListener('keydown', (e) => e.stopPropagation()); 
searchInput.addEventListener('input', () => populateCreativeGrid());

document.addEventListener('mousedown', (e) => {
    if (creativeScaleCenter.style.display === 'flex' && heldItem.type) {
        if (!invBody.contains(e.target) && !topTabsRow.contains(e.target) && !bottomTabsRow.contains(e.target)) {
            heldItem.type = null;
            heldItem.count = 0;
            updateInventoryUI();
        }
    }
});

let isDraggingScroll = false;
scrollThumb.addEventListener('mousedown', (e) => {
    isDraggingScroll = true;
    e.stopPropagation();
});

document.addEventListener('mousemove', (e) => {
    if (creativeScaleCenter.style.display === 'flex') {
        heldItemWrapper.style.left = e.clientX + 'px';
        heldItemWrapper.style.top = e.clientY + 'px';
    }
    if (tooltip.style.display === 'block') {
        tooltip.style.left = (e.clientX / currentGuiScale + 12) + 'px';
        tooltip.style.top = (e.clientY / currentGuiScale - 12) + 'px';
    }
    
    // Smooth scroll thumb drag logic that snaps the grid mathematically to rows
    if (isDraggingScroll && creativeScaleCenter.style.display !== 'none') {
        let totalRows = Math.ceil(creativeGridContainer.children.length / 9);
        let maxRow = Math.max(0, totalRows - 5);
        if (maxRow > 0) {
            const trackRect = scrollTrack.getBoundingClientRect();
            let trueHeight = 97 * currentGuiScale; 
            let y = e.clientY - trackRect.top - (7.5 * currentGuiScale); 
            y = Math.max(0, Math.min(y, trueHeight)); 
            const scrollPct = y / trueHeight;
            
            currentCreativeRow = Math.round(scrollPct * maxRow);
            creativeGridContainer.scrollTop = currentCreativeRow * 18;
            scrollThumb.style.top = (y / currentGuiScale) + 'px';
        }
    }
});

document.addEventListener('mouseup', () => { isDraggingScroll = false; });

// Row by Row Discrete Menu Wheel Scrolling
invBody.addEventListener('wheel', (e) => {
    if (currentCategory === 'inventory') return;
    let totalRows = Math.ceil(creativeGridContainer.children.length / 9);
    let maxRow = Math.max(0, totalRows - 5);
    if (maxRow <= 0) return;

    e.preventDefault(); 
    let dir = Math.sign(e.deltaY);
    currentCreativeRow = Math.max(0, Math.min(currentCreativeRow + dir, maxRow));
    updateCreativeScrollView();
}, { passive: false });

calculateGuiScale();
window.addEventListener('resize', calculateGuiScale);
updateTabsUI();
populateCreativeGrid();
updateInventoryUI();


// ============================================================================
// 8. MINECRAFT HARDNESS & MINING LOGIC
// ============================================================================

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


// ============================================================================
// 9. CHUNK GENERATION & GAME LOOP
// ============================================================================

// Minimal Perlin Noise Fallback implementation
const noise = {
    p: new Uint8Array(512),
    seed: function(s) {
        let r = () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
        for(let i=0; i<256; i++) this.p[i] = Math.floor(r()*256);
        for(let i=0; i<256; i++) this.p[256+i] = this.p[i];
    },
    fade: function(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
    lerp: function(t, a, b) { return a + t * (b - a); },
    grad: function(hash, x, y, z) {
        let h = hash & 15, u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },
    perlin2: function(x, y) { return this.perlin3(x, y, 0); },
    perlin3: function(x, y, z) {
        let X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        let u = this.fade(x), v = this.fade(y), w = this.fade(z);
        let A = this.p[X]+Y, AA = this.p[A]+Z, AB = this.p[A+1]+Z, B = this.p[X+1]+Y, BA = this.p[B]+Z, BB = this.p[B+1]+Z;
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x-1, y, z)),
                       this.lerp(u, this.grad(this.p[AB], x, y-1, z), this.grad(this.p[BB], x-1, y-1, z))),
               this.lerp(v, this.lerp(u, this.grad(this.p[AA+1], x, y, z-1), this.grad(this.p[BA+1], x-1, y, z-1)),
                       this.lerp(u, this.grad(this.p[AB+1], x, y-1, z-1), this.grad(this.p[BB+1], x-1, y-1, z-1))));
    }
};

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

const worldSeed = Math.random(); 
noise.seed(worldSeed);

const mapOffsetX = Math.floor(Math.random() * 1000000);
const mapOffsetZ = Math.floor(Math.random() * 1000000);

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

    const canTakeShape = (checkDir) => {
        let n = getStairData(x + DIRS[checkDir][0], y, z + DIRS[checkDir][2]);
        if (n && n.half === s.half && n.facing === f) {
            return false;
        }
        return true;
    };
    
    if (sFront && sFront.half === s.half && sFront.facing !== f && (sFront.facing % 2 !== f % 2)) {
        let oppFrontDir = (sFront.facing + 2) % 4;
        if (canTakeShape(oppFrontDir)) {
            if (sFront.facing === leftOfF) shape = 'outer_left';
            else shape = 'outer_right';
        }
    }
    
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
// Day / Night & Core Update Loop
// ----------------------------------------------------
let timeOfDay = Math.PI / 2; 
const dayCycleSpeed = Math.PI / 600; 

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
    const velocity = new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 2, (Math.random() - 0.5) * 4);
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
        
        updateStairConnections(pX+1, pY, pZ);
        updateStairConnections(pX-1, pY, pZ);
        updateStairConnections(pX, pY, pZ+1);
        updateStairConnections(pX, pY, pZ-1);

        mining.active = false;
        destroyMesh.visible = false;
    }
}

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#creative-inventory-screen') || e.target.closest('#hotbar')) return; 
    
    if (!document.pointerLockElement && creativeScaleCenter.style.display === 'none') {
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
            
            // STRICT PREVENT OF RAW FLAT ITEMS BEING PLACED ON THE GROUND
            let placementType = selectedItem.type;
            if (placementType === 'sweet_berries') placementType = 'sweet_berry_bush';
            if (flatItems.has(placementType)) return; 
            
            if (placementType && getGlobalBlock(placeX, placeY, placeZ) === 0) {
                let rotation = [0, 0, 0];
                let stairData = null;
                let extraBlock = null; 
                
                if (placementType.includes('log') || placementType.includes('pillar') || placementType === 'basalt' || placementType === 'polished_basalt' || placementType === 'bone_block' || placementType === 'purpur_pillar' || placementType === 'quartz_pillar' || placementType === 'hay_block') {
                    let axis = 'y';
                    if (Math.abs(hit.face.normal.x) > 0.5) axis = 'x';
                    if (Math.abs(hit.face.normal.z) > 0.5) axis = 'z';
                    rotation = JSONReader.getRotationForAxis(axis);
                } 
                else if (placementType.includes('stairs')) {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;
                    
                    let facing = 0;
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) facing = 1; 
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) facing = 2; 
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) facing = 3; 
                    else facing = 0; 

                    let isTop = (hit.face.normal.y === -1 || (hit.face.normal.y === 0 && hit.point.y - Math.floor(hit.point.y) > 0.5));
                    stairData = { isStair: true, facing: facing, half: isTop ? 'top' : 'bottom' };
                }
                else if (placementType.includes('door') && !placementType.includes('trapdoor')) {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;
                    
                    let rotY = 0;
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) rotY = Math.PI; 
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) rotY = -Math.PI/2; 
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) rotY = 0; 
                    else rotY = Math.PI/2; 

                    rotation = [0, rotY, 0];
                    extraBlock = { x: placeX, y: placeY + 1, z: placeZ, type: TYPE[placementType + '_top'], rotation: [0, rotY, 0] };
                }
                else if (placementType.includes('furnace') || placementType === 'chest' || placementType === 'carved_pumpkin' || placementType === 'jack_o_lantern' || placementType === 'loom' || placementType === 'observer' || placementType === 'dispenser' || placementType === 'dropper') {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;
                    
                    let rotY = 0;
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) rotY = Math.PI; 
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) rotY = -Math.PI/2; 
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) rotY = 0; 
                    else rotY = Math.PI/2; 
                    
                    rotation = [0, rotY, 0];
                }
                
                let placedData = { type: TYPE[placementType], rotation: rotation };
                if (stairData) placedData = { ...placedData, ...stairData };
                
                if (extraBlock && getGlobalBlock(extraBlock.x, extraBlock.y, extraBlock.z) !== 0) {
                    // Not enough room to place the double block
                } else {
                    setGlobalBlock(placeX, placeY, placeZ, placedData);
                    
                    if (extraBlock) {
                        setGlobalBlock(extraBlock.x, extraBlock.y, extraBlock.z, { type: extraBlock.type, rotation: extraBlock.rotation });
                    }
                    
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
    if (document.activeElement && document.activeElement.id === 'creative-search') return;
    keys[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === 'e') {
        if (creativeScaleCenter.style.display === 'none') {
            creativeScaleCenter.style.display = 'flex';
            crosshair.style.display = 'none';
            document.exitPointerLock();
            keys = {}; 
            populateCreativeGrid();
        } else {
            creativeScaleCenter.style.display = 'none';
            crosshair.style.display = 'block';
            
            if (heldItem.type) {
                heldItem = { type: null, count: 0 };
                updateInventoryUI();
            }
            renderer.domElement.requestPointerLock();
        }
    }

    if (e.key >= '1' && e.key <= '9' && creativeScaleCenter.style.display === 'none') {
        selectedSlot = parseInt(e.key) - 1;
        updateInventoryUI();
    }
});

window.addEventListener('keyup', (e) => {
    if (document.activeElement && document.activeElement.id === 'creative-search') return;
    keys[e.key.toLowerCase()] = false;
});

let lastScrollTime = 0; 
window.addEventListener('wheel', (e) => {
    if (document.pointerLockElement && creativeScaleCenter.style.display === 'none') {
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
        let tickDuration = typeof currentFrameData === 'object' ? currentFrameData.time : anim.defaultTickRate;
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

    // Dynamic compass animation hook
    const dx = -camera.position.x;
    const dz = -camera.position.z;
    const targetAngle = Math.atan2(dx, dz);
    let relAngle = (targetAngle - yaw) % (Math.PI * 2);
    if (relAngle < 0) relAngle += Math.PI * 2;
    let compassFrame = Math.floor((relAngle / (Math.PI * 2)) * 32) % 32;
    let frameStr = compassFrame.toString().padStart(2, '0');
    let compassUrl = `url(${ITEM_TEX_DIR}compass_${frameStr}.png)`;
    document.querySelectorAll('[data-icon-type="compass"]').forEach(el => {
        if (el.style.backgroundImage !== compassUrl) el.style.backgroundImage = compassUrl;
    });

    if (chunkQueue.length > 0 && !isGeneratingChunk) {
        isGeneratingChunk = true;
        const next = chunkQueue.shift();
        const [cx, cz] = next.split(',').map(Number);
        generateChunk(cx, cz).then(() => { isGeneratingChunk = false; });
    }

    if (isLeftMouseDown && !mining.active && document.pointerLockElement && creativeScaleCenter.style.display === 'none') {
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

        let bX = Math.round(nx); let bY = Math.round(ny - 0.25); let bZ = Math.round(nz);
        let blockBelow = getGlobalBlock(bX, bY, bZ);

        if (blockBelow === null) {
            item.velocity.set(0, 0, 0);
            nx = item.mesh.position.x; ny = item.mesh.position.y; nz = item.mesh.position.z;
        } 
        else if (blockBelow !== 0) {
            ny = bY + 0.5 + 0.125; 
            item.velocity.y = 0; item.velocity.x *= 0.5; item.velocity.z *= 0.5;
        } 
        else {
            let wallBlock = getGlobalBlock(bX, Math.round(ny), bZ);
            if (wallBlock !== 0 && wallBlock !== null) {
                item.velocity.x *= -0.5; item.velocity.z *= -0.5;
                nx = item.mesh.position.x; nz = item.mesh.position.z;
            }
        }

        item.mesh.position.set(nx, ny, nz);
        item.mesh.rotation.y += delta * 2;
        if (item.velocity.y === 0) item.mesh.position.y += Math.sin(item.lifeTime * 4) * 0.002;
        
        const dist = camera.position.distanceTo(item.mesh.position);
        if (dist < 1.5) {
            scene.remove(item.mesh); item.mesh.geometry.dispose();
            droppedItems.splice(i, 1); addItemToInventory(item.blockName, 1);
        } else if (item.mesh.position.y < minworldY - 20) {
            scene.remove(item.mesh); item.mesh.geometry.dispose(); droppedItems.splice(i, 1);
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

// Start the game loop
animate();