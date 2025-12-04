/**
 * Recommendations module - scoring engine for build matching
 * Port of the Python RecommendationEngine
 */

const Recommendations = {
    // Class name mapping for scoring (PoE2 classes only)
    CLASS_MAPPING: {
        witch: ['Witch', 'Necromancer', 'Blood Mage', 'Elementalist', 'Occultist'],
        sorceress: ['Sorceress', 'Stormweaver', 'Chronomancer'],
        ranger: ['Ranger', 'Deadeye', 'Pathfinder'],
        mercenary: ['Mercenary', 'Witchhunter', 'Gemling Legionnaire'],
        monk: ['Monk', 'Invoker', 'Acolyte of Chayula'],
        warrior: ['Warrior', 'Slayer', 'Juggernaut', 'Berserker', 'Titan']
    },

    // Tags to avoid mapping
    AVOID_TAG_MAPPING: {
        piano: ['piano', 'complex-rotation'],
        minions: ['minion', 'summoner'],
        dot: ['dot', 'damage-over-time'],
        melee: ['melee'],
        channeling: ['channeling'],
        totems: ['totem', 'totems']
    },

    /**
     * Score an archetype based on user responses
     * Higher score = better match
     */
    scoreArchetype(archetype, responses) {
        let score = 100.0; // Start with base score

        // Class matching
        const userClass = responses.class || 'any';
        if (userClass !== 'any') {
            const validClasses = this.CLASS_MAPPING[userClass] || [userClass.charAt(0).toUpperCase() + userClass.slice(1)];
            if (!validClasses.includes(archetype.class_name)) {
                score -= 50; // Heavy penalty for wrong class
            }
        }

        // Playstyle matching
        const userPlaystyle = responses.playstyle || 'any';
        if (userPlaystyle !== 'any') {
            if (archetype.primary_playstyle !== userPlaystyle) {
                if (archetype.primary_playstyle === 'hybrid') {
                    score -= 10;
                } else {
                    score -= 30;
                }
            }
        }

        // Damage type matching
        const userDamage = responses.damage_preference || 'any';
        if (userDamage !== 'any') {
            if (archetype.damage_type !== userDamage && archetype.damage_type !== 'mixed') {
                score -= 20;
            }
        }

        // Content focus matching
        let contentFocus = responses.content_focus || [];
        if (typeof contentFocus === 'string') {
            contentFocus = [contentFocus];
        }

        if (contentFocus.includes('mapping') || contentFocus.includes('both')) {
            score += archetype.mapping_score * 2;
        }
        if (contentFocus.includes('bossing') || contentFocus.includes('both')) {
            score += archetype.bossing_score * 2;
        }

        // Budget matching - check league start viability
        const budget = responses.budget || 'mid';
        if (budget === 'starter' || budget === 'budget') {
            score += archetype.league_start_score * 3;
        }

        // Experience/complexity matching
        const experience = responses.experience || 'intermediate';
        const maxComplexity = Data.EXPERIENCE_COMPLEXITY[experience] || 2;
        if (archetype.complexity > maxComplexity) {
            score -= (archetype.complexity - maxComplexity) * 15;
        }

        // Survivability preferences
        const survivability = responses.survivability || 'balanced';
        if (survivability === 'tanky' || survivability === 'immortal') {
            if (archetype.tags.includes('tanky') || archetype.tags.includes('defensive')) {
                score += 15;
            }
            if (archetype.tags.includes('glass-cannon')) {
                score -= 20;
            }
        } else if (survivability === 'glass_cannon') {
            if (archetype.tags.includes('glass-cannon') || archetype.tags.includes('high-damage')) {
                score += 10;
            }
        }

        // Clear speed preferences
        const clearSpeed = responses.clear_speed || 'moderate';
        if (clearSpeed === 'fast' || clearSpeed === 'zoom') {
            if (archetype.tags.includes('fast-mapper') || archetype.tags.includes('speed')) {
                score += 15;
            }
            score += archetype.mapping_score;
        }

        // Things to avoid
        let avoid = responses.avoid || [];
        if (typeof avoid === 'string') {
            avoid = [avoid];
        }

        for (const avoidItem of avoid) {
            const badTags = this.AVOID_TAG_MAPPING[avoidItem] || [];
            for (const tag of badTags) {
                if (archetype.tags.includes(tag) || archetype.primary_playstyle === tag.replace(/s$/, '')) {
                    score -= 40;
                }
            }
        }

        // Existing gear bonus
        const existingGear = (responses.existing_gear || '').toLowerCase().trim();
        if (existingGear) {
            for (const tier of archetype.tiers) {
                for (const item of tier.items) {
                    if (item.item_name.toLowerCase().includes(existingGear)) {
                        score += 25;
                        break;
                    }
                }
            }
        }

        return Math.max(0, score); // Don't go negative
    },

    /**
     * Get recommendations based on interview responses
     */
    getRecommendations(responses, limit = 5) {
        const archetypes = Data.ARCHETYPES;
        const scored = [];

        // Score each archetype
        for (const archetype of archetypes) {
            const score = this.scoreArchetype(archetype, responses);
            if (score > 0) {
                scored.push({
                    archetype,
                    score
                });
            }
        }

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Take top N
        const topArchetypes = scored.slice(0, limit);

        // Build full recommendations with budget tiers
        const recommendations = [];
        const userBudget = responses.budget || 'mid';

        const budgetOrder = {
            starter: 1,
            budget: 2,
            mid: 3,
            high: 4,
            unlimited: 5
        };
        const userBudgetOrder = budgetOrder[userBudget] || 3;

        for (const item of topArchetypes) {
            const archetype = item.archetype;
            const tiers = archetype.tiers.sort((a, b) => a.tier_order - b.tier_order);

            // Find recommended tier based on budget
            let recommendedTier = null;
            for (const tier of tiers) {
                if (tier.tier_order <= userBudgetOrder) {
                    recommendedTier = tier;
                }
            }

            if (!recommendedTier && tiers.length > 0) {
                recommendedTier = tiers[0]; // Default to cheapest
            }

            recommendations.push({
                archetype: {
                    id: archetype.id,
                    name: archetype.name,
                    slug: archetype.slug,
                    class_name: archetype.class_name,
                    primary_playstyle: archetype.primary_playstyle,
                    damage_type: archetype.damage_type,
                    tags: archetype.tags,
                    mapping_score: archetype.mapping_score,
                    bossing_score: archetype.bossing_score,
                    league_start_score: archetype.league_start_score,
                    complexity: archetype.complexity,
                    description: archetype.description,
                    pros: archetype.pros,
                    cons: archetype.cons,
                    playstyle_notes: archetype.playstyle_notes,
                    leveling_notes: archetype.leveling_notes
                },
                score: Math.round(item.score * 10) / 10,
                match_percentage: Math.min(100, Math.round(item.score)),
                recommended_tier: recommendedTier,
                all_tiers: tiers
            });
        }

        return recommendations;
    },

    /**
     * Quick filter recommendations without full interview
     */
    quickRecommend(filters, limit = 5) {
        // Convert filters to responses format
        const responses = {
            class: filters.class_name || 'any',
            playstyle: filters.playstyle || 'any',
            damage_preference: filters.damage_type || 'any',
            content_focus: filters.content_focus || ['both'],
            budget: filters.budget || 'mid',
            experience: 'intermediate',
            survivability: 'balanced',
            clear_speed: 'moderate',
            avoid: []
        };

        // Add tag-based filtering
        if (filters.tag) {
            // Boost archetypes with matching tag
            const taggedArchetypes = Data.getArchetypesByTag(filters.tag);
            // This will naturally be handled by the scoring
        }

        return this.getRecommendations(responses, limit);
    },

    /**
     * Get detailed archetype info with price estimates
     */
    async getArchetypeWithPrices(archetypeId) {
        const archetype = Data.getArchetype(archetypeId);
        if (!archetype) return null;

        // Get prices for each tier
        const tiersWithPrices = await Promise.all(
            archetype.tiers.map(async tier => {
                const itemsWithPrices = await Promise.all(
                    tier.items.map(async item => {
                        if (item.is_unique) {
                            const price = await Prices.getPrice(item.item_name);
                            return {
                                ...item,
                                current_price: price ? price.chaos : null,
                                price_source: price ? 'poe.ninja' : null
                            };
                        }
                        return {
                            ...item,
                            current_price: null,
                            price_note: 'Rare item - price varies'
                        };
                    })
                );

                const totalCost = itemsWithPrices.reduce((sum, item) => {
                    return sum + (item.current_price || 0);
                }, 0);

                return {
                    ...tier,
                    items: itemsWithPrices,
                    estimated_total: Math.round(totalCost)
                };
            })
        );

        return {
            ...archetype,
            tiers: tiersWithPrices
        };
    }
};
