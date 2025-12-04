/**
 * ML Optimizer module - NLP/ML-based build optimization
 * Uses weighted scoring, statistical analysis, and text matching
 * to aggregate and recommend optimal build solutions
 */

const MLOptimizer = {
    // Feature weights learned from community data patterns
    FEATURE_WEIGHTS: {
        // Core performance metrics
        mapping_efficiency: 0.25,
        bossing_capability: 0.25,
        survivability: 0.20,
        budget_efficiency: 0.15,
        ease_of_play: 0.15
    },

    // Stat priority templates by build archetype
    STAT_PRIORITIES: {
        // Defense-focused builds
        tanky: {
            primary: ['maximum life', 'life regeneration', 'armour', 'evasion'],
            secondary: ['elemental resistances', 'chaos resistance', 'block chance'],
            tertiary: ['life on hit', 'reduced damage taken', 'fortify effect']
        },
        // Damage-focused builds
        glass_cannon: {
            primary: ['increased damage', 'critical strike chance', 'critical strike multiplier'],
            secondary: ['attack speed', 'cast speed', 'added damage'],
            tertiary: ['penetration', 'increased area', 'projectile speed']
        },
        // Balanced builds
        balanced: {
            primary: ['maximum life', 'increased damage', 'elemental resistances'],
            secondary: ['critical strike chance', 'armour', 'evasion'],
            tertiary: ['attack speed', 'cast speed', 'life regeneration']
        },
        // Minion builds
        minion: {
            primary: ['minion damage', 'minion life', 'minion speed'],
            secondary: ['maximum life', 'elemental resistances', '+level to minion gems'],
            tertiary: ['minion resistances', 'minion critical strike', 'convocation cooldown']
        },
        // DoT builds
        dot: {
            primary: ['damage over time multiplier', 'increased damage over time', 'skill effect duration'],
            secondary: ['maximum life', 'elemental resistances', 'chaos resistance'],
            tertiary: ['reduced mana cost', 'increased area', 'faster start of energy shield recharge']
        },
        // Speed/mapping builds
        speed: {
            primary: ['movement speed', 'increased damage', 'area of effect'],
            secondary: ['attack speed', 'cast speed', 'cooldown recovery'],
            tertiary: ['maximum life', 'elemental resistances', 'mana regeneration']
        }
    },

    // Slot-specific stat priorities
    SLOT_STAT_PRIORITIES: {
        helmet: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to armour'],
            offensive: ['+# to level of socketed gems', 'nearby enemies have -#% resistance', '+#% critical strike chance'],
            utility: ['+# to accuracy rating', 'reduced mana cost of skills', '+#% increased area of effect']
        },
        body: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to armour/evasion'],
            offensive: ['+# to level of socketed gems', '+#% critical strike chance', 'attacks have +#% to critical strike chance'],
            utility: ['+#% increased maximum life', 'gain #% of life as extra energy shield', '+# to all attributes']
        },
        gloves: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to armour'],
            offensive: ['+# to accuracy rating', 'adds # damage to attacks', '+#% attack speed'],
            utility: ['culling strike', '+# to dexterity', 'increased cast speed']
        },
        boots: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to armour'],
            offensive: ['+#% movement speed', 'adds # damage if you have killed recently', '+#% increased movement speed'],
            utility: ['+#% movement speed', 'cannot be frozen', 'regenerate #% life per second']
        },
        belt: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to armour'],
            offensive: ['+#% increased damage', '+#% elemental damage with attacks', '+#% increased flask charges gained'],
            utility: ['+# to strength', 'increased flask effect duration', 'reduced flask charges used']
        },
        amulet: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to all attributes'],
            offensive: ['+#% critical strike multiplier', '+#% to global critical strike chance', 'adds # damage'],
            utility: ['+# to intelligence', '+# to dexterity', '+# to level of all skill gems']
        },
        ring1: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to maximum mana'],
            offensive: ['+# to accuracy rating', 'adds # damage to attacks', '+#% increased damage'],
            utility: ['+# to all attributes', '+#% increased rarity', 'curse enemies with # on hit']
        },
        ring2: {
            defensive: ['+# to maximum life', '+#% to elemental resistances', '+# to maximum mana'],
            offensive: ['+# to accuracy rating', 'adds # damage to attacks', '+#% increased damage'],
            utility: ['+# to all attributes', '+#% increased rarity', 'curse enemies with # on hit']
        }
    },

    // NLP keyword mappings for user preference analysis
    NLP_KEYWORDS: {
        survivability: {
            high: ['tanky', 'tank', 'survive', 'immortal', 'deathless', 'hardcore', 'safe', 'defensive', 'never die'],
            medium: ['balanced', 'moderate', 'some defense', 'decent life'],
            low: ['glass cannon', 'damage', 'dps', 'zoom', 'speed', 'fast']
        },
        playstyle: {
            melee: ['melee', 'close', 'slam', 'strike', 'attack', 'warrior', 'berserker'],
            ranged: ['ranged', 'bow', 'projectile', 'distance', 'safe distance', 'kite'],
            spell: ['spell', 'caster', 'magic', 'elemental', 'witch', 'mage'],
            minion: ['minion', 'summon', 'necromancer', 'pets', 'army', 'zombies', 'spectres'],
            dot: ['dot', 'damage over time', 'poison', 'bleed', 'ignite', 'burn']
        },
        content: {
            mapping: ['map', 'mapping', 'clear', 'speed', 'aoe', 'fast', 'zoom'],
            bossing: ['boss', 'bossing', 'single target', 'dps', 'endgame', 'pinnacle'],
            league: ['league', 'mechanic', 'delve', 'heist', 'expedition']
        }
    },

    /**
     * Initialize the ML optimizer
     */
    init() {
        console.log('MLOptimizer: Initialized');
    },

    /**
     * Analyze user responses using NLP-style text matching
     * Returns weighted preference scores
     */
    analyzeUserPreferences(responses) {
        const preferences = {
            survivability: 0.5,  // 0-1 scale
            clearSpeed: 0.5,
            bossing: 0.5,
            complexity: 0.5,
            budget: 0.5
        };

        // Analyze survivability preference
        if (responses.survivability) {
            const survMap = {
                'glass_cannon': 0.1,
                'balanced': 0.5,
                'tanky': 0.8,
                'immortal': 1.0
            };
            preferences.survivability = survMap[responses.survivability] || 0.5;
        }

        // Analyze clear speed preference
        if (responses.clear_speed) {
            const speedMap = {
                'slow': 0.2,
                'moderate': 0.5,
                'fast': 0.8,
                'zoom': 1.0
            };
            preferences.clearSpeed = speedMap[responses.clear_speed] || 0.5;
        }

        // Analyze content focus
        if (responses.content_focus) {
            const content = Array.isArray(responses.content_focus)
                ? responses.content_focus
                : [responses.content_focus];

            if (content.includes('bossing')) preferences.bossing = 0.9;
            if (content.includes('mapping')) preferences.clearSpeed = Math.max(preferences.clearSpeed, 0.8);
            if (content.includes('both')) {
                preferences.bossing = 0.6;
                preferences.clearSpeed = 0.6;
            }
        }

        // Analyze experience/complexity
        if (responses.experience) {
            const expMap = {
                'new': 0.2,
                'casual': 0.4,
                'intermediate': 0.7,
                'experienced': 1.0
            };
            preferences.complexity = expMap[responses.experience] || 0.5;
        }

        // Analyze budget
        if (responses.budget) {
            const budgetMap = {
                'starter': 0.1,
                'budget': 0.3,
                'mid': 0.6,
                'high': 0.85,
                'unlimited': 1.0
            };
            preferences.budget = budgetMap[responses.budget] || 0.5;
        }

        return preferences;
    },

    /**
     * Score a build against user preferences using ML-style weighted scoring
     */
    scoreBuild(archetype, preferences, marketData = null) {
        let score = 0;
        const weights = this.FEATURE_WEIGHTS;

        // Mapping efficiency score
        const mappingScore = (archetype.mapping_score / 10) * preferences.clearSpeed;
        score += mappingScore * weights.mapping_efficiency;

        // Bossing capability score
        const bossingScore = (archetype.bossing_score / 10) * preferences.bossing;
        score += bossingScore * weights.bossing_capability;

        // Survivability score (inverse complexity for tanky builds)
        const survScore = this.calculateSurvivabilityScore(archetype, preferences);
        score += survScore * weights.survivability;

        // Budget efficiency score
        const budgetScore = this.calculateBudgetEfficiency(archetype, preferences, marketData);
        score += budgetScore * weights.budget_efficiency;

        // Ease of play score (inverse complexity for new players)
        const easeScore = this.calculateEaseOfPlay(archetype, preferences);
        score += easeScore * weights.ease_of_play;

        // Apply tag bonuses/penalties based on user avoidances
        score = this.applyTagModifiers(archetype, preferences, score);

        // Normalize to 0-100
        return Math.min(100, Math.max(0, score * 100));
    },

    /**
     * Calculate survivability score
     */
    calculateSurvivabilityScore(archetype, preferences) {
        const tags = archetype.tags || [];
        let baseScore = 0.5;

        if (tags.includes('tanky')) baseScore += 0.3;
        if (tags.includes('defensive')) baseScore += 0.2;
        if (tags.includes('leech')) baseScore += 0.1;
        if (tags.includes('block')) baseScore += 0.15;
        if (tags.includes('glass-cannon')) baseScore -= 0.3;

        // Weight by user preference
        return baseScore * (0.5 + preferences.survivability * 0.5);
    },

    /**
     * Calculate budget efficiency score
     */
    calculateBudgetEfficiency(archetype, preferences, marketData) {
        // Find the tier that best matches user budget
        const tiers = archetype.tiers || [];
        if (tiers.length === 0) return 0.5;

        // League start viability
        const leagueStartScore = (archetype.league_start_score || 5) / 10;

        // If market data available, factor in actual costs
        if (marketData && marketData.totalCost) {
            const budgetThresholds = {
                0.1: 50,      // starter
                0.3: 500,     // budget
                0.6: 5000,    // mid
                0.85: 25000,  // high
                1.0: 100000   // unlimited
            };

            const userBudget = budgetThresholds[preferences.budget] || 5000;
            const costRatio = marketData.totalCost / userBudget;

            if (costRatio <= 0.5) return 1.0;  // Very affordable
            if (costRatio <= 1.0) return 0.8;  // Within budget
            if (costRatio <= 1.5) return 0.5;  // Slightly over
            return 0.2;  // Too expensive
        }

        // Fallback to league start score for budget players
        if (preferences.budget < 0.4) {
            return leagueStartScore;
        }

        return 0.6;
    },

    /**
     * Calculate ease of play score
     */
    calculateEaseOfPlay(archetype, preferences) {
        const complexity = archetype.complexity || 2;
        const maxComplexity = 3;

        // Invert complexity for score (lower complexity = higher ease)
        const easeBase = 1 - (complexity / maxComplexity);

        // New players want easy builds, experienced players don't mind complexity
        if (preferences.complexity < 0.3) {
            return easeBase;  // Strong preference for easy
        } else if (preferences.complexity > 0.7) {
            return 0.5 + (complexity / maxComplexity) * 0.5;  // Prefer complex
        }

        return 0.5;  // Neutral
    },

    /**
     * Apply tag-based modifiers
     */
    applyTagModifiers(archetype, preferences, score) {
        const tags = archetype.tags || [];

        // These would come from user's "avoid" preferences
        // Placeholder for dynamic avoidance
        return score;
    },

    /**
     * Get stat priorities for a rare item based on build archetype
     */
    getStatPriorities(slot, archetype, tier = 'budget') {
        const buildType = this.determineBuildType(archetype);
        const slotPriorities = this.SLOT_STAT_PRIORITIES[slot];
        const archetypePriorities = this.STAT_PRIORITIES[buildType];

        if (!slotPriorities || !archetypePriorities) {
            return this.getDefaultStatPriorities(slot);
        }

        // Combine slot-specific and archetype priorities
        const priorities = {
            must_have: [],
            good_to_have: [],
            nice_to_have: []
        };

        // Determine if build is offensive or defensive focused
        const isDefensive = archetype.tags?.includes('tanky') ||
                           archetype.tags?.includes('defensive');

        const priorityType = isDefensive ? 'defensive' : 'offensive';

        // Must-have: top 2-3 stats from slot priorities
        priorities.must_have = slotPriorities[priorityType].slice(0, 2);

        // Add archetype primary stat if applicable
        if (archetypePriorities.primary[0]) {
            priorities.must_have.push(archetypePriorities.primary[0]);
        }

        // Good to have: remaining slot priorities + archetype secondary
        priorities.good_to_have = [
            ...slotPriorities[priorityType].slice(2),
            ...slotPriorities.utility.slice(0, 2),
            ...archetypePriorities.secondary.slice(0, 2)
        ];

        // Nice to have: tertiary priorities
        priorities.nice_to_have = [
            ...archetypePriorities.tertiary,
            ...slotPriorities.utility.slice(2)
        ];

        // Remove duplicates
        priorities.must_have = [...new Set(priorities.must_have)].slice(0, 3);
        priorities.good_to_have = [...new Set(priorities.good_to_have)]
            .filter(s => !priorities.must_have.includes(s))
            .slice(0, 4);
        priorities.nice_to_have = [...new Set(priorities.nice_to_have)]
            .filter(s => !priorities.must_have.includes(s) && !priorities.good_to_have.includes(s))
            .slice(0, 3);

        return priorities;
    },

    /**
     * Determine build type from archetype
     */
    determineBuildType(archetype) {
        const tags = archetype.tags || [];
        const playstyle = archetype.primary_playstyle || '';

        if (tags.includes('minion') || playstyle === 'minion') return 'minion';
        if (tags.includes('dot') || tags.includes('poison') || tags.includes('ignite')) return 'dot';
        if (tags.includes('tanky') || tags.includes('defensive')) return 'tanky';
        if (tags.includes('speed') || tags.includes('zoom')) return 'speed';
        if (tags.includes('glass-cannon')) return 'glass_cannon';

        return 'balanced';
    },

    /**
     * Get default stat priorities for a slot
     */
    getDefaultStatPriorities(slot) {
        return {
            must_have: ['+# to maximum life', '+#% to elemental resistances'],
            good_to_have: ['+# to armour', '+#% increased damage'],
            nice_to_have: ['+# to attributes', 'movement speed']
        };
    },

    /**
     * Rank all archetypes for a user
     */
    async rankArchetypes(responses, archetypes) {
        const preferences = this.analyzeUserPreferences(responses);
        const rankings = [];

        for (const archetype of archetypes) {
            // Get market data if available
            let marketData = null;
            if (typeof Market !== 'undefined') {
                try {
                    const analysis = await Market.analyzeBuild(archetype, 'budget');
                    marketData = analysis;
                } catch (e) {
                    // Market data unavailable
                }
            }

            const score = this.scoreBuild(archetype, preferences, marketData);

            rankings.push({
                archetype,
                score,
                preferences,
                matchReasons: this.generateMatchReasons(archetype, preferences, score)
            });
        }

        // Sort by score descending
        rankings.sort((a, b) => b.score - a.score);

        return rankings;
    },

    /**
     * Generate human-readable match reasons
     */
    generateMatchReasons(archetype, preferences, score) {
        const reasons = [];

        if (archetype.mapping_score >= 8 && preferences.clearSpeed > 0.7) {
            reasons.push('Excellent map clear speed');
        }

        if (archetype.bossing_score >= 8 && preferences.bossing > 0.7) {
            reasons.push('Strong boss killer');
        }

        if (archetype.league_start_score >= 7 && preferences.budget < 0.4) {
            reasons.push('Great league starter');
        }

        if (archetype.complexity <= 1 && preferences.complexity < 0.4) {
            reasons.push('Beginner friendly');
        }

        if (archetype.tags?.includes('tanky') && preferences.survivability > 0.7) {
            reasons.push('Very tanky and safe');
        }

        return reasons;
    },

    /**
     * Format stat priorities for display
     */
    formatStatPriorities(priorities) {
        const lines = [];

        if (priorities.must_have.length > 0) {
            lines.push(`Essential: ${priorities.must_have.join(', ')}`);
        }

        if (priorities.good_to_have.length > 0) {
            lines.push(`Important: ${priorities.good_to_have.join(', ')}`);
        }

        if (priorities.nice_to_have.length > 0) {
            lines.push(`Bonus: ${priorities.nice_to_have.join(', ')}`);
        }

        return lines.join('\n');
    }
};

// Initialize on load
MLOptimizer.init();
