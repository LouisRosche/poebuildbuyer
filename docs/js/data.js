/**
 * Data module - embedded archetypes and interview questions
 * This replaces the backend database for the static version
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
                { value: "witch", label: "Witch" },
                { value: "sorceress", label: "Sorceress" },
                { value: "ranger", label: "Ranger" },
                { value: "mercenary", label: "Mercenary" },
                { value: "monk", label: "Monk" },
                { value: "warrior", label: "Warrior" }
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
                { value: "both", label: "Balanced - both mapping and bossing" },
                { value: "league_mechanics", label: "League mechanics (delve, heist, etc.)" }
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
                { value: "glass_cannon", label: "Glass cannon - Max damage, deaths are fine" },
                { value: "balanced", label: "Balanced - Some defense, good damage" },
                { value: "tanky", label: "Tanky - I hate dying, willing to sacrifice damage" },
                { value: "immortal", label: "Near-immortal - I want to AFK in boss fights" }
            ],
            weight: 1.0
        },
        {
            id: "clear_speed",
            question: "How important is clear speed?",
            type: "select",
            required: false,
            options: [
                { value: "slow", label: "Slow and steady - I take my time" },
                { value: "moderate", label: "Moderate - Comfortable pace" },
                { value: "fast", label: "Fast - Gotta go fast" },
                { value: "zoom", label: "Zoom zoom - Speed is everything" }
            ],
            weight: 0.8
        },
        {
            id: "existing_gear",
            question: "Do you have any valuable items you want to build around?",
            type: "text",
            required: false,
            placeholder: "e.g., 'Headhunter', 'Mageblood', or leave blank",
            weight: 0.5
        },
        {
            id: "avoid",
            question: "Anything you want to avoid?",
            type: "multiselect",
            required: false,
            options: [
                { value: "piano", label: "Piano builds (many buttons to press)" },
                { value: "minions", label: "Minion/summon builds" },
                { value: "dot", label: "Damage over time builds" },
                { value: "melee", label: "Melee combat" },
                { value: "channeling", label: "Channeling skills" },
                { value: "totems", label: "Totem builds" }
            ],
            weight: 1.5
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

    // Build archetypes with budget tiers
    ARCHETYPES: [
        {
            id: "blackflame-blood-mage",
            name: "Blackflame Chaos Fire Blood Mage",
            slug: "blackflame-blood-mage",
            class_name: "Blood Mage",
            primary_playstyle: "spell",
            damage_type: "chaos",
            tags: ["dot", "chaos", "tanky", "boss-killer", "blood-magic"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 4,
            complexity: 2,
            description: "Converts fire damage to chaos via the Blackflame mechanic. Excellent boss damage with strong sustain from blood magic. Scales extremely well with investment.",
            pros: [
                "Exceptional single target damage",
                "Great sustain through life leech",
                "Chaos damage bypasses enemy resistances",
                "Very tanky with proper gear"
            ],
            cons: [
                "Expensive to min-max",
                "Not the fastest mapper",
                "Requires specific uniques to function"
            ],
            playstyle_notes: "Focus on maintaining your damage over time effects on bosses. Use your life pool as a resource - the blood magic mechanic gives you incredible sustain.",
            leveling_notes: "Level as generic fire spells until you can transition to chaos conversion in maps.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 1000,
                    description: "Entry-level version that can clear yellow maps comfortably.",
                    upgrade_notes: "Prioritize getting Rathpith Globe and Kaom's Heart next.",
                    items: [
                        { slot: "weapon", item_name: "Obliteration", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Rare Focus", item_type: "Focus", is_unique: false, priority: 2, min_stats: { life: 50, "spell damage": 20 } },
                        { slot: "body", item_name: "Cloak of Flame", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "helmet", item_name: "Goldrim", item_type: "Helmet", is_unique: true, priority: 3 },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 3 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 },
                        { slot: "amulet", item_name: "Atziri's Foible", item_type: "Amulet", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 3 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 1000,
                    max_budget: 10000,
                    description: "Comfortable red map farming with good boss damage.",
                    upgrade_notes: "Focus on getting Atziri's Acuity and better jewels.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1, min_stats: { "+# to Level of all Spell Skill Gems": 2, "spell damage": 80 } },
                        { slot: "offhand", item_name: "Rathpith Globe", item_type: "Sacred Focus", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Kaom's Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2, min_stats: { life: 80, resistances: 60 } },
                        { slot: "gloves", item_name: "Atziri's Acuity", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Stone of Lazhwar", item_type: "Amulet", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Snakepit", item_type: "Ring", is_unique: true, priority: 2 },
                        { slot: "ring2", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 2 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Undying Hate", item_type: "Jewel", is_unique: true, priority: 1, variant: "Tecrod" },
                        { slot: "jewel2", item_name: "Heart of the Well", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: 100000,
                    description: "Full power version capable of all content including Uber bosses.",
                    upgrade_notes: "Min-max rare items with double influenced mods.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1, min_stats: { "+# to Level of all Spell Skill Gems": 3, "spell damage": 120, "chaos damage": 40 } },
                        { slot: "offhand", item_name: "Rathpith Globe", item_type: "Sacred Focus", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Kaom's Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Veil of the Night", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "gloves", item_name: "Atziri's Acuity", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Stone of Lazhwar", item_type: "Amulet", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Snakepit", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "ring2", item_name: "Kalandra's Touch", item_type: "Ring", is_unique: true, priority: 2 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Undying Hate", item_type: "Jewel", is_unique: true, priority: 1, variant: "Tecrod" },
                        { slot: "jewel2", item_name: "Heart of the Well", item_type: "Jewel", is_unique: true, priority: 1 },
                        { slot: "jewel3", item_name: "From Nothing", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "summon-army-necromancer",
            name: "Summon Army Necromancer",
            slug: "summon-army-necromancer",
            class_name: "Necromancer",
            primary_playstyle: "minion",
            damage_type: "physical",
            tags: ["minion", "summoner", "tanky", "league-start", "low-button"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 9,
            complexity: 1,
            description: "Classic summoner build using multiple minion types. Very safe playstyle with minions doing all the work. Great for new players.",
            pros: [
                "Extremely safe playstyle",
                "Great league starter",
                "Low button count - minions do the work",
                "Good scaling with investment"
            ],
            cons: [
                "Minion AI can be frustrating",
                "Not the fastest clear speed",
                "Socket pressure for all minion gems"
            ],
            playstyle_notes: "Summon your army and let them do the work. Focus on positioning and buffing your minions. Use convocation to recall minions when needed.",
            leveling_notes: "Start with Raise Zombie from level 1. Add spectres and skeletons as you progress.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Can be started with zero currency. Self-found viable.",
                    upgrade_notes: "Get Bones of Ullr and The Baron as first upgrades.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 2, min_stats: { "minion damage": 30 } },
                        { slot: "offhand", item_name: "Rare Shield", item_type: "Shield", is_unique: false, priority: 3 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 2, min_stats: { life: 60 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2 },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 3 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 },
                        { slot: "amulet", item_name: "Sidhebreath", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Solid yellow map farmer with room to grow.",
                    upgrade_notes: "Next priority is Vis Mortis for extra spectre.",
                    items: [
                        { slot: "weapon", item_name: "Cerberus Limb", item_type: "Sceptre", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Advancing Fortress", item_type: "Tower Shield", is_unique: true, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "The Baron", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Grip of the Council", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Bones of Ullr", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Sidhebreath", item_type: "Amulet", is_unique: true, priority: 2 },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 2 },
                        { slot: "jewel1", item_name: "Violent Dead", item_type: "Jewel", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "Comfortable in all content with strong minion army.",
                    upgrade_notes: "Focus on getting better rare gear and cluster jewels.",
                    items: [
                        { slot: "weapon", item_name: "Cerberus Limb", item_type: "Sceptre", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Advancing Fortress", item_type: "Tower Shield", is_unique: true, priority: 2 },
                        { slot: "body", item_name: "Vis Mortis", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "The Baron", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Grip of the Council", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Bones of Ullr", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Astramentis", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 2, min_stats: { strength: 40, life: 50 } },
                        { slot: "belt", item_name: "Darkness Enthroned", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Violent Dead", item_type: "Jewel", is_unique: true, priority: 1 },
                        { slot: "jewel2", item_name: "Anatomical Knowledge", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "lightning-arrow-deadeye",
            name: "Lightning Arrow Deadeye",
            slug: "lightning-arrow-deadeye",
            class_name: "Ranger",
            primary_playstyle: "ranged",
            damage_type: "lightning",
            tags: ["bow", "fast-mapper", "speed", "projectile", "screen-clear"],
            mapping_score: 10,
            bossing_score: 5,
            league_start_score: 6,
            complexity: 2,
            description: "Extremely fast map clearer using Lightning Arrow. Excels at zooming through maps but requires investment for boss damage.",
            pros: [
                "Top tier clear speed",
                "Satisfying screen-wide explosions",
                "Great for farming currency",
                "Very mobile playstyle"
            ],
            cons: [
                "Mediocre single target without investment",
                "Somewhat squishy",
                "Requires good positioning"
            ],
            playstyle_notes: "Zoom through maps firing arrows. Use movement skills liberally. Swap to single target setup for bosses if needed.",
            leveling_notes: "Level with caustic arrow or rain of arrows until you get proper lightning arrow scaling.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 1000,
                    description: "Functional mapper for yellow/early red maps.",
                    upgrade_notes: "Priority is getting a good bow and Hyrri's Ire.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "physical damage": 200, "attack speed": 1.4 } },
                        { slot: "body", item_name: "Queen of the Forest", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "helmet", item_name: "Rat's Nest", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "gloves", item_name: "Shadows and Dust", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Seven-League Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Ngamahu's Sign", item_type: "Amulet", is_unique: true, priority: 3 },
                        { slot: "ring1", item_name: "Call of the Brotherhood", item_type: "Ring", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 1000,
                    max_budget: 10000,
                    description: "Fast and comfortable in all maps.",
                    upgrade_notes: "Get a Headhunter or Mageblood for ultimate speed.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "physical damage": 400, "critical strike chance": 7 } },
                        { slot: "body", item_name: "Queen of the Forest", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rat's Nest", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Shadows and Dust", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Seven-League Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Xoph's Blood", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Call of the Brotherhood", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "ring2", item_name: "Call of the Brotherhood", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Ryslatha's Coil", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Grand Spectrum", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: null,
                    description: "Maximum zoom. Headhunter-powered mapping machine.",
                    upgrade_notes: "Mirror-tier bow and double-influenced gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "physical damage": 600, "critical strike chance": 9, "attack speed": 1.6 } },
                        { slot: "body", item_name: "Queen of the Forest", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { life: 100, "critical strike multiplier": 30 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 12, accuracy: 300 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 35, life: 80 } },
                        { slot: "amulet", item_name: "Xoph's Blood", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Call of the Brotherhood", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "ring2", item_name: "Call of the Brotherhood", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Headhunter", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Grand Spectrum", item_type: "Jewel", is_unique: true, priority: 1 },
                        { slot: "jewel2", item_name: "Grand Spectrum", item_type: "Jewel", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "cyclone-slayer",
            name: "Cyclone Slayer",
            slug: "cyclone-slayer",
            class_name: "Slayer",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "channeling", "leech", "tanky", "boss-killer", "league-start"],
            mapping_score: 7,
            bossing_score: 8,
            league_start_score: 8,
            complexity: 1,
            description: "Spin to win! Classic cyclone build with incredible life leech and sustain. Very tanky and satisfying playstyle.",
            pros: [
                "Extremely tanky with overleech",
                "Great league starter",
                "Simple one-button gameplay",
                "Good at all content"
            ],
            cons: [
                "Melee range can be dangerous",
                "Clear speed is good but not top tier",
                "Can feel slow early"
            ],
            playstyle_notes: "Hold down cyclone and spin through everything. The slayer leech makes you very hard to kill. Focus on keeping flasks up.",
            leveling_notes: "Can use cyclone from act 1. Very smooth leveling experience.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Self-found viable. Works with any two-handed weapon.",
                    upgrade_notes: "Get Belly of the Beast and a better weapon.",
                    items: [
                        { slot: "weapon", item_name: "Rare Two-Handed Sword", item_type: "Sword", is_unique: false, priority: 1, min_stats: { "physical damage": 300 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 2, min_stats: { life: 80 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 3 },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 3 },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2, min_stats: { "movement speed": 25 } },
                        { slot: "amulet", item_name: "Carnage Heart", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Comfortable mapping and can do most bosses.",
                    upgrade_notes: "Priority is Starkonja's Head and better rings.",
                    items: [
                        { slot: "weapon", item_name: "Rare Two-Handed Sword", item_type: "Sword", is_unique: false, priority: 1, min_stats: { "physical damage": 450, "attack speed": 1.6 } },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "gloves", item_name: "Maligaro's Virtuosity", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Kaom's Roots", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Carnage Heart", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Le Heup of All", item_type: "Ring", is_unique: true, priority: 3 },
                        { slot: "ring2", item_name: "Thief's Torment", item_type: "Ring", is_unique: true, priority: 2 },
                        { slot: "jewel1", item_name: "Conqueror's Efficiency", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 10000,
                    description: "Can do all content comfortably including endgame bosses.",
                    upgrade_notes: "Look for Headhunter for mapping or focus on rare influenced gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Two-Handed Sword", item_type: "Sword", is_unique: false, priority: 1, min_stats: { "physical damage": 600, "critical strike chance": 7 } },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 10, life: 70, accuracy: 200 } },
                        { slot: "boots", item_name: "Kaom's Roots", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Carnage Heart", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Mark of the Elder", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "ring2", item_name: "Mark of the Shaper", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Ryslatha's Coil", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "jewel1", item_name: "Conqueror's Efficiency", item_type: "Jewel", is_unique: true, priority: 1 },
                        { slot: "jewel2", item_name: "Conqueror's Potency", item_type: "Jewel", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "ice-nova-hierophant",
            name: "Ice Nova Hierophant",
            slug: "ice-nova-hierophant",
            class_name: "Witch",
            primary_playstyle: "spell",
            damage_type: "cold",
            tags: ["spell", "cold", "freeze", "fast-mapper", "coc"],
            mapping_score: 9,
            bossing_score: 7,
            league_start_score: 3,
            complexity: 3,
            description: "Cast on Crit Ice Nova build. Freezes everything on screen with satisfying shatters. Requires specific gear to function.",
            pros: [
                "Excellent clear with screen-wide freezes",
                "Very safe due to freezing enemies",
                "Satisfying shatter sounds",
                "Great damage scaling"
            ],
            cons: [
                "Expensive to start",
                "Complex mechanics to understand",
                "Requires specific unique combinations"
            ],
            playstyle_notes: "Use cyclone to trigger your spells automatically. Position yourself to hit maximum enemies. The freezing provides excellent defense.",
            leveling_notes: "Level as self-cast freezing pulse or arc. Transition to CoC once you have the required gear and attack speed.",
            tiers: [
                {
                    tier_name: "Entry",
                    tier_order: 2,
                    min_budget: 500,
                    max_budget: 2000,
                    description: "Minimum viable CoC setup. Can clear maps but needs upgrades.",
                    upgrade_notes: "Get Cospri's Malice and better crit gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sword", item_type: "Sword", is_unique: false, priority: 1, min_stats: { "critical strike chance": 8, "attack speed": 1.8 } },
                        { slot: "offhand", item_name: "Lycosidae", item_type: "Buckler", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Carcass Jack", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2, min_stats: { "critical strike chance": 1, life: 70 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 2, min_stats: { "attack speed": 8, accuracy: 200 } },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Ungil's Harmony", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 2000,
                    max_budget: 20000,
                    description: "Smooth gameplay with good damage and survivability.",
                    upgrade_notes: "Look for Awakened gems and influenced gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sword", item_type: "Sword", is_unique: false, priority: 1, min_stats: { "critical strike chance": 9, "attack speed": 2.0, "cold damage": 50 } },
                        { slot: "offhand", item_name: "Rare Shield", item_type: "Shield", is_unique: false, priority: 1, min_stats: { "spell critical strike chance": 80, life: 80 } },
                        { slot: "body", item_name: "Carcass Jack", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Crown of Eyes", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 12, accuracy: 350, life: 60 } },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Ungil's Harmony", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Dream Fragments", item_type: "Ring", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Belt of the Deceiver", item_type: "Belt", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "explosive-arrow-elementalist",
            name: "Explosive Arrow Elementalist",
            slug: "explosive-arrow-elementalist",
            class_name: "Witch",
            primary_playstyle: "ranged",
            damage_type: "fire",
            tags: ["bow", "fire", "ignite", "dot", "league-start", "boss-killer"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 9,
            complexity: 2,
            description: "Stack explosive arrows on enemies for massive ignite damage. Incredible boss damage on a budget. Top tier league starter.",
            pros: [
                "Exceptional boss damage",
                "Very budget friendly",
                "Great league starter",
                "Scales well with investment"
            ],
            cons: [
                "Delayed damage playstyle",
                "Clear speed is okay but not amazing",
                "Requires understanding of fuse mechanics"
            ],
            playstyle_notes: "Stack 20 fuses on enemies then watch them explode. Use ballista totems for bosses to maximize fuse stacking. The ignite lasts long enough to keep moving.",
            leveling_notes: "Can level with explosive arrow from level 28. Very smooth progression.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Can kill all bosses on basically no budget.",
                    upgrade_notes: "Get Dyadian Dawn belt and a 6-link.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "attack speed": 1.5 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 2, min_stats: { life: 80 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2, min_stats: { life: 60, resistances: 40 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 2, min_stats: { "attack speed": 5 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2, min_stats: { "movement speed": 25, life: 50 } },
                        { slot: "amulet", item_name: "Rare Amulet", item_type: "Amulet", is_unique: false, priority: 2 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Comfortable in all content with great boss damage.",
                    upgrade_notes: "Look for Polaric Devastation and better cluster jewels.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "attack speed": 1.7, "+# to Level of Socketed Bow Gems": 1 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1, min_stats: { life: 100, resistances: 60 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { life: 80, resistances: 50 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 2, min_stats: { "attack speed": 8, life: 60 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 30, life: 70 } },
                        { slot: "amulet", item_name: "Atziri's Foible", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Dyadian Dawn", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 2, min_stats: { life: 50, resistances: 60 } }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 10000,
                    description: "Melts all bosses including Uber versions.",
                    upgrade_notes: "Focus on getting +gem level bow and influenced gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "attack speed": 1.8, "+# to Level of Socketed Bow Gems": 3 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1, min_stats: { life: 120, resistances: 80, "+# to Level of Socketed Gems": 1 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { life: 100, "burning damage": 20 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 10, life: 70, "fire damage over time multiplier": 15 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 35, life: 90 } },
                        { slot: "amulet", item_name: "Atziri's Foible", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Dyadian Dawn", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Pyre", item_type: "Ring", is_unique: true, priority: 2 },
                        { slot: "ring2", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 1, min_stats: { life: 70, "fire damage over time multiplier": 10 } }
                    ]
                }
            ]
        },
        {
            id: "righteous-fire-juggernaut",
            name: "Righteous Fire Juggernaut",
            slug: "righteous-fire-juggernaut",
            class_name: "Warrior",
            primary_playstyle: "spell",
            damage_type: "fire",
            tags: ["dot", "fire", "tanky", "immortal", "low-button", "league-start", "walking-simulator"],
            mapping_score: 7,
            bossing_score: 6,
            league_start_score: 8,
            complexity: 1,
            description: "Walk around and burn everything. Extremely tanky with minimal button pressing. Great for relaxed gameplay.",
            pros: [
                "Almost unkillable with proper gear",
                "One button gameplay",
                "Great for HC",
                "Relaxing playstyle"
            ],
            cons: [
                "Slower clear than meta builds",
                "Requires regen/life recovery to sustain",
                "Boss damage is okay but not spectacular"
            ],
            playstyle_notes: "Just walk around. RF damages enemies in an area around you. Use Fire Trap for extra single target. Focus on maintaining life recovery.",
            leveling_notes: "Level with ground slam or other melee skills. Switch to RF once you have enough life regen in early maps.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Functional RF that can sustain itself.",
                    upgrade_notes: "Get Rise of the Phoenix and life regen gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 2, min_stats: { "fire damage": 20 } },
                        { slot: "offhand", item_name: "Rise of the Phoenix", item_type: "Kite Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1, min_stats: { life: 100 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2, min_stats: { life: 80, "fire resistance": 30 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 3, min_stats: { life: 60 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2, min_stats: { "movement speed": 25, life: 60 } }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Very comfortable sustain with good damage.",
                    upgrade_notes: "Look for Pyre ring and better regen gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 1, min_stats: { "fire damage over time multiplier": 20, "+# to Level of all Fire Spell Skill Gems": 1 } },
                        { slot: "offhand", item_name: "Rise of the Phoenix", item_type: "Kite Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Kaom's Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { life: 100, "burning damage": 25 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 2, min_stats: { life: 80, "fire resistance": 30 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 30, life: 80 } },
                        { slot: "amulet", item_name: "Xoph's Blood", item_type: "Amulet", is_unique: true, priority: 2 },
                        { slot: "ring1", item_name: "Pyre", item_type: "Ring", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "tornado-shot-deadeye",
            name: "Tornado Shot Deadeye",
            slug: "tornado-shot-deadeye",
            class_name: "Ranger",
            primary_playstyle: "ranged",
            damage_type: "physical",
            tags: ["bow", "fast-mapper", "projectile", "speed", "expensive"],
            mapping_score: 10,
            bossing_score: 6,
            league_start_score: 2,
            complexity: 2,
            description: "The ultimate mapping build. Tornado Shot with good gear covers the entire screen. Requires significant investment.",
            pros: [
                "Best-in-class clear speed",
                "Extremely satisfying gameplay",
                "Screen-wide coverage",
                "Scales infinitely with investment"
            ],
            cons: [
                "Very expensive to feel good",
                "Bad league starter",
                "Squishy without investment",
                "Mediocre single target"
            ],
            playstyle_notes: "Fire tornado shot and watch everything die. Use additional projectiles and chain/fork for maximum coverage. Requires good positioning.",
            leveling_notes: "Do NOT league start this. Level as something else and transition once you have 50+ divines.",
            tiers: [
                {
                    tier_name: "Entry",
                    tier_order: 3,
                    min_budget: 5000,
                    max_budget: 20000,
                    description: "Minimum viable TS. Feels okay but not great.",
                    upgrade_notes: "Save for Mageblood or Headhunter.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "physical damage": 450, "critical strike chance": 8 } },
                        { slot: "body", item_name: "Queen of the Forest", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { "tornado shot projectiles": 2 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 10, accuracy: 300 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 35 } },
                        { slot: "amulet", item_name: "Xoph's Blood", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "ring1", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 1, min_stats: { life: 50, "critical strike multiplier": 20 } },
                        { slot: "belt", item_name: "Ryslatha's Coil", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 20000,
                    max_budget: null,
                    description: "Full power TS. Obliterates maps.",
                    upgrade_notes: "Mirror-tier bow and perfect influenced rares.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1, min_stats: { "physical damage": 700, "critical strike chance": 10, "attack speed": 1.7 } },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1, min_stats: { life: 120, "critical strike chance": 1.5, "additional curse": 1 } },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1, min_stats: { "tornado shot projectiles": 3, life: 80 } },
                        { slot: "gloves", item_name: "Rare Gloves", item_type: "Gloves", is_unique: false, priority: 1, min_stats: { "attack speed": 14, accuracy: 400, "critical strike multiplier": 25 } },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1, min_stats: { "movement speed": 35, tailwind: true } },
                        { slot: "amulet", item_name: "Rare Amulet", item_type: "Amulet", is_unique: false, priority: 1, min_stats: { "+# to Level of all Skill Gems": 1, "critical strike multiplier": 40 } },
                        { slot: "ring1", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 1, min_stats: { life: 60, "critical strike multiplier": 30, accuracy: 200 } },
                        { slot: "ring2", item_name: "Rare Ring", item_type: "Ring", is_unique: false, priority: 1, min_stats: { life: 60, "critical strike multiplier": 30 } },
                        { slot: "belt", item_name: "Headhunter", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "venom-gyre-pathfinder",
            name: "Venom Gyre Poison Pathfinder",
            slug: "venom-gyre-pathfinder",
            class_name: "Pathfinder",
            primary_playstyle: "melee",
            damage_type: "chaos",
            tags: ["poison", "chaos", "fast-mapper", "league-start", "attack"],
            mapping_score: 10,
            bossing_score: 6,
            league_start_score: 8,
            complexity: 2,
            description: "Blazing fast mapper using Venom Gyre's whirling blades to spread poison everywhere. Pathfinder provides excellent flask sustain and poison proliferation.",
            pros: [
                "Extremely fast clear speed",
                "Great league starter",
                "Flask sustain is incredible",
                "Very satisfying playstyle"
            ],
            cons: [
                "Lower single target than pure boss killers",
                "Requires good flask management",
                "Can feel squishy without investment"
            ],
            playstyle_notes: "Whirl through packs, throwing returning blades. The poison stacks melt everything. Use Whirling Blades to zoom between packs.",
            leveling_notes: "Level with Poisonous Concoction or Venom Gyre from act 1. Very smooth leveling experience.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Self-found viable with rare gear.",
                    upgrade_notes: "Get Wasp Nest claws as first priority.",
                    items: [
                        { slot: "weapon", item_name: "Wasp Nest", item_type: "Claw", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Wasp Nest", item_type: "Claw", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Fast T16 mapper with solid damage.",
                    upgrade_notes: "Next upgrade is Dendrobate for more poison damage.",
                    items: [
                        { slot: "weapon", item_name: "Wasp Nest", item_type: "Claw", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Wasp Nest", item_type: "Claw", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Dendrobate", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Impresence", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "detonate-dead-necromancer",
            name: "Detonate Dead Ignite Necromancer",
            slug: "detonate-dead-necromancer",
            class_name: "Necromancer",
            primary_playstyle: "spell",
            damage_type: "fire",
            tags: ["ignite", "fire", "tanky", "boss-killer", "corpse"],
            mapping_score: 7,
            bossing_score: 9,
            league_start_score: 7,
            complexity: 2,
            description: "Explode corpses for massive ignite damage. Necromancer's corpse manipulation makes it easy to scale. Excellent boss killer that can facetank.",
            pros: [
                "Incredible boss damage",
                "Very tanky with block",
                "Corpse explosions chain nicely",
                "Good league starter"
            ],
            cons: [
                "Requires desecrate for corpses",
                "Slower mapper than projectile builds",
                "Two-button playstyle"
            ],
            playstyle_notes: "Cast Desecrate to create corpses, then Detonate Dead to ignite. The ignite damage scales with corpse life.",
            leveling_notes: "Level with Armageddon Brand or Cremation until you can transition to DD.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Functions well on rare gear.",
                    upgrade_notes: "Get Corpsewalker boots for auto-corpse generation.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 2 },
                        { slot: "offhand", item_name: "Rare Shield", item_type: "Shield", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable with great survivability.",
                    upgrade_notes: "Awakened gems and better rare gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Aegis Aurora", item_type: "Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Brass Dome", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2 },
                        { slot: "boots", item_name: "Corpsewalker", item_type: "Boots", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Ashes of the Stars", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "arc-elementalist",
            name: "Arc Chain Lightning Elementalist",
            slug: "arc-elementalist",
            class_name: "Elementalist",
            primary_playstyle: "spell",
            damage_type: "lightning",
            tags: ["lightning", "spell", "league-start", "fast-mapper", "shock"],
            mapping_score: 9,
            bossing_score: 6,
            league_start_score: 9,
            complexity: 1,
            description: "Classic Arc build that chains lightning between enemies. Elementalist provides huge elemental damage and shock effect. Great for new players.",
            pros: [
                "Excellent for beginners",
                "Chains clear entire screens",
                "Shock amplifies damage",
                "Cheap to start"
            ],
            cons: [
                "Falls off in deep endgame",
                "Single target is mediocre",
                "Needs mana management"
            ],
            playstyle_notes: "Cast Arc and watch it chain through packs. Shock enhances all your damage. Stay mobile and kite tough enemies.",
            leveling_notes: "Arc available from level 12. Use Spark before that. Very straightforward leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Works great on self-found gear.",
                    upgrade_notes: "Get Storm's Gift gloves for clear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Stone of Lazhwar", item_type: "Amulet", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Smooth T16 mapper.",
                    upgrade_notes: "Get Inpulsa's for explosions.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Rare Shield", item_type: "Shield", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Inpulsa's Broken Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Storm's Gift", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "boneshatter-juggernaut",
            name: "Boneshatter Stun Juggernaut",
            slug: "boneshatter-juggernaut",
            class_name: "Juggernaut",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "physical", "tanky", "stun", "boss-killer"],
            mapping_score: 6,
            bossing_score: 9,
            league_start_score: 7,
            complexity: 2,
            description: "Smash enemies with devastating strikes that stun-lock bosses. Juggernaut provides unmatched tankiness. Self-damage converted to more power.",
            pros: [
                "Extremely tanky",
                "Stun-locks most bosses",
                "Great damage scaling",
                "Satisfying melee combat"
            ],
            cons: [
                "Slower clear speed",
                "Self-damage needs management",
                "Melee range is risky"
            ],
            playstyle_notes: "Build trauma stacks to increase damage. The self-damage is mitigated by Juggernaut's defenses. Stun everything.",
            leveling_notes: "Level with Ground Slam or Sunder. Boneshatter available at level 28.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Tanky from the start.",
                    upgrade_notes: "Get a good two-handed mace.",
                    items: [
                        { slot: "weapon", item_name: "Tidebreaker", item_type: "Mace", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable, stun-locks Uber bosses.",
                    upgrade_notes: "Get a crafted mace with higher DPS.",
                    items: [
                        { slot: "weapon", item_name: "Rare Mace", item_type: "Mace", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Brass Dome", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Abyssus", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Ralakesh's Impatience", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Aul's Uprising", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "ice-shot-deadeye",
            name: "Ice Shot Cold Deadeye",
            slug: "ice-shot-deadeye",
            class_name: "Deadeye",
            primary_playstyle: "ranged",
            damage_type: "cold",
            tags: ["cold", "bow", "fast-mapper", "ranged", "freeze"],
            mapping_score: 10,
            bossing_score: 5,
            league_start_score: 5,
            complexity: 2,
            description: "Freeze entire screens with cold projectiles that shatter enemies. Deadeye's chaining and piercing amplify clear speed massively.",
            pros: [
                "Top-tier clear speed",
                "Freeze is great defense",
                "Satisfying shattering",
                "Scales incredibly with gear"
            ],
            cons: [
                "Expensive to feel good",
                "Glass cannon",
                "Poor boss damage without investment"
            ],
            playstyle_notes: "Fire arrows that pierce and chain, freezing and shattering packs. Stay moving, stay alive.",
            leveling_notes: "Level as Rain of Arrows or Split Arrow until you have the gear for Ice Shot.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 1000,
                    description: "Starting to feel the freeze.",
                    upgrade_notes: "Get Hyrri's Ire for damage.",
                    items: [
                        { slot: "weapon", item_name: "Death's Opus", item_type: "Bow", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Hyrri's Ire", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Pandemonius", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: 100000,
                    description: "Freeze everything, clear entire screens instantly.",
                    upgrade_notes: "Mirror-tier gear for maximum zoom.",
                    items: [
                        { slot: "weapon", item_name: "Rare Bow", item_type: "Bow", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1 },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 1 },
                        { slot: "amulet", item_name: "Pandemonius", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Headhunter", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "blade-vortex-occultist",
            name: "Blade Vortex Poison Occultist",
            slug: "blade-vortex-occultist",
            class_name: "Occultist",
            primary_playstyle: "spell",
            damage_type: "chaos",
            tags: ["poison", "chaos", "fast-mapper", "spell", "aura-stacker"],
            mapping_score: 9,
            bossing_score: 7,
            league_start_score: 6,
            complexity: 2,
            description: "Spin blades around you, poisoning everything nearby. Occultist curses and chaos scaling make this a powerhouse for both mapping and bossing.",
            pros: [
                "Great clear and single target",
                "Curse synergies",
                "Smooth gameplay",
                "Scales well"
            ],
            cons: [
                "Need to stay in melee range",
                "Ramping damage on bosses",
                "Blade uptime requires practice"
            ],
            playstyle_notes: "Keep 10 blades spinning at all times. Whirling Blades through packs. Curses amplify your damage.",
            leveling_notes: "BV available at level 12. Use Unleash support for blade generation.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Smooth mapper with good poison damage.",
                    upgrade_notes: "Get Obliteration wands for explosions.",
                    items: [
                        { slot: "weapon", item_name: "Obliteration", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Obliteration", item_type: "Wand", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Carcass Jack", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Sin Trek", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable.",
                    upgrade_notes: "Get Cold Iron Point daggers for +6 gem levels.",
                    items: [
                        { slot: "weapon", item_name: "Cold Iron Point", item_type: "Dagger", is_unique: true, priority: 1 },
                        { slot: "offhand", item_name: "Cold Iron Point", item_type: "Dagger", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Dendrobate", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2 },
                        { slot: "amulet", item_name: "Ashes of the Stars", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "storm-brand-hierophant",
            name: "Storm Brand Hierophant",
            slug: "storm-brand-hierophant",
            class_name: "Hierophant",
            primary_playstyle: "spell",
            damage_type: "lightning",
            tags: ["lightning", "brand", "league-start", "fast-mapper", "totems"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 8,
            complexity: 1,
            description: "Attach brands to enemies that zap them and nearby foes. Hierophant's brand attachment and mana synergies make this very smooth.",
            pros: [
                "Hands-off playstyle",
                "Great for beginners",
                "Good league starter",
                "Brands auto-target"
            ],
            cons: [
                "Brand playstyle isn't for everyone",
                "Needs brand recall management",
                "Damage caps eventually"
            ],
            playstyle_notes: "Attach brands, watch them kill. Brand Recall refreshes duration and teleports brands. Very chill mapping.",
            leveling_notes: "Storm Brand from level 12. Armageddon Brand is also good. Easy leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Great self-found viability.",
                    upgrade_notes: "Get Badge of the Brotherhood for more brands.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Smooth T16 farmer.",
                    upgrade_notes: "Focus on +gem level gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Cloak of Defiance", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Mind of the Council", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "ground-slam-berserker",
            name: "Ground Slam Impale Berserker",
            slug: "ground-slam-berserker",
            class_name: "Berserker",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "physical", "fast-mapper", "impale", "rage"],
            mapping_score: 8,
            bossing_score: 8,
            league_start_score: 8,
            complexity: 2,
            description: "Slam the ground with devastating force. Berserker's rage and damage bonuses turn this simple skill into a powerhouse.",
            pros: [
                "Great all-rounder",
                "Satisfying slam gameplay",
                "Good league starter",
                "Scales well with gear"
            ],
            cons: [
                "Melee range is risky",
                "Rage management needed",
                "Can be squishy"
            ],
            playstyle_notes: "Build rage, slam hard. Use Leap Slam for mobility. Vaal Ground Slam for bosses.",
            leveling_notes: "Ground Slam from level 1. Very smooth leveling with any two-hand weapon.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Strong from day one.",
                    upgrade_notes: "Get a high pDPS two-hander.",
                    items: [
                        { slot: "weapon", item_name: "Kaom's Primacy", item_type: "Axe", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable, great impale damage.",
                    upgrade_notes: "Get Ryslatha's Coil for damage variance.",
                    items: [
                        { slot: "weapon", item_name: "Rare Axe", item_type: "Axe", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Abyssus", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "belt", item_name: "Ryslatha's Coil", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Daresso's Salute", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "spark-inquisitor",
            name: "Spark Aura Inquisitor",
            slug: "spark-inquisitor",
            class_name: "Inquisitor",
            primary_playstyle: "spell",
            damage_type: "lightning",
            tags: ["lightning", "spell", "aura-stacker", "fast-mapper", "projectile"],
            mapping_score: 10,
            bossing_score: 6,
            league_start_score: 5,
            complexity: 3,
            description: "Fill the screen with lightning projectiles that bounce off walls. Inquisitor's crit and consecrated ground synergies boost damage.",
            pros: [
                "Incredible clear speed",
                "Scales infinitely with auras",
                "Projectiles seek enemies",
                "Very satisfying"
            ],
            cons: [
                "Expensive to optimize",
                "Complex aura stacking",
                "Lower boss damage"
            ],
            playstyle_notes: "Cast Spark in enclosed spaces for maximum bounces. Stay on consecrated ground for buffs.",
            leveling_notes: "Spark from level 12. Use Pierce support early.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 1000,
                    description: "Good mapper, sparks everywhere.",
                    upgrade_notes: "Get more aura reservation efficiency.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Inpulsa's Broken Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: null,
                    description: "Full aura stacker, clear speed is unmatched.",
                    upgrade_notes: "Get Mageblood for flask sustain.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Prism Guardian", item_type: "Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Skin of the Lords", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Crown of the Inward Eye", item_type: "Helmet", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Ashes of the Stars", item_type: "Amulet", is_unique: true, priority: 1 },
                        { slot: "belt", item_name: "Mageblood", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "herald-of-agony-guardian",
            name: "Herald of Agony Guardian",
            slug: "herald-of-agony-guardian",
            class_name: "Guardian",
            primary_playstyle: "minion",
            damage_type: "physical",
            tags: ["minion", "poison", "tanky", "boss-killer", "low-button"],
            mapping_score: 6,
            bossing_score: 9,
            league_start_score: 6,
            complexity: 2,
            description: "Summon a powerful Agony Crawler that does all your damage. Guardian provides auras and defense. Incredibly tanky facetank build.",
            pros: [
                "Extremely tanky",
                "Great boss damage",
                "Low button gameplay",
                "Can do all content"
            ],
            cons: [
                "Slow clear speed",
                "Need to maintain poison stacks",
                "Crawler AI can be annoying"
            ],
            playstyle_notes: "Apply poison with Rain of Arrows or Cyclone to maintain virulence stacks. The Crawler does all the damage.",
            leveling_notes: "Level as Dominating Blow or SRS until you can get Herald of Agony.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Tanky mapper with solid single target.",
                    upgrade_notes: "Get Coming Calamity for reservation.",
                    items: [
                        { slot: "weapon", item_name: "The Embalmer", item_type: "Gloves", is_unique: true, priority: 2 },
                        { slot: "body", item_name: "Coming Calamity", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Victario's Flight", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 5000,
                    max_budget: 50000,
                    description: "Facetank everything, Uber viable.",
                    upgrade_notes: "Get Aegis Aurora for ES on block.",
                    items: [
                        { slot: "weapon", item_name: "Rare Claw", item_type: "Claw", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Aegis Aurora", item_type: "Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Coming Calamity", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 1 },
                        { slot: "boots", item_name: "Rare Boots", item_type: "Boots", is_unique: false, priority: 2 },
                        { slot: "amulet", item_name: "Aul's Uprising", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        // Sorceress builds
        {
            id: "frozen-orb-stormweaver",
            name: "Frozen Orb Stormweaver",
            slug: "frozen-orb-stormweaver",
            class_name: "Stormweaver",
            primary_playstyle: "spell",
            damage_type: "cold",
            tags: ["cold", "spell", "freeze", "fast-mapper", "league-start"],
            mapping_score: 9,
            bossing_score: 6,
            league_start_score: 8,
            complexity: 1,
            description: "Classic frozen orb build that clears screens with cold explosions. Stormweaver enhances cold damage and freeze duration for excellent control.",
            pros: [
                "Great clear speed",
                "Strong freeze for safety",
                "Simple one-button gameplay",
                "Good league starter"
            ],
            cons: [
                "Lower single target damage",
                "Mana management needed",
                "Projectile aiming required"
            ],
            playstyle_notes: "Cast Frozen Orb into packs and watch them shatter. Use frost blink for mobility. Freeze is your best defense.",
            leveling_notes: "Frozen Orb available early. Very straightforward leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Works great on self-found gear.",
                    upgrade_notes: "Get wand with +spell gems and spell damage.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Comfortable T16 mapper.",
                    upgrade_notes: "Focus on cold damage and cast speed.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Hyrri's Ire", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Pandemonius", item_type: "Amulet", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "meteor-chronomancer",
            name: "Meteor Strike Chronomancer",
            slug: "meteor-chronomancer",
            class_name: "Chronomancer",
            primary_playstyle: "spell",
            damage_type: "fire",
            tags: ["fire", "spell", "boss-killer", "aoe", "channeling"],
            mapping_score: 6,
            bossing_score: 9,
            league_start_score: 5,
            complexity: 2,
            description: "Call down devastating meteors on enemies. Chronomancer's time manipulation allows for stacking meteor impacts for massive burst damage.",
            pros: [
                "Incredible burst damage",
                "Satisfying meteor impacts",
                "Great boss killer",
                "Scales well with investment"
            ],
            cons: [
                "Slower clear speed",
                "Cast time delay",
                "Positioning required"
            ],
            playstyle_notes: "Stack meteors on boss spawn points. Use time manipulation to overlap damage windows.",
            leveling_notes: "Level with Fireball or Firestorm until you unlock Meteor.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 1000,
                    description: "Good boss damage on budget.",
                    upgrade_notes: "Get +fire gem level staff.",
                    items: [
                        { slot: "weapon", item_name: "Rare Staff", item_type: "Staff", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Cloak of Flame", item_type: "Body Armour", is_unique: true, priority: 2 },
                        { slot: "amulet", item_name: "Atziri's Foible", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 1000,
                    max_budget: 10000,
                    description: "Melts bosses, comfortable mapping.",
                    upgrade_notes: "Get Kaom's Heart for survivability.",
                    items: [
                        { slot: "weapon", item_name: "Rare Staff", item_type: "Staff", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Kaom's Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "lightning-storm-sorceress",
            name: "Lightning Storm Sorceress",
            slug: "lightning-storm-sorceress",
            class_name: "Sorceress",
            primary_playstyle: "spell",
            damage_type: "lightning",
            tags: ["lightning", "spell", "fast-mapper", "shock", "channeling"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 7,
            complexity: 2,
            description: "Channel devastating lightning storms that grow in intensity. Great balance of clear and single target with shock amplification.",
            pros: [
                "Good all-rounder",
                "Shock amplifies damage",
                "Scales well",
                "Flexible playstyle"
            ],
            cons: [
                "Channeling is risky",
                "Mana hungry",
                "Needs cast speed investment"
            ],
            playstyle_notes: "Channel to build storm intensity, release for maximum damage. Keep enemies shocked for damage bonus.",
            leveling_notes: "Spark or Arc for leveling, transition to Lightning Storm later.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Functional on self-found.",
                    upgrade_notes: "Get Inpulsa's for clear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Smooth mapping with good shock effect.",
                    upgrade_notes: "Storm's Gift for proliferation.",
                    items: [
                        { slot: "weapon", item_name: "Rare Wand", item_type: "Wand", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Inpulsa's Broken Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "gloves", item_name: "Storm's Gift", item_type: "Gloves", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        // Mercenary builds
        {
            id: "crossbow-witchhunter",
            name: "Rapid Crossbow Witchhunter",
            slug: "crossbow-witchhunter",
            class_name: "Witchhunter",
            primary_playstyle: "ranged",
            damage_type: "physical",
            tags: ["ranged", "physical", "fast-mapper", "league-start", "projectile"],
            mapping_score: 9,
            bossing_score: 7,
            league_start_score: 9,
            complexity: 1,
            description: "Rapid-fire crossbow build that excels at clearing content quickly. Witchhunter provides anti-magic bonuses and burst damage windows.",
            pros: [
                "Excellent league starter",
                "Fast clear speed",
                "Simple gameplay",
                "Great scaling"
            ],
            cons: [
                "Need to manage reload",
                "Squishy without investment",
                "Ammo management"
            ],
            playstyle_notes: "Burst down packs with rapid fire, reload between groups. Use mobility skills to stay safe.",
            leveling_notes: "Crossbow skills available from act 1. Smooth progression.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Excellent self-found viable build.",
                    upgrade_notes: "Get a higher damage crossbow.",
                    items: [
                        { slot: "weapon", item_name: "Rare Crossbow", item_type: "Crossbow", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Wanderlust", item_type: "Boots", is_unique: true, priority: 3 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Fast T16 farmer.",
                    upgrade_notes: "Focus on attack speed and crit.",
                    items: [
                        { slot: "weapon", item_name: "Rare Crossbow", item_type: "Crossbow", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "grenade-gemling",
            name: "Explosive Grenade Gemling Legionnaire",
            slug: "grenade-gemling",
            class_name: "Gemling Legionnaire",
            primary_playstyle: "ranged",
            damage_type: "fire",
            tags: ["fire", "ranged", "aoe", "boss-killer", "explosive"],
            mapping_score: 7,
            bossing_score: 8,
            league_start_score: 7,
            complexity: 2,
            description: "Throw explosive grenades that devastate groups. Gemling Legionnaire's gem socketing provides unique skill modifications.",
            pros: [
                "Huge AoE damage",
                "Great boss damage",
                "Satisfying explosions",
                "Flexible gem choices"
            ],
            cons: [
                "Grenade arc takes practice",
                "Slower than pure mappers",
                "Resource management"
            ],
            playstyle_notes: "Arc grenades into packs, save burst for bosses. Position for maximum explosion overlap.",
            leveling_notes: "Grenades available early, very smooth leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Strong on self-found.",
                    upgrade_notes: "Get +fire damage gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 2 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable.",
                    upgrade_notes: "Get Kaom's Heart for life pool.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sceptre", item_type: "Sceptre", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Kaom's Heart", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Rare Helmet", item_type: "Helmet", is_unique: false, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                }
            ]
        },
        {
            id: "dual-pistol-mercenary",
            name: "Dual Pistol Mercenary",
            slug: "dual-pistol-mercenary",
            class_name: "Mercenary",
            primary_playstyle: "ranged",
            damage_type: "physical",
            tags: ["ranged", "physical", "fast-mapper", "dual-wield", "speed"],
            mapping_score: 10,
            bossing_score: 5,
            league_start_score: 8,
            complexity: 2,
            description: "Dual-wield pistols for maximum attack speed and clear. Pure speed build that excels at farming content quickly.",
            pros: [
                "Top tier clear speed",
                "Very mobile",
                "Fun gun-slinging gameplay",
                "Scales well with gear"
            ],
            cons: [
                "Glass cannon",
                "Lower single target",
                "Reload management"
            ],
            playstyle_notes: "Rapid fire into packs, dash between groups. Keep moving, keep shooting.",
            leveling_notes: "Dual pistols available early. Fast leveling experience.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Fast mapper on budget.",
                    upgrade_notes: "Get higher crit pistols.",
                    items: [
                        { slot: "weapon", item_name: "Rare Pistol", item_type: "Pistol", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Rare Pistol", item_type: "Pistol", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: null,
                    description: "Maximum zoom farmer.",
                    upgrade_notes: "Mirror-tier pistols and Headhunter.",
                    items: [
                        { slot: "weapon", item_name: "Rare Pistol", item_type: "Pistol", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Rare Pistol", item_type: "Pistol", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1 },
                        { slot: "belt", item_name: "Headhunter", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        // Monk builds
        {
            id: "flicker-strike-invoker",
            name: "Flicker Strike Invoker",
            slug: "flicker-strike-invoker",
            class_name: "Invoker",
            primary_playstyle: "melee",
            damage_type: "lightning",
            tags: ["melee", "lightning", "fast-mapper", "speed", "strike"],
            mapping_score: 10,
            bossing_score: 5,
            league_start_score: 4,
            complexity: 3,
            description: "Teleport between enemies with lightning speed. Invoker's elemental invocations add lightning damage and clear. Pure speed demon.",
            pros: [
                "Fastest clear in the game",
                "Teleportation bypasses terrain",
                "Very satisfying",
                "Scales infinitely"
            ],
            cons: [
                "Can be disorienting",
                "Requires frenzy charge sustain",
                "Boss damage is mediocre"
            ],
            playstyle_notes: "Hold flicker and watch yourself teleport through maps. Make sure you have frenzy charge generation.",
            leveling_notes: "Level with other skills, transition to Flicker once you have Terminus Est or frenzy generation.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 500,
                    description: "Functional flicker with frenzy sustain.",
                    upgrade_notes: "Get better frenzy generation.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sword", item_type: "Sword", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Endgame",
                    tier_order: 4,
                    min_budget: 10000,
                    max_budget: null,
                    description: "Pure speed. Clear maps in seconds.",
                    upgrade_notes: "Mirror-tier gear for maximum zoom.",
                    items: [
                        { slot: "weapon", item_name: "Rare Sword", item_type: "Sword", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1 },
                        { slot: "belt", item_name: "Headhunter", item_type: "Belt", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "palm-strike-acolyte",
            name: "Palm Strike Acolyte of Chayula",
            slug: "palm-strike-acolyte",
            class_name: "Acolyte of Chayula",
            primary_playstyle: "melee",
            damage_type: "chaos",
            tags: ["melee", "chaos", "tanky", "boss-killer", "es"],
            mapping_score: 6,
            bossing_score: 9,
            league_start_score: 5,
            complexity: 2,
            description: "Channel the void through devastating palm strikes. Acolyte's chaos and energy shield synergies create a tanky boss killer.",
            pros: [
                "Very tanky with ES",
                "Excellent boss damage",
                "Chaos bypasses resistances",
                "Good sustain"
            ],
            cons: [
                "Slower clear",
                "Requires specific ES gear",
                "Melee range is risky"
            ],
            playstyle_notes: "Stack chaos damage, use palm strikes to delete bosses. ES recharge provides excellent sustain.",
            leveling_notes: "Level as generic melee, transition to chaos once you have the gear.",
            tiers: [
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 100,
                    max_budget: 500,
                    description: "Solid boss damage on budget.",
                    upgrade_notes: "Get ES gear.",
                    items: [
                        { slot: "weapon", item_name: "Rare Claw", item_type: "Claw", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1 },
                        { slot: "boots", item_name: "Sin Trek", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "Tanky boss killer.",
                    upgrade_notes: "Get Aegis Aurora for ES on block.",
                    items: [
                        { slot: "weapon", item_name: "Rare Claw", item_type: "Claw", is_unique: false, priority: 1 },
                        { slot: "offhand", item_name: "Aegis Aurora", item_type: "Shield", is_unique: true, priority: 1 },
                        { slot: "body", item_name: "Rare Body Armour", item_type: "Body Armour", is_unique: false, priority: 1 },
                        { slot: "boots", item_name: "Sin Trek", item_type: "Boots", is_unique: true, priority: 1 }
                    ]
                }
            ]
        },
        {
            id: "quarterstaff-monk",
            name: "Whirlwind Quarterstaff Monk",
            slug: "quarterstaff-monk",
            class_name: "Monk",
            primary_playstyle: "melee",
            damage_type: "physical",
            tags: ["melee", "physical", "fast-mapper", "league-start", "aoe"],
            mapping_score: 8,
            bossing_score: 7,
            league_start_score: 9,
            complexity: 1,
            description: "Spin through enemies with a quarterstaff. Simple, effective, and great for beginners. Monk's martial arts enhance attack speed and damage.",
            pros: [
                "Excellent league starter",
                "Simple one-button gameplay",
                "Great AoE clear",
                "Tanky with block"
            ],
            cons: [
                "Melee range",
                "Not the fastest clearer",
                "Average boss damage"
            ],
            playstyle_notes: "Spin to win! Keep moving through packs. Use your mobility skills between groups.",
            leveling_notes: "Quarterstaff skills from level 1. Very smooth leveling.",
            tiers: [
                {
                    tier_name: "League Start",
                    tier_order: 1,
                    min_budget: 0,
                    max_budget: 50,
                    description: "Self-found viable, works great.",
                    upgrade_notes: "Get a high pDPS staff.",
                    items: [
                        { slot: "weapon", item_name: "Rare Quarterstaff", item_type: "Staff", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Tabula Rasa", item_type: "Body Armour", is_unique: true, priority: 1 }
                    ]
                },
                {
                    tier_name: "Budget",
                    tier_order: 2,
                    min_budget: 50,
                    max_budget: 500,
                    description: "Comfortable all content farmer.",
                    upgrade_notes: "Get Belly of the Beast for life.",
                    items: [
                        { slot: "weapon", item_name: "Rare Quarterstaff", item_type: "Staff", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Starkonja's Head", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "boots", item_name: "Atziri's Step", item_type: "Boots", is_unique: true, priority: 2 }
                    ]
                },
                {
                    tier_name: "Mid-Tier",
                    tier_order: 3,
                    min_budget: 500,
                    max_budget: 5000,
                    description: "All content viable with good damage.",
                    upgrade_notes: "Focus on attack speed and crit.",
                    items: [
                        { slot: "weapon", item_name: "Rare Quarterstaff", item_type: "Staff", is_unique: false, priority: 1 },
                        { slot: "body", item_name: "Belly of the Beast", item_type: "Body Armour", is_unique: true, priority: 1 },
                        { slot: "helmet", item_name: "Abyssus", item_type: "Helmet", is_unique: true, priority: 2 },
                        { slot: "belt", item_name: "Ryslatha's Coil", item_type: "Belt", is_unique: true, priority: 1 },
                        { slot: "amulet", item_name: "Daresso's Salute", item_type: "Amulet", is_unique: true, priority: 2 }
                    ]
                }
            ]
        }
    ],

    // Helper methods
    getArchetype(id) {
        return this.ARCHETYPES.find(a => a.id === id || a.slug === id);
    },

    getArchetypesByClass(className) {
        if (!className || className === 'any') return this.ARCHETYPES;
        const classMap = {
            witch: ['Witch', 'Necromancer', 'Blood Mage', 'Elementalist', 'Occultist'],
            sorceress: ['Sorceress', 'Stormweaver', 'Chronomancer'],
            ranger: ['Ranger', 'Deadeye', 'Pathfinder'],
            mercenary: ['Mercenary', 'Witchhunter', 'Gemling Legionnaire'],
            monk: ['Monk', 'Invoker', 'Acolyte of Chayula'],
            warrior: ['Warrior', 'Slayer', 'Juggernaut', 'Berserker', 'Titan'],
            templar: ['Templar', 'Hierophant', 'Inquisitor', 'Guardian']
        };
        const validClasses = classMap[className.toLowerCase()] || [className];
        return this.ARCHETYPES.filter(a => validClasses.includes(a.class_name));
    },

    getArchetypesByPlaystyle(playstyle) {
        if (!playstyle || playstyle === 'any') return this.ARCHETYPES;
        return this.ARCHETYPES.filter(a => a.primary_playstyle === playstyle);
    },

    getArchetypesByTag(tag) {
        return this.ARCHETYPES.filter(a => a.tags.includes(tag));
    },

    getQuestion(id) {
        return this.INTERVIEW_QUESTIONS.find(q => q.id === id);
    },

    getAllUniqueItems() {
        const items = new Set();
        this.ARCHETYPES.forEach(arch => {
            arch.tiers.forEach(tier => {
                tier.items.forEach(item => {
                    if (item.is_unique) {
                        items.add(item.item_name);
                    }
                });
            });
        });
        return Array.from(items).sort();
    }
};
