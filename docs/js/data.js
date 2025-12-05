/**
 * Data module - PoE2 Build Archetypes and Interview Questions
 * IMPORTANT: Only contains validated PoE2 content (not PoE1)
 *
 * PoE2 Classes (Early Access):
 * - Warrior: Titan, Warbringer, Smith of Kitava
 * - Sorceress: Stormweaver, Chronomancer
 * - Witch: Infernalist, Blood Mage, Lich
 * - Ranger: Deadeye, Pathfinder
 * - Huntress: Amazon, Ritualist
 * - Mercenary: Gemling Legionnaire, Tactician, Witchhunter
 * - Monk: Acolyte of Chayula, Invoker
 */

const Data = {
    // Interview questions
    INTERVIEW_QUESTIONS: [
        {
            id: "class",
            question: "What class are you playing (or want to play)?",
            type: "select",
            required: true,
            options: [
                { value: "any", label: "I'm flexible / Show me all options" },
                { value: "warrior", label: "Warrior" },
                { value: "sorceress", label: "Sorceress" },
                { value: "witch", label: "Witch" },
                { value: "ranger", label: "Ranger" },
                { value: "huntress", label: "Huntress" },
                { value: "mercenary", label: "Mercenary" },
                { value: "monk", label: "Monk" }
            ],
            weight: 2.0
        },
        {
            id: "playstyle",
            question: "What playstyle do you enjoy most?",
            type: "select",
            required: true,
            options: [
                { value: "any", label: "I enjoy variety / No preference" },
                { value: "melee", label: "Up close and personal - Melee combat" },
                { value: "ranged", label: "Keep my distance - Ranged attacks" },
                { value: "spell", label: "Cast powerful spells" },
                { value: "minion", label: "Let my minions do the work" },
                { value: "hybrid", label: "A mix of styles" }
            ],
            weight: 2.0
        },
        {
            id: "damage_preference",
            question: "Do you have a damage type preference?",
            type: "select",
            required: false,
            options: [
                { value: "any", label: "No preference" },
                { value: "physical", label: "Physical - Raw brute force" },
                { value: "fire", label: "Fire - Burn everything" },
                { value: "cold", label: "Cold - Freeze and shatter" },
                { value: "lightning", label: "Lightning - Shock and awe" },
                { value: "chaos", label: "Chaos - Poison and decay" }
            ],
            weight: 1.5
        },
        {
            id: "content_focus",
            question: "What content will you focus on?",
            type: "multiselect",
            required: true,
            options: [
                { value: "mapping", label: "Fast map clearing" },
                { value: "bossing", label: "Boss killing" },
                { value: "both", label: "Balanced - both mapping and bossing" }
            ],
            weight: 1.5
        },
        {
            id: "budget",
            question: "What's your approximate budget?",
            type: "select",
            required: true,
            options: [
                { value: "starter", label: "League start / Very low (< 50 chaos)" },
                { value: "budget", label: "Budget (50-500 chaos)" },
                { value: "mid", label: "Mid-tier (500-5000 chaos / few divines)" },
                { value: "high", label: "High budget (5000+ chaos / 5+ divines)" },
                { value: "unlimited", label: "Sky's the limit / Min-max everything" }
            ],
            weight: 1.0
        },
        {
            id: "experience",
            question: "What's your experience level with PoE?",
            type: "select",
            required: true,
            options: [
                { value: "new", label: "New to PoE - Keep it simple" },
                { value: "casual", label: "Casual - I know the basics" },
                { value: "intermediate", label: "Intermediate - I understand most mechanics" },
                { value: "experienced", label: "Experienced - Bring on the complexity" }
            ],
            weight: 1.0
        },
        {
            id: "survivability",
            question: "How important is survivability to you?",
            type: "select",
            required: false,
            options: [
                { value: "any", label: "No preference" },
                { value: "glass_cannon", label: "Maximum damage, I'll just dodge" },
                { value: "balanced", label: "Balanced - I want some tankiness" },
                { value: "tanky", label: "Very tanky - I hate dying" }
            ],
            weight: 1.0
        }
    ],

    // Budget tier definitions
    BUDGET_TIERS: {
        starter: { name: "League Start", min: 0, max: 50, order: 1 },
        budget: { name: "Budget", min: 50, max: 500, order: 2 },
        mid: { name: "Mid-Tier", min: 500, max: 5000, order: 3 },
        high: { name: "High Budget", min: 5000, max: 50000, order: 4 },
        mirror: { name: "Min-Maxed", min: 50000, max: null, order: 5 }
    },

    // Experience to complexity mapping
    EXPERIENCE_COMPLEXITY: {
        new: 1,
        casual: 1,
        intermediate: 2,
        experienced: 3
    },

    // PoE2 Build Archetypes - Only valid PoE2 classes, ascendancies, and items
    ARCHETYPES: [
        // ========== WARRIOR BUILDS ==========
        {
            id: "slam-titan",
            name: "Slam Titan",
            slug: "slam-titan",
            class_name: "Titan",
            base_class: "Warrior",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "physical", "tanky", "aoe", "slam"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 8,
            complexity: 1,
            description: "Devastating slam attacks with incredible durability. The Titan ascendancy provides massive defensive bonuses while still delivering huge damage.",
            pros: [
                "Extremely tanky",
                "Big satisfying hits",
                "Great for bosses",
                "Simple gameplay"
            ],
            cons: [
                "Slow attack speed",
                "Needs to stand still to attack",
                "Not the fastest mapper"
            ],
            playstyle_notes: "Position carefully, then unleash powerful slams. Use your tankiness to facetank hits while you wind up big attacks.",
            leveling_notes: "Slam skills available early. Focus on life and damage nodes.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Self-found viable with any two-handed weapon.",
                    upgrade_notes: "Look for a high physical damage two-handed mace.",
                    items: [
                        { slot: "weapon", item_name: "Rare Great Mace", item_type: "Great Mace", is_unique: false, priority: 1, min_stats: { "physical damage": 200 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 2, min_stats: { life: 80, armour: 500 } },
                        { slot: "helmet", item_name: "Goldrim", item_type: "Helmet", is_unique: true, priority: 3 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Solid red map farmer with good boss damage.",
                    upgrade_notes: "Prioritize a better weapon and Marohi Erqi.",
                    items: [
                        { slot: "weapon", item_name: "Marohi Erqi", item_type: "Great Mace", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1, min_stats: { life: 100, armour: 1000 } },
                        { slot: "helmet", item_name: "Goldrim", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2, min_stats: { life: 70, "movement speed": 25 } },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "warcry-warbringer",
            name: "Warcry Warbringer",
            slug: "warcry-warbringer",
            class_name: "Warbringer",
            base_class: "Warrior",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "physical", "warcry", "buff", "totem"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 2,
            description: "Combines powerful warcries with melee attacks. Warbringer ascendancy enhances warcries and totems for a versatile combat style.",
            pros: [
                "Flexible playstyle",
                "Strong buffs from warcries",
                "Good clear and boss damage",
                "Totem synergy for safety"
            ],
            cons: [
                "Need to manage warcry cooldowns",
                "More buttons to press",
                "Requires good positioning"
            ],
            playstyle_notes: "Use warcries to buff yourself before engaging. Place totems to support your damage.",
            leveling_notes: "Warcries unlock mid-campaign. Level with basic attacks first.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Functional with self-found gear.",
                    upgrade_notes: "Look for warcry-related items.",
                    items: [
                        { slot: "weapon", item_name: "Rare Mace", item_type: "Mace", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Rare Shield", item_type: "Shield", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 2 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                }
            ]
        },

        // ========== SORCERESS BUILDS ==========
        {
            id: "lightning-stormweaver",
            name: "Lightning Storm Stormweaver",
            slug: "lightning-stormweaver",
            class_name: "Stormweaver",
            base_class: "Sorceress",
            primary_playstyle: "spell",
            damage_type: "lightning",
            tags: ["spell", "lightning", "shock", "aoe", "elemental"],
            mapping_score: 9,
            bossing_score: 7,
            league_start_score: 8,
            complexity: 2,
            description: "Harness devastating lightning storms. Stormweaver strips enemy resistances and creates powerful elemental storms for massive AoE damage.",
            pros: [
                "Excellent clear speed",
                "Shock amplifies damage",
                "Resistance reduction",
                "Great AoE coverage"
            ],
            cons: [
                "Can be mana hungry",
                "Squishy without investment",
                "Positioning matters"
            ],
            playstyle_notes: "Cast lightning spells to shock enemies, then follow up with your main damage skills. Use movement to stay safe.",
            leveling_notes: "Lightning skills available from start. Spark or Arc work well.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Functions well on self-found gear.",
                    upgrade_notes: "Get a +spell level wand.",
                    items: [
                        { slot: "weapon", item_name: "Lifesprig", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Smooth mapping with consistent shock application.",
                    upgrade_notes: "Get Enezun's Charge for lightning scaling.",
                    items: [
                        { slot: "weapon", item_name: "Enezun's Charge", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Ghostwrithe", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Thunderfist", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Luminous Pace", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Dream Fragments", item_type: "Ring", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "freeze-chronomancer",
            name: "Freeze Chronomancer",
            slug: "freeze-chronomancer",
            class_name: "Chronomancer",
            base_class: "Sorceress",
            primary_playstyle: "spell",
            damage_type: "cold",
            tags: ["spell", "cold", "freeze", "control", "time"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 3,
            description: "Freeze enemies in time while dealing cold damage. Chronomancer manipulates time for cooldown reduction and unique combat mechanics.",
            pros: [
                "Excellent crowd control",
                "Frozen enemies can't hurt you",
                "Unique time manipulation",
                "Good scaling"
            ],
            cons: [
                "Complex mechanics",
                "Freeze-immune bosses are harder",
                "Requires understanding of time mechanics"
            ],
            playstyle_notes: "Freeze enemies to control the battlefield. Use time manipulation abilities to reset cooldowns and extend buffs.",
            leveling_notes: "Cold spells from the start. Ice skills work well for leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Playable self-found with cold spell focus.",
                    upgrade_notes: "Get cold damage weapons.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1, min_stats: { "cold damage": 20 } },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Consistent freezing with good damage.",
                    upgrade_notes: "Get Taryn's Shiver for cold scaling.",
                    items: [
                        { slot: "weapon", item_name: "Taryn's Shiver", item_type: "Staff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Bitterbloom", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Dream Fragments", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },

        // ========== WITCH BUILDS ==========
        {
            id: "fire-infernalist",
            name: "Fire Storm Infernalist",
            slug: "fire-infernalist",
            class_name: "Infernalist",
            base_class: "Witch",
            primary_playstyle: "spell",
            damage_type: "fire",
            tags: ["spell", "fire", "ignite", "hellhound", "demon"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 2,
            description: "Unleash hellfire with the Infernalist. Summon a Hellhound companion and transform into a demon for enhanced fire damage.",
            pros: [
                "Strong fire damage",
                "Hellhound provides support",
                "Demon form is powerful",
                "Good ignite scaling"
            ],
            cons: [
                "Fire resistance on enemies hurts",
                "Demon form has drawbacks",
                "Managing transformation"
            ],
            playstyle_notes: "Cast fire spells to build ignite stacks. Use demon form for burst damage phases.",
            leveling_notes: "Fire spells available from start. Fireball and Firestorm work well.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Fire spells work well with minimal investment.",
                    upgrade_notes: "Get fire damage wand and staff.",
                    items: [
                        { slot: "weapon", item_name: "Lifesprig", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Strong ignite damage with good clear.",
                    upgrade_notes: "Get The Searing Touch for fire scaling.",
                    items: [
                        { slot: "weapon", item_name: "The Searing Touch", item_type: "Staff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Ghostwrithe", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 },
                        { slot: "jewel1", item_name: "Heart of the Well", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "blood-mage",
            name: "Chaos Fire Blood Mage",
            slug: "blood-mage",
            class_name: "Blood Mage",
            base_class: "Witch",
            primary_playstyle: "spell",
            damage_type: "chaos",
            tags: ["spell", "chaos", "blood", "life-cost", "sustain"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 5,
            complexity: 3,
            description: "Master life and blood energy. Skills cost life but enemies drop life remnants. Excellent sustain with high damage potential.",
            pros: [
                "Exceptional single target",
                "Great sustain from life remnants",
                "Chaos damage bypasses resistances",
                "Unique playstyle"
            ],
            cons: [
                "Skills cost life - risky",
                "Requires understanding blood mechanics",
                "Not beginner friendly"
            ],
            playstyle_notes: "Manage your life pool carefully. Kill enemies to collect life remnants for sustain. Use blood abilities strategically.",
            leveling_notes: "Start with basic fire spells, transition to blood magic mechanics later.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Entry-level Blood Mage with basic functionality.",
                    upgrade_notes: "Focus on life and chaos damage items.",
                    items: [
                        { slot: "weapon", item_name: "Sanguine Diviner", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Ghostwrithe", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 },
                        { slot: "jewel1", item_name: "Undying Hate", item_type: "Jewel", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "minion-lich",
            name: "Minion Army Lich",
            slug: "minion-lich",
            class_name: "Lich",
            base_class: "Witch",
            primary_playstyle: "minion",
            damage_type: "physical",
            tags: ["minion", "summoner", "tanky", "league-start", "army"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 9,
            complexity: 1,
            description: "Raise an army of undead minions. The Lich ascendancy enhances summoning capabilities for a safe, minion-focused playstyle.",
            pros: [
                "Very safe - minions tank for you",
                "Great league starter",
                "Low button gameplay",
                "Good at all content"
            ],
            cons: [
                "Minion AI can be frustrating",
                "Clear speed limited by minion movement",
                "Socket pressure for minion gems"
            ],
            playstyle_notes: "Summon your minions and let them fight. Focus on buffing and repositioning your army.",
            leveling_notes: "Summon skills from level 1. Add more minion types as you progress.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Completely self-found viable.",
                    upgrade_notes: "Get +minion level items.",
                    items: [
                        { slot: "weapon", item_name: "Chober Chaber", item_type: "Great Mace", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Strong minion army with good survivability.",
                    upgrade_notes: "Focus on minion damage and life.",
                    items: [
                        { slot: "weapon", item_name: "The Unborn Lich", item_type: "Staff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Enfolding Dawn", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Umbilicus Immortalis", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Undying Hate", item_type: "Jewel", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },

        // ========== RANGER BUILDS ==========
        {
            id: "bow-deadeye",
            name: "Lightning Arrow Deadeye",
            slug: "bow-deadeye",
            class_name: "Deadeye",
            base_class: "Ranger",
            primary_playstyle: "ranged",
            damage_type: "lightning",
            tags: ["ranged", "bow", "lightning", "fast-mapper", "projectile"],
            mapping_score: 10,
            bossing_score: 6,
            league_start_score: 7,
            complexity: 2,
            description: "Fire lightning-infused arrows that chain between enemies. Deadeye enhances projectile skills for incredible clear speed.",
            pros: [
                "Fastest clear in the game",
                "Great screen coverage",
                "Chain clears entire packs",
                "Very satisfying"
            ],
            cons: [
                "Glass cannon",
                "Struggles with single target",
                "Needs good bow"
            ],
            playstyle_notes: "Keep moving and firing. Use your mobility to stay safe. Focus on clearing packs quickly.",
            leveling_notes: "Bow skills from act 1. Lightning Arrow available early.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Bow builds can start with vendor bows.",
                    upgrade_notes: "Get a good physical or elemental bow.",
                    items: [
                        { slot: "weapon", item_name: "Quill Rain", item_type: "Bow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "quiver", item_name: "Blackgleam", item_type: "Quiver", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Excellent mapper with chain mechanics.",
                    upgrade_notes: "Get Doomfletch for elemental conversion.",
                    items: [
                        { slot: "weapon", item_name: "Doomfletch", item_type: "Bow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Hyrri's Ire", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2, min_stats: { life: 60, "movement speed": 30 } },
                        { slot: "quiver", item_name: "Asphyxia's Wrath", item_type: "Quiver", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Thief's Torment", item_type: "Ring", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "poison-pathfinder",
            name: "Poison Pathfinder",
            slug: "poison-pathfinder",
            class_name: "Pathfinder",
            base_class: "Ranger",
            primary_playstyle: "ranged",
            damage_type: "chaos",
            tags: ["ranged", "poison", "chaos", "dot", "flask"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 8,
            complexity: 2,
            description: "Stack poisons on enemies for devastating DoT damage. Pathfinder enhances flask effects and poison application.",
            pros: [
                "Great league starter",
                "Poison stacks infinitely",
                "Flask uptime is excellent",
                "Good scaling"
            ],
            cons: [
                "DoT damage takes time",
                "Need poison chance investment",
                "Chaos res enemies are annoying"
            ],
            playstyle_notes: "Apply poisons rapidly and let them stack. Keep flasks active for bonuses.",
            leveling_notes: "Poison skills available early. Focus on attack speed and poison chance.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Poison works on self-found gear.",
                    upgrade_notes: "Get chaos damage weapons.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "attack speed": 1.3, "chaos damage": 20 } },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "quiver", item_name: "Asphyxia's Wrath", item_type: "Quiver", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },

        // ========== HUNTRESS BUILDS ==========
        {
            id: "spear-amazon",
            name: "Elemental Spear Amazon",
            slug: "spear-amazon",
            class_name: "Amazon",
            base_class: "Huntress",
            primary_playstyle: "melee",
            damage_type: "lightning",
            tags: ["melee", "spear", "lightning", "elemental", "critical"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 2,
            description: "Infuse your spear with elemental power. Amazon exploits weaknesses and enhances critical strikes for high burst damage.",
            pros: [
                "High critical damage",
                "Elemental infusion is versatile",
                "Good reach with spears",
                "Exploit mechanics are strong"
            ],
            cons: [
                "Need crit investment",
                "Less tanky than warriors",
                "Requires positioning"
            ],
            playstyle_notes: "Use elemental infusion to adapt to enemies. Focus on critical strikes for big damage.",
            leveling_notes: "Spear skills available from start. Lightning infusion works well.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Spear builds work with basic gear.",
                    upgrade_notes: "Get a good elemental spear.",
                    items: [
                        { slot: "weapon", item_name: "Chainsting", item_type: "Spear", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Consistent crits with good elemental damage.",
                    upgrade_notes: "Get lightning damage items.",
                    items: [
                        { slot: "weapon", item_name: "Daevata's Wind", item_type: "Spear", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Lightning Coil", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Thunderfist", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Hinekora's Sight", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },

        // ========== MERCENARY BUILDS ==========
        {
            id: "crossbow-witchhunter",
            name: "Rapid Crossbow Witchhunter",
            slug: "crossbow-witchhunter",
            class_name: "Witchhunter",
            base_class: "Mercenary",
            primary_playstyle: "ranged",
            damage_type: "physical",
            tags: ["ranged", "crossbow", "physical", "fast-mapper", "league-start"],
            mapping_score: 9,
            bossing_score: 7,
            league_start_score: 9,
            complexity: 1,
            description: "Rapid-fire crossbow build. Witchhunter provides anti-magic bonuses and weapon set flexibility for a versatile combat style.",
            pros: [
                "Excellent league starter",
                "Fast clear speed",
                "Simple gameplay",
                "Two weapon sets"
            ],
            cons: [
                "Reload management",
                "Can be squishy",
                "Ammo awareness"
            ],
            playstyle_notes: "Burst down packs with rapid fire. Use mobility skills to stay safe.",
            leveling_notes: "Crossbow skills from act 1. Very smooth progression.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Excellent self-found build.",
                    upgrade_notes: "Get a higher damage crossbow.",
                    items: [
                        { slot: "weapon", item_name: "Mist Whisper", item_type: "Crossbow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Fast and deadly mapping build.",
                    upgrade_notes: "Get Double Vision for extra projectiles.",
                    items: [
                        { slot: "weapon", item_name: "Double Vision", item_type: "Crossbow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Cospri's Will", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Bushwhack", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "artillery-tactician",
            name: "Artillery Tactician",
            slug: "artillery-tactician",
            class_name: "Tactician",
            base_class: "Mercenary",
            primary_playstyle: "ranged",
            damage_type: "physical",
            tags: ["ranged", "crossbow", "support", "banner", "aoe"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 2,
            description: "Rain arrows from above and support with banners. Tactician uses elite skills to control the battlefield.",
            pros: [
                "Great AoE coverage",
                "Banners buff allies",
                "Strong defensive options",
                "Good for groups"
            ],
            cons: [
                "More setup required",
                "Need to place banners",
                "Positioning matters"
            ],
            playstyle_notes: "Place banners strategically. Use artillery skills to clear large areas.",
            leveling_notes: "Crossbow and banner skills unlock through campaign.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Works with basic crossbow gear.",
                    upgrade_notes: "Get artillery crossbow.",
                    items: [
                        { slot: "weapon", item_name: "Fairgraves' Curse", item_type: "Crossbow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },

        // ========== MONK BUILDS ==========
        {
            id: "chaos-acolyte",
            name: "Chaos Strike Acolyte of Chayula",
            slug: "chaos-acolyte",
            class_name: "Acolyte of Chayula",
            base_class: "Monk",
            primary_playstyle: "melee",
            damage_type: "chaos",
            tags: ["melee", "chaos", "darkness", "quarterstaff", "volatility"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 6,
            complexity: 3,
            description: "Harness darkness and chaos. The Acolyte trades Spirit for an extra defensive layer and deals massive chaos damage through volatility.",
            pros: [
                "Massive chaos damage",
                "Unique darkness mechanic",
                "Good boss killer",
                "Interesting playstyle"
            ],
            cons: [
                "Complex mechanics",
                "Spirit management",
                "Learning curve"
            ],
            playstyle_notes: "Build volatility stacks for big damage. Use darkness mechanic for defense. Manage your spirit carefully.",
            leveling_notes: "Start with basic monk attacks. Chaos skills unlock later.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Functional chaos build with good damage.",
                    upgrade_notes: "Get chaos damage quarterstaves.",
                    items: [
                        { slot: "weapon", item_name: "Blood Thorn", item_type: "Quarterstaff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Ghostwrithe", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 },
                        { slot: "jewel1", item_name: "Undying Hate", item_type: "Jewel", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "elemental-invoker",
            name: "Elemental Invoker",
            slug: "elemental-invoker",
            class_name: "Invoker",
            base_class: "Monk",
            primary_playstyle: "hybrid",
            damage_type: "lightning",
            tags: ["hybrid", "elemental", "spell", "attack", "avatar"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 7,
            complexity: 2,
            description: "Combine attacks and spells with elemental power. Invoker can become an Unbound Avatar for increased elemental damage.",
            pros: [
                "Flexible hybrid playstyle",
                "Avatar form is powerful",
                "Elemental versatility",
                "Good at applying ailments"
            ],
            cons: [
                "Jack of all trades",
                "Needs balanced gear",
                "Avatar management"
            ],
            playstyle_notes: "Weave attacks and spells together. Use Avatar form for burst damage phases.",
            leveling_notes: "Monk skills from start. Elemental attacks work well.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Hybrid builds work on basic gear.",
                    upgrade_notes: "Get elemental damage staff.",
                    items: [
                        { slot: "weapon", item_name: "Matsya", item_type: "Quarterstaff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Strong elemental hybrid with good uptime.",
                    upgrade_notes: "Get elemental damage body armour.",
                    items: [
                        { slot: "weapon", item_name: "Pillar of the Caged God", item_type: "Quarterstaff", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Lightning Coil", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Thunderfist", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                }
            ]
        }
    ],

    /**
     * Get archetype by ID
     */
    getArchetype(id) {
        return this.ARCHETYPES.find(a => a.id === id);
    },

    /**
     * Get all archetypes
     */
    getAllArchetypes() {
        return this.ARCHETYPES;
    },

    /**
     * Filter archetypes based on criteria
     */
    filterArchetypes(filters) {
        return this.ARCHETYPES.filter(arch => {
            // Class filter
            if (filters.class && filters.class !== 'any') {
                if (arch.base_class?.toLowerCase() !== filters.class.toLowerCase()) {
                    return false;
                }
            }

            // Playstyle filter
            if (filters.playstyle && filters.playstyle !== 'any') {
                if (arch.primary_playstyle !== filters.playstyle) {
                    return false;
                }
            }

            // Damage type filter
            if (filters.damage_type && filters.damage_type !== 'any') {
                if (arch.damage_type !== filters.damage_type) {
                    return false;
                }
            }

            // Budget filter
            if (filters.budget) {
                const budgetTier = this.BUDGET_TIERS[filters.budget];
                if (budgetTier) {
                    const hasTier = arch.tiers.some(t =>
                        t.min_budget <= budgetTier.max &&
                        (t.max_budget >= budgetTier.min || !t.max_budget)
                    );
                    if (!hasTier) return false;
                }
            }

            // Complexity filter based on experience
            if (filters.experience) {
                const maxComplexity = this.EXPERIENCE_COMPLEXITY[filters.experience] || 3;
                if (arch.complexity > maxComplexity) {
                    return false;
                }
            }

            return true;
        });
    },

    /**
     * Search archetypes by query
     */
    searchArchetypes(query) {
        if (!query) return this.ARCHETYPES;

        const lowerQuery = query.toLowerCase();
        return this.ARCHETYPES.filter(arch =>
            arch.name.toLowerCase().includes(lowerQuery) ||
            arch.class_name.toLowerCase().includes(lowerQuery) ||
            arch.base_class?.toLowerCase().includes(lowerQuery) ||
            arch.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            arch.description.toLowerCase().includes(lowerQuery)
        );
    },

    /**
     * Get interview questions
     */
    getInterviewQuestions() {
        return this.INTERVIEW_QUESTIONS;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Data;
}
