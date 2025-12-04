/**
 * Prices module - poe.ninja API integration
 * Fetches live price data for PoE items
 */

const Prices = {
    // poe.ninja API base URL
    API_BASE: 'https://poe.ninja/api/data',

    // Current league (will be updated)
    league: 'Standard',

    // Cache for prices
    cache: {},
    cacheTimestamp: 0,
    CACHE_TTL: 30 * 60 * 1000, // 30 minutes

    // Item type to API endpoint mapping
    ITEM_TYPES: {
        'UniqueWeapon': 'itemoverview?type=UniqueWeapon',
        'UniqueArmour': 'itemoverview?type=UniqueArmour',
        'UniqueAccessory': 'itemoverview?type=UniqueAccessory',
        'UniqueFlask': 'itemoverview?type=UniqueFlask',
        'UniqueJewel': 'itemoverview?type=UniqueJewel',
        'UniqueMap': 'itemoverview?type=UniqueMap',
        'Currency': 'currencyoverview?type=Currency',
        'Fragment': 'currencyoverview?type=Fragment'
    },

    // Map item slots to poe.ninja types
    SLOT_TO_TYPE: {
        weapon: 'UniqueWeapon',
        offhand: 'UniqueWeapon',
        body: 'UniqueArmour',
        helmet: 'UniqueArmour',
        gloves: 'UniqueArmour',
        boots: 'UniqueArmour',
        belt: 'UniqueAccessory',
        amulet: 'UniqueAccessory',
        ring1: 'UniqueAccessory',
        ring2: 'UniqueAccessory',
        jewel1: 'UniqueJewel',
        jewel2: 'UniqueJewel',
        jewel3: 'UniqueJewel',
        flask: 'UniqueFlask'
    },

    /**
     * Initialize with league setting
     */
    init() {
        const settings = Storage.getSettings();
        this.league = settings.league || 'Standard';

        // Try to load cached prices
        const cached = Storage.getPriceCache();
        if (cached) {
            this.cache = cached;
            this.cacheTimestamp = Date.now();
        }
    },

    /**
     * Set the current league
     */
    setLeague(league) {
        this.league = league;
        Storage.updateSettings({ league });
        // Clear cache when league changes
        this.cache = {};
        this.cacheTimestamp = 0;
    },

    /**
     * Get available leagues from poe.ninja
     */
    async getLeagues() {
        try {
            // poe.ninja doesn't have a leagues endpoint, use known leagues
            // For PoE2, the leagues might be different
            return [
                { id: 'Standard', name: 'Standard' },
                { id: 'poe2-Standard', name: 'PoE2 Standard' },
                { id: 'Dawn', name: 'Dawn (PoE2 League)' }
            ];
        } catch (error) {
            console.error('Error fetching leagues:', error);
            return [{ id: 'Standard', name: 'Standard' }];
        }
    },

    /**
     * Fetch prices for a specific item type
     */
    async fetchPrices(itemType) {
        const endpoint = this.ITEM_TYPES[itemType];
        if (!endpoint) {
            console.warn(`Unknown item type: ${itemType}`);
            return [];
        }

        const url = `${this.API_BASE}/${endpoint}&league=${encodeURIComponent(this.league)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.lines || [];
        } catch (error) {
            console.error(`Error fetching ${itemType} prices:`, error);
            return [];
        }
    },

    /**
     * Get price for a specific item
     */
    async getPrice(itemName, slot = null) {
        // Check cache first
        const cacheKey = itemName.toLowerCase();
        const cached = Storage.getCachedPrice(cacheKey);
        if (cached) {
            return cached;
        }

        // Determine item type
        let itemTypes = ['UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueJewel'];
        if (slot && this.SLOT_TO_TYPE[slot]) {
            itemTypes = [this.SLOT_TO_TYPE[slot]];
        }

        // Search in each item type
        for (const itemType of itemTypes) {
            const prices = await this.fetchPrices(itemType);
            const match = prices.find(p =>
                p.name.toLowerCase() === itemName.toLowerCase() ||
                p.name.toLowerCase().includes(itemName.toLowerCase())
            );

            if (match) {
                const priceData = {
                    name: match.name,
                    chaos: match.chaosValue || match.chaosEquivalent || 0,
                    divine: match.divineValue || 0,
                    exalted: match.exaltedValue || 0,
                    change: match.sparkline?.totalChange || 0,
                    listingCount: match.listingCount || 0,
                    icon: match.icon || null
                };

                // Cache the result
                Storage.setCachedPrice(cacheKey, priceData);
                return priceData;
            }
        }

        return null;
    },

    /**
     * Get prices for multiple items at once
     */
    async getPrices(items) {
        const results = {};

        // Group items by type for efficiency
        const byType = {};
        for (const item of items) {
            const type = this.SLOT_TO_TYPE[item.slot] || 'UniqueAccessory';
            if (!byType[type]) byType[type] = [];
            byType[type].push(item);
        }

        // Fetch each type
        for (const [type, typeItems] of Object.entries(byType)) {
            const prices = await this.fetchPrices(type);

            for (const item of typeItems) {
                const match = prices.find(p =>
                    p.name.toLowerCase() === item.item_name.toLowerCase()
                );

                if (match) {
                    results[item.item_name] = {
                        name: match.name,
                        chaos: match.chaosValue || 0,
                        divine: match.divineValue || 0,
                        change: match.sparkline?.totalChange || 0,
                        listingCount: match.listingCount || 0,
                        icon: match.icon
                    };
                }
            }
        }

        return results;
    },

    /**
     * Get prices for all items in a build tier
     */
    async getTierPrices(tier) {
        const uniqueItems = tier.items.filter(i => i.is_unique);
        const prices = await this.getPrices(uniqueItems);

        let total = 0;
        const itemsWithPrices = tier.items.map(item => {
            if (item.is_unique && prices[item.item_name]) {
                const price = prices[item.item_name];
                total += price.chaos;
                return {
                    ...item,
                    price: price.chaos,
                    priceChange: price.change,
                    icon: price.icon
                };
            }
            return {
                ...item,
                price: null,
                priceNote: item.is_unique ? 'Price not found' : 'Rare - varies'
            };
        });

        return {
            items: itemsWithPrices,
            total,
            currency: 'chaos'
        };
    },

    /**
     * Get currency exchange rates
     */
    async getCurrencyRates() {
        try {
            const url = `${this.API_BASE}/currencyoverview?type=Currency&league=${encodeURIComponent(this.league)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const rates = {
                divine: 0,
                exalted: 0,
                chaos: 1
            };

            for (const line of data.lines || []) {
                if (line.currencyTypeName === 'Divine Orb') {
                    rates.divine = line.chaosEquivalent;
                } else if (line.currencyTypeName === 'Exalted Orb') {
                    rates.exalted = line.chaosEquivalent;
                }
            }

            return rates;
        } catch (error) {
            console.error('Error fetching currency rates:', error);
            return { divine: 200, exalted: 20, chaos: 1 }; // Fallback
        }
    },

    /**
     * Format price for display
     */
    formatPrice(chaos, rates = null) {
        if (chaos === null || chaos === undefined) {
            return 'N/A';
        }

        if (chaos >= 1000 && rates && rates.divine > 0) {
            const divine = chaos / rates.divine;
            if (divine >= 1) {
                return `${divine.toFixed(1)} div`;
            }
        }

        if (chaos >= 100) {
            return `${Math.round(chaos)} c`;
        }

        return `${chaos.toFixed(1)} c`;
    },

    /**
     * Format price change for display
     */
    formatPriceChange(change) {
        if (!change) return '';
        const sign = change > 0 ? '+' : '';
        const className = change > 0 ? 'price-up' : change < 0 ? 'price-down' : '';
        return `<span class="${className}">${sign}${change.toFixed(1)}%</span>`;
    }
};

// Initialize on load
Prices.init();
