/**
 * Market Analysis Module
 * Provides dynamic build recommendations based on current item prices
 */

const Market = {
    // Cache for market analysis results
    analysisCache: null,
    analysisCacheTime: 0,
    CACHE_TTL: 15 * 60 * 1000, // 15 minutes

    /**
     * Analyze all builds and return market insights
     */
    async analyzeMarket() {
        // Check cache
        if (this.analysisCache && (Date.now() - this.analysisCacheTime) < this.CACHE_TTL) {
            return this.analysisCache;
        }

        const archetypes = Data.ARCHETYPES;
        const analysis = {
            builds: [],
            cheapestByClass: {},
            bestValue: [],
            priceDrops: [],
            timestamp: Date.now()
        };

        // Analyze each build
        for (const archetype of archetypes) {
            const buildAnalysis = await this.analyzeBuild(archetype);
            analysis.builds.push(buildAnalysis);

            // Track cheapest per class
            const className = archetype.class_name;
            if (!analysis.cheapestByClass[className] ||
                buildAnalysis.lowestTierCost < analysis.cheapestByClass[className].cost) {
                analysis.cheapestByClass[className] = {
                    build: archetype,
                    cost: buildAnalysis.lowestTierCost,
                    tier: buildAnalysis.lowestTier
                };
            }
        }

        // Sort by value score (effectiveness per chaos)
        analysis.builds.sort((a, b) => b.valueScore - a.valueScore);
        analysis.bestValue = analysis.builds.slice(0, 5);

        // Find builds with significant price drops
        analysis.priceDrops = analysis.builds
            .filter(b => b.priceChange < -10) // More than 10% cheaper
            .sort((a, b) => a.priceChange - b.priceChange)
            .slice(0, 5);

        this.analysisCache = analysis;
        this.analysisCacheTime = Date.now();

        return analysis;
    },

    /**
     * Analyze a single build's market position
     */
    async analyzeBuild(archetype) {
        const tiers = archetype.tiers || [];
        let lowestTierCost = Infinity;
        let lowestTier = null;
        let tierAnalyses = [];

        for (const tier of tiers) {
            const tierCost = await this.calculateTierCost(tier);
            tierAnalyses.push({
                tierName: tier.tier_name,
                totalCost: tierCost.total,
                itemsWithPrices: tierCost.items,
                priceCoverage: tierCost.coverage,
                estimatedTotal: tierCost.estimated
            });

            if (tierCost.total < lowestTierCost && tierCost.total > 0) {
                lowestTierCost = tierCost.total;
                lowestTier = tier;
            }
        }

        // Calculate value score: build effectiveness / cost
        // Higher scores = better value
        const effectiveness = (
            archetype.mapping_score * 0.4 +
            archetype.bossing_score * 0.4 +
            archetype.league_start_score * 0.2
        ) / 10;

        const costFactor = Math.log10(Math.max(lowestTierCost, 1) + 1);
        const valueScore = lowestTierCost > 0 ? (effectiveness / costFactor) * 100 : 0;

        // Estimate price change (would need historical data, using random for demo)
        // In real implementation, compare to stored prices
        const priceChange = this.estimatePriceChange(archetype.id);

        return {
            archetype,
            tiers: tierAnalyses,
            lowestTierCost,
            lowestTier,
            valueScore: Math.round(valueScore * 10) / 10,
            priceChange,
            affordabilityRating: this.getAffordabilityRating(lowestTierCost)
        };
    },

    /**
     * Calculate the cost of a build tier
     */
    async calculateTierCost(tier) {
        const items = tier.items || [];
        let total = 0;
        let estimated = 0;
        let itemsWithPrices = 0;
        const itemResults = [];

        for (const item of items) {
            let price = null;
            let isEstimate = false;

            if (item.is_unique) {
                const priceData = await Prices.getPrice(item.item_name);
                if (priceData && priceData.chaos) {
                    price = priceData.chaos;
                } else {
                    // Use estimated price
                    price = Prices.getEstimatedPrice(item.item_name);
                    isEstimate = true;
                }
            } else {
                // Rare item - estimate based on slot
                price = this.estimateRareItemPrice(item);
                isEstimate = true;
            }

            if (price !== null) {
                total += price;
                if (!isEstimate) itemsWithPrices++;
                estimated += price;
            }

            itemResults.push({
                ...item,
                price,
                isEstimate
            });
        }

        return {
            total: Math.round(total),
            estimated: Math.round(estimated),
            items: itemResults,
            coverage: items.length > 0 ? (itemsWithPrices / items.length) * 100 : 0
        };
    },

    /**
     * Estimate rare item price based on slot and required stats
     */
    estimateRareItemPrice(item) {
        const baseEstimates = {
            weapon: 30,
            offhand: 20,
            body: 50,
            helmet: 25,
            gloves: 15,
            boots: 20,
            amulet: 30,
            ring1: 20,
            ring2: 20,
            belt: 20,
            jewel1: 10,
            jewel2: 10,
            jewel3: 10
        };

        let estimate = baseEstimates[item.slot] || 20;

        // Increase estimate for items with specific stat requirements
        if (item.min_stats) {
            const statCount = Object.keys(item.min_stats).length;
            estimate *= (1 + statCount * 0.3);
        }

        return Math.round(estimate);
    },

    /**
     * Estimate price change (placeholder - would use historical data)
     */
    estimatePriceChange(buildId) {
        // In a real implementation, compare current prices to historical data
        // For now, return a simulated value based on build characteristics
        const stored = Storage.getBuildPriceHistory(buildId);
        if (stored && stored.previousCost) {
            const current = this.analysisCache?.builds?.find(b => b.archetype.id === buildId)?.lowestTierCost;
            if (current) {
                return ((current - stored.previousCost) / stored.previousCost) * 100;
            }
        }
        return 0;
    },

    /**
     * Get affordability rating based on cost
     */
    getAffordabilityRating(cost) {
        if (cost === Infinity || cost === 0) return 'unknown';
        if (cost < 50) return 'very-cheap';
        if (cost < 200) return 'cheap';
        if (cost < 1000) return 'moderate';
        if (cost < 5000) return 'expensive';
        return 'very-expensive';
    },

    /**
     * Get market-driven recommendations
     */
    async getMarketRecommendations(userResponses) {
        const analysis = await this.analyzeMarket();
        const budget = userResponses?.budget || 'mid';

        // Get budget range
        const budgetRanges = {
            starter: { max: 50 },
            budget: { max: 500 },
            mid: { max: 5000 },
            high: { max: 50000 },
            unlimited: { max: Infinity }
        };
        const maxBudget = budgetRanges[budget]?.max || 5000;

        // Filter builds that fit budget
        const affordableBuilds = analysis.builds.filter(b =>
            b.lowestTierCost <= maxBudget || b.lowestTierCost === Infinity
        );

        // Get standard recommendations
        const standardRecs = Recommendations.getRecommendations(userResponses);

        // Enhance with market data
        const enhanced = standardRecs.map(rec => {
            const marketData = analysis.builds.find(b => b.archetype.id === rec.archetype.id);
            return {
                ...rec,
                market: marketData ? {
                    currentCost: marketData.lowestTierCost,
                    valueScore: marketData.valueScore,
                    priceChange: marketData.priceChange,
                    affordability: marketData.affordabilityRating,
                    isGoodValue: marketData.valueScore > 50,
                    isPriceDropping: marketData.priceChange < -5
                } : null
            };
        });

        // Sort by combined score (preference + value)
        enhanced.sort((a, b) => {
            const aMarketBonus = a.market?.isGoodValue ? 10 : 0;
            const bMarketBonus = b.market?.isGoodValue ? 10 : 0;
            const aDropBonus = a.market?.isPriceDropping ? 5 : 0;
            const bDropBonus = b.market?.isPriceDropping ? 5 : 0;

            return (b.score + bMarketBonus + bDropBonus) - (a.score + aMarketBonus + aDropBonus);
        });

        return {
            recommendations: enhanced,
            marketInsights: {
                bestValue: analysis.bestValue.slice(0, 3),
                priceDrops: analysis.priceDrops,
                cheapestByClass: analysis.cheapestByClass
            }
        };
    },

    /**
     * Get builds by market criteria
     */
    async getBuildsByMarketCriteria(criteria) {
        const analysis = await this.analyzeMarket();
        let builds = [...analysis.builds];

        if (criteria.maxCost) {
            builds = builds.filter(b => b.lowestTierCost <= criteria.maxCost);
        }

        if (criteria.sortBy === 'value') {
            builds.sort((a, b) => b.valueScore - a.valueScore);
        } else if (criteria.sortBy === 'cost') {
            builds.sort((a, b) => a.lowestTierCost - b.lowestTierCost);
        } else if (criteria.sortBy === 'priceChange') {
            builds.sort((a, b) => a.priceChange - b.priceChange);
        }

        if (criteria.className) {
            builds = builds.filter(b =>
                b.archetype.class_name.toLowerCase() === criteria.className.toLowerCase()
            );
        }

        return builds.slice(0, criteria.limit || 10);
    },

    /**
     * Generate market summary for display
     */
    async getMarketSummary() {
        const analysis = await this.analyzeMarket();

        // Calculate overall market health indicators
        const avgCost = analysis.builds.reduce((sum, b) => sum + (b.lowestTierCost === Infinity ? 0 : b.lowestTierCost), 0) / analysis.builds.length;
        const cheapBuildsCount = analysis.builds.filter(b => b.affordabilityRating === 'cheap' || b.affordabilityRating === 'very-cheap').length;
        const droppingPricesCount = analysis.priceDrops.length;

        return {
            totalBuilds: analysis.builds.length,
            averageCost: Math.round(avgCost),
            cheapBuildsCount,
            droppingPricesCount,
            bestValueBuild: analysis.bestValue[0],
            cheapestBuild: analysis.builds.reduce((min, b) =>
                b.lowestTierCost < min.lowestTierCost ? b : min,
                { lowestTierCost: Infinity }
            ),
            insights: this.generateInsights(analysis)
        };
    },

    /**
     * Generate human-readable market insights
     */
    generateInsights(analysis) {
        const insights = [];

        // Best value insight
        if (analysis.bestValue[0]) {
            const best = analysis.bestValue[0];
            insights.push({
                type: 'value',
                icon: '💎',
                title: 'Best Value Build',
                message: `${best.archetype.name} offers excellent performance for its cost`,
                buildId: best.archetype.id
            });
        }

        // Price drop insight
        if (analysis.priceDrops.length > 0) {
            const dropped = analysis.priceDrops[0];
            insights.push({
                type: 'deal',
                icon: '📉',
                title: 'Price Dropping',
                message: `${dropped.archetype.name} items are getting cheaper - good time to gear up!`,
                buildId: dropped.archetype.id
            });
        }

        // Budget-friendly insight
        const veryChep = analysis.builds.filter(b => b.affordabilityRating === 'very-cheap');
        if (veryChep.length > 0) {
            insights.push({
                type: 'budget',
                icon: '💰',
                title: 'Budget Friendly',
                message: `${veryChep.length} builds can be started for under 50 chaos`,
                count: veryChep.length
            });
        }

        return insights;
    },

    /**
     * Format cost for display
     */
    formatCost(cost) {
        if (cost === Infinity || cost === 0) return 'Unknown';
        if (cost >= 10000) {
            const divines = Math.round(cost / 200); // Approximate divine value
            return `~${divines} div`;
        }
        return `${cost.toLocaleString()}c`;
    },

    /**
     * Get affordability badge class
     */
    getAffordabilityBadgeClass(rating) {
        const classes = {
            'very-cheap': 'badge-success',
            'cheap': 'badge-success-light',
            'moderate': 'badge-warning',
            'expensive': 'badge-danger-light',
            'very-expensive': 'badge-danger',
            'unknown': 'badge-muted'
        };
        return classes[rating] || 'badge-muted';
    }
};

// Extend Storage with price history
if (typeof Storage !== 'undefined') {
    Storage.getBuildPriceHistory = function(buildId) {
        const key = `price_history_${buildId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    };

    Storage.saveBuildPriceHistory = function(buildId, currentCost) {
        const key = `price_history_${buildId}`;
        const existing = this.getBuildPriceHistory(buildId);
        const entry = {
            previousCost: existing?.currentCost || currentCost,
            currentCost,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(entry));
    };
}

// Extend Prices with getEstimatedPrice helper
if (typeof Prices !== 'undefined' && !Prices.getEstimatedPrice) {
    Prices.getEstimatedPrice = function(itemName) {
        const normalized = itemName.toLowerCase().trim();
        return this.ESTIMATED_PRICES[normalized] || 10; // Default 10c for unknown items
    };
}
