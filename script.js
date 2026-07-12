const globalStyles = document.createElement('style');
globalStyles.innerHTML = `
    * {
        image-rendering: -moz-crisp-edges !important;
        image-rendering: -o-crisp-edges !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        image-rendering: pixelated !important; 
    }
    body { margin: 0; overflow: hidden; background-color: #87ceeb; font-family: sans-serif; }
    canvas { display: block; }
    .mc-text { font-family: 'Minecraft', monospace; text-shadow: 1px 1px 0 #3f3f3f; color: #fff; font-size: 10px; }
    .mc-title { font-family: 'Minecraft', monospace; color: #404040; text-shadow: none; font-size: 8px; }
    .item-icon-glint,
    .equipment-icon-glint {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 3;
    }

    .item-icon-glint::before,
    .item-icon-glint::after,
    .equipment-icon-glint::before,
    .equipment-icon-glint::after {
        content: "";
        position: absolute;
        inset: -70%;
        background-repeat: repeat;
        background-size: 128px 128px;
        transform-origin: center;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        image-rendering: auto;
    }

    .item-icon-glint::before,
    .item-icon-glint::after {
        background-image: url('assets/minecraft/textures/misc/enchanted_glint_item.png');
        filter: brightness(1.65) saturate(1.15);
    }

    .equipment-icon-glint::before,
    .equipment-icon-glint::after {
        background-image: url('assets/minecraft/textures/misc/enchanted_glint_entity.png');
        filter: brightness(1.45) saturate(1.08);
    }

    .item-icon-glint::before,
    .equipment-icon-glint::before {
        transform: rotate(-30deg) scale(1.3);
        opacity: 0.25;
        mix-blend-mode: hard-light;
        animation: mc-glint-a 8s linear infinite;
    }

    .item-icon-glint::after,
    .equipment-icon-glint::after {
        transform: rotate(30deg) scale(1.3);
        opacity: 0.10;
        mix-blend-mode: hard-light;
        animation: mc-glint-b 12s linear infinite;
    }

    @keyframes mc-glint-a {
        0%   { background-position: 0px 0px; }
        100% { background-position: -128px -128px; }
    }

    @keyframes mc-glint-b {
        0%   { background-position: 0px 0px; }
        100% { background-position: 128px -128px; }
    }
`;
document.head.appendChild(globalStyles);

const BLOCK_TEX_DIR = 'assets/minecraft/textures/block/';
const ITEM_TEX_DIR = 'assets/minecraft/textures/item/';
const GUI_TEX_DIR = 'assets/minecraft/textures/gui/container/creative_inventory/';
const GUI_WIDGETS_DIR = 'assets/minecraft/textures/gui/';
const SPRITE_CREATIVE_DIR = 'assets/minecraft/textures/gui/sprites/container/creative_inventory/';
const SPRITE_HUD_DIR = 'assets/minecraft/textures/gui/sprites/hud/';
const MISC_TEX_DIR = 'assets/minecraft/textures/misc/';
const ITEM_GLINT_ITEMS = new Set([
    'enchanted_book',
    'enchanted_golden_apple',
    'experience_bottle'
]);
const EQUIPMENT_GLINT_ITEMS = new Set([
    'netherite_chestplate'
]);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 75);
scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = false; 
renderer.autoClear = false;
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace; else renderer.outputEncoding = 3001;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const moveSpeed = 2.5;
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const iconRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
iconRenderer.setSize(128, 128);
iconRenderer.setPixelRatio(1);
if (THREE.SRGBColorSpace) iconRenderer.outputColorSpace = THREE.SRGBColorSpace; else iconRenderer.outputEncoding = 3001;
const iconScene = new THREE.Scene();

const iconCamera = new THREE.OrthographicCamera(-0.51, 0.51, 0.51, -0.51, 0.1, 10);
iconCamera.position.set(0.008, -0.008, 5); 
iconCamera.lookAt(0, 0, 0);

const iconAmbient = new THREE.AmbientLight(0xffffff, 0.40 * Math.PI); 
iconScene.add(iconAmbient);
const iconTopLight = new THREE.DirectionalLight(0xffffff, 0.70 * Math.PI); 
iconScene.add(iconTopLight);
const iconLeftLight = new THREE.DirectionalLight(0xffffff, 0.30 * Math.PI); 
iconScene.add(iconLeftLight);

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

// =========================================================================
// 2. REGISTRIES (BLOCKS, ITEMS, TYPES)
// =========================================================================
const ITEMS = [
    'acacia_boat',
    'acacia_chest_boat',
    'acacia_hanging_sign',
    'acacia_sign',
    'allay_spawn_egg',
    'amethyst_shard',
    'angler_pottery_sherd',
    'apple',
    'archer_pottery_sherd',
    'armadillo_scute',
    'armadillo_spawn_egg',
    'armor_stand',
    'arms_up_pottery_sherd',
    'arrow',
    'axolotl_bucket',
    'axolotl_spawn_egg',
    'baked_potato',
    'bamboo_chest_raft',
    'bamboo_hanging_sign',
    'bamboo_raft',
    'bamboo_sign',
    'barrier',
    'bat_spawn_egg',
    'bee_spawn_egg',
    'beef',
    'beetroot',
    'beetroot_soup',
    'birch_boat',
    'birch_chest_boat',
    'birch_hanging_sign',
    'birch_sign',
    'black_dye',
    'blade_pottery_sherd',
    'blaze_powder',
    'blaze_rod',
    'blaze_spawn_egg',
    'blue_dye',
    'bolt_armor_trim_smithing_template',
    'bone',
    'bone_meal',
    'bogged_spawn_egg',
    'book',
    'bordure_indented_banner_pattern',
    'bow',
    'bowl',
    'bread',
    'breeze_rod',
    'breeze_spawn_egg',
    'brewer_pottery_sherd',
    'brick',
    'brown_dye',
    'brush',
    'bucket',
    'bundle',
    'burn_pottery_sherd',
    'cake',
    'camel_spawn_egg',
    'carrot',
    'carrot_on_a_stick',
    'cat_spawn_egg',
    'cave_spider_spawn_egg',
    'chainmail_boots',
    'chainmail_chestplate',
    'chainmail_helmet',
    'chainmail_leggings',
    'chain_command_block',
    'charcoal',
    'cherry_boat',
    'cherry_chest_boat',
    'cherry_hanging_sign',
    'cherry_sign',
    'chest_minecart',
    'chicken',
    'chicken_spawn_egg',
    'chorus_fruit',
    'clay_ball',
    'clock',
    'coast_armor_trim_smithing_template',
    'cocoa_beans',
    'cod',
    'cod_bucket',
    'cod_spawn_egg',
    'command_block',
    'command_block_minecart',
    'compass',
    'cooked_beef',
    'cooked_chicken',
    'cooked_cod',
    'cooked_mutton',
    'cooked_porkchop',
    'cooked_rabbit',
    'cooked_salmon',
    'cookie',
    'copper_ingot',
    'cow_spawn_egg',
    'creaking_spawn_egg',
    'creeper_banner_pattern',
    'creeper_head',
    'creeper_spawn_egg',
    'crimson_hanging_sign',
    'crimson_sign',
    'crossbow',
    'cyan_dye',
    'danger_pottery_sherd',
    'dark_oak_boat',
    'dark_oak_chest_boat',
    'dark_oak_hanging_sign',
    'dark_oak_sign',
    'debug_stick',
    'diamond',
    'diamond_axe',
    'diamond_boots',
    'diamond_chestplate',
    'diamond_helmet',
    'diamond_hoe',
    'diamond_horse_armor',
    'diamond_leggings',
    'diamond_pickaxe',
    'diamond_shovel',
    'diamond_sword',
    'disc_fragment_5',
    'dolphin_spawn_egg',
    'donkey_spawn_egg',
    'dragon_breath',
    'dragon_head',
    'drowned_spawn_egg',
    'dune_armor_trim_smithing_template',
    'echo_shard',
    'egg',
    'elder_guardian_spawn_egg',
    'elytra',
    'emerald',
    'enchanted_golden_apple',
    'ender_eye',
    'ender_pearl',
    'enderman_spawn_egg',
    'endermite_spawn_egg',
    'evoker_spawn_egg',
    'experience_bottle',
    'explorer_pottery_sherd',
    'eye_armor_trim_smithing_template',
    'feather',
    'fermented_spider_eye',
    'field_masoned_banner_pattern',
    'filled_map',
    'fire_charge',
    'firework_rocket',
    'firework_star',
    'fishing_rod',
    'flint',
    'flint_and_steel',
    'flow_armor_trim_smithing_template',
    'flow_banner_pattern',
    'flow_pottery_sherd',
    'flower_banner_pattern',
    'fox_spawn_egg',
    'friend_pottery_sherd',
    'frog_spawn_egg',
    'furnace_minecart',
    'ghast_spawn_egg',
    'ghast_tear',
    'glass_bottle',
    'globe_banner_pattern',
    'glow_berries',
    'glow_ink_sac',
    'glow_item_frame',
    'glowstone_dust',
    'goat_horn',
    'goat_spawn_egg',
    'gold_ingot',
    'gold_nugget',
    'golden_apple',
    'golden_axe',
    'golden_boots',
    'golden_carrot',
    'golden_chestplate',
    'golden_helmet',
    'golden_hoe',
    'golden_horse_armor',
    'golden_leggings',
    'golden_pickaxe',
    'golden_shovel',
    'golden_sword',
    'gray_dye',
    'green_dye',
    'guardian_spawn_egg',
    'gunpowder',
    'guster_banner_pattern',
    'guster_pottery_sherd',
    'heart_of_the_sea',
    'heart_pottery_sherd',
    'heartbreak_pottery_sherd',
    'hoglin_spawn_egg',
    'honeycomb',
    'honey_bottle',
    'hopper_minecart',
    'horse_spawn_egg',
    'host_armor_trim_smithing_template',
    'howl_pottery_sherd',
    'husk_spawn_egg',
    'ink_sac',
    'iron_axe',
    'iron_boots',
    'iron_chestplate',
    'iron_helmet',
    'iron_hoe',
    'iron_horse_armor',
    'iron_ingot',
    'iron_leggings',
    'iron_nugget',
    'iron_pickaxe',
    'iron_shovel',
    'iron_sword',
    'item_frame',
    'jigsaw',
    'jungle_boat',
    'jungle_chest_boat',
    'jungle_hanging_sign',
    'jungle_sign',
    'knowledge_book',
    'lapis_lazuli',
    'lava_bucket',
    'lead',
    'leather',
    'leather_boots',
    'leather_chestplate',
    'leather_helmet',
    'leather_horse_armor',
    'leather_leggings',
    'light',
    'light_blue_dye',
    'light_gray_dye',
    'lime_dye',
    'lingering_potion',
    'llama_spawn_egg',
    'mace',
    'magenta_dye',
    'magma_cream',
    'magma_cube_spawn_egg',
    'mangrove_boat',
    'mangrove_chest_boat',
    'mangrove_hanging_sign',
    'mangrove_sign',
    'map',
    'melon_slice',
    'milk_bucket',
    'miner_pottery_sherd',
    'minecart',
    'mojang_banner_pattern',
    'mooshroom_spawn_egg',
    'mourner_pottery_sherd',
    'mule_spawn_egg',
    'mushroom_stew',
    'music_disc_11',
    'music_disc_13',
    'music_disc_5',
    'music_disc_blocks',
    'music_disc_cat',
    'music_disc_chirp',
    'music_disc_creator',
    'music_disc_creator_music_box',
    'music_disc_far',
    'music_disc_mall',
    'music_disc_mellohi',
    'music_disc_otherside',
    'music_disc_pigstep',
    'music_disc_precipice',
    'music_disc_relic',
    'music_disc_stal',
    'music_disc_strad',
    'music_disc_wait',
    'music_disc_ward',
    'mutton',
    'name_tag',
    'nautilus_shell',
    'netherite_axe',
    'netherite_boots',
    'netherite_chestplate',
    'netherite_helmet',
    'netherite_hoe',
    'netherite_ingot',
    'netherite_leggings',
    'netherite_pickaxe',
    'netherite_scrap',
    'netherite_shovel',
    'netherite_sword',
    'netherite_upgrade_smithing_template',
    'nether_star',
    'nether_wart',
    'oak_boat',
    'oak_chest_boat',
    'oak_hanging_sign',
    'oak_sign',
    'ocelot_spawn_egg',
    'ominous_bottle',
    'ominous_trial_key',
    'orange_dye',
    'painting',
    'pale_oak_boat',
    'pale_oak_chest_boat',
    'pale_oak_hanging_sign',
    'pale_oak_sign',
    'panda_spawn_egg',
    'paper',
    'parrot_spawn_egg',
    'phantom_membrane',
    'phantom_spawn_egg',
    'piglin_banner_pattern',
    'piglin_brute_spawn_egg',
    'piglin_head',
    'piglin_spawn_egg',
    'pillager_spawn_egg',
    'pink_dye',
    'pitcher_pod',
    'player_head',
    'plenty_pottery_sherd',
    'polar_bear_spawn_egg',
    'popped_chorus_fruit',
    'porkchop',
    'potion',
    'potato',
    'powder_snow_bucket',
    'prismarine_crystals',
    'prismarine_shard',
    'prize_pottery_sherd',
    'pufferfish',
    'pufferfish_bucket',
    'pufferfish_spawn_egg',
    'pumpkin_pie',
    'purple_dye',
    'rabbit',
    'rabbit_foot',
    'rabbit_hide',
    'rabbit_spawn_egg',
    'rabbit_stew',
    'raiser_armor_trim_smithing_template',
    'ravager_spawn_egg',
    'raw_copper',
    'raw_gold',
    'raw_iron',
    'recovery_compass',
    'red_dye',
    'redstone',
    'repeating_command_block',
    'resin_brick',
    'resin_clump',
    'rib_armor_trim_smithing_template',
    'rotten_flesh',
    'saddle',
    'salmon',
    'salmon_bucket',
    'salmon_spawn_egg',
    'scrape_pottery_sherd',
    'sentry_armor_trim_smithing_template',
    'shaper_armor_trim_smithing_template',
    'shears',
    'sheaf_pottery_sherd',
    'sheep_spawn_egg',
    'shelter_pottery_sherd',
    'shield',
    'shulker_shell',
    'shulker_spawn_egg',
    'silence_armor_trim_smithing_template',
    'silverfish_spawn_egg',
    'skeleton_horse_spawn_egg',
    'skeleton_skull',
    'skeleton_spawn_egg',
    'skull_banner_pattern',
    'skull_pottery_sherd',
    'slime_ball',
    'slime_spawn_egg',
    'sniffer_egg',
    'sniffer_spawn_egg',
    'snort_pottery_sherd',
    'snout_armor_trim_smithing_template',
    'snowball',
    'snow_golem_spawn_egg',
    'spectral_arrow',
    'spider_eye',
    'spider_spawn_egg',
    'spire_armor_trim_smithing_template',
    'splash_potion',
    'spruce_boat',
    'spruce_chest_boat',
    'spruce_hanging_sign',
    'spruce_sign',
    'spyglass',
    'squid_spawn_egg',
    'stick',
    'stone_axe',
    'stone_hoe',
    'stone_pickaxe',
    'stone_shovel',
    'stone_sword',
    'stray_spawn_egg',
    'strider_spawn_egg',
    'string',
    'structure_block',
    'structure_void',
    'sugar',
    'suspicious_stew',
    'sweet_berries',
    'tadpole_bucket',
    'tadpole_spawn_egg',
    'tide_armor_trim_smithing_template',
    'tipped_arrow',
    'tnt_minecart',
    'totem_of_undying',
    'torchflower_seeds',
    'trader_llama_spawn_egg',
    'trial_key',
    'trident',
    'tropical_fish',
    'tropical_fish_bucket',
    'tropical_fish_spawn_egg',
    'turtle_helmet',
    'turtle_scute',
    'turtle_spawn_egg',
    'vex_armor_trim_smithing_template',
    'vex_spawn_egg',
    'villager_spawn_egg',
    'vindicator_spawn_egg',
    'wandering_trader_spawn_egg',
    'ward_armor_trim_smithing_template',
    'warden_spawn_egg',
    'warped_fungus_on_a_stick',
    'warped_hanging_sign',
    'warped_sign',
    'water_bucket',
    'wayfinder_armor_trim_smithing_template',
    'wheat',
    'white_dye',
    'wild_armor_trim_smithing_template',
    'wind_charge',
    'witch_spawn_egg',
    'wither_skeleton_skull',
    'wither_skeleton_spawn_egg',
    'wither_spawn_egg',
    'wolf_armor',
    'wolf_spawn_egg',
    'wooden_axe',
    'wooden_hoe',
    'wooden_pickaxe',
    'wooden_shovel',
    'wooden_sword',
    'writable_book',
    'written_book',
    'yellow_dye',
    'zoglin_spawn_egg',
    'zombie_head',
    'zombie_horse_spawn_egg',
    'zombie_spawn_egg',
    'zombie_villager_spawn_egg',
    'zombified_piglin_spawn_egg',
    'bucket_of_sulfur_cube',
    'bounce_music_disc',
    'sulfur_cube_spawn_egg',
    'copper_sword',
    'copper_pickaxe',
    'copper_axe',
    'copper_shovel',
    'copper_hoe',
    'copper_helmet',
    'copper_chestplate',
    'copper_leggings',
    'copper_boots',
    'copper_nugget',
    'copper_horse_armor',
    'enchanted_book',
    'suspicious_stew',
    'copper_nautilus_armor',
    'iron_nautilus_armor',
    'gold_nautilus_armor',
    'diamond_nautilus_armor',
    'netherite_nautilus_armor'
];
const STRICT_ITEMS = new Set(ITEMS);

const flatItems = new Set([...STRICT_ITEMS]);
[
    'creeper_head', 'zombie_head', 'skeleton_skull', 'wither_skeleton_skull',
    'player_head', 'dragon_head', 'piglin_head',
    'command_block', 'repeating_command_block', 'chain_command_block',
    'barrier', 'light', 'structure_block', 'structure_void', 'jigsaw',
].forEach(k => flatItems.delete(k));

const baseBlocks = [
    'air', 'stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite',
    'grass_block', 'dirt', 'coarse_dirt', 'podzol', 'rooted_dirt', 'mud', 'cobblestone', 'bedrock', 'sand', 'red_sand',
    'gravel', 'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore', 'copper_ore', 'deepslate_copper_ore',
    'gold_ore', 'deepslate_gold_ore', 'redstone_ore', 'deepslate_redstone_ore', 'emerald_ore', 'deepslate_emerald_ore',
    'lapis_ore', 'deepslate_lapis_ore', 'diamond_ore', 'deepslate_diamond_ore', 'nether_gold_ore', 'nether_quartz_ore',
    'ancient_debris', 'coal_block', 'raw_iron_block', 'raw_copper_block', 'raw_gold_block', 'iron_block', 'copper_block',
    'exposed_copper', 'weathered_copper', 'oxidized_copper',
    'waxed_copper_block', 'waxed_exposed_copper', 'waxed_weathered_copper', 'waxed_oxidized_copper',
    'cut_copper', 'exposed_cut_copper', 'weathered_cut_copper', 'oxidized_cut_copper',
    'waxed_cut_copper', 'waxed_exposed_cut_copper', 'waxed_weathered_cut_copper', 'waxed_oxidized_cut_copper',
    'chiseled_copper', 'exposed_chiseled_copper', 'weathered_chiseled_copper', 'oxidized_chiseled_copper',
    'waxed_chiseled_copper', 'waxed_exposed_chiseled_copper', 'waxed_weathered_chiseled_copper', 'waxed_oxidized_chiseled_copper',
    'gold_block', 'diamond_block', 'netherite_block', 'emerald_block', 'lapis_block', 'redstone_block',
    'amethyst_block', 'budding_amethyst', 'amethyst_cluster', 'large_amethyst_bud', 'medium_amethyst_bud', 'small_amethyst_bud',
    'sponge', 'wet_sponge', 'glass', 'tinted_glass',
    'sandstone', 'chiseled_sandstone', 'cut_sandstone', 'smooth_sandstone',
    'red_sandstone', 'chiseled_red_sandstone', 'cut_red_sandstone', 'smooth_red_sandstone',
    'cobweb', 'short_grass', 'fern', 'dead_bush', 'seagrass', 'tall_seagrass', 'sea_pickle',
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet',
    'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley',
    'wither_rose', 'torchflower', 'pitcher_plant', 'open_eyeblossom', 'closed_eyeblossom',
    'brown_mushroom', 'red_mushroom',
    'brown_mushroom_block', 'red_mushroom_block', 'mushroom_stem',
    'bricks', 'bookshelf', 'chiseled_bookshelf', 'mossy_cobblestone', 'obsidian', 'crying_obsidian',
    'torch', 'soul_torch', 'lantern', 'soul_lantern',
    'end_rod', 'chorus_plant', 'chorus_flower', 'purpur_block', 'purpur_pillar',
    'spawner', 'trial_spawner', 'vault',
    'chest', 'trapped_chest', 'ender_chest', 'barrel',
    'crafting_table', 'furnace', 'blast_furnace', 'smoker',
    'farmland', 'dirt_path',
    'ladder', 'scaffolding',
    'snow', 'snow_block', 'powder_snow', 'ice', 'packed_ice', 'blue_ice',
    'cactus', 'clay', 'jukebox',
    'pumpkin', 'carved_pumpkin', 'jack_o_lantern', 'melon',
    'netherrack', 'soul_sand', 'soul_soil',
    'basalt', 'polished_basalt', 'smooth_basalt',
    'glowstone', 'shroomlight', 'sea_lantern', 'redstone_lamp',
    'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks', 'smooth_stone',
    'infested_stone', 'infested_cobblestone', 'infested_stone_bricks', 'infested_mossy_stone_bricks',
    'infested_cracked_stone_bricks', 'infested_chiseled_stone_bricks', 'infested_deepslate',
    'mycelium', 'lily_pad', 'nether_bricks', 'cracked_nether_bricks', 'chiseled_nether_bricks',
    'red_nether_bricks', 'nether_wart_block', 'warped_wart_block',
    'end_stone', 'end_stone_bricks', 'dragon_egg', 'dragon_head',
    'beacon', 'conduit',
    'quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'smooth_quartz',
    'slime_block', 'honey_block', 'honeycomb_block',
    'prismarine', 'prismarine_bricks', 'dark_prismarine',
    'hay_block', 'bone_block', 'dried_kelp_block',
    'terracotta', 'white_terracotta', 'orange_terracotta', 'magenta_terracotta', 'light_blue_terracotta',
    'yellow_terracotta', 'lime_terracotta', 'pink_terracotta', 'gray_terracotta', 'light_gray_terracotta',
    'cyan_terracotta', 'purple_terracotta', 'blue_terracotta', 'brown_terracotta', 'green_terracotta',
    'red_terracotta', 'black_terracotta',
    'sunflower', 'lilac', 'rose_bush', 'peony', 'tall_grass', 'large_fern', 'pitcher_crop',
    'magma_block', 'target',
    'kelp', 'kelp_plant', 'turtle_egg', 'frogspawn',
    'tube_coral', 'brain_coral', 'bubble_coral', 'fire_coral', 'horn_coral',
    'tube_coral_block', 'brain_coral_block', 'bubble_coral_block', 'fire_coral_block', 'horn_coral_block',
    'tube_coral_fan', 'brain_coral_fan', 'bubble_coral_fan', 'fire_coral_fan', 'horn_coral_fan',
    'dead_tube_coral', 'dead_brain_coral', 'dead_bubble_coral', 'dead_fire_coral', 'dead_horn_coral',
    'dead_tube_coral_block', 'dead_brain_coral_block', 'dead_bubble_coral_block', 'dead_fire_coral_block', 'dead_horn_coral_block',
    'dead_tube_coral_fan', 'dead_brain_coral_fan', 'dead_bubble_coral_fan', 'dead_fire_coral_fan', 'dead_horn_coral_fan',
     'bamboo', 'bamboo_block', 'stripped_bamboo_block',
    'campfire', 'soul_campfire',
    'weeping_vines', 'weeping_vines_plant', 'twisting_vines', 'twisting_vines_plant',
    'crimson_roots', 'warped_roots', 'nether_sprouts',
    'crimson_fungus', 'warped_fungus',
    'respawn_anchor',
    'blackstone', 'gilded_blackstone', 'polished_blackstone', 'chiseled_polished_blackstone',
    'polished_blackstone_bricks', 'cracked_polished_blackstone_bricks',
    'tuff', 'tuff_bricks', 'chiseled_tuff', 'polished_tuff',
    'calcite',
    'sculk', 'sculk_vein', 'sculk_catalyst', 'sculk_shrieker', 'sculk_sensor', 'calibrated_sculk_sensor',
    'dripstone_block', 'pointed_dripstone',
    'moss_block', 'moss_carpet',
    'azalea', 'flowering_azalea', 'azalea_leaves', 'flowering_azalea_leaves',
    'hanging_roots', 'spore_blossom', 'glow_lichen',
    'packed_mud', 'mud_bricks',
    'mangrove_roots', 'muddy_mangrove_roots',
    'ochre_froglight', 'verdant_froglight', 'pearlescent_froglight',
    'suspicious_sand', 'suspicious_gravel',
    'pink_petals',
    'decorated_pot',
    'crafter',
    'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb',
    'waxed_copper_bulb', 'waxed_exposed_copper_bulb', 'waxed_weathered_copper_bulb', 'waxed_oxidized_copper_bulb',
    'copper_grate', 'exposed_copper_grate', 'weathered_copper_grate', 'oxidized_copper_grate',
    'waxed_copper_grate', 'waxed_exposed_copper_grate', 'waxed_weathered_copper_grate', 'waxed_oxidized_copper_grate',
    'copper_door', 'exposed_copper_door', 'weathered_copper_door', 'oxidized_copper_door',
    'waxed_copper_door', 'waxed_exposed_copper_door', 'waxed_weathered_copper_door', 'waxed_oxidized_copper_door',
    'copper_trapdoor', 'exposed_copper_trapdoor', 'weathered_copper_trapdoor', 'oxidized_copper_trapdoor',
    'waxed_copper_trapdoor', 'waxed_exposed_copper_trapdoor', 'waxed_weathered_copper_trapdoor', 'waxed_oxidized_copper_trapdoor',
    'heavy_core', 'cobbled_deepslate', 'deepslate', 'chiseled_deepslate',
    'deepslate_bricks', 'cracked_deepslate_bricks', 'deepslate_tiles', 'cracked_deepslate_tiles',
    'reinforced_deepslate',
    'sweet_berry_bush',
    'nether_wart', 'soul_fire', 'fire',
    'iron_bars', 'iron_door', 'iron_trapdoor',
    'observer', 'dispenser', 'dropper', 'hopper', 'piston', 'sticky_piston',
    'tnt', 'anvil', 'chipped_anvil', 'damaged_anvil',
    'grindstone', 'stonecutter', 'loom', 'cartography_table', 'fletching_table', 'smithing_table',
    'bell', 'lectern', 'composter', 'cauldron',
    'note_block', 'daylight_detector', 'comparator', 'repeater',
    'lever', 'tripwire_hook', 'tripwire',
    'stone_button', 'oak_button', 'spruce_button', 'birch_button', 'jungle_button',
    'acacia_button', 'dark_oak_button', 'mangrove_button', 'cherry_button', 'pale_oak_button',
    'bamboo_button', 'crimson_button', 'warped_button', 'polished_blackstone_button',
    'stone_pressure_plate', 'oak_pressure_plate', 'spruce_pressure_plate', 'birch_pressure_plate',
    'jungle_pressure_plate', 'acacia_pressure_plate', 'dark_oak_pressure_plate', 'mangrove_pressure_plate',
    'cherry_pressure_plate', 'pale_oak_pressure_plate', 'bamboo_pressure_plate', 'crimson_pressure_plate',
    'warped_pressure_plate', 'polished_blackstone_pressure_plate',
    'light_weighted_pressure_plate', 'heavy_weighted_pressure_plate',
    'oak_fence_gate', 'spruce_fence_gate', 'birch_fence_gate', 'jungle_fence_gate',
    'acacia_fence_gate', 'dark_oak_fence_gate', 'mangrove_fence_gate', 'cherry_fence_gate',
    'pale_oak_fence_gate', 'bamboo_fence_gate', 'crimson_fence_gate', 'warped_fence_gate',
    'lightning_rod',
    'iron_chain',
    'vine', 
    'sugar_cane',
    'glass_pane',
    'cake',
    'end_portal_frame', 'end_gateway', 'end_portal',
    'nether_portal',
    'structure_block', 'structure_void', 'jigsaw', 'command_block',
    'repeating_command_block', 'chain_command_block',
    'barrier', 'light',
    'pale_hanging_moss', 'pale_moss_block', 'pale_moss_carpet', 
    'resin_block', 'resin_bricks', 'chiseled_resin_bricks', 'resin_brick', 'resin_clump',
    'sulfur',
    'polished_sulfur',
    'chiseled_sulfur',
    'sulfur_bricks',
    'sulfur_slab',
    'sulfur_stairs',
    'sulfur_wall',

    'polished_sulfur_slab',
    'polished_sulfur_stairs',
    'polished_sulfur_wall',

    'sulfur_brick_slab',
    'sulfur_brick_stairs',
    'sulfur_brick_wall',
    'cinnabar',
    'polished_cinnabar',
    'chiseled_cinnabar',
    'cinnabar_bricks', 
    'cinnabar_slab',
    'cinnabar_stairs',
    'cinnabar_wall', 
    'polished_cinnabar_slab',
    'polished_cinnabar_stairs',
    'polished_cinnabar_wall',

    'cinnabar_brick_slab',
    'cinnabar_brick_stairs',
    'cinnabar_brick_wall',
    'potent_sulfur',
    'sulfur_spike',
    'copper_chain', 
    'exposed_copper_chain', 
    'weathered_copper_chain', 
    'oxidized_copper_chain', 
    'waxed_copper_chain', 
    'waxed_exposed_copper_chain', 
    'waxed_weathered_copper_chain', 
    'waxed_oxidized_copper_chain',
    'chest_right', 'chest_left', 'trapped_right', 'trapped_left', 'red_bed_head', 'red_bed_foot',

    ...ITEMS
];
const cubeAllBlocks = [
    'air', 'stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite',
    'grass_block', 'dirt', 'coarse_dirt', 'podzol', 'rooted_dirt', 'mud', 'cobblestone', 'bedrock', 'sand', 'red_sand',
    'gravel', 'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore', 'copper_ore', 'deepslate_copper_ore',
    'gold_ore', 'deepslate_gold_ore', 'redstone_ore', 'deepslate_redstone_ore', 'emerald_ore', 'deepslate_emerald_ore',
    'lapis_ore', 'deepslate_lapis_ore', 'diamond_ore', 'deepslate_diamond_ore', 'nether_gold_ore', 'nether_quartz_ore',
    'ancient_debris', 'coal_block', 'raw_iron_block', 'raw_copper_block', 'raw_gold_block', 'iron_block', 'copper_block',
    'exposed_copper', 'weathered_copper', 'oxidized_copper',
    'waxed_copper_block', 'waxed_exposed_copper', 'waxed_weathered_copper', 'waxed_oxidized_copper',
    'cut_copper', 'exposed_cut_copper', 'weathered_cut_copper', 'oxidized_cut_copper',
    'waxed_cut_copper', 'waxed_exposed_cut_copper', 'waxed_weathered_cut_copper', 'waxed_oxidized_cut_copper',
    'chiseled_copper', 'exposed_chiseled_copper', 'weathered_chiseled_copper', 'oxidized_chiseled_copper',
    'waxed_chiseled_copper', 'waxed_exposed_chiseled_copper', 'waxed_weathered_chiseled_copper', 'waxed_oxidized_chiseled_copper',
    'gold_block', 'diamond_block', 'netherite_block', 'emerald_block', 'lapis_block', 'redstone_block',
    'amethyst_block', 'budding_amethyst', 
    'sponge', 'wet_sponge', 
    'sandstone', 'chiseled_sandstone', 'cut_sandstone', 'smooth_sandstone',
    'red_sandstone', 'chiseled_red_sandstone', 'cut_red_sandstone', 'smooth_red_sandstone',
    'brown_mushroom', 'red_mushroom',
    'brown_mushroom_block', 'red_mushroom_block', 'mushroom_stem',
    'bricks', 'bookshelf', 'chiseled_bookshelf', 'mossy_cobblestone', 'obsidian', 'crying_obsidian',
    'purpur_block', 'purpur_pillar',
    'spawner', 'trial_spawner', 'vault',
    'barrel',
    'crafting_table', 'furnace', 'blast_furnace', 'smoker',
    'farmland', 'dirt_path',
    'snow', 'snow_block', 'ice', 'packed_ice', 'blue_ice',
    'clay', 'jukebox',
    'pumpkin', 'carved_pumpkin', 'jack_o_lantern', 'melon',
    'netherrack', 'soul_sand', 'soul_soil',
    'basalt', 'polished_basalt', 'smooth_basalt',
    'glowstone', 'shroomlight', 'sea_lantern', 'redstone_lamp',
    'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks', 'smooth_stone',
    'infested_stone', 'infested_cobblestone', 'infested_stone_bricks', 'infested_mossy_stone_bricks',
    'infested_cracked_stone_bricks', 'infested_chiseled_stone_bricks', 'infested_deepslate',
    'mycelium', 'nether_bricks', 'cracked_nether_bricks', 'chiseled_nether_bricks',
    'red_nether_bricks', 'nether_wart_block', 'warped_wart_block',
    'end_stone', 'end_stone_bricks', 
    'beacon', 
    'quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'smooth_quartz',
    'honeycomb_block',
    'prismarine', 'prismarine_bricks', 'dark_prismarine',
    'hay_block', 'bone_block', 'dried_kelp_block',
    'terracotta', 'white_terracotta', 'orange_terracotta', 'magenta_terracotta', 'light_blue_terracotta',
    'yellow_terracotta', 'lime_terracotta', 'pink_terracotta', 'gray_terracotta', 'light_gray_terracotta',
    'cyan_terracotta', 'purple_terracotta', 'blue_terracotta', 'brown_terracotta', 'green_terracotta',
    'red_terracotta', 'black_terracotta',
    'magma_block', 'target',
    'tube_coral', 'brain_coral', 'bubble_coral', 'fire_coral', 'horn_coral',
    'tube_coral_block', 'brain_coral_block', 'bubble_coral_block', 'fire_coral_block', 'horn_coral_block',
    'dead_tube_coral', 'dead_brain_coral', 'dead_bubble_coral', 'dead_fire_coral', 'dead_horn_coral',
    'dead_tube_coral_block', 'dead_brain_coral_block', 'dead_bubble_coral_block', 'dead_fire_coral_block', 'dead_horn_coral_block',
    'bamboo', 'bamboo_block', 'stripped_bamboo_block',
    'respawn_anchor',
    'blackstone', 'gilded_blackstone', 'polished_blackstone', 'chiseled_polished_blackstone',
    'polished_blackstone_bricks', 'cracked_polished_blackstone_bricks',
    'tuff', 'tuff_bricks', 'chiseled_tuff', 'polished_tuff',
    'calcite',
    'sculk', 'sculk_catalyst', 
    'dripstone_block', 
    'moss_block', 
    'packed_mud', 'mud_bricks',
    'muddy_mangrove_roots',
    'ochre_froglight', 'verdant_froglight', 'pearlescent_froglight',
    'suspicious_sand', 'suspicious_gravel',
    'crafter',
    'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb',
    'waxed_copper_bulb', 'waxed_exposed_copper_bulb', 'waxed_weathered_copper_bulb', 'waxed_oxidized_copper_bulb', 
    'cobbled_deepslate', 'deepslate', 'chiseled_deepslate',
    'deepslate_bricks', 'cracked_deepslate_bricks', 'deepslate_tiles', 'cracked_deepslate_tiles',
    'reinforced_deepslate',
    'iron_bars', 
    'observer', 'dispenser', 'dropper', 'piston', 'sticky_piston',
    'tnt', 'loom', 'cartography_table', 'fletching_table', 'smithing_table',
    'note_block', 
    'glass_pane',
    'pale_moss_block', 
    'resin_block', 'resin_bricks', 'chiseled_resin_bricks', 'resin_brick',
    'sulfur',
    'polished_sulfur',
    'chiseled_sulfur',
    'sulfur_bricks',
    'cinnabar',
    'polished_cinnabar',
    'chiseled_cinnabar',
    'cinnabar_bricks', 
    'potent_sulfur',
    "oak_planks", "oak_log", "stripped_oak_log", "oak_wood", "stripped_oak_wood",
    "spruce_planks", "spruce_log", "stripped_spruce_log", "spruce_wood", "stripped_spruce_wood",
    "birch_planks", "birch_log", "stripped_birch_log", "birch_wood", "stripped_birch_wood",
    "jungle_planks", "jungle_log", "stripped_jungle_log", "jungle_wood", "stripped_jungle_wood",
    "acacia_planks", "acacia_log", "stripped_acacia_log", "acacia_wood", "stripped_acacia_wood",
    "dark_oak_planks", "dark_oak_log", "stripped_dark_oak_log", "dark_oak_wood", "stripped_dark_oak_wood",
    "mangrove_planks", "mangrove_log", "stripped_mangrove_log", "mangrove_wood", "stripped_mangrove_wood",
    "cherry_planks", "cherry_log", "stripped_cherry_log", "cherry_wood", "stripped_cherry_wood",
    "crimson_planks", "crimson_stem", "stripped_crimson_stem", "crimson_hyphae", "stripped_crimson_hyphae",
    "warped_planks", "warped_stem", "stripped_warped_stem", "warped_hyphae", "stripped_warped_hyphae",
    "pale_oak_planks", "pale_oak_log", "stripped_pale_oak_log", "pale_oak_wood", "stripped_pale_oak_wood",
    "bamboo_planks", "bamboo_mosaic",
    "white_concrete", "orange_concrete", "magenta_concrete", "light_blue_concrete",
    "yellow_concrete", "lime_concrete", "pink_concrete", "gray_concrete",
    "light_gray_concrete", "cyan_concrete", "purple_concrete", "blue_concrete",
    "brown_concrete", "green_concrete", "red_concrete", "black_concrete",
    "white_glazed_terracotta", "orange_glazed_terracotta", "magenta_glazed_terracotta", "light_blue_glazed_terracotta",
    "yellow_glazed_terracotta", "lime_glazed_terracotta", "pink_glazed_terracotta", "gray_glazed_terracotta",
    "light_gray_glazed_terracotta", "cyan_glazed_terracotta", "purple_glazed_terracotta", "blue_glazed_terracotta",
    "brown_glazed_terracotta", "green_glazed_terracotta", "red_glazed_terracotta", "black_glazed_terracotta",
    "white_wool", "orange_wool", "magenta_wool", "light_blue_wool",
    "yellow_wool", "lime_wool", "pink_wool", "gray_wool",
    "light_gray_wool", "cyan_wool", "purple_wool", "blue_wool",
    "brown_wool", "green_wool", "red_wool", "black_wool",
    'copper_chain', 'exposed_copper_chain', 'weathered_copper_chain', 'oxidized_copper_chain', 'waxed_copper_chain', 'waxed_exposed_copper_chain', 'waxed_weathered_copper_chain', 'waxed_oxidized_copper_chain'
    ];

const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'crimson', 'warped', 'bamboo'];
const STONE_TYPES = ['stone', 'cobblestone', 'mossy_cobblestone', 'stone_brick', 'mossy_stone_brick', 'granite', 'diorite', 'andesite', 'sandstone', 'red_sandstone', 'brick', 'prismarine', 'dark_prismarine', 'nether_brick', 'red_nether_brick', 'end_stone_brick', 'blackstone', 'polished_blackstone', 'deepslate_brick', 'deepslate_tile', 'tuff', 'polished_tuff', 'mud_brick', 'cut_copper', 'exposed_cut_copper', 'weathered_cut_copper', 'oxidized_cut_copper', 'waxed_cut_copper', 'waxed_exposed_cut_copper', 'waxed_weathered_cut_copper', 'waxed_oxidized_cut_copper', 'cobbled_deepslate', 'smooth_sandstone', 'smooth_red_sandstone', 'smooth_quartz', 'purpur', 'resin_brick'];

const generatedBlocks = [...baseBlocks];

COLORS.forEach(c => {
    generatedBlocks.push(`${c}_wool`, `${c}_stained_glass`, `${c}_concrete`, `${c}_concrete_powder`, `${c}_glazed_terracotta`, `${c}_carpet`, `${c}_stained_glass_pane`, `${c}_shulker_box`, `${c}_candle`, `${c}_bed`, `${c}_bed_head`, `${c}_bed_foot`);
});

WOODS.forEach(w => {
    let log = w === 'crimson' || w === 'warped' ? `${w}_stem` : w === 'bamboo' ? `${w}_block` : `${w}_log`;
    let strippedLog = w === 'crimson' || w === 'warped' ? `stripped_${w}_stem` : w === 'bamboo' ? `stripped_${w}_block` : `stripped_${w}_log`;
    let wood = w === 'crimson' || w === 'warped' ? `${w}_hyphae` : w === 'bamboo' ? null : `${w}_wood`;
    let strippedWood = w === 'crimson' || w === 'warped' ? `stripped_${w}_hyphae` : w === 'bamboo' ? null : `stripped_${w}_wood`;
    let planks = `${w}_planks`;
    let leaves = w === 'crimson' ? 'nether_wart_block' : w === 'warped' ? 'warped_wart_block' : w === 'bamboo' ? null : `${w}_leaves`;
    let sapling = w === 'crimson' || w === 'warped' ? `${w}_fungus` : w === 'mangrove' ? `mangrove_propagule` : w === 'bamboo' ? `bamboo` : `${w}_sapling`;

    generatedBlocks.push(log, strippedLog, planks);
    if (wood) generatedBlocks.push(wood);
    if (strippedWood) generatedBlocks.push(strippedWood);
    if (leaves && !generatedBlocks.includes(leaves)) generatedBlocks.push(leaves);
    if (sapling && !generatedBlocks.includes(sapling)) generatedBlocks.push(sapling);
    generatedBlocks.push(`${w}_slab`, `${w}_stairs`, `${w}_fence`, `${w}_fence_gate`, `${w}_door`, `${w}_door_top`, `${w}_trapdoor`);
    if (w !== 'bamboo' && w !== 'crimson' && w !== 'warped') {
        generatedBlocks.push(`${w}_pressure_plate`, `${w}_button`);
    }
});

STONE_TYPES.forEach(st => {
    generatedBlocks.push(`${st}_slab`, `${st}_stairs`);
    if (!['dark_prismarine', 'stone', 'cut_copper', 'exposed_cut_copper', 'weathered_cut_copper', 'oxidized_cut_copper', 'waxed_cut_copper', 'waxed_exposed_cut_copper', 'waxed_weathered_cut_copper', 'waxed_oxidized_cut_copper', 'smooth_sandstone', 'smooth_red_sandstone', 'smooth_quartz', 'purpur', 'resin_brick', 'sulfur', 'polished_sulfur', 'sulfur_brick', 'cinnabar', 'polished_cinnabar', 'cinnabar_brick'].includes(st)) {
        generatedBlocks.push(`${st}_wall`);
    }
});

generatedBlocks.push('iron_door', 'iron_door_top', 'iron_trapdoor');

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

const TRANSPARENT_BLOCKS = new Set(['glass', 'ice', 'slime_block', 'beacon', 'sculk_shrieker', 'sculk_sensor', 'snow', 'cactus', 'spawner', 'vault', 'trial_spawner', 'heavy_core', 'ladder', 'bamboo', 'turtle_egg', 'sculk_vein', 'glow_lichen']);
const isTransparent = new Uint8Array(65535);
isTransparent[0] = 1; 
ALL_BLOCKS.forEach((b) => {
    if (TRANSPARENT_BLOCKS.has(b) || 
        ['pale_hanging_moss', 'leaves', 'glass', 'door', 'trapdoor', 'fence', 'stairs', 'slab', 'wall', 'pane', 'candle', 'campfire', 'chest', 'lantern', 'torch', 'cobweb', 'iron_chain', 'iron_bars', 'carpet', 'copper_chain', 'exposed_copper_chain', 'weathered_copper_chain', 'oxidized_copper_chain', 'waxed_copper_chain', 'waxed_exposed_copper_chain', 'waxed_weathered_copper_chain', 'waxed_oxidized_copper_chain', 'lily_pad', 'mushroom', 'sapling', 'roots', 'vines', 'coral', 'cactus', 'spawner', 'vault', 'trial_spawner', 'heavy_core', 'trapped_chest', 'ender_chest', 'cluster', 'azalea', 'lilac', 'peony', 'seagrass', 'kelp', 'pickle', 'conduit', 'head', 'skull', 'pot', 'bell', 'cake', 'end_rod', 'bush', 'fern', 'short_grass', 'tall_grass', 'sprout', 'dripstone', 'spore_blossom', 'flower', 'tulip', 'orchid', 'daisy', 'allium', 'bluet', 'fungus', 'propagule', 'berry', 'dandelion', 'poppy', 'wither_rose', 'azure_bluet', 'lily_of_the_valley', 'sculk_vein', 'glow_lichen', 'ladder', 'bamboo', 'turtle_egg', 'scaffolding', 'copper_grate', 'exposed_copper_grate', 'weathered_copper_grate', 'oxidized_copper_grate', 'waxed_copper_grate', 'waxed_exposed_copper_grate', 'waxed_weathered_copper_grate', 'waxed_oxidized_copper_grate', 'stonecutter', 'sulfur_spike', 'trapped_left', 'trapped_right',].some(kw => b.includes(kw))) {
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
    spawns: { name: 'Spawn Eggs', icon: 'creeper_spawn_egg', blocks: [] },
    operator: { name: 'Operator Utilities', icon: 'command_block', blocks: [] },
    inventory: { name: 'Survival Inventory', icon: 'chest', blocks: [] }
};
const HIDDEN_CREATIVE_BLOCKS = new Set([
    'air',

    'pitcher_crop',
    'sweet_berry_bush',

    'kelp_plant',
    'weeping_vines_plant',
    'twisting_vines_plant',

    'fire',
    'soul_fire',
    //'chest_right', 'chest_left', 'trapped_right', 'trapped_left',
    'end_portal',
    'end_gateway',
    'nether_portal',
    'infested_stone',
    'infested_cobblestone',
    'infested_stone_bricks',
    'infested_mossy_stone_bricks',
    'infested_cracked_stone_bricks',
    'infested_chiseled_stone_bricks',
    'infested_deepslate',
    'spawner',
    'trial_spawner',
    'vault',
    'knowledge_book',
    'frogspawn',

    'cave_vines_plant',

    'void_air',
    'cave_air',

    'moving_piston',
    'piston_head',

    'wall_torch',
    'redstone_wall_torch',
    'soul_wall_torch',

    'attached_melon_stem',
    'attached_pumpkin_stem',

    'big_dripleaf_stem',

    'bubble_column',

    'wall_sign',
    'wall_hanging_sign',

    'skeleton_wall_skull',
    'wither_skeleton_wall_skull',
    'zombie_wall_head',
    'player_wall_head',
    'creeper_wall_head',
    'dragon_wall_head',
    'piglin_wall_head',
    'tripwire',
    'structure_block',
    'structure_void',
    'jigsaw',
    'command_block',
    'chain_command_block',
    'repeating_command'
]);
ALL_BLOCKS.forEach(b => {
    if (
        HIDDEN_CREATIVE_BLOCKS.has(b) ||

        b.endsWith('_inner') ||
        b.endsWith('_outer') ||
        b.endsWith('_top') ||

        b.endsWith('_wall_head') ||
        b.endsWith('_wall_skull') ||
        b.endsWith('_wall_sign') ||
        b.endsWith('_wall_hanging_sign')
    ) return;

    if (STRICT_ITEMS.has(b)) {
        if (b.includes('sword') || b.includes('bow') || b.includes('arrow') || b.includes('helmet') || b.includes('chestplate') || b.includes('leggings') || b.includes('boots') || b === 'shield' || b === 'trident' || b === 'crossbow' || b === 'mace' || b === 'wind_charge' || b === 'totem_of_undying' || b === 'turtle_helmet') CATEGORIES.combat.blocks.push(b);
        else if (['apple', 'beef', 'bread', 'porkchop', 'potato', 'chicken', 'mutton', 'rabbit', 'salmon', 'cod', 'cookie', 'melon_slice', 'beetroot', 'carrot', 'berry', 'kelp', 'stew', 'soup', 'pie', 'honey_bottle', 'chorus_fruit', 'tropical_fish', 'pufferfish', 'sweet_berries', 'glow_berries', 'dried_kelp', 'suspicious_stew', 'enchanted_golden_apple'].some(k=>b.includes(k))) CATEGORIES.food.blocks.push(b);
        else if (b.includes('pickaxe') || b.includes('axe') || b.includes('shovel') || b.includes('hoe') || b === 'compass' || b === 'recovery_compass' || b === 'clock' || b === 'flint_and_steel' || b === 'shears' || b === 'fishing_rod' || b === 'carrot_on_a_stick' || b === 'warped_fungus_on_a_stick' || b === 'spyglass' || b === 'brush' || b === 'lead' || b === 'name_tag' || b.includes('horse_armor') || b === 'saddle' || b === 'elytra' || b === 'goat_horn' || b === 'wolf_armor') CATEGORIES.tools.blocks.push(b);
        else if (b.includes('head') || b.includes('skull') || b === 'egg' || b.includes('spawn_egg') || b.includes('pottery_sherd') || b.includes('banner_pattern') || b === 'sniffer_egg') CATEGORIES.spawns.blocks.push(b);
        else if (b.includes('command_block') || b.includes('structure') || b === 'light' || b === 'jigsaw' || b === 'barrier') CATEGORIES.operator.blocks.push(b);
        else CATEGORIES.materials.blocks.push(b);
    } else if (b.includes('wool') || b.includes('concrete') || b.includes('terracotta') || b.includes('stained_glass')) {
        CATEGORIES.colored.blocks.push(b);
    } else if (b.includes('redstone') || b.includes('piston') || b.includes('door') || b.includes('trapdoor') || b.includes('sensor') || b.includes('lamp') || b.includes('observer') || b.includes('dispenser') || b.includes('dropper')) {
        CATEGORIES.redstone.blocks.push(b);
    } else if (['chest', 'crafting_table', 'furnace', 'spawner', 'beacon', 'anvil', 'loom', 'shulker_box', 'sign', 'crafter'].some(kw => b.includes(kw))) {
        CATEGORIES.functional.blocks.push(b);
    } else if (['dirt', 'grass_block', 'short_grass', 'tall_grass', 'sand', 'gravel', 'ore', 'log', 'leaves', 'sapling', 'coral', 'plant', 'flower', 'mushroom', 'sponge', 'bedrock', 'stone', 'granite', 'diorite', 'andesite', 'tuff', 'deepslate', 'ice', 'snow', 'dripstone'].some(kw => b.includes(kw)) && !b.includes('bricks') && !b.includes('stairs') && !b.includes('slab')) {
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
let currentCreativeRow = 0; 

const INVENTORY_SIZE = 9; 
const inventory = Array(INVENTORY_SIZE).fill(null).map(() => ({ type: null, count: 0 }));

inventory[0] = { type: 'netherite_shovel', count: 1 };
inventory[1] = { type: 'snow', count: 64 };
inventory[2] = { type: 'grass_block', count: 64 };
inventory[3] = { type: 'tall_grass', count: 64 };
inventory[4] = { type: 'sunflower', count: 64 };
inventory[5] = { type: 'furnace', count: 64 };
inventory[6] = { type: 'oak_stairs', count: 64 };
inventory[7] = { type: 'lily_pad', count: 64 };
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

const STRICT_ITEMS_SET = new Set(STRICT_ITEMS);

// ============================================================================
// 4. TEXTURE LOADERS & PATH RESOLVERS
// ============================================================================
const imageLoader = new THREE.ImageLoader();
imageLoader.setCrossOrigin('anonymous');

function resolveTexturePath(name, isIconContext = false) {
    let folder = BLOCK_TEX_DIR;
    let filename = name;

    if (name === 'air') return { folder, filename, is2D: false };

    if (name === 'compass') { folder = ITEM_TEX_DIR; filename = 'compass_16'; }
    else if (name === 'compass_tab') filename = 'compass_01';
    else if (name === 'redstone') { folder = ITEM_TEX_DIR; filename = 'redstone'; }
    else if (name === 'clock') { folder = ITEM_TEX_DIR; filename = 'clock_00'; }
    else if (name === 'glass_pane') { folder = BLOCK_TEX_DIR; filename = 'glass'}
    else if (name === 'bucket_of_sulfur_cube') { folder = ITEM_TEX_DIR; filename = 'sulfur_cube_bucket'}
    else if (name === 'waxed_copper_door') { folder = ITEM_TEX_DIR; filename = 'copper_door'}
    else if (name === 'waxed_exposed_copper_door') { folder = ITEM_TEX_DIR; filename = 'exposed_copper_door'}
    else if (name === 'waxed_oxidized_copper_door') { folder = ITEM_TEX_DIR; filename = 'oxidized_copper_door'}
    else if (name === 'waxed_weathered_copper_door') { folder = ITEM_TEX_DIR; filename = 'weathered_copper_door'}
    else if (name === 'waxed_copper_chain') { folder = ITEM_TEX_DIR; filename = 'copper_chain'}
    else if (name === 'waxed_exposed_copper_chain') { folder = ITEM_TEX_DIR; filename = 'exposed_copper_chain'}
    else if (name === 'waxed_oxidized_copper_chain') { folder = ITEM_TEX_DIR; filename = 'oxidized_copper_chain'}
    else if (name === 'waxed_weathered_copper_chain') { folder = ITEM_TEX_DIR; filename = 'weathered_copper_chain'}
    return { folder, filename, is2D: false };
}
//hhayyy
const loadTex = (filename, explicitFolder = null, isIconContext = false, originalTypeName = null) => {
    if (!filename) filename = 'missingno';
    
    let { folder, filename: parsedFilename } = resolveTexturePath(filename, isIconContext);
    if (explicitFolder) folder = explicitFolder;

    const cvs = document.createElement('canvas');
    cvs.width = 16; cvs.height = 16;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false; 
    
    const t = new THREE.CanvasTexture(cvs);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = 3001;

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
                            if (mcmeta.animation.frames = mcmeta.animation.frames);
                            if (mcmeta.animation.frametime = mcmeta.animation.frametime);
                        }
                        resolve(t);
                    }).catch(e => { resolve(t); });
                } else {
                    cvs.width = isStandardSkin ? 64 : fw;
                    cvs.height = isStandardSkin ? 64 : fh;
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(image, 0, 0);
                    t.dispose();

                    if (isIconContext && originalTypeName) {
                        const tintables = ['lily_pad', 'short_grass', 'tall_grass', 'fern', 'large_fern', 'vine', 'oak_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'mangrove_leaves', 'sugar_cane'];
                        if (tintables.includes(originalTypeName)) {
                            ctx.globalCompositeOperation = 'source-atop';
                            ctx.fillStyle = originalTypeName === 'lily_pad' ? '#4aa850' : '#91bd59';
                            ctx.fillRect(0, 0, cvs.width, cvs.height);
                            ctx.globalCompositeOperation = 'multiply';
                            ctx.drawImage(image, 0, 0);
                            ctx.globalCompositeOperation = 'destination-in';
                            ctx.drawImage(image, 0, 0); 
                            ctx.globalCompositeOperation = 'source-over';
                        }
                    }

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
    if (name === 'grass_block') return 'grass_block_side';
    if (name === 'chest') return '../entity/chest/normal';
    if (name === 'trapped_chest') return '../entity/chest/trapped';
    if (name === 'ender_chest') return '../entity/chest/ender';
    if (name === 'trapped_left') return '../entity/chest/trapped_left';
    if (name === 'chest_left') return '../entity/chest/normal_left';
    if (name === 'trapped_right') return '../entity/chest/trapped_right'
    if (name === 'chest_right') return '../entity/chest/normal_right'
    if (name === 'crafting_table') return 'crafting_table_top';
    if (name === 'furnace') return 'furnace_front';
    if (name.includes('shulker_box')) return 'shulker_box';
    if (name.includes('anvil')) return 'anvil_base';
    if (name === 'packed_mud') return 'mud';
    if (name === 'conduit') return 'conduit';
    if (name === 'red_bed_head' || name === 'red_bed_foot') return '../entity/bed/red';
    if (name === 'orange_bed_head' || name === 'orange_bed_foot') return '../entity/bed/orange';
    if (name === 'magenta_bed_head' || name === 'magenta_bed_foot') return '../entity/bed/magenta';
    if (name === 'light_blue_bed_head' || name === 'light_blue_bed_foot') return '../entity/bed/light_blue';
    if (name === 'yellow_bed_head' || name === 'yellow_bed_foot') return '../entity/bed/yellow';
    if (name === 'lime_bed_head' || name === 'lime_bed_foot') return '../entity/bed/lime';
    if (name === 'pink_bed_head' || name === 'pink_bed_foot') return '../entity/bed/pink';
    if (name === 'gray_bed_head' || name === 'gray_bed_foot') return '../entity/bed/gray';
    if (name === 'light_gray_bed_head' || name === 'light_gray_bed_foot') return '../entity/bed/light_gray';
    if (name === 'cyan_bed_head' || name === 'cyan_bed_foot') return '../entity/bed/cyan';
    if (name === 'purple_bed_head' || name === 'purple_bed_foot') return '../entity/bed/purple';
    if (name === 'blue_bed_head' || name === 'blue_bed_foot') return '../entity/bed/blue';
    if (name === 'brown_bed_head' || name === 'brown_bed_foot') return '../entity/bed/brown';
    if (name === 'green_bed_head' || name === 'green_bed_foot') return '../entity/bed/green';
    if (name === 'white_bed_head' || name === 'white_bed_foot') return '../entity/bed/white';
    if (name === 'black_bed_head' || name === 'black_bed_foot') return '../entity/bed/black';

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
        const path = `assets/minecraft/blockstates/${blockName}.json`;
        const data = await this.fetchJSON(path);
        if (data) this.blockstates[blockName] = data;
        return data;
    },

    async getModel(modelPath) {
        if (this.models[modelPath]) return this.models[modelPath];
        
        let actualPath = modelPath;
        if (!actualPath.includes('/')) actualPath = `block/${actualPath}`;
        
        const path = `assets/minecraft/models/${actualPath}.json`;
        const data = await this.fetchJSON(path);
        if (data) this.models[modelPath] = data;
        return data;
    },

    evaluateWhen(when, state) {
        if (!when) return true;

        if (when.OR) {
            return when.OR.some(cond => this.evaluateWhen(cond, state));
        }

        if (when.AND) {
            return when.AND.every(cond => this.evaluateWhen(cond, state));
        }

        for (const key in when) {
            if (key === 'OR' || key === 'AND') continue;

            const rawExpected = when[key];
            const currentState = state[key] !== undefined ? String(state[key]) : "false";

            let expectedValues;

            if (Array.isArray(rawExpected)) {
                expectedValues = rawExpected.map(v => String(v));
            } else if (typeof rawExpected === 'string') {
                expectedValues = rawExpected.split('|').map(v => String(v));
            } else {
                expectedValues = [String(rawExpected)];
            }

            if (!expectedValues.includes(currentState)) return false;
        }

        return true;
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
function getStoredBlockState(x, y, z) {
    let placed = placedBlocks.get(`${x},${y},${z}`);

    if (
        placed &&
        typeof placed === 'object' &&
        placed.state
    ) {
        return placed.state;
    }

    return null;
}
function getBlockContext(gx, gy, gz, bName) {
    let state = {};
    let placed = placedBlocks.get(`${gx},${gy},${gz}`);
    if (placed && typeof placed === 'object' && placed.state) Object.assign(state, placed.state);

    if (bName === 'grass_block' || bName === 'podzol' || bName === 'mycelium') {
        let above = getGlobalBlock(gx, gy + 1, gz);
        if (above !== null && (REVERSE_TYPE[above] === 'snow' || REVERSE_TYPE[above] === 'snow_block')) {
            state.snowy = 'true';
        } else {
            state.snowy = 'false';
        }
    }

    if (bName === 'snow' && !state.layers) state.layers = '1';
    if (bName === 'sea_pickle' && !state.pickles) state.pickles = '1';
    if (bName === 'sweet_berry_bush' && !state.age) state.age = '0';
    if (bName === 'end_rod' && !state.facing) state.facing = 'up';

    if (bName === 'pointed_dripstone') {
        if (!state.vertical_direction)
            state.vertical_direction = 'up';

        let dir = state.vertical_direction === 'up' ? 1 : -1;

        let baseBlock = getGlobalBlock(gx, gy - dir, gz);
        let tipBlock  = getGlobalBlock(gx, gy + dir, gz);

        let baseIsDripstone =
            baseBlock &&
            REVERSE_TYPE[baseBlock] === 'pointed_dripstone';

        let tipIsDripstone =
            tipBlock &&
            REVERSE_TYPE[tipBlock] === 'pointed_dripstone';

        let blockBeyondTip =
            getGlobalBlock(
                gx,
                gy + (dir * 2),
                gz
            )
        let beyondTipIsDripstone = 
            blockBeyondTip &&
            REVERSE_TYPE[blockBeyondTip] === 'pointed_dripstone';
        if (tipIsDripstone) {
            let neighborstate = getStoredBlockState (
                gx,
                gy+dir,
                gz
            );
            if (
                neighborstate &&
                neighborstate.vertical_direction &&
                neighborstate.vertical_direction !==
                    state.vertical_direction
            ) {state.thickness = 'tip_merge'}
        }
        if (!state.thickness) {

            if (!tipIsDripstone) {
                state.thickness = 'tip';
            }
            else if (tipIsDripstone && !beyondTipIsDripstone) {
                state.thickness = 'frustum';
            }
            else {
                if (beyondTipIsDripstone && tipIsDripstone && baseIsDripstone) {
                    state.thickness = 'middle';
                } else if (!baseIsDripstone){
                    state.thickness = 'base';
                } else{
                    state.thickness = 'tip'
                }
            }
        }
    }
    if (bName === 'sulfur_spike') {
        if (!state.vertical_direction)
            state.vertical_direction = 'up';

        let dir = state.vertical_direction === 'up' ? 1 : -1;

        let baseBlock = getGlobalBlock(gx, gy - dir, gz);
        let tipBlock  = getGlobalBlock(gx, gy + dir, gz);

        let baseIsSpike =
            baseBlock &&
            REVERSE_TYPE[baseBlock] === 'sulfur_spike';

        let tipIsSpike =
            tipBlock &&
            REVERSE_TYPE[tipBlock] === 'sulfur_spike';
        let blockBeyondTip =
            getGlobalBlock(
                gx,
                gy + (dir * 2),
                gz
            )
        let beyondTipIsSpike = 
            blockBeyondTip &&
            REVERSE_TYPE[blockBeyondTip] === 'sulfur_spike';
        if (tipIsSpike) {
            let neighborstate = getStoredBlockState (
                gx,
                gy+dir,
                gz
            );
            if (
                neighborstate &&
                neighborstate.vertical_direction &&
                neighborstate.vertical_direction !==
                    state.vertical_direction
            ) {state.thickness = 'tip_merge'}
        }
        if (!state.thickness) {

            if (!tipIsSpike) {
                state.thickness = 'tip';
            }
            else if (tipIsSpike && !beyondTipIsSpike) {
                state.thickness = 'frustum';
            }
            else {
                if (beyondTipIsSpike && tipIsSpike && baseIsSpike) {
                    state.thickness = 'middle';
                } else if (!baseIsSpike){
                    state.thickness = 'base';
                } else{
                    state.thickness = 'tip'
                }
            }
        }
    }
    

    if (bName === 'kelp') {
        if (!state.age) state.age = '0';
    }

    if (bName.endsWith('_top')) {
        state.half = 'upper';
    } else if (bName.includes('door') && !bName.includes('trapdoor')) {
        if (!state.half) state.half = 'lower';
    }

    if (bName === 'chiseled_bookshelf') {
        state.slot_0_occupied = 'false'; state.slot_1_occupied = 'false';
        state.slot_2_occupied = 'false'; state.slot_3_occupied = 'false';
        state.slot_4_occupied = 'false'; state.slot_5_occupied = 'false';
        if (!state.facing) state.facing = 'north';
    }

    if (bName === 'sculk_vein' || bName === 'glow_lichen') {
        if (Object.keys(state).length === 0) {
            state.down = 'true'; state.up = 'false'; state.north = 'false'; state.south = 'false'; state.east = 'false'; state.west = 'false';
        }
    }

    if (bName.includes('fence') || bName.includes('pane') || bName === 'iron_bars') {
        const connects = (nx, ny, nz) => {
            let nb = getGlobalBlock(nx, ny, nz);
            if (!nb) return false;
            let nn = REVERSE_TYPE[nb];
            if (nn.includes('fence') || nn.includes('pane') || nn === 'iron_bars') return true;
            return !isTransparent[nb];
        };
        state.north = connects(gx, gy, gz - 1) ? 'true' : 'false';
        state.south = connects(gx, gy, gz + 1) ? 'true' : 'false';
        state.east = connects(gx + 1, gy, gz) ? 'true' : 'false';
        state.west = connects(gx - 1, gy, gz) ? 'true' : 'false';
    }
    if (bName.includes('wall')) {
        let eastblock  = getGlobalBlock(gx + 1, gy, gz);
        let westblock  = getGlobalBlock(gx - 1, gy, gz);
        let northblock = getGlobalBlock(gx, gy, gz - 1);
        let southblock = getGlobalBlock(gx, gy, gz + 1);
        let topblock   = getGlobalBlock(gx, gy + 1, gz);
        let beyondeastblock  = getGlobalBlock(gx + 1, gy + 1, gz);
        let beyondwestblock  = getGlobalBlock(gx - 1, gy + 1, gz);
        let beyondnorthblock = getGlobalBlock(gx, gy + 1, gz - 1);
        let beyondsouthblock = getGlobalBlock(gx, gy + 1, gz + 1);
        function getBlockName(blockObj) {
            if (!blockObj) return "";
            return typeof blockObj === "string" ? blockObj : (REVERSE_TYPE[blockObj] || "");
        }
        let eastName  = getBlockName(eastblock);
        let westName  = getBlockName(westblock);
        let northName = getBlockName(northblock);
        let southName = getBlockName(southblock);
        let topName   = getBlockName(topblock);
        let beyondeastName  = getBlockName(beyondeastblock);
        let beyondwestName  = getBlockName(beyondwestblock);
        let beyondnorthName = getBlockName(beyondnorthblock);
        let beyondsouthName = getBlockName(beyondsouthblock);
        let eastIsWall  = eastName.includes("wall");
        let westIsWall  = westName.includes("wall");
        let northIsWall = northName.includes("wall");
        let southIsWall = southName.includes("wall");
        let topIsWall   = topName.includes("wall");
        let beyondeastIsWall  = beyondeastName.includes("wall");
        let beyondwestIsWall  = beyondwestName.includes("wall");
        let beyondnorthIsWall = beyondnorthName.includes("wall");
        let beyondsouthIsWall = beyondsouthName.includes("wall");
        function isSolidBlock(nameStr, rawBlock) {
            if (!nameStr) return false;
            return cubeAllBlocks.includes(nameStr) || cubeAllBlocks.includes(rawBlock);
        }
        let eastIsLegal  = eastIsWall  || isSolidBlock(eastName, eastblock);
        let westIsLegal  = westIsWall  || isSolidBlock(westName, westblock);
        let northIsLegal = northIsWall || isSolidBlock(northName, northblock);
        let southIsLegal = southIsWall || isSolidBlock(southName, southblock);
        let openDirections = [northIsLegal, southIsLegal, eastIsLegal, westIsLegal].filter(Boolean).length;
        let straightLineNS = northIsLegal && southIsLegal && !eastIsLegal && !westIsLegal;
        let straightLineEW = eastIsLegal && westIsLegal && !northIsLegal && !southIsLegal;
        if (topblock || openDirections !== 2 || (!straightLineNS && !straightLineEW)) {
            state.up = 'true';
        } else {
            state.up = 'false';
        } 
        if (northblock && northIsLegal) {
            state.north = (beyondnorthblock && isSolidBlock(beyondnorthName, beyondnorthblock) && !beyondnorthIsWall) ? 'tall' : 'low';
        } else {
            state.north = 'none';
        }
        if (southblock && southIsLegal) {
            state.south = (beyondsouthblock && isSolidBlock(beyondsouthName, beyondsouthblock) && !beyondsouthIsWall) ? 'tall' : 'low';
        } else {
            state.south = 'none';
        }
        if (eastblock && eastIsLegal) {
            state.east = (beyondeastblock && isSolidBlock(beyondeastName, beyondeastblock) && !beyondeastIsWall) ? 'tall' : 'low';
        } else {
            state.east = 'none';
        }
        if (westblock && westIsLegal) {
            state.west = (beyondwestblock && isSolidBlock(beyondwestName, beyondwestblock) && !beyondwestIsWall) ? 'tall' : 'low';
        } else {
            state.west = 'none';
        }
    }




    if (bName === 'chorus_plant') {
        const connects = (nx, ny, nz) => {
            let nb = getGlobalBlock(nx, ny, nz);
            if (!nb) return false;
            let nn = REVERSE_TYPE[nb];
            return nn === 'chorus_plant' || nn === 'chorus_flower' || nn === 'end_stone';
        };
        state.north = connects(gx, gy, gz - 1) ? 'true' : 'false';
        state.south = connects(gx, gy, gz + 1) ? 'true' : 'false';
        state.east = connects(gx + 1, gy, gz) ? 'true' : 'false';
        state.west = connects(gx - 1, gy, gz) ? 'true' : 'false';
        state.up = connects(gx, gy + 1, gz) ? 'true' : 'false';
        state.down = connects(gx, gy - 1, gz) ? 'true' : 'false';
    }
    
    if ((bName.includes('log') || bName.includes('pillar')) && !state.axis) state.axis = 'y';
    if (bName.includes('stairs')) {
        northblock = getGlobalBlock (
            gx,
            gy,
            gz - 1
        );
        eastblock = getGlobalBlock (
            gx + 1,
            gy,
            gz
        );
        westblock = getGlobalBlock (
            gx - 1,
            gy,
            gz
        );
        southblock = getGlobalBlock (
            gx,
            gy,
            gz + 1
        );
        let northstate = getStoredBlockState(
            gx,
            gy,
            gz - 1
        );

        let eaststate = getStoredBlockState(
            gx + 1,
            gy,
            gz
        );

        let weststate = getStoredBlockState(
            gx - 1,
            gy,
            gz
        );

        let southstate = getStoredBlockState(
            gx,
            gy,
            gz + 1
        );
        let northIsStair =
            northblock &&
            REVERSE_TYPE[northblock].includes('stairs');
        let eastIsStair =
            eastblock &&
            REVERSE_TYPE[eastblock].includes('stairs');
        let westIsStair =
            westblock &&
            REVERSE_TYPE[westblock].includes('stairs');
        let southIsStair =
            southblock &&
            REVERSE_TYPE[southblock].includes('stairs');
        if (!state.shape) {
            if (state.facing === 'north') {
                if (southIsStair && southstate.facing === 'east') state.shape = 'inner_left';
                else if (southIsStair && southstate.facing === 'west') state.shape = 'inner_right';
                else if (northIsStair && northstate.facing === 'east') state.shape = 'outer_left';
                else if (northIsStair && northstate.facing === 'west') state.shape = 'outer_right';
                else state.shape = 'straight';
            }
            else if (state.facing === 'south') {
                if (northIsStair && northstate.facing === 'east') state.shape = 'inner_right';
                else if (northIsStair && northstate.facing === 'west') state.shape = 'inner_left';
                else if (southIsStair && southstate.facing === 'east') state.shape = 'outer_right';
                else if (southIsStair && southstate.facing === 'west') state.shape = 'outer_left';
                else state.shape = 'straight';
            }
            else if (state.facing === 'west') {
                if (eastIsStair && eaststate.facing === 'north') state.shape = 'inner_right';
                else if (eastIsStair && eaststate.facing === 'south') state.shape = 'inner_left';
                else if (westIsStair && weststate.facing === 'north') state.shape = 'outer_left';
                else if (westIsStair && weststate.facing === 'south') state.shape = 'outer_right';
                else state.shape = 'straight';
            }
            else if (state.facing === 'east') {
                if (westIsStair && weststate.facing === 'north') state.shape = 'inner_left';
                else if (westIsStair && weststate.facing === 'south') state.shape = 'inner_right';
                else if (eastIsStair && eaststate.facing === 'north') state.shape = 'outer_right';
                else if (eastIsStair && eaststate.facing === 'south') state.shape = 'outer_left';
                else state.shape = 'straight';
            }
        }

    }
    return state;
}

const geometry = new THREE.BoxGeometry(1, 1, 1);

const DEFAULT_ROTATION_OFFSET = { x: 0, y: -90 };

const MODEL_ROTATION_OFFSETS = {
    'crafter': {x: -90, y: -90},
    'crafting_table': {x:0, y: 180},
    'bone_block': {x: 90},
    'hay_block': {x: 90},
    'bamboo_block': {x:90},
    'stripped_bamboo_block': {x: 90},
    'deepslate': {x: 90},
    'grindstone': {x: 180, y: -90},
    'dispenser': {x: 180},
    'dropper': {x: 180},
    'observer': {x: -90},
    'lightning_rod': {x: 180},
    'oak_wood': {x: 90},
    'stripped_oak_wood': {x: 90},
    'spruce_wood': {x: 90},
    'stripped_spruce_wood': {x: 90},
    'birch_wood': {x: 90},
    'stripped_birch_wood': {x: 90},
    'jungle_wood': {x:90},
    'stripped_jungle_wood': {x: 90},
    'acacia_wood': {x: 90},
    'stripped_acacia_wood': {x: 90},
    'dark_oak_wood': {x: 90},
    'stripped_oak_wood': {x: 90},
    'mangrove_wood': {x: 90},
    'stripped_mangrove_wood': {x: 90},
    'cherry_wood': {x: 90},
    'stripped_cherry_wood': {x: 90},
    'pale_oak_wood': {x: 90},
    'stripped_pale_oak_wood': {x: 90},
    'crimson_stem': {x: 90},
    'stripped_crimson_stem': {x: 90},
    'crimson_hyphae': {x: 90},
    'stripped_crimson_hyphae': {x: 90},
    'warped_stem': {x: 90},
    'stripped_warped_stem': {x: 90},
    'warped_hyphae': {x: 90},
    'stripped_warped_hyphae': {x: 90},
    'polished_basalt': {x: 90},
    'end_rod': {x: 180},
    'bamboo_block': {x: -90},
    'stripped_bamboo_block': {x: -90}
};

async function loadCustomModel(bName, stateDict = {}, cacheKey = null) {
    let key = cacheKey || bName;
    if (customGeometries[key]) return; 

    if (bName === 'conduit') {
        const tex = loadTex('conduit');
        let mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
        const px = 1/16;
        const geos = [];
        
        const coreGeo = new THREE.BoxGeometry(6 * px, 6 * px, 6 * px);
        coreGeo.clearGroups();
        const coreUVs = coreGeo.attributes.uv.array;
        
        const setCoreFaceUV = (faceIdx, u, v, w, h) => {
            const u1 = u / 32, u2 = (u + w) / 32;
            const v1 = 1 - (v + h) / 16, v2 = 1 - v / 16;
            const i = faceIdx * 8;
            coreUVs[i]=u1; coreUVs[i+1]=v2; coreUVs[i+2]=u2; coreUVs[i+3]=v2;
            coreUVs[i+4]=u1; coreUVs[i+5]=v1; coreUVs[i+6]=u2; coreUVs[i+7]=v1;
        };
        for (let i = 0; i < 6; i++) {
            setCoreFaceUV(i, 0, 0, 6, 6);
            coreGeo.addGroup(i * 6, 6, 0);
        }
        geos.push(coreGeo);
        
        const shell1 = new THREE.BoxGeometry(8 * px, 8 * px, 2 * px);
        const shell2 = new THREE.BoxGeometry(8 * px, 2 * px, 8 * px);
        const shell3 = new THREE.BoxGeometry(2 * px, 8 * px, 8 * px);
        
        const shellUVs1 = shell1.attributes.uv.array;
        const shellUVs2 = shell2.attributes.uv.array;
        const shellUVs3 = shell3.attributes.uv.array;
        
        const setShellUV = (uvs, faceIdx, u, v, w, h) => {
            const u1 = u / 32, u2 = (u + w) / 32;
            const v1 = 1 - (v + h) / 16, v2 = 1 - v / 16;
            const i = faceIdx * 8;
            uvs[i]=u1; uvs[i+1]=v2; uvs[i+2]=u2; uvs[i+3]=v2;
            uvs[i+4]=u1; uvs[i+5]=v1; uvs[i+6]=u2; uvs[i+7]=v1;
        };
        
        for (let i = 0; i < 6; i++) {
            setShellUV(shellUVs1, i, 12, 0, 8, 8); shell1.addGroup(i * 6, 6, 0);
            setShellUV(shellUVs2, i, 12, 0, 8, 8); shell2.addGroup(i * 6, 6, 0);
            setShellUV(shellUVs3, i, 12, 0, 8, 8); shell3.addGroup(i * 6, 6, 0);
        }
        
        geos.push(shell1, shell2, shell3);
        
        materials[key] = mat;
        customGeometries[key] = mergeBufferGeometries(geos);
        return;
    }

    const hardcodedModels = new Set(['creeper_head', 'zombie_head', 'skeleton_skull', 'wither_skeleton_skull', 'dragon_head', 'player_head', 'chest', 'trapped_chest', 'ender_chest', 'chest_right', 'chest_left', 'trapped_right', 'trapped_left', 'red_bed_head', 'red_bed_foot', 'orange_bed_head', 'orange_bed_foot', 'magenta_bed_head', 'magenta_bed_foot', 'light_blue_bed_head', 'light_blue_bed_foot', 'yellow_bed_head', 'yellow_bed_foot', 'lime_bed_head', 'lime_bed_foot', 'pink_bed_head', 'pink_bed_foot', 'gray_bed_head', 'gray_bed_foot', 'light_gray_bed_head', 'light_gray_bed_foot', 'cyan_bed_head', 'cyan_bed_foot', 'purple_bed_head', 'purple_bed_foot', 'blue_bed_head', 'blue_bed_foot', 'brown_bed_head', 'brown_bed_foot', 'green_bed_head', 'green_bed_foot', 'white_bed_head', 'white_bed_foot', 'black_bed_head', 'black_bed_foot']);
    if (hardcodedModels.has(bName)) {
      try {
        const fallbackName = resolveFallbackTexture(bName);
        const tex = loadTex(fallbackName);
        let mat = new THREE.MeshLambertMaterial({ map: tex, transparent: false, alphaTest: 0.5 });
        
        const buildMCModel = (parts, tS, scaleFactor = 1.0) => {
            const geos = [];
            const px = 1/16;

            const applyPivotRotation = (geo, pivotArr, rotArr, rotXVal) => {
                if (!pivotArr) return;
                const pivX = pivotArr[0] * px; const pivY = pivotArr[1] * px; const pivZ = pivotArr[2] * px;
                geo.translate(-pivX, -pivY, -pivZ);
                if (rotArr) {
                    if (rotArr[0]) geo.rotateX(THREE.MathUtils.degToRad(rotArr[0]));
                    if (rotArr[1]) geo.rotateY(THREE.MathUtils.degToRad(rotArr[1]));
                    if (rotArr[2]) geo.rotateZ(THREE.MathUtils.degToRad(rotArr[2]));
                } else if (rotXVal) geo.rotateX(rotXVal);
                geo.translate(pivX, pivY, pivZ);
            };

            const buildPart = (p, ancestors) => {
                let w = p.to ? p.to[0]-p.from[0] : p.size ? p.size[0] : p.w;
                let h = p.to ? p.to[1]-p.from[1] : p.size ? p.size[1] : p.h;
                let d = p.to ? p.to[2]-p.from[2] : p.size ? p.size[2] : p.d;
                let mcX = p.to ? p.from[0] : p.pos ? p.pos[0] : p.mcX;
                let mcY = p.to ? p.from[1] : p.pos ? p.pos[1] : p.mcY;
                let mcZ = p.to ? p.from[2] : p.pos ? p.pos[2] : p.mcZ;

                const physW = w * scaleFactor;
                const physH = h * scaleFactor;
                const physD = d * scaleFactor;

                const { pivot, rot, rotX, uvEast, uvWest, uvUp, uvDown, uvSouth, uvNorth, mirror, mirrorV, rotSouthNorth, rotDown } = p;
                const geo = new THREE.BoxGeometry(physW * px, physH * px, physD * px);
                geo.clearGroups();
                const uvs = geo.attributes.uv.array;

                const setF = (faceIdx, uvArr, fw, fh, mirrorU = false, rot180 = false, mirrorV = false) => {
                    if (!uvArr) return; 
                    const u = uvArr[0];
                    const v = uvArr[1] !== undefined ? uvArr[1] : 0;
                    let u1 = u / tS; let u2 = (u + fw) / tS;
                    let v1 = 1 - (v + fh) / tS; let v2 = 1 - v / tS;        
                    
                    if (mirrorU) { const tmp = u1; u1 = u2; u2 = tmp; }
                    if (mirrorV) { const tmp = v1; v1 = v2; v2 = tmp; }
                    
                    const i = faceIdx * 8;
                    if (rot180) {
                        uvs[i] = u2; uvs[i+1] = v1; uvs[i+2] = u1; uvs[i+3] = v1;
                        uvs[i+4] = u2; uvs[i+5] = v2; uvs[i+6] = u1; uvs[i+7] = v2;
                    } else {
                        uvs[i] = u1; uvs[i+1] = v2; uvs[i+2] = u2; uvs[i+3] = v2;
                        uvs[i+4] = u1; uvs[i+5] = v1; uvs[i+6] = u2; uvs[i+7] = v1;
                    }
                };

                const m = mirror || false;
                const mv = mirrorV || false;
                const snRot = rotSouthNorth || false;
                const dRot = rotDown || false;
                setF(0, uvEast, d, h, m, false, mv);
                setF(1, uvWest, d, h, m, false, mv);
                setF(2, uvUp, w, d, m, true);
                setF(3, uvDown, w, d, m, dRot);
                setF(4, uvSouth, w, h, m, snRot, snRot ? false : mv);
                setF(5, uvNorth, w, h, m, snRot, snRot ? false : mv);

                geo.rotateY(Math.PI);
                geo.translate((mcX + physW/2) * px, (mcY + physH/2) * px, (mcZ + physD/2) * px);

                applyPivotRotation(geo, pivot, rot, rotX);
                for (let anc of ancestors) {
                    applyPivotRotation(geo, anc.pivot, anc.rot, anc.rotX);
                }

                geos.push(geo);

                if (p.children) {
                    const childAncestors = [{ pivot, rot, rotX }, ...ancestors];
                    for (let child of p.children) {
                        buildPart(child, childAncestors);
                    }
                }
            };

            for (let p of parts) buildPart(p, []);

            return mergeBufferGeometries(geos);
        };

        const boxUV = (u, v, w, h, d) => ({
            uvUp:    [u + d + w, v],
            uvDown:  [u + d, v],
            uvEast:  [u, v + d],
            uvSouth: [u + d, v + d],
            uvWest:  [u + d + w, v + d],
            uvNorth: [u + d + w + d, v + d]
        });

        if (bName.includes('chest') && !bName.includes('right') && !bName.includes('left')) {
            const parts = [
                { size: [14, 10, 14], pos: [1, 0, 1], ...boxUV(0, 19, 14, 10, 14), mirrorV: true },
                { 
                    size: [14, 5, 14], pos: [1, 9, 1], pivot: [0, 9, 1], ...boxUV(0, 0, 14, 5, 14), mirrorV: true,
                    children: [
                        { size: [2, 4, 1], pos: [7, 7, 15], ...boxUV(0, 0, 2, 4, 1), mirrorV: true }
                    ]
                }
            ];
            let chestGeo = buildMCModel(parts, 64);
            chestGeo.clearGroups();
            chestGeo.addGroup(0, chestGeo.index.count, 0);
            chestGeo.translate(-0.5, -0.5, -0.5);
            materials[key] = mat;
            customGeometries[key] = chestGeo;
            return;
        }
        else if (bName.includes('left')) {
            const parts = [
                { size: [15, 10, 14], pos: [0, 0, 1], ...boxUV(0, 19, 15, 10, 14), mirrorV: true, rotSouthNorth: true, rotDown: true },
                {
                    size: [15, 5, 14], pos: [0, 9, 1], ...boxUV(0, 0, 15, 5, 14), mirrorV: true, rotSouthNorth: true, rotDown: true,
                    children: [
                        { size: [1, 4, 1], pos: [0, 7, 15], ...boxUV(0, 0, 1, 4, 1), mirrorV: true, rotSouthNorth: true, rotDown: true }
                    ] 
                }
            ];
            let leftchestGeo = buildMCModel(parts, 64);
            leftchestGeo.clearGroups();
            leftchestGeo.addGroup(0, leftchestGeo.index.count, 0);
            leftchestGeo.translate(-0.5, -0.5, -0.5);
            materials[key] = mat;
            customGeometries[key] = leftchestGeo;
            return;
        }
        else if (bName.includes('bed_head')) {
            const parts = [
                {size: [16, 16, 6], pos: [0, 3, -6], ...boxUV(0, 0, 16, 16, 6), pivot: [0, 3, 0], rot: [90, 0, 0], mirrorU: true, mirrorV: true},
                {size: [3, 3, 3], pos: [0, 0, 0], ...boxUV(50, 0, 3, 3, 3)},
                {size: [3, 3, 3], pos: [13, 0, 0], ...boxUV(50, 6, 3, 3, 3)}
            ]
            let bedheadGeo = buildMCModel(parts, 64);
            bedheadGeo.clearGroups();
            bedheadGeo.addGroup(0, bedheadGeo.index.count, 0);
            bedheadGeo.translate(-0.5, -0.5, -0.5);
            materials[key] = mat;
            customGeometries [key] = bedheadGeo;
            return;
        }

        else if (bName.includes('bed_foot')) {
            const parts = [
                {size: [16, 16, 6], pos: [0, 3, -6], ...boxUV(0, 22, 16, 16, 6), pivot: [0, 3, 0], rot: [90, 0, 0], mirrorU: false, mirrorV: true},
                {size: [3, 3, 3], pos: [0, 0, 0], ...boxUV(50, 12, 3, 3, 3)},
                {size: [3, 3, 3], pos: [13, 0, 0], ...boxUV(50, 18, 3, 3, 3)}
            ]
            let bedfootGeo = buildMCModel(parts, 64);
            bedfootGeo.clearGroups();
            bedfootGeo.addGroup(0, bedfootGeo.index.count, 0);
            bedfootGeo.translate(-0.5, -0.5, -0.5);
            materials[key] = mat;
            customGeometries [key] = bedfootGeo;
            return;
        }
        //heh
        else if (bName.includes('right')) {
            const parts = [
                { size: [15, 10, 14], pos: [1, 0, 1], ...boxUV(0, 19, 15, 10, 14), mirrorV: true, rotSouthNorth: true, rotDown: true },
                {
                    size: [15, 5, 14], pos: [1, 9, 1], ...boxUV(0, 0, 15, 5, 14), mirrorV: true, rotSouthNorth: true, rotDown: true,
                    children: [
                        { size: [1, 4, 1], pos: [15, 7, 15], ...boxUV(0, 0, 1, 4, 1), mirrorV: true, rotSouthNorth: true, rotDown: true }
                    ] 
                }
            ];
            let leftchestGeo = buildMCModel(parts, 64);
            leftchestGeo.clearGroups();
            leftchestGeo.addGroup(0, leftchestGeo.index.count, 0);
            leftchestGeo.translate(-0.5, -0.5, -0.5);
            materials[key] = mat;
            customGeometries[key] = leftchestGeo;
            return;
        }
        let headGeo;
        if (bName === 'dragon_head') {
            const parts = [
                { size: [16, 16, 16], pos: [2, 0, 2], uvUp: [128,30], uvDown: [144,30], uvWest: [112,46], uvNorth: [128,46], uvEast: [144,46], uvSouth: [160,46] },
                { size: [12, 5, 16],  pos: [3.5, 3, 12.5], uvUp: [192,44], uvDown: [204,44], uvWest: [176,60], uvNorth: [192,60], uvEast: [204,60], uvSouth: [220,60] }, 
                { size: [12, 4, 16],  pos: [3.5, 0, 12.5], uvUp: [192,65], uvDown: [204,65], uvWest: [176,81], uvNorth: [192,81], uvEast: [204,81], uvSouth: [220,81], pivot: [8, 3, 12], rot: [15, 0, 0] }, 
                { size: [2, 4, 6],    pos: [4.25, 12, 5], uvUp: [6,0], uvDown: [8,0], uvWest: [0,6], uvNorth: [6,6], uvEast: [8,6], uvSouth: [14,6], mirror: true }, 
                { size: [2, 4, 6],    pos: [10.25, 12, 5],  uvUp: [6,0], uvDown: [8,0], uvWest: [8,6], uvNorth: [6,6], uvEast: [0,6], uvSouth: [14,6] }, 
                { size: [2, 2, 4],    pos: [4.25, 6.75, 20], uvUp: [116,0], uvDown: [118,0], uvWest: [112,4], uvNorth: [116,4], uvEast: [118,4], uvSouth: [120,4], mirror: true }, 
                { size: [2, 2, 4],    pos: [10.25, 6.75, 20],  uvUp: [116,0], uvDown: [118,0], uvWest: [118,4], uvNorth: [116,4], uvEast: [112,4], uvSouth: [120,4] }  
            ];
            headGeo = buildMCModel(parts, 256, 0.75);
            headGeo.translate(-0.5, -0.5, -0.5);
        } else {
            const parts = [ { size: [8, 8, 8], pos: [-4, -4, -4], 
                uvWest: [16, 8], uvNorth: [8, 8], uvEast: [0, 8], uvSouth: [24, 8], uvUp: [8, 0], uvDown: [16, 0] 
            } ];
            headGeo = buildMCModel(parts, 64);
            headGeo.translate(0, -0.25, 0); 
        }

        materials[key] = mat;
        customGeometries[key] = headGeo;
        return;
      } catch (e) {
        console.error("HARDCODED MODEL BUILD FAILED:", bName, e);
        return;
      }
    }

    try {
        let isInner = bName.endsWith('_inner');
        let isOuter = bName.endsWith('_outer');
        let isTop = bName.endsWith('_top');
        let baseName = bName;
        if (isInner) baseName = bName.replace('_inner', '');
        if (isOuter) baseName = bName.replace('_outer', '');
        if (isTop) {
            baseName = bName.replace('_top', '');
            stateDict.half = 'upper';
        } else if (bName.includes('door') && !bName.includes('trapdoor')) {
            if (!stateDict.half) stateDict.half = 'lower';
        }

        const stateJson = await JSONReader.getBlockstate(baseName);
        let modelPartsToLoad = [];
        let combinedDisplay = {};
        let parsedGuiLight = null;
        
        if (stateJson) {
            if (stateJson.variants) {
                let match = "";
                let keys = Object.keys(stateJson.variants);
                for (let k of keys) {
                    let kPairs = k.split(',');
                    let matchesAll = kPairs.every(pair => {
                        if (pair === "") return true;
                        let [prop, val] = pair.split('=');
                        return stateDict[prop] === val;
                    });
                    if (matchesAll) { match = k; break; }
                }
                if (!match && keys.length > 0) match = keys[0];
                let v = stateJson.variants[match];
                modelPartsToLoad.push(Array.isArray(v) ? v[0] : v);
            } else if (stateJson.multipart) {
                for (let p of stateJson.multipart) {
                    if (!p.when || JSONReader.evaluateWhen(p.when, stateDict)) {
                        let apply = Array.isArray(p.apply) ? p.apply[0] : p.apply;
                        modelPartsToLoad.push(apply);
                    }
                }
                if (modelPartsToLoad.length === 0 && stateJson.multipart.length > 0) {
                    let apply = Array.isArray(stateJson.multipart[0].apply) ? stateJson.multipart[0].apply[0] : stateJson.multipart[0].apply;
                    modelPartsToLoad.push(apply);
                }
            }
        } else {
            modelPartsToLoad.push({ model: `block/${baseName}` });
        }

        const allCompiledGeometries = [];
        const matArray = [];
        const texMap = {};
        let matIndexCounter = 0;
        let isGenerated = false;
        
        for (let p of modelPartsToLoad) {
            let modelPath = p.model.replace('minecraft:', '');
            if (!modelPath.includes('/')) modelPath = `block/${modelPath}`;
            
            let currentModel = await JSONReader.getModel(modelPath);
            if (!currentModel && modelPath.startsWith('item/')) {
                modelPath = `block/${baseName}`;
                currentModel = await JSONReader.getModel(modelPath);
            }

            if (currentModel && currentModel.gui_light && !parsedGuiLight) parsedGuiLight = currentModel.gui_light;
            const captureDisplayTransforms = (model) => {
                if (!model || !model.display) return;
                for (let k in model.display) {
                    if (k === 'gui' || k === 'ground') {
                        if (!combinedDisplay[k]) combinedDisplay[k] = JSON.parse(JSON.stringify(model.display[k]));
                    }
                }
            };

            captureDisplayTransforms(currentModel);

            let elements = currentModel ? currentModel.elements : null;
            let textures = currentModel && currentModel.textures ? { ...currentModel.textures } : {};
            let partIsGenerated = false;
            let depth = 0;

            while (currentModel && currentModel.parent && depth < 10) {
                let parentPath = currentModel.parent.replace('minecraft:', '');
                if (parentPath === 'item/generated' || parentPath === 'item/handheld' || parentPath === 'builtin/generated' || parentPath.startsWith('builtin/')) {
                    partIsGenerated = true; isGenerated = true; break;
                }
                currentModel = await JSONReader.getModel(parentPath);
                if (currentModel) {
                    if (currentModel.gui_light && !parsedGuiLight) parsedGuiLight = currentModel.gui_light;
                    if (!elements && currentModel.elements) elements = currentModel.elements;
                    if (currentModel.textures) {
                        for (let k in currentModel.textures) if (!textures[k]) textures[k] = currentModel.textures[k];
                    }
                    captureDisplayTransforms(currentModel);
                }
                depth++;
            }

            const resolveTexture = (texStr) => {
                if (!texStr) return null;

                let tKey = texStr.startsWith('#') ? texStr.substring(1) : texStr;

                if (textures[tKey]) {
                    if (typeof textures[tKey] === "object" && textures[tKey].sprite) {
                        return textures[tKey].sprite;
                    }

                    let safe = 10;
                    while (
                        typeof textures[tKey] === "string" &&
                        textures[tKey].startsWith("#") &&
                        safe > 0
                    ) {
                        tKey = textures[tKey].substring(1);
                        safe--;
                    }

                    if (typeof textures[tKey] === "object" && textures[tKey].sprite) {
                        return textures[tKey].sprite;
                    }

                    if (textures[tKey]) return textures[tKey];
                }

                return texStr.startsWith("#") ? null : texStr;
            };

            const getMaterialForTex = (texPath) => {
                if (!texPath) texPath = resolveFallbackTexture(baseName); 
                texPath = texPath.replace('minecraft:', '');
                if (texMap[texPath] !== undefined) return texMap[texPath];
                
                let folder = `assets/minecraft/textures/`; let file = texPath;
                if (!file.includes('/')) folder = BLOCK_TEX_DIR;
                else { let parts = file.split('/'); file = parts.pop(); folder += parts.join('/') + '/'; }
                
                let tex = loadTex(file, folder);
                let mat;
                let isOverlay = texPath.includes('overlay');
                const isTranslucent = texPath.includes('glass') || texPath.includes('water') || texPath.includes('ice') || bName === 'conduit';
                
                const isCutout = ['pale_hanging_moss', 'leaves', 'door', 'trapdoor', 'ladder', 'rail', 'torch', 'lantern', 'campfire', 'fire', 'bush', 'plant', 'flower', 'mushroom', 'sapling', 'roots', 'vines', 'coral', 'iron_chain', 'bars', 'sculk', 'sprouts', 'stem', 'cactus', 'spawner', 'vault', 'cluster', 'lilac', 'azalea', 'peony', 'allium', 'orchid', 'tulip', 'daisy', 'cornflower', 'lily', 'rose', 'seagrass', 'kelp', 'spore_blossom', 'cobweb', 'grass', 'fern', 'fungus', 'propagule', 'dandelion', 'poppy', 'azure_bluet', 'wither_rose', 'dripstone', 'glow_lichen', 'sculk_vein', 'turtle_egg', 'bamboo', 'scaffolding', 'copper_grate', 'exposed_copper_grate', 'weathered_copper_grate', 'oxidized_copper_grate', 'waxed_copper_grate', 'waxed_exposed_copper_grate', 'waxed_weathered_copper_grate', 'waxed_oxidized_copper_grate', 'stonecutter', 'sulfur_spike', 'copper_chain', 'exposed_copper_chain', 'weathered_copper_chain', 'oxidized_copper_chain', 'waxed_copper_chain', 'waxed_exposed_copper_chain', 'waxed_weathered_copper_chain', 'waxed_oxidized_copper_chain'].some(kw => texPath.includes(kw) || baseName.includes(kw));

                if (isTranslucent || isOverlay) mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: !isOverlay });
                else if (isGenerated) mat = new THREE.MeshLambertMaterial({ map: tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
                else if (isCutout) mat = new THREE.MeshLambertMaterial({ map: tex, transparent: false, alphaTest: 0.5 });
                else mat = new THREE.MeshLambertMaterial({ map: tex });
                
                if (texPath.includes('grass_block_top') || texPath.includes('vine') || texPath.includes('grass_block_side_overlay') || bName === 'short_grass' || bName === 'tall_grass' || bName === 'fern' || bName === 'large_fern' || texPath.includes('tall_grass') || texPath.includes('fern') || bName === 'sugar_cane') {
                    mat.color.setHex(0x91bd59); 
                }
                else if (bName === 'lily_pad' || texPath.includes('lily_pad')) {
                    mat.color.setHex(0x4aa850);
                }
                else if (texPath.includes('leaves')) { 
                    mat.color.setHex(0x91bd59); 
                    if (texPath.includes('spruce')) mat.color.setHex(0x619961); 
                    if (texPath.includes('birch')) mat.color.setHex(0x80a755); 
                }
                
                matArray.push(mat); texMap[texPath] = matIndexCounter; return matIndexCounter++;
            };

            if (partIsGenerated) {
                let layer0 = resolveTexture(textures.layer0 || textures.cross) || `item/${baseName}`; 
                let matIdx = getMaterialForTex(layer0);
                const geo = new THREE.PlaneGeometry(1, 1);
                geo.clearGroups(); geo.addGroup(0, 6, matIdx);
                allCompiledGeometries.push(geo);
            } else if (elements && elements.length > 0) {
                for (let el of elements) {
                    const w = (el.to[0] - el.from[0]) / 16, h = (el.to[1] - el.from[1]) / 16, d = (el.to[2] - el.from[2]) / 16;
                    let expand = 0;
                    if (el.faces) for (const mcF in el.faces) {
                        let tPath = resolveTexture(el.faces[mcF]?.texture);
                        if (tPath && tPath.includes('overlay')) expand = 0.002;
                    }
                    
                    const geo = new THREE.BoxGeometry(Math.max(0.001, w + expand), Math.max(0.001, h + expand), Math.max(0.001, d + expand));
                    geo.translate((el.from[0] + el.to[0])/32 - 0.5, (el.from[1] + el.to[1])/32 - 0.5, (el.from[2] + el.to[2])/32 - 0.5);
                    geo.clearGroups();

                    if (el.rotation && el.rotation.origin) {
                        let pX = el.rotation.origin[0]/16 - 0.5, pY = el.rotation.origin[1]/16 - 0.5, pZ = el.rotation.origin[2]/16 - 0.5;
                        let rad = THREE.MathUtils.degToRad(el.rotation.angle || 0);
                        geo.translate(-pX, -pY, -pZ);
                        if (el.rotation.axis === 'x') geo.rotateX(rad);
                        if (el.rotation.axis === 'y') geo.rotateY(rad);
                        if (el.rotation.axis === 'z') geo.rotateZ(rad);
                        if (el.rotation.rescale) {
                            let sAmt = 1.0 / Math.cos(Math.abs(rad));
                            if (el.rotation.axis === 'x') geo.scale(1, sAmt, sAmt);
                            if (el.rotation.axis === 'y') geo.scale(sAmt, 1, sAmt);
                            if (el.rotation.axis === 'z') geo.scale(sAmt, sAmt, 1);
                        }
                        geo.translate(pX, pY, pZ);
                    }

                    if (el.faces) {
                        const uvs = geo.attributes.uv;
                        const faceMap = { east: 0, west: 1, up: 2, down: 3, south: 4, north: 5 };
                        for (const [mcFace, faceIdx] of Object.entries(faceMap)) {
                            const faceData = el.faces[mcFace];
                            if (!faceData) continue;
                            let matIdx = getMaterialForTex(resolveTexture(faceData.texture));
                            geo.addGroup(faceIdx * 6, 6, matIdx);

                            let u1=0, v1=0, u2=1, v2=1;
                            if (faceData.uv) { u1=faceData.uv[0]/16; v1=faceData.uv[1]/16; u2=faceData.uv[2]/16; v2=faceData.uv[3]/16; } 
                            else {
                                if (mcFace === 'up' || mcFace === 'down') { u1=el.from[0]/16; v1=el.from[2]/16; u2=el.to[0]/16; v2=el.to[2]/16; } 
                                else if (mcFace === 'north' || mcFace === 'south') { u1=el.from[0]/16; v1=1-el.to[1]/16; u2=el.to[0]/16; v2=1-el.from[1]/16; } 
                                else { u1=el.from[2]/16; v1=1-el.to[1]/16; u2=el.to[2]/16; v2=1-el.from[1]/16; }
                            }
                            let tv1 = 1-v1, tv2 = 1-v2, vIdx = faceIdx * 4;
                            let rot = faceData.rotation || 0;
                            if (rot === 0) { uvs.setXY(vIdx, u1, tv1); uvs.setXY(vIdx+1, u2, tv1); uvs.setXY(vIdx+2, u1, tv2); uvs.setXY(vIdx+3, u2, tv2); } 
                            else if (rot === 90) { uvs.setXY(vIdx, u1, tv2); uvs.setXY(vIdx+1, u1, tv1); uvs.setXY(vIdx+2, u2, tv2); uvs.setXY(vIdx+3, u2, tv1); } 
                            else if (rot === 180) { uvs.setXY(vIdx, u2, tv2); uvs.setXY(vIdx+1, u1, tv2); uvs.setXY(vIdx+2, u2, tv1); uvs.setXY(vIdx+3, u1, tv1); } 
                            else if (rot === 270) { uvs.setXY(vIdx, u2, tv1); uvs.setXY(vIdx+1, u2, tv2); uvs.setXY(vIdx+2, u1, tv1); uvs.setXY(vIdx+3, u1, tv2); }
                        }
                    }
                    if (p.x || p.y) {
                        const uvs = geo.attributes.uv;
                        const hasUVLock = !!p.uvlock;
                        const modelYRotDeg = p.y || 0;
                        const modelXRotDeg = p.x || 0;
                        const rotOffset = MODEL_ROTATION_OFFSETS[baseName] || DEFAULT_ROTATION_OFFSET;
                        const yRotDeg = modelYRotDeg + (rotOffset.y || 0);
                        const xRotDeg = modelXRotDeg + (rotOffset.x || 0);
                        if (hasUVLock && modelYRotDeg !== 0) {
                            const counterRad = THREE.MathUtils.degToRad(-modelYRotDeg);
                            for (const faceIdx of [2, 3]) {
                                const base = faceIdx * 4;
                                const u0 = uvs.getX(base+0), v0 = uvs.getY(base+0);
                                const u1 = uvs.getX(base+1), v1 = uvs.getY(base+1);
                                const u2 = uvs.getX(base+2), v2 = uvs.getY(base+2);
                                const u3 = uvs.getX(base+3), v3 = uvs.getY(base+3);
                                const cos = Math.cos(counterRad);
                                const sin = Math.sin(counterRad);
                                const rotUV = (u, v) => {
                                    const du = u - 0.5, dv = v - 0.5;
                                    return [0.5 + du * cos - dv * sin, 0.5 + du * sin + dv * cos];
                                };
                                const [ru0, rv0] = rotUV(u0, v0);
                                const [ru1, rv1] = rotUV(u1, v1);
                                const [ru2, rv2] = rotUV(u2, v2);
                                const [ru3, rv3] = rotUV(u3, v3);
                                uvs.setXY(base+0, ru0, rv0);
                                uvs.setXY(base+1, ru1, rv1);
                                uvs.setXY(base+2, ru2, rv2);
                                uvs.setXY(base+3, ru3, rv3);
                            }
                            uvs.needsUpdate = true;
                        }
                        if (xRotDeg) geo.rotateX(THREE.MathUtils.degToRad(xRotDeg));
                        if (yRotDeg) geo.rotateY(-THREE.MathUtils.degToRad(yRotDeg));
                    }

                    allCompiledGeometries.push(geo);
                }
            } else {
                throw new Error("No elements found");
            }
        }
        materials[key] = matArray;
        if (allCompiledGeometries.length === 1) customGeometries[key] = allCompiledGeometries[0];
        else if (allCompiledGeometries.length > 1) customGeometries[key] = mergeBufferGeometries(allCompiledGeometries);
        
        if (customGeometries[key]) customGeometries[key].userData = { display: combinedDisplay, is2D: isGenerated, guiLight: parsedGuiLight || 'side' };
        
    } catch(e) {
        console.error("MODEL BUILD FAILED:", bName, e);
        return;
    }
    
    const promises = [];
    if (Array.isArray(materials[key])) {
        materials[key].forEach(mat => { if (mat.map && mat.map.loadPromise) promises.push(mat.map.loadPromise); });
    } else if (materials[key] && materials[key].map && materials[key].map.loadPromise) {
        promises.push(materials[key].map.loadPromise);
    }
    await Promise.all(promises);
}

async function getBlockIcon(type) {
    if (!type || type === 'air') return 'none';
    if (iconCache[type]) return iconCache[type];

    // Vanilla special item sprites that should NOT be built from a base item + glint
    if (type === 'enchanted_golden_apple' || type === 'enchanted_book') {
        const baseIconName =
            type === 'enchanted_golden_apple' ? 'golden_apple' :
            type === 'enchanted_book' ? 'enchanted_book' :
            type;

        let tex = loadTex(baseIconName, ITEM_TEX_DIR);
        await tex.loadPromise;

        if (tex && tex.image && tex.image.width > 0) {
            const cvs = document.createElement('canvas');
            cvs.width = 16;
            cvs.height = 16;
            const ctx = cvs.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);

            const url = `url(${cvs.toDataURL('image/png')})`;
            iconCache[type] = url;
            return url;
        }
    }
    
    let defaultState = {};
    if (type.includes('stairs')) defaultState = { shape: 'straight', half: 'bottom', facing: 'east' };
    if (type.includes('log') || type.includes('pillar') || type === 'basalt') defaultState.axis = 'y';
    if (type === 'pointed_dripstone') defaultState = { vertical_direction: 'up', thickness: 'tip' };
    if (type === 'dispenser' || type === 'dropper') defaultState = {facing: 'north'};
    if (type.includes('fence')) defaultState = {south: 'true'};
    if (type.includes('wall')) defaultState = {up: 'true', north: 'tall', south: 'tall', east: 'none', west: 'none'};
    if (type.includes('gate')) defaultState = {open: 'false'};
    if (type.includes('mushroom_block')) defaultState = {east: 'false', west: 'false', north: 'false', south: 'false', north: 'false', south: 'false'};
    if (type === ('mushroom_stem')) defaultState = {east: 'false', west: 'false', north: 'false', south: 'false', north: 'true', south: 'true'};
    if (type === 'compass_tab') {
        let tex = loadTex('compass_01', ITEM_TEX_DIR);
        await tex.loadPromise;
        const cvs = document.createElement('canvas');
        cvs.width = 16; cvs.height = 16;
        const ctx = cvs.getContext('2d');
        ctx.imageSmoothingEnabled = false; 
        if (tex.image) ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
        const url = `url(${cvs.toDataURL('image/png')})`;
        iconCache[type] = url;
        return url;
    }

    let itemModel = await JSONReader.getModel(`item/${type}`);
    let is2DItem = false;
    let layer0Ref = null;
    let texturesMap = {};
    
    if (itemModel) {
        let curr = itemModel;
        let depth = 0;
        while (curr && depth < 10) {
            if (curr.textures) {
                for (let k in curr.textures) {
                    if (!texturesMap[k]) texturesMap[k] = curr.textures[k];
                }
            }
            if (curr.parent && (curr.parent.includes('item/generated') || curr.parent.includes('item/handheld') || curr.parent.includes('builtin/generated'))) {
                is2DItem = true;
                break;
            }
            if (!curr.parent) break;
            curr = await JSONReader.getModel(curr.parent.replace('minecraft:', ''));
            depth++;
        }
    }

    if (is2DItem) {
        layer0Ref = texturesMap.layer0 || texturesMap.cross;
        
        const resolveTexRef = (ref) => {
            let resolved = ref;
            let loops = 0;
            while (resolved && resolved.startsWith('#') && loops < 10) {
                resolved = texturesMap[resolved.substring(1)];
                loops++;
            }
            return resolved;
        };
        
        layer0Ref = resolveTexRef(layer0Ref);
        
        // If the item model didn't resolve to a real texture, don't invent item/<type>.
        // Let getBlockIcon fall through to the normal block-model icon path below.
        if (layer0Ref) {
            if (layer0Ref.startsWith('minecraft:')) layer0Ref = layer0Ref.replace('minecraft:', '');
            
            let folder = `assets/minecraft/textures/`;
            let file = layer0Ref;
            if (!file.includes('/')) {
                folder = ITEM_TEX_DIR;
            } else {
                let parts = file.split('/');
                file = parts.pop();
                folder += parts.join('/') + '/';
            }
            
            let tex = loadTex(file, folder, true, type);
            await tex.loadPromise;
            
            if (tex && tex.image && tex.image.width > 0) {
                const cvs = document.createElement('canvas');
                cvs.width = 16; cvs.height = 16;
                const ctx = cvs.getContext('2d');
                ctx.imageSmoothingEnabled = false; 
                
                const tintables = ['lily_pad', 'short_grass', 'tall_grass', 'fern', 'large_fern', 'vine', 'oak_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'mangrove_leaves', 'sugar_cane'];
                if (tintables.includes(type)) {
                    ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = type === 'lily_pad' ? '#4aa850' : '#91bd59';
                    ctx.fillRect(0, 0, cvs.width, cvs.height);
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
                    ctx.globalCompositeOperation = 'destination-in';
                    ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16); 
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
                }

                const url = `url(${cvs.toDataURL('image/png')})`;
                iconCache[type] = url;
                
                if (!STRICT_ITEMS_SET.has(type) && !customGeometries[type]) {
                    loadCustomModel(type, defaultState, type).catch(()=>{});
                }
                
                return url;
            }
        }
    }

    if (STRICT_ITEMS_SET.has(type)) {
        return 'none';
    }

    if (!customGeometries[type]) await loadCustomModel(type, defaultState, type);
    const geo = customGeometries[type];
    const mat = materials[type];
    if (!geo || !mat) return 'none';
    
    if (geo.userData && geo.userData.is2D) {
        let tex = Array.isArray(mat) ? mat[0].map : mat.map;
        if (tex && tex.loadPromise) await tex.loadPromise;
        
        if (tex && tex.image) {
            const cvs = document.createElement('canvas');
            cvs.width = 16; cvs.height = 16;
            const ctx = cvs.getContext('2d');
            ctx.imageSmoothingEnabled = false; 
            
            const tintables = ['lily_pad', 'short_grass', 'tall_grass', 'fern', 'large_fern', 'vine', 'oak_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'mangrove_leaves', 'sugar_cane'];
            if (tintables.includes(type)) {
                ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = type === 'lily_pad' ? '#4aa850' : '#91bd59';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16); 
                ctx.globalCompositeOperation = 'source-over';
            } else {
                ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, 16, 16);
            }

            const url = `url(${cvs.toDataURL('image/png')})`;
            iconCache[type] = url;
            return url;
        }
    }
    
    const mesh = new THREE.Mesh(geo, mat);
    iconScene.add(mesh);
    
    mesh.position.set(0, 0, 0);
    
    let guiConfig = { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] };
    if (geo.userData && geo.userData.display && geo.userData.display.gui) {
        guiConfig = geo.userData.display.gui;
    }

    if (guiConfig.rotation) {
        let rx = guiConfig.rotation[0];
        let ry = guiConfig.rotation[1];
        let rz = guiConfig.rotation[2];
        
        let threeRx = THREE.MathUtils.degToRad(rx);
        let threeRy = THREE.MathUtils.degToRad(ry);
        let threeRz = THREE.MathUtils.degToRad(rz);
        
        // Minecraft display transforms are authored as XYZ Euler rotations.
        // Using a different order makes block icons look rotated even when the
        // correct display.gui values were read from the model JSON.
        mesh.rotation.set(threeRx, threeRy, threeRz, 'XYZ');
    }
    
    let guiLight = geo.userData && geo.userData.guiLight ? geo.userData.guiLight : 'side';

    if (guiLight === 'front') {
        iconTopLight.position.set(0, 0, 1);
        iconLeftLight.position.set(0, 0, 1);
    } else {
        const normals = [
            new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
            new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
            new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1)
        ];

        let bestTop = new THREE.Vector3(0, 1, 0);
        let bestLeft = new THREE.Vector3(-1, 0, 0);
        let maxY = -Infinity;
        let minX = Infinity;

        for (let n of normals) {
            let globalN = n.clone().applyEuler(mesh.rotation);
            if (globalN.y > maxY) {
                maxY = globalN.y;
                bestTop.copy(n);
            }
            if (globalN.z > 0.01 && globalN.x < minX) {
                minX = globalN.x;
                bestLeft.copy(n);
            }
        }

        iconTopLight.position.copy(bestTop.applyEuler(mesh.rotation));
        iconLeftLight.position.copy(bestLeft.applyEuler(mesh.rotation));
    }
    
    if (guiConfig.scale) {
        mesh.scale.set(guiConfig.scale[0], guiConfig.scale[1], guiConfig.scale[2]);
    }
    
    if (guiConfig.translation) {
        mesh.position.set(
            (guiConfig.translation[0] / 16),
            (guiConfig.translation[1] / 16),
            (guiConfig.translation[2] / 16)
        );
    }
    
    iconRenderer.render(iconScene, iconCamera);
    const dataUrl = iconRenderer.domElement.toDataURL('image/png');
    iconScene.remove(mesh);
    
    const url = `url(${dataUrl})`;
    iconCache[type] = url;
    return url;
}
function getItemGlintType(type) {
    if (ITEM_GLINT_ITEMS.has(type)) return 'item';
    if (EQUIPMENT_GLINT_ITEMS.has(type)) return 'equipment';
    return null;
}
function updateItemGlintOverlay(element, type) {
    const glintType = getItemGlintType(type);
    let itemGlint = element.querySelector(':scope > .item-icon-glint');
    let equipGlint = element.querySelector(':scope > .equipment-icon-glint');

    if (glintType === 'item') {
        if (equipGlint) equipGlint.remove();
        if (!itemGlint) {
            itemGlint = document.createElement('div');
            itemGlint.className = 'item-icon-glint';
            element.appendChild(itemGlint);
        }
    } else if (glintType === 'equipment') {
        if (itemGlint) itemGlint.remove();
        if (!equipGlint) {
            equipGlint = document.createElement('div');
            equipGlint.className = 'equipment-icon-glint';
            element.appendChild(equipGlint);
        }
    } else {
        if (itemGlint) itemGlint.remove();
        if (equipGlint) equipGlint.remove();
    }
}
function setGlintMaskFromBackground(element) {
    const glint = element.querySelector(':scope > .item-icon-glint, :scope > .equipment-icon-glint');
    if (!glint) return;

    const bg = element.style.backgroundImage;
    if (!bg || bg === 'none') {
        glint.style.webkitMaskImage = '';
        glint.style.maskImage = '';
        return;
    }

    glint.style.webkitMaskImage = bg;
    glint.style.maskImage = bg;
    glint.style.webkitMaskRepeat = 'no-repeat';
    glint.style.maskRepeat = 'no-repeat';
    glint.style.webkitMaskPosition = 'center';
    glint.style.maskPosition = 'center';
    glint.style.webkitMaskSize = 'contain';
    glint.style.maskSize = 'contain';
}
function applyIcon(element, type) {
    element.dataset.iconType = type || 'none';

    if (!type) {
        element.style.backgroundImage = 'none';
        updateItemGlintOverlay(element, null);
        return;
    }

    if (type === 'compass') {
        element.style.backgroundImage = `url(${ITEM_TEX_DIR}compass_00.png)`;
        updateItemGlintOverlay(element, type);
        setGlintMaskFromBackground(element);
        return;
    }

    getBlockIcon(type).then(url => {
        if (element.dataset.iconType !== type) return;
        element.style.backgroundImage = url;
        updateItemGlintOverlay(element, type);
        setGlintMaskFromBackground(element);
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
    itemSprite.style.position = 'absolute';
    itemSprite.style.left = '0px'; 
    itemSprite.style.top = '0px'; 
    itemSprite.style.width = '16px';
    itemSprite.style.height = '16px';
    itemSprite.style.backgroundSize = 'contain';
    itemSprite.style.backgroundPosition = 'center';
    itemSprite.style.backgroundRepeat = 'no-repeat';
    itemSprite.style.overflow = 'hidden';
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
creativeScaleCenter.style.top = '50%'; 
creativeScaleCenter.style.left = '50%';
creativeScaleCenter.style.display = 'none'; 
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
scrollTrack.style.right = '6px'; 
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
heldItemUI.style.left = '-9px'; 
heldItemUI.style.top = '-9px';  
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
    itemSprite.style.left = '0px'; 
    itemSprite.style.top = '0px'; 
    itemSprite.style.width = '16px';
    itemSprite.style.height = '16px';
    itemSprite.style.backgroundSize = '16px 16px';
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
            !HIDDEN_CREATIVE_BLOCKS.has(b) &&
            !b.includes('_inner') &&
            !b.includes('_outer') &&
            !b.includes('_top') &&
            !b.endsWith('_wall_head') &&
            !b.endsWith('_wall_skull') &&
            !b.endsWith('_wall_sign') &&
            !b.endsWith('_wall_hanging_sign') &&
            b.includes(query)
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
    air: 0.0, short_grass: 0.0, fern: 0.0, dead_bush: 0.0, dandelion: 0.0, poppy: 0.0, blue_orchid: 0.0,
    allium: 0.0, azure_bluet: 0.0, red_tulip: 0.0, orange_tulip: 0.0, white_tulip: 0.0, pink_tulip: 0.0,
    oxeye_daisy: 0.0, cornflower: 0.0, lily_of_the_valley: 0.0, wither_rose: 0.0,
    dirt: 0.5, coarse_dirt: 0.5, podzol: 0.5, rooted_dirt: 0.5, mud: 0.5, grass_block: 0.6,
    sand: 0.5, red_sand: 0.5, gravel: 0.6, clay: 0.6, soul_sand: 0.5, soul_soil: 0.5,
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
    dirt: 'shovel', coarse_dirt: 'shovel', podzol: 'shovel', grass_block: 'shovel',
    sand: 'shovel', red_sand: 'shovel', gravel: 'shovel', clay: 'shovel', snow: 'shovel', snow_block: 'shovel',
    soul_sand: 'shovel', soul_soil: 'shovel',
    oak_log: 'axe', spruce_log: 'axe', birch_log: 'axe', jungle_log: 'axe', acacia_log: 'axe', dark_oak_log: 'axe',
    oak_planks: 'axe', spruce_planks: 'axe', birch_planks: 'axe', chest: 'axe', crafting_table: 'axe', bookshelf: 'axe'
};

const BLOCK_DROPS = {
    grass_block: { item: 'dirt', count: 1 },
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
        if (data && data.type) {
            let bName = REVERSE_TYPE[data.type];
            if (bName && bName.includes('stairs')) {
                let baseName = bName.replace('_inner', '').replace('_outer', '');
                let facingStr = data.state && data.state.facing ? data.state.facing : 'east';
                let halfStr = data.state && data.state.half ? data.state.half : 'bottom';
                let fMap = { 'east': 0, 'north': 1, 'west': 2, 'south': 3 };
                return { baseName: baseName, facing: fMap[facingStr] || 0, half: halfStr };
            }
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

    let rx = 0;
    
    let existing = placedBlocks.get(`${x},${y},${z}`);
    let targetTypeId = TYPE[finalType];
    
    if (!existing || existing.type !== targetTypeId || !existing.rotation || existing.rotation[0] !== rx || existing.rotation[1] !== finalRotY) {
        let newState = existing && existing.state ? { ...existing.state } : {};
        newState.shape = shape;
        setGlobalBlock(x, y, z, { ...existing, type: targetTypeId, rotation: [rx, 0, 0], state: newState });
    }
}

function updateStairConnections(x, y, z) {
    evaluateStair(x, y, z);
    evaluateStair(x+1, y, z);
    evaluateStair(x-1, y, z);
    evaluateStair(x, y, z+1);
    evaluateStair(x, y, z-1);
}

const CHEST_RIGHT_DIR_BY_FACING = { south: 'east', north: 'west', west: 'south', east: 'north' };
const CHEST_PAIR_AXIS_DIRS = { south: ['east','west'], north: ['east','west'], west: ['north','south'], east: ['north','south'] };
const CHEST_DIR_OFFSETS = { north: [0,0,-1], south: [0,0,1], east: [1,0,0], west: [-1,0,0] };

function getChestBaseName(name) {
    if (!name) return null;
    if (name === 'chest_left' || name === 'chest_right') return 'chest';
    if (name === 'trapped_left' || name === 'trapped_right') return 'trapped_chest';
    if (name === 'chest' || name === 'trapped_chest') return name;
    return null;
}

function getChestVariantName(baseType, side) {
    if (baseType === 'chest') return side === 'left' ? 'chest_left' : 'chest_right';
    if (baseType === 'trapped_chest') return side === 'left' ? 'trapped_left' : 'trapped_right';
    return baseType;
}

function tryMergeChest(x, y, z, baseType, facing, rotY) {
    const rightDir = CHEST_RIGHT_DIR_BY_FACING[facing];
    const axisDirs = CHEST_PAIR_AXIS_DIRS[facing];
    const leftDir = axisDirs.find(d => d !== rightDir);

    for (const side of [rightDir, leftDir]) {
        const [dx, dy, dz] = CHEST_DIR_OFFSETS[side];
        const nx = x + dx, ny = y, nz = z + dz;
        const nb = getGlobalBlock(nx, ny, nz);
        if (!nb) continue;
        const nName = REVERSE_TYPE[nb];
        if (getChestBaseName(nName) !== baseType) continue;

        const nKey = `${nx},${ny},${nz}`;
        const nData = placedBlocks.get(nKey);
        const nState = (nData && nData.state) ? nData.state : {};
        if (nState.facing !== facing) continue;
        if (nState.type && nState.type !== 'single') continue;

        const isNeighborRight = (side === rightDir);
        const thisSide = isNeighborRight ? 'left' : 'right';
        const otherSide = isNeighborRight ? 'right' : 'left';

        setGlobalBlock(x, y, z, {
            type: TYPE[getChestVariantName(baseType, otherSide)],
            rotation: [0, rotY, 0],
            state: { facing: facing, type: otherSide }
        });
        setGlobalBlock(nx, ny, nz, {
            type: TYPE[getChestVariantName(baseType, thisSide)],
            rotation: [0, rotY, 0],
            state: { facing: facing, type: thisSide }
        });
        return true;
    }
    return false;
}

function unmergeChestPartner(x, y, z, blockName, blockState) {
    if (!blockState || (blockState.type !== 'left' && blockState.type !== 'right')) return;
    const baseType = getChestBaseName(blockName);
    const facing = blockState.facing;
    if (!baseType || !facing) return;

    const rightDir = CHEST_RIGHT_DIR_BY_FACING[facing];
    const axisDirs = CHEST_PAIR_AXIS_DIRS[facing];
    const leftDir = axisDirs.find(d => d !== rightDir);
    const partnerSide = blockState.type === 'right' ? leftDir : rightDir;

    const [dx, dy, dz] = CHEST_DIR_OFFSETS[partnerSide];
    const nx = x + dx, ny = y, nz = z + dz;
    const nb = getGlobalBlock(nx, ny, nz);
    if (!nb) return;
    const nName = REVERSE_TYPE[nb];
    if (getChestBaseName(nName) !== baseType) return;

    const nKey = `${nx},${ny},${nz}`;
    const nData = placedBlocks.get(nKey);
    const nRotation = (nData && nData.rotation) ? nData.rotation : [0, 0, 0];

    setGlobalBlock(nx, ny, nz, {
        type: TYPE[baseType],
        rotation: nRotation,
        state: { facing: facing }
    });
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
    
    let idx = lx + (lz * 16) + (ly * 256);
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
        let toStore = typeof typeData === 'object' ? typeData : { type: typeId };
        placedBlocks.set(blockKey, toStore);
    }

    let cx = Math.floor(gx / chunkSize);
    let cz = Math.floor(gz / chunkSize);
    let chunkId = `${cx},${cz}`;
    let chunk = activeChunks[chunkId];
    
    if (!chunk || chunk.pending) return; 
    
    let lx = gx - (cx * chunkSize);
    let lz = gz - (cz * chunkSize);
    let ly = gy - minworldY;
    let idx = lx + lz * 16 + ly * 256;
    
    if (chunk.blocks[idx] !== typeId) {
        chunk.blocks[idx] = typeId;
    }
    
    chunksToRebuild.add(chunkId);
    if (lx === 0) chunksToRebuild.add(`${cx - 1},${cz}`);
    if (lx === chunkSize - 1) chunksToRebuild.add(`${cx + 1},${cz}`);
    if (lz === 0) chunksToRebuild.add(`${cx},${cz - 1}`);
    if (lz === chunkSize - 1) chunksToRebuild.add(`${cx},${cz + 1}`);
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
            
            let idx = lx + lz * 16 + ly * 256;
            let blockType = chunk.blocks[idx];

            if (blockType === TYPE.grass_block) {
                let gx = (cx * chunkSize) + lx;
                let gy = ly + minworldY;
                let gz = (cz * chunkSize) + lz;

                let above = getGlobalBlock(gx, gy + 1, gz);
                
                if (above !== null && above !== 0 && above !== TYPE.oak_leaves && above !== TYPE.spruce_leaves && above !== TYPE.snow_block && above !== TYPE.snow && above !== TYPE.oak_sapling && above !== TYPE.spruce_sapling) {
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
                            setGlobalBlock(tx, ty, tz, TYPE.grass_block);
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
    if (key === 'dirt' || key === 'grass_block' || key === 'snow_block' || key === 'sand' || key === 'bedrock') return 15000;
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

const sharedLightMap = new Uint8Array(16 * 16 * 256);
const sharedLightQueue = new Int32Array(16 * 16 * 256 * 2);

function computeChunkLight(blocks) {
    sharedLightMap.fill(0);
    let head = 0, tail = 0;
    const getIdx = (x, y, z) => x + (z * 16) + (y * 256);

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

                sharedLightMap[idx] = currentLight;
                if (currentLight > 0) {
                    sharedLightQueue[tail++] = idx;
                }
            }
        }
    }

    while (head < tail) {
        let idx = sharedLightQueue[head++];
        let light = sharedLightMap[idx];
        if (light <= 1) continue;

        let x = idx % chunkSize;
        let z = Math.floor(idx / chunkSize) % chunkSize;
        let y = Math.floor(idx / 256);

        let nextLight = light - 1;

        const processN = (nx, ny, nz) => {
            if (nx >= 0 && nx < chunkSize && nz >= 0 && nz < chunkSize && ny >= 0 && ny < worldHeight) {
                let nIdx = getIdx(nx, ny, nz);
                let b = blocks[nIdx];
                if ((b === 0 || isTransparent[b]) && sharedLightMap[nIdx] < nextLight) {
                    let drop = 1;
                    if (b === TYPE.oak_leaves || b === TYPE.spruce_leaves || b === TYPE.water) drop = 2;
                    let targetLight = light - drop;
                    
                    if (targetLight > sharedLightMap[nIdx]) {
                        sharedLightMap[nIdx] = targetLight;
                        sharedLightQueue[tail++] = nIdx;
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
    return sharedLightMap;
}

async function generateChunk(chunkX, chunkZ) {
    const chunkId = `${chunkX},${chunkZ}`;
    if (activeChunks[chunkId]) return;
    activeChunks[chunkId] = { pending: true };

    const blocks = new Uint16Array(chunkSize * chunkSize * worldHeight);
    const treesToSpawn = [];
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;

    const getIdx = (x, y, z) => x + (z * 16) + (y * 256);

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
                    if ((b === TYPE.grass_block) && localBiome.treeChance > 0) {
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
            for (let ly = localY + trunkH - 2; ly <= localY + trunkH + 1; ly++) {
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

    const uniqueStates = new Set();
    const chunkStateKeys = new Array(chunkSize * chunkSize * worldHeight);
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let idx = getIdx(x, y, z);
                let typeId = blocks[idx];
                if (typeId !== 0) {
                    let bName = REVERSE_TYPE[typeId];
                    let gx = startX + x, gy = y + minworldY, gz = startZ + z;
                    
                    let stateDict = getBlockContext(gx, gy, gz, bName);
                    let stateKey = bName;
                    let keys = Object.keys(stateDict).sort();
                    if (keys.length > 0) stateKey += '[' + keys.map(k => `${k}=${stateDict[k]}`).join(',') + ']';
                    
                    let data = { key: stateKey, dict: stateDict, bName: bName, cap: getBlockCapacity(bName) };
                    chunkStateKeys[idx] = data;
                    
                    let exists = false;
                    for (let item of uniqueStates) if (item.key === stateKey) { exists = true; break; }
                    if (!exists) uniqueStates.add(data);
                }
            }
        }
    }
    
    for (let typeData of uniqueStates) {
        if (!customGeometries[typeData.key]) await loadCustomModel(typeData.bName, typeData.dict, typeData.key);
    }

    const meshes = {};
    const indices = {};
    
    for (let typeData of uniqueStates) {
        let sKey = typeData.key;
        let geo = customGeometries[sKey];
        let mat = materials[sKey] || materials[typeData.bName];
        let cap = typeData.cap;
        
        meshes[sKey] = new THREE.InstancedMesh(geo, mat, cap);
        meshes[sKey].name = sKey;
        meshes[sKey].chunkId = chunkId;
        meshes[sKey].maxCapacity = cap;
        meshes[sKey].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        meshes[sKey].matrixAutoUpdate = false;
        meshes[sKey].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
        indices[sKey] = 0;
    }

    const matrix = new THREE.Matrix4();
    const colorObj = new THREE.Color();
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let idx = getIdx(x, y, z);
                let typeId = blocks[idx];
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
                    let stateData = chunkStateKeys[idx];
                    let sKey = stateData.key;
                    let bName = stateData.bName;
                    if (meshes[sKey] && indices[sKey] < meshes[sKey].maxCapacity) {
                        
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

                        if (rot[0] === 0 && rot[1] === 0 && rot[2] === 0) {
                            matrix.makeTranslation(startX + x, actualY, startZ + z);
                        } else {
                            matrix.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
                            matrix.setPosition(startX + x, actualY, startZ + z);
                        }

                        meshes[sKey].setMatrixAt(indices[sKey], matrix);
                        meshes[sKey].setColorAt(indices[sKey], colorObj); 
                        indices[sKey]++;
                    }
                }
            }
        }
    }

    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        if (meshes[key].instanceColor) meshes[key].instanceColor.needsUpdate = true;
        meshes[key].boundingSphere = new THREE.Sphere(new THREE.Vector3(startX + 8, 128 + minworldY, startZ + 8), 140); 
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
    const getIdx = (x, y, z) => x + (z * 16) + (y * 256);

    const lightMap = computeChunkLight(blocks);

    const uniqueStates = new Set();
    const chunkStateKeys = new Array(chunkSize * chunkSize * worldHeight);

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let idx = getIdx(x, y, z);
                let typeId = blocks[idx];
                if (typeId !== 0) {
                    let bName = REVERSE_TYPE[typeId];
                    let gx = startX + x, gy = y + minworldY, gz = startZ + z;
                    
                    let stateDict = getBlockContext(gx, gy, gz, bName);
                    let stateKey = bName;
                    let keys = Object.keys(stateDict).sort();
                    if (keys.length > 0) stateKey += '[' + keys.map(k => `${k}=${stateDict[k]}`).join(',') + ']';
                    
                    let data = { key: stateKey, dict: stateDict, bName: bName, cap: getBlockCapacity(bName) };
                    chunkStateKeys[idx] = data;
                    
                    let exists = false;
                    for (let item of uniqueStates) if (item.key === stateKey) { exists = true; break; }
                    if (!exists) uniqueStates.add(data);
                }
            }
        }
    }

    for (let typeData of uniqueStates) {
        let sKey = typeData.key;
        if (!customGeometries[sKey]) await loadCustomModel(typeData.bName, typeData.dict, sKey);
        
        if (!meshes[sKey]) {
            let geo = customGeometries[sKey];
            let mat = materials[sKey] || materials[typeData.bName];
            let cap = typeData.cap;
            meshes[sKey] = new THREE.InstancedMesh(geo, mat, cap);
            meshes[sKey].name = sKey;
            meshes[sKey].chunkId = chunkId;
            meshes[sKey].maxCapacity = cap;
            meshes[sKey].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            meshes[sKey].matrixAutoUpdate = false;
            meshes[sKey].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
            scene.add(meshes[sKey]);
            interactableMeshes.push(meshes[sKey]);
        }
    }

    const indices = {};
    for (const key in meshes) indices[key] = 0;

    const matrix = new THREE.Matrix4();
    const colorObj = new THREE.Color();

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < worldHeight; y++) {
                let idx = getIdx(x, y, z);
                let typeId = blocks[idx];
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
                    let stateData = chunkStateKeys[idx];
                    let sKey = stateData.key;
                    let bName = stateData.bName;
                    if (meshes[sKey] && indices[sKey] < meshes[sKey].maxCapacity) {
                        
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

                        if (rot[0] === 0 && rot[1] === 0 && rot[2] === 0) {
                            matrix.makeTranslation(globalX, actualY, globalZ);
                        } else {
                            matrix.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
                            matrix.setPosition(globalX, actualY, globalZ);
                        }
                        
                        meshes[sKey].setMatrixAt(indices[sKey], matrix);
                        meshes[sKey].setColorAt(indices[sKey], colorObj);
                        indices[sKey]++;
                    }
                }
            }
        }
    }

    for (const key in meshes) {
        meshes[key].count = indices[key];
        meshes[key].instanceMatrix.needsUpdate = true;
        if (meshes[key].instanceColor) meshes[key].instanceColor.needsUpdate = true;
        meshes[key].boundingSphere = new THREE.Sphere(new THREE.Vector3(startX + 8, 128 + minworldY, startZ + 8), 140);
    }
}

// ----------------------------------------------------
// Day / Night & Core Update Loop
// ----------------------------------------------------
let timeOfDay = Math.PI / 2; 
const dayCycleSpeed = 0; 

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
scene.add(camera);

const PLAYER_SKIN_PATH = 'assets/minecraft/textures/entity/player/wide/steve.png';
const playerTexture = new THREE.TextureLoader().load(PLAYER_SKIN_PATH);
playerTexture.magFilter = THREE.NearestFilter;
playerTexture.minFilter = THREE.NearestFilter;
if (THREE.SRGBColorSpace) playerTexture.colorSpace = THREE.SRGBColorSpace; else playerTexture.encoding = 3001;

function applySkinUVs(geometry, faceUVs) {
    const uv = geometry.attributes.uv;
    // Three.js +X/-X faces are wound opposite to Minecraft skin convention so swap left/right
    const order = ['left', 'right', 'top', 'bottom', 'front', 'back'];
    order.forEach((faceName, faceIdx) => {
        const r = faceUVs[faceName];
        if (!r) return;
        const u1 = r[0] / 64;
        const v1 = 1 - (r[1] + r[3]) / 64;
        const u2 = (r[0] + r[2]) / 64;
        const v2 = 1 - r[1] / 64;
        const i = faceIdx * 4;
        if (faceName === 'bottom') {
            uv.setXY(i,   u2, v1);
            uv.setXY(i+1, u1, v1);
            uv.setXY(i+2, u2, v2);
            uv.setXY(i+3, u1, v2);
        } else {
            uv.setXY(i,   u1, v2);
            uv.setXY(i+1, u2, v2);
            uv.setXY(i+2, u1, v1);
            uv.setXY(i+3, u2, v1);
        }
    });
    uv.needsUpdate = true;
}

function makePlayerPart(widthPx, heightPx, depthPx, faceUVs) {
    const geo = new THREE.BoxGeometry(widthPx / 16, heightPx / 16, depthPx / 16);
    applySkinUVs(geo, faceUVs);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: playerTexture }));
}
function makePlayerArm() {
    return makePlayerPart(4, 12, 4, {
        right: [40, 20, 4, 12], left: [48, 20, 4, 12], top: [44, 16, 4, 4],
        bottom: [48, 16, 4, 4], front: [44, 20, 4, 12], back: [52, 20, 4, 12]
    });
}

function buildPlayerModel() {
    const group = new THREE.Group();

    const headPivot = new THREE.Group();
    headPivot.position.y = 1.5;
    const headBone = new THREE.Group();
    headPivot.add(headBone);
    const head = makePlayerPart(8, 8, 8, {
        right: [0, 8, 8, 8], left: [16, 8, 8, 8], top: [8, 0, 8, 8],
        bottom: [16, 0, 8, 8], front: [8, 8, 8, 8], back: [24, 8, 8, 8]
    });
    head.position.y = 4 / 16;
    headBone.add(head);

    const body = makePlayerPart(8, 12, 4, {
        right: [16, 20, 4, 12], left: [28, 20, 4, 12], top: [20, 16, 8, 4],
        bottom: [28, 16, 8, 4], front: [20, 20, 8, 12], back: [32, 20, 8, 12]
    });
    body.position.y = 0.75 + 6 / 16;

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-6 / 16, 1.5, 0);
    const rightArm = makePlayerArm();
    rightArm.position.y = -6 / 16;
    rightArmPivot.add(rightArm);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(6 / 16, 1.5, 0);
    const leftArm = makePlayerPart(4, 12, 4, {
        right: [32, 52, 4, 12], left: [40, 52, 4, 12], top: [36, 48, 4, 4],
        bottom: [40, 48, 4, 4], front: [36, 52, 4, 12], back: [44, 52, 4, 12]
    });
    leftArm.position.y = -6 / 16;
    leftArmPivot.add(leftArm);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-2 / 16, 0.75, 0);
    const rightLeg = makePlayerPart(4, 12, 4, {
        right: [0, 20, 4, 12], left: [8, 20, 4, 12], top: [4, 16, 4, 4],
        bottom: [8, 16, 4, 4], front: [4, 20, 4, 12], back: [12, 20, 4, 12]
    });
    rightLeg.position.y = -6 / 16;
    rightLegPivot.add(rightLeg);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(2 / 16, 0.75, 0);
    const leftLeg = makePlayerPart(4, 12, 4, {
        right: [16, 52, 4, 12], left: [24, 52, 4, 12], top: [20, 48, 4, 4],
        bottom: [24, 48, 4, 4], front: [20, 52, 4, 12], back: [28, 52, 4, 12]
    });
    leftLeg.position.y = -6 / 16;
    leftLegPivot.add(leftLeg);

    group.add(headPivot, body, rightArmPivot, leftArmPivot, rightLegPivot, leftLegPivot);
    group.userData = { headPivot, headBone, head, body, rightArmPivot, leftArmPivot, rightLegPivot, leftLegPivot };
    return group;
}

const playerModel = buildPlayerModel();
scene.add(playerModel);

const viewModelScene = new THREE.Scene();
const viewModelCamera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, 0.01, 10);
const viewModelLight = new THREE.AmbientLight(0xffffff, 1.25);
viewModelScene.add(viewModelLight);
const firstPersonArmPivot = new THREE.Group();
const firstPersonArm = makePlayerArm();
firstPersonArm.position.y = -6 / 16;
firstPersonArmPivot.add(firstPersonArm);
firstPersonArmPivot.rotation.order = 'YXZ';
viewModelScene.add(firstPersonArmPivot);

const CAMERA_VIEWS = { FIRST: 0, THIRD_BACK: 1, THIRD_FRONT: 2 };
let cameraView = CAMERA_VIEWS.FIRST;
let yaw = 0, pitch = 0, keys = {};
let walkCycle = 0;
let walkAnimationAmount = 0;
let bodyYaw = 0;
let actionSwing = 0;
let actionType = null;
let strafeTilt = 0;
const playerEyePosition = camera.position.clone();
const PLAYER_EYE_HEIGHT = 1.62;
let isLeftMouseDown = false; 

let mining = { active: false, startTime: 0, blockPosition: null, blockName: null, requiredTime: 500 };

const droppedItems = [];
const itemGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);

function spawnDroppedItem(x, y, z, blockName) {
    let geo = customGeometries[blockName] || itemGeometry;
    let mat = materials[blockName];
    if (!mat) return; 

    const itemGroup = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat);
    
    let groundConfig = { rotation: [0, 0, 0], translation: [0, 3, 0], scale: [0.25, 0.25, 0.25] };
    if (geo.userData && geo.userData.display && geo.userData.display.ground) {
        groundConfig = geo.userData.display.ground;
    } else if (geo.userData && geo.userData.is2D) {
        groundConfig.scale = [0.4, 0.4, 0.4];
    }

    if (groundConfig.scale) {
        mesh.scale.set(groundConfig.scale[0], groundConfig.scale[1], groundConfig.scale[2]);
    }
    if (groundConfig.rotation) {
        mesh.rotation.set(
            THREE.MathUtils.degToRad(groundConfig.rotation[0]),
            THREE.MathUtils.degToRad(groundConfig.rotation[1]),
            THREE.MathUtils.degToRad(groundConfig.rotation[2]),
            'YXZ'
        );
    }
    if (groundConfig.translation) {
        mesh.position.set(
            groundConfig.translation[0] / 16,
            groundConfig.translation[1] / 16,
            groundConfig.translation[2] / 16
        );
    }
    
    itemGroup.add(mesh);
    itemGroup.position.set(x, y, z);
    const velocity = new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 2, (Math.random() - 0.5) * 4);
    scene.add(itemGroup);
    droppedItems.push({ group: itemGroup, mesh: mesh, velocity, blockName, lifeTime: 0 });
}

function getTarget() {
    const dir = getCameraForwardVector(true);
    const ox = playerEyePosition.x;
    const oy = playerEyePosition.y;
    const oz = playerEyePosition.z;
    let ix = Math.floor(ox + 0.5);
    let iy = Math.floor(oy + 0.5);
    let iz = Math.floor(oz + 0.5);
    const stepX = dir.x >= 0 ? 1 : -1;
    const stepY = dir.y >= 0 ? 1 : -1;
    const stepZ = dir.z >= 0 ? 1 : -1;
    const tDeltaX = Math.abs(1.0 / dir.x);
    const tDeltaY = Math.abs(1.0 / dir.y);
    const tDeltaZ = Math.abs(1.0 / dir.z);
    const nextBoundaryX = ix + stepX * 0.5;
    const nextBoundaryY = iy + stepY * 0.5;
    const nextBoundaryZ = iz + stepZ * 0.5;
    let tMaxX = (dir.x !== 0) ? Math.abs((nextBoundaryX - ox) / dir.x) : Infinity;
    let tMaxY = (dir.y !== 0) ? Math.abs((nextBoundaryY - oy) / dir.y) : Infinity;
    let tMaxZ = (dir.z !== 0) ? Math.abs((nextBoundaryZ - oz) / dir.z) : Infinity;
    const maxDist = 6;
    let normalX = 0, normalY = 0, normalZ = 0;
    while (true) {
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
            if (tMaxX > maxDist) break;
            ix += stepX;
            tMaxX += tDeltaX;
            normalX = -stepX; normalY = 0; normalZ = 0;
        } else if (tMaxY < tMaxZ) {
            if (tMaxY > maxDist) break;
            iy += stepY;
            tMaxY += tDeltaY;
            normalX = 0; normalY = -stepY; normalZ = 0;
        } else {
            if (tMaxZ > maxDist) break;
            iz += stepZ;
            tMaxZ += tDeltaZ;
            normalX = 0; normalY = 0; normalZ = -stepZ;
        }
        const b = getGlobalBlock(ix, iy, iz);
        if (b !== null && b !== 0 && b !== TYPE.water
            && !REVERSE_TYPE[b].includes('sculk_vein')
            && !REVERSE_TYPE[b].includes('glow_lichen')) {
            const tCrossed = normalX !== 0 ? tMaxX - tDeltaX : normalY !== 0 ? tMaxY - tDeltaY : tMaxZ - tDeltaZ;
            const hitPoint = new THREE.Vector3(
                ox + dir.x * tCrossed,
                oy + dir.y * tCrossed,
                oz + dir.z * tCrossed
            );

            return {
                position: new THREE.Vector3(ix, iy, iz),
                normal: new THREE.Vector3(normalX, normalY, normalZ),
                blockName: REVERSE_TYPE[b],
                point: hitPoint
            };
        }
    }
    return null;
}

function startMining(hit) {
    const blockName = hit.blockName;
    const heldItemType = inventory[selectedSlot].type;
    
    const requiredTime = calculateMiningTime(blockName, heldItemType);
    if (requiredTime === Infinity) return; 

    mining = { active: true, startTime: Date.now(), blockPosition: hit.position, blockName: blockName, requiredTime: requiredTime };
    destroyMat.map = destroyTextures[0]; destroyMat.needsUpdate = true;
    destroyMesh.position.set(hit.position.x, hit.position.y, hit.position.z);
    destroyMesh.visible = true; 
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DEPENDENCY & BREAKING LOGIC (Cascades breaks to anchored plants/blocks)
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
function breakBlockRecursive(pX, pY, pZ, dropItems = true) {
    let b = getGlobalBlock(pX, pY, pZ);
    if (b === null || b === 0) return;
    let blockName = REVERSE_TYPE[b];
    
    let placed = placedBlocks.get(`${pX},${pY},${pZ}`);
    let isUpperHalf = placed && placed.state && placed.state.half === 'upper';

    setGlobalBlock(pX, pY, pZ, 0);

    if (placed && placed.state && (placed.state.type === 'left' || placed.state.type === 'right')) {
        unmergeChestPartner(pX, pY, pZ, blockName, placed.state);
    }
    
    if (dropItems && !isUpperHalf) {
        let dropName = blockName;
        if (dropName === 'chest_left' || dropName === 'chest_right') dropName = 'chest';
        if (dropName === 'trapped_left' || dropName === 'trapped_right') dropName = 'trapped_chest';
        // Fix for weeping and twisting vines explicitly dropping their _plant base types
        if (dropName === 'weeping_vines' || dropName === 'weeping_vines_plant') dropName = 'weeping_vines_plant';
        if (dropName === 'twisting_vines' || dropName === 'twisting_vines_plant') dropName = 'twisting_vines_plant';

        const dropData = BLOCK_DROPS[blockName];
        const item = (dropData && dropData.item) ? dropData.item : dropName;
        let count = (dropData && dropData.count) ? dropData.count : 1;
        if (typeof count === 'function') count = count();
        
        for (let i = 0; i < count; i++) {
            spawnDroppedItem(pX + 0.5, pY + 0.5, pZ + 0.5, item); // Centered slightly
        }
    }

    updateStairConnections(pX+1, pY, pZ);
    updateStairConnections(pX-1, pY, pZ);
    updateStairConnections(pX, pY, pZ+1);
    updateStairConnections(pX, pY, pZ-1);

    // Prompt grass below to recount snowy status if needed
    let floorBelow = getGlobalBlock(pX, pY - 1, pZ);
    if (floorBelow) chunksToRebuild.add(`${Math.floor(pX/chunkSize)},${Math.floor(pZ/chunkSize)}`);
    
    // Check block ABOVE (If the broken block was the floor support)
    let above = getGlobalBlock(pX, pY + 1, pZ);
    if (above !== null && above !== 0) {
        let aName = REVERSE_TYPE[above];
        const needsSupportBelow = ['grass', 'fern', 'bush', 'sapling', 'flower', 'orchid', 'allium', 'bluet', 'tulip', 'daisy', 'lily', 'rose', 'mushroom', 'fungus', 'roots', 'sugar_cane', 'cactus', 'snow', 'carpet', 'twisting_vines', 'door_top', 'sunflower', 'peony', 'lilac'];
        let requiresBelow = needsSupportBelow.some(kw => aName.includes(kw)) && !aName.includes('block') && !aName.includes('wall') && !aName.includes('hanging');
        if (requiresBelow) breakBlockRecursive(pX, pY + 1, pZ, true);
    }
    
    // Check block BELOW (If the broken block was the ceiling support)
    let below = getGlobalBlock(pX, pY - 1, pZ);
    if (below !== null && below !== 0) {
        let bName = REVERSE_TYPE[below];
        const needsSupportAbove = ['weeping_vines', 'spore_blossom', 'hanging_roots'];
        let requiresAbove = needsSupportAbove.some(kw => bName.includes(kw));
        
        let placedBelow = placedBlocks.get(`${pX},${pY - 1},${pZ}`);
        let isLowerHalf = placedBelow && placedBelow.state && placedBelow.state.half === 'lower';

        if (requiresAbove || isLowerHalf) breakBlockRecursive(pX, pY - 1, pZ, true);
        else if (blockName.includes('door_top') && bName === blockName.replace('_top', '')) breakBlockRecursive(pX, pY - 1, pZ, true);
    }
}

function updateMining() {
    if (!mining.active) { 
        destroyMesh.visible = false; 
        return; 
    }
    
    const hit = getTarget();
    
    if (!hit || !hit.position.equals(mining.blockPosition)) {
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
        const p = mining.blockPosition;
        const blockName = mining.blockName;
        let pX = p.x | 0; let pY = p.y | 0; let pZ = p.z | 0;
        const heldItemType = inventory[selectedSlot].type;
        const harvestable = canHarvestBlock(blockName, heldItemType);
        breakBlockRecursive(pX, pY, pZ, harvestable);
        mining.active = false;
        destroyMesh.visible = false;
    }
}

document.addEventListener('contextmenu', e => e.preventDefault());

function triggerPlayerAction(type) {
    actionType = type;
    actionSwing = 1;
}
const horizontalFacingBlocks = [
  "furnace",
  "blast_furnace",
  "smoker",
  "crafter",
  "loom",
  "stonecutter",
  "lectern",
  "grindstone",
  "bell",
  "campfire",
  "soul_campfire",
  "heavy_core",
  "chest",
  "trapped_chest",
  "ender_chest",
  "barrel",
  "chiseled_bookshelf",
  "repeater",
  "comparator",
  "beehive",
  "bee_nest",
  "carved_pumpkin",
  "jack_o_lantern",
  "cocoa",
  "anvil",
  "chipped_anvil",
  "damaged_anvil",
  "shulker_box",
  "white_shulker_box",
  "orange_shulker_box",
  "magenta_shulker_box",
  "light_blue_shulker_box",
  "yellow_shulker_box",
  "lime_shulker_box",
  "pink_shulker_box",
  "gray_shulker_box",
  "light_gray_shulker_box",
  "cyan_shulker_box",
  "purple_shulker_box",
  "blue_shulker_box",
  "brown_shulker_box",
  "green_shulker_box",
  "red_shulker_box",
  "black_shulker_box",
  "white_bed",
  "orange_bed",
  "magenta_bed",
  "light_blue_bed",
  "yellow_bed",
  "lime_bed",
  "pink_bed",
  "gray_bed",
  "light_gray_bed",
  "cyan_bed",
  "purple_bed",
  "blue_bed",
  "brown_bed",
  "green_bed",
  "red_bed",
  "black_bed",
  "white_glazed_terracotta",
  "orange_glazed_terracotta",
  "magenta_glazed_terracotta",
  "light_blue_glazed_terracotta",
  "yellow_glazed_terracotta",
  "lime_glazed_terracotta",
  "pink_glazed_terracotta",
  "gray_glazed_terracotta",
  "light_gray_glazed_terracotta",
  "cyan_glazed_terracotta",
  "purple_glazed_terracotta",
  "blue_glazed_terracotta",
  "brown_glazed_terracotta",
  "green_glazed_terracotta",
  "red_glazed_terracotta",
  "black_glazed_terracotta",
  "oak_fence_gate",
  "spruce_fence_gate",
  "birch_fence_gate",
  "jungle_fence_gate",
  "acacia_fence_gate",
  "dark_oak_fence_gate",
  "mangrove_fence_gate",
  "cherry_fence_gate",
  "bamboo_fence_gate",
  "crimson_fence_gate",
  "warped_fence_gate",
  "oak_stairs",
  "spruce_stairs",
  "birch_stairs",
  "jungle_stairs",
  "acacia_stairs",
  "dark_oak_stairs",
  "mangrove_stairs",
  "cherry_stairs",
  "bamboo_stairs",
  "crimson_stairs",
  "warped_stairs",
  "stone_stairs",
  "cobblestone_stairs",
  "mossy_cobblestone_stairs",
  "smooth_stone_stairs",
  "stone_brick_stairs",
  "mossy_stone_brick_stairs",
  "granite_stairs",
  "polished_granite_stairs",
  "diorite_stairs",
  "polished_diorite_stairs",
  "andesite_stairs",
  "polished_andesite_stairs",
  "deepslate_stairs",
  "cobbled_deepslate_stairs",
  "polished_deepslate_stairs",
  "deepslate_brick_stairs",
  "deepslate_tile_stairs",
  "brick_stairs",
  "mud_brick_stairs",
  "resin_brick_stairs",
  "sandstone_stairs",
  "smooth_sandstone_stairs",
  "red_sandstone_stairs",
  "smooth_red_sandstone_stairs",
  "prismarine_stairs",
  "prismarine_brick_stairs",
  "dark_prismarine_stairs",
  "nether_brick_stairs",
  "red_nether_brick_stairs",
  "quartz_stairs",
  "smooth_quartz_stairs",
  "purpur_stairs",
  "blackstone_stairs",
  "polished_blackstone_stairs",
  "polished_blackstone_brick_stairs",
  "tuff_stairs",
  "polished_tuff_stairs",
  "tuff_brick_stairs",
  "cut_copper_stairs",
  "exposed_cut_copper_stairs",
  "weathered_cut_copper_stairs",
  "oxidized_cut_copper_stairs",
  "waxed_cut_copper_stairs",
  "waxed_exposed_cut_copper_stairs",
  "waxed_weathered_cut_copper_stairs",
  "waxed_oxidized_cut_copper_stairs",
  "creeper_wall_head",
  "dragon_wall_head",
  "player_wall_head",
  "zombie_wall_head",
  "skeleton_wall_skull",
  "wither_skeleton_wall_skull",
  "piglin_wall_head",
  "white_wall_banner",
  "orange_wall_banner",
  "magenta_wall_banner",
  "light_blue_wall_banner",
  "yellow_wall_banner",
  "lime_wall_banner",
  "pink_wall_banner",
  "gray_wall_banner",
  "light_gray_wall_banner",
  "cyan_wall_banner",
  "purple_wall_banner",
  "blue_wall_banner",
  "brown_wall_banner",
  "green_wall_banner",
  "red_wall_banner",
  "black_wall_banner",
  "oak_wall_sign",
  "spruce_wall_sign",
  "birch_wall_sign",
  "jungle_wall_sign",
  "acacia_wall_sign",
  "dark_oak_wall_sign",
  "mangrove_wall_sign",
  "cherry_wall_sign",
  "bamboo_wall_sign",
  "crimson_wall_sign",
  "warped_wall_sign",
  "oak_wall_hanging_sign",
  "spruce_wall_hanging_sign",
  "birch_wall_hanging_sign",
  "jungle_wall_hanging_sign",
  "acacia_wall_hanging_sign",
  "dark_oak_wall_hanging_sign",
  "mangrove_wall_hanging_sign",
  "cherry_wall_hanging_sign",
  "bamboo_wall_hanging_sign",
  "crimson_wall_hanging_sign",
  "warped_wall_hanging_sign"
];

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#creative-inventory-screen') || e.target.closest('#hotbar')) return; 
    
    if (!document.pointerLockElement && creativeScaleCenter.style.display === 'none') {
        renderer.domElement.requestPointerLock();
    } else if (document.pointerLockElement) {
        if (e.button === 0) {
            isLeftMouseDown = true;
            triggerPlayerAction('mine');
        } else if (e.button === 2) { 
            const hit = getTarget(); 
            if (!hit) return;
            triggerPlayerAction('place');
            
            const p = hit.position;
            const placeX = (p.x + hit.normal.x) | 0;
            const placeY = (p.y + hit.normal.y) | 0;
            const placeZ = (p.z + hit.normal.z) | 0;
            
            const selectedItem = inventory[selectedSlot];
            
            let placementType = selectedItem.type;
            if (placementType === 'sweet_berries') placementType = 'sweet_berry_bush';
            
            const explicit2DItems = new Set([
                'torch', 'soul_torch', 'kelp', 'ladder', 'glow_lichen', 'sculk_vein', 'seagrass',
                'candle', 'bamboo', 'lilac', 'peony', 'turtle_egg', 'pink_petals', 'soul_campfire', 'campfire',
                'amethyst_cluster', 'pointed_dripstone', 'weeping_vines', 'twisting_vines', 'crimson_roots', 'warped_roots',
                'crimson_fungus', 'warped_fungus', 'nether_sprouts', 'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet',
                'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose',
                'brown_mushroom', 'red_mushroom', 'fern', 'dead_bush', 'tall_grass', 'large_fern', 'short_grass',
                'oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling',
                'mangrove_propagule', 'cherry_sapling', 'pale_oak_sapling', 'hanging_roots'
            ]);
            
            if (flatItems.has(placementType) && !explicit2DItems.has(placementType) && !placementType.includes('sign') && !placementType.includes('door')) return; 

            // Special interaction: Stack snow
            if (placementType === 'snow') {
                let clickedBlockId = getGlobalBlock(placeX - hit.normal.x, placeY - hit.normal.y, placeZ - hit.normal.z);
                if (clickedBlockId === TYPE['snow'] && hit.normal.y === 1) {
                    let cx = placeX - hit.normal.x; let cy = placeY - hit.normal.y; let cz = placeZ - hit.normal.z;
                    let currentData = placedBlocks.get(`${cx},${cy},${cz}`);
                    let layers = currentData && currentData.state && currentData.state.layers ? parseInt(currentData.state.layers) : 1;
                    if (layers < 8) {
                        setGlobalBlock(cx, cy, cz, { type: TYPE['snow'], state: { layers: (layers + 1).toString() } });
                        selectedItem.count--;
                        if (selectedItem.count <= 0) selectedItem.type = null;
                        updateInventoryUI();
                        return; // Successfully layered
                    }
                }
            }

            if (placementType && getGlobalBlock(placeX, placeY, placeZ) === 0) {

                if (placementType === 'twisting_vines') {
                    let below = getGlobalBlock(placeX, placeY - 1, placeZ);
                    if (below !== null && (REVERSE_TYPE[below] === 'twisting_vines' || REVERSE_TYPE[below] === 'twisting_vines_plant')) {
                        setGlobalBlock(placeX, placeY - 1, placeZ, { type: TYPE.twisting_vines_plant });
                        chunksToRebuild.add(`${Math.floor(placeX/chunkSize)},${Math.floor(placeZ/chunkSize)}`);
                    }
                } else if (placementType === 'weeping_vines') {
                    let above = getGlobalBlock(placeX, placeY + 1, placeZ);
                    if (above !== null && (REVERSE_TYPE[above] === 'weeping_vines' || REVERSE_TYPE[above] === 'weeping_vines_plant')) {
                        setGlobalBlock(placeX, placeY + 1, placeZ, { type: TYPE.weeping_vines_plant });
                        chunksToRebuild.add(`${Math.floor(placeX/chunkSize)},${Math.floor(placeZ/chunkSize)}`);
                    }
                } else if (placementType === 'kelp') {
                    let below = getGlobalBlock(placeX, placeY - 1, placeZ);
                    if (below !== null && (REVERSE_TYPE[below] === 'kelp' || REVERSE_TYPE[below] === 'kelp_plant')) {
                        setGlobalBlock(placeX, placeY - 1, placeZ, { type: TYPE.kelp_plant });
                        chunksToRebuild.add(`${Math.floor(placeX/chunkSize)},${Math.floor(placeZ/chunkSize)}`);
                    }
                }

                let rotation = [0, 0, 0];
                let blockStateDict = {};
                let extraBlock = null; 
                
                if (placementType.includes('log') || placementType.includes('pillar') || placementType === 'basalt' || placementType === 'polished_basalt' || placementType === 'bone_block' || placementType === 'purpur_pillar' || placementType === 'quartz_pillar' || placementType === 'hay_block') {
                    let axis = 'y';
                    if (Math.abs(hit.normal.x) > 0.5) axis = 'x';
                    if (Math.abs(hit.normal.z) > 0.5) axis = 'z';
                    blockStateDict = { axis: axis };
                } 
                else if (placementType.includes('stairs')) {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;

                    let facingStr = 'east';
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) facingStr = 'north';
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) facingStr = 'west';
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) facingStr = 'south';
                    let isTop;
                    if (hit.normal.y === -1) {
                        isTop = true;
                    } else if (hit.normal.y === 1) {
                        isTop = false;
                    } else {
                        const localHitY = hit.point.y - hit.position.y + 0.5;
                        isTop = localHitY > 0.5;
                    }

                    blockStateDict = {
                        facing: facingStr,
                        half: isTop ? 'top' : 'bottom',
                        shape: 'straight'
                    };

                    rotation = [
                        isTop ? Math.PI : 0,
                        0,
                        0
                    ];
                }
                else if (placementType === 'pointed_dripstone') {
                    let isTop = (hit.normal.y === -1 || (hit.normal.y === 0 && (playerEyePosition.y - placeY) < 0));
                    blockStateDict = { vertical_direction: isTop ? 'down' : 'up'};
                }
                else if (placementType === 'sulfur_spike') {
                    let isTop = (hit.normal.y === -1 || (hit.normal.y === 0 && (playerEyePosition.y - placeY) < 0));
                    blockStateDict = { vertical_direction: isTop ? 'down' : 'up'};
                }
                else if (placementType.includes('door') && !placementType.includes('trapdoor')) {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;
                    
                    let rotY = 0;
                    let facingStr = 'east';
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) { rotY = Math.PI; facingStr = 'north'; } 
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) { rotY = -Math.PI/2; facingStr = 'west'; } 
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) { rotY = 0; facingStr = 'south'; } 
                    else { rotY = Math.PI/2; facingStr = 'east'; }

                    rotation = [0, rotY, 0];
                    blockStateDict = { half: 'lower', facing: facingStr, open: 'false', hinge: 'left' };
                    extraBlock = { x: placeX, y: placeY + 1, z: placeZ, type: TYPE[placementType + '_top'], rotation: [0, rotY, 0], state: { half: 'upper', facing: facingStr, open: 'false', hinge: 'left' } };
                }
                else if (horizontalFacingBlocks.includes(placementType)) {
                    let ry = yaw % (Math.PI * 2);
                    if (ry < 0) ry += Math.PI * 2;
                    
                    let facingStr = 'south';
                    if (ry >= 7*Math.PI/4 || ry < Math.PI/4) facingStr = 'south';
                    else if (ry >= Math.PI/4 && ry < 3*Math.PI/4) facingStr = 'east';
                    else if (ry >= 3*Math.PI/4 && ry < 5*Math.PI/4) facingStr = 'north';
                    else facingStr = 'west';
                    
                    blockStateDict = { facing: facingStr };
                    rotation = [0, 0, 0];
                }
                
                // Two-tall plants parsing logic
                const twoTallPlants = ['sunflower', 'lilac', 'rose_bush', 'peony', 'tall_grass', 'large_fern', 'pitcher_plant'];
                if (twoTallPlants.includes(placementType)) {
                    let topClear = getGlobalBlock(placeX, placeY + 1, placeZ);
                    if (topClear !== 0) return; // Prevent placing if blocked
                    blockStateDict = { half: 'lower' };
                    extraBlock = { x: placeX, y: placeY + 1, z: placeZ, type: TYPE[placementType], state: { half: 'upper' } };
                }
                
                let placedData = { type: TYPE[placementType], rotation: rotation, state: blockStateDict };

                if (extraBlock && getGlobalBlock(extraBlock.x, extraBlock.y, extraBlock.z) !== 0) {
                    // Not enough room
                } else {
                    setGlobalBlock(placeX, placeY, placeZ, placedData);
                    
                    if (placementType === 'chest' || placementType === 'trapped_chest') {
                        tryMergeChest(placeX, placeY, placeZ, placementType, blockStateDict.facing, rotation[1]);
                    }
                    
                    if (extraBlock) {
                        setGlobalBlock(extraBlock.x, extraBlock.y, extraBlock.z, { type: extraBlock.type, rotation: extraBlock.rotation, state: extraBlock.state });
                    }
                    
                    if (placementType.includes('stairs')) {
                        updateStairConnections(placeX, placeY, placeZ);
                    }
                    
                    // Update floor grass blocks to become snowy when placing blocks down
                    let floorBelow = getGlobalBlock(placeX, placeY - 1, placeZ);
                    if (floorBelow === TYPE.grass_block || floorBelow === TYPE.podzol || floorBelow === TYPE.mycelium) {
                        chunksToRebuild.add(`${Math.floor(placeX/chunkSize)},${Math.floor(placeZ/chunkSize)}`);
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
        const PITCH_LIMIT = THREE.MathUtils.degToRad(89.5);
        pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch - e.movementY * 0.002));
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
    if (e.key.toLowerCase() === 'c' && creativeScaleCenter.style.display === 'none' && !e.repeat) {
        cameraView = (cameraView + 1) % 3;
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
function getWrappedAngleDifference(target, current) {
    return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function stepAngleToward(current, target, amount) {
    return current + getWrappedAngleDifference(target, current) * amount;
}
function getCameraForwardVector(includePitch = true) {
    const cp = includePitch ? Math.cos(pitch) : 1;
    return new THREE.Vector3(
        -Math.sin(yaw) * cp,
        includePitch ? Math.sin(pitch) : 0,
        -Math.cos(yaw) * cp
    ).normalize();
}

function getThirdPersonCameraPosition(startPos, targetOffset) {
    const desired = startPos.clone().add(targetOffset);
    const steps = Math.ceil(targetOffset.length() / 0.1);
    const probe = startPos.clone();

    for (let i = 1; i <= steps; i++) {
        probe.lerpVectors(startPos, desired, i / steps);
        const b = getGlobalBlock(Math.round(probe.x), Math.round(probe.y), Math.round(probe.z));
        if (b !== null && b !== 0 && !isTransparent[b]) {
            return startPos.clone().add(targetOffset.clone().multiplyScalar(Math.max(0, (i - 2) / steps)));
        }
    }
    return desired;
}
function getPlayerHeadTarget() {
    const headPivot = playerModel.userData.headPivot;
    headPivot.updateWorldMatrix(true, false);
    return headPivot.getWorldPosition(new THREE.Vector3());
}
function updateCameraView() {
    if (cameraView === CAMERA_VIEWS.FIRST) {
        camera.position.copy(playerEyePosition);
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    } else {
        const isBack = cameraView === CAMERA_VIEWS.THIRD_BACK;
        const distance = 4;

        const offsetDir = getCameraForwardVector(true);
        if (isBack) offsetDir.negate();

        const offset = offsetDir.multiplyScalar(distance);
        const headCenter = playerEyePosition.clone();
        headCenter.y += 0.13;

        camera.position.copy(getThirdPersonCameraPosition(headCenter, offset));
        camera.up.set(0, 1, 0);
        camera.lookAt(getPlayerHeadTarget());
    }

    playerModel.visible = cameraView !== CAMERA_VIEWS.FIRST;
}

function updatePlayerModel(delta, moving) {
    const feetY = playerEyePosition.y - PLAYER_EYE_HEIGHT;
    playerModel.position.set(playerEyePosition.x, feetY, playerEyePosition.z);

    const neckLimit = 0.65;
    const yawDiff = getWrappedAngleDifference(yaw, bodyYaw);
    if (moving) {
        bodyYaw = stepAngleToward(bodyYaw, yaw, 0.34);
    } else if (Math.abs(yawDiff) > neckLimit) {
        bodyYaw += yawDiff - Math.sign(yawDiff) * neckLimit;
    }
    const neckYaw = THREE.MathUtils.clamp(getWrappedAngleDifference(yaw, bodyYaw), -neckLimit, neckLimit);
    playerModel.rotation.y = bodyYaw + Math.PI;
    const targetTilt = (keys.a ? 0.07 : 0) - (keys.d ? 0.07 : 0);
    strafeTilt = THREE.MathUtils.lerp(strafeTilt, targetTilt, 0.1);
    playerModel.rotation.z = strafeTilt;

    const parts = playerModel.userData;
    
    if (moving) {
        walkAnimationAmount = THREE.MathUtils.lerp(walkAnimationAmount, 1, 0.35);
        walkCycle += delta * 9.0;
    } else {
        walkAnimationAmount = THREE.MathUtils.lerp(walkAnimationAmount, 0, 0.2);
    }

    const walkPhase = walkCycle * 0.6662;
    const swing = Math.cos(walkPhase) * 0.6 * walkAnimationAmount;
    const oppositeSwing = Math.cos(walkPhase + Math.PI) * 0.6 * walkAnimationAmount;
    const swingProgress = 1 - actionSwing;
    const actionRoot = Math.sqrt(Math.max(0, swingProgress));
    const actionSin = Math.sin(actionRoot * Math.PI);
    const actionSin2 = Math.sin(swingProgress * swingProgress * Math.PI);

    const time = performance.now() / 1000;
    const idleBobX = Math.sin(time * 1.2) * 0.03;
    const idleBobZ = Math.sin(time * 1.2) * 0.03;
    const idleAmount = 1.0 - walkAnimationAmount;

    parts.rightLegPivot.rotation.x = swing;
    parts.leftLegPivot.rotation.x = oppositeSwing;
    const rightArmWalkBlend = Math.max(0.0, 1.0 - actionSwing * 4.0);
    parts.rightArmPivot.rotation.x = oppositeSwing * rightArmWalkBlend - actionSin * 1.4 + idleBobX * idleAmount;
    parts.rightArmPivot.rotation.y = actionSin2 * 0.3;
    parts.rightArmPivot.rotation.z = (actionType === 'place' ? -actionSin * 0.4 : -actionSin * 0.7) + idleBobZ * idleAmount;
    parts.leftArmPivot.rotation.x = swing + idleBobX * idleAmount;
    parts.leftArmPivot.rotation.z = -idleBobZ * idleAmount;
    parts.headBone.rotation.set(-pitch, neckYaw, 0, 'YXZ');

    firstPersonArmPivot.visible = cameraView === CAMERA_VIEWS.FIRST;
    
    const armBaseX = 0.56;
    const armBaseY = -0.52;
    const armBaseZ = -0.72;
    
    const walkU = Math.sin(walkPhase);
    const walkU2 = Math.cos(walkPhase);
    const useDrop = Math.sin(actionRoot * Math.PI * 2);

    firstPersonArmPivot.position.set(
        armBaseX - actionSin * 0.25 + walkU * 0.035 * walkAnimationAmount,
        armBaseY + Math.abs(walkU) * 0.055 * walkAnimationAmount + useDrop * 0.05,
        armBaseZ - actionSin2 * 0.15
    );
    firstPersonArmPivot.rotation.set(
        THREE.MathUtils.degToRad(-10) + (-actionSin * 1.2 + Math.abs(walkU) * 0.05 * walkAnimationAmount),
        THREE.MathUtils.degToRad(-20) + actionSin2 * 0.3,
        walkU * 0.05 * walkAnimationAmount - actionSin * 0.1,
        'YXZ'
    );

    viewModelCamera.rotation.set(pitch * 0.2, 0, 0, 'YXZ');

    actionSwing = Math.max(0, actionSwing - delta * (actionType === 'place' ? 5.5 : 4.0));
    if (actionSwing === 0) actionType = null;
}

let isGeneratingChunk = false;
let isRebuildingChunk = false;
let lastCompassFrame = -1;

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

    updateCameraView();

    const dx = -playerEyePosition.x;
    const dz = -playerEyePosition.z;
    const targetAngle = Math.atan2(dx, dz);
    let relAngle = (targetAngle - yaw) % (Math.PI * 2);
    if (relAngle < 0) relAngle += Math.PI * 2;
    let compassFrame = Math.floor((relAngle / (Math.PI * 2)) * 32) % 32;
    
    if (compassFrame !== lastCompassFrame) {
        lastCompassFrame = compassFrame;
        let frameStr = compassFrame.toString().padStart(2, '0');
        let compassUrl = `url(${ITEM_TEX_DIR}compass_${frameStr}.png)`;
        document.querySelectorAll('[data-icon-type="compass"]').forEach(el => {
            if (el.style.backgroundImage !== compassUrl) el.style.backgroundImage = compassUrl;
        });
    }

    if (chunkQueue.length > 0 && !isGeneratingChunk) {
        isGeneratingChunk = true;
        const next = chunkQueue.shift();
        const [cx, cz] = next.split(',').map(Number);
        generateChunk(cx, cz)
            .catch((err) => { console.error('generateChunk failed for', next, err); })
            .then(() => { isGeneratingChunk = false; });
    }

    if (isLeftMouseDown && document.pointerLockElement && creativeScaleCenter.style.display === 'none') {
        if (!mining.active) {
            const hit = getTarget();
            if (hit) startMining(hit);
        }
        if (mining.active && actionSwing < 0.1) {
            triggerPlayerAction('mine');
        }
    }

    updateMining();
    doRandomTicks();

    if (chunksToRebuild.size > 0 && !isRebuildingChunk) {
        isRebuildingChunk = true;
        const chunkId = chunksToRebuild.values().next().value;
        chunksToRebuild.delete(chunkId);
        let [cx, cz] = chunkId.split(',').map(Number);
        rebuildChunkGeometry(cx, cz)
            .catch((err) => { console.error('rebuildChunkGeometry failed for', chunkId, err); })
            .then(() => { isRebuildingChunk = false; });
    }
    
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        let item = droppedItems[i];
        item.lifeTime += delta;
        item.velocity.y -= 15 * delta; 
        
        let nx = item.group.position.x + item.velocity.x * delta;
        let ny = item.group.position.y + item.velocity.y * delta;
        let nz = item.group.position.z + item.velocity.z * delta;

        let bX = Math.round(nx); let bY = Math.round(ny - 0.25); let bZ = Math.round(nz);
        let blockBelow = getGlobalBlock(bX, bY, bZ);

        if (blockBelow === null) {
            item.velocity.set(0, 0, 0);
            nx = item.group.position.x; ny = item.group.position.y; nz = item.group.position.z;
        } 
        else if (blockBelow !== 0) {
            ny = bY + 0.5 + 0.125; 
            item.velocity.y = 0; item.velocity.x *= 0.5; item.velocity.z *= 0.5;
        } 
        else {
            let wallBlock = getGlobalBlock(bX, Math.round(ny), bZ);
            if (wallBlock !== 0 && wallBlock !== null) {
                item.velocity.x *= -0.5; item.velocity.z *= -0.5;
                nx = item.group.position.x; nz = item.group.position.z;
            }
        }

        item.group.position.set(nx, ny, nz);
        item.group.rotation.y += delta * 2;
        if (item.velocity.y === 0) item.group.position.y += Math.sin(item.lifeTime * 4) * 0.002;
        
        const dist = playerEyePosition.distanceTo(item.group.position);
        if (dist < 1.5) {
            scene.remove(item.group); 
            if (item.mesh.geometry !== itemGeometry) item.mesh.geometry.dispose();
            droppedItems.splice(i, 1); addItemToInventory(item.blockName, 1);
        } else if (item.group.position.y < minworldY - 20) {
            scene.remove(item.group); 
            if (item.mesh.geometry !== itemGeometry) item.mesh.geometry.dispose();
            droppedItems.splice(i, 1);
        }
    }

    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const moving = !!(keys.w || keys.s || keys.a || keys.d);
    if (keys.w) playerEyePosition.addScaledVector(fwd, -moveSpeed * delta);
    if (keys.s) playerEyePosition.addScaledVector(fwd, moveSpeed * delta);
    if (keys.a) playerEyePosition.addScaledVector(rgt, moveSpeed * delta);
    if (keys.d) playerEyePosition.addScaledVector(rgt, -moveSpeed * delta);
    if (keys[' ']) playerEyePosition.y += moveSpeed * delta;
    if (keys.shift) playerEyePosition.y -= moveSpeed * delta;

    updatePlayerModel(delta, moving);
    updateCameraView();
    renderer.clear();
    renderer.render(scene, camera);
    if (cameraView === CAMERA_VIEWS.FIRST) {
        renderer.clearDepth();
        viewModelCamera.aspect = camera.aspect;
        viewModelCamera.updateProjectionMatrix();
        renderer.render(viewModelScene, viewModelCamera);
    }
    stats.update();
}

animate();