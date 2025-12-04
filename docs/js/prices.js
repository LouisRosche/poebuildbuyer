/**
 * Prices module - poe.ninja API integration
 * Fetches live price data for PoE items
 */

const Prices = {
    // poe.ninja API base URL (note: may have CORS issues)
    API_BASE: 'https://poe.ninja/api/data',

    // Backend API URL (set when backend is available)
    BACKEND_URL: null,

    // Current league (will be updated)
    league: 'Standard',

    // Cache for prices
    cache: {},
    cacheTimestamp: 0,
    CACHE_TTL: 30 * 60 * 1000, // 30 minutes

    // Whether we're using estimated prices (fallback)
    usingEstimates: false,

    // Estimated prices for common uniques (fallback when API unavailable)
    // These are rough estimates - real prices vary by league
    ESTIMATED_PRICES: {
        // Weapons
        'tabula rasa': 10,
        'obliteration': 5,
        'wasp nest': 3,
        'cerberus limb': 15,
        'death\'s opus': 50,
        'tidebreaker': 20,
        'kaom\'s primacy': 5,
        'cold iron point': 30,
        // Armour
        'kaom\'s heart': 100,
        'cloak of flame': 5,
        'belly of the beast': 30,
        'brass dome': 80,
        'inpulsa\'s broken heart': 60,
        'hyrri\'s ire': 40,
        'carcass jack': 25,
        'dendrobate': 15,
        'vis mortis': 20,
        'coming calamity': 10,
        'cloak of defiance': 15,
        'skin of the lords': 200,
        // Helmets
        'goldrim': 2,
        'the baron': 5,
        'starkonja\'s head': 10,
        'abyssus': 20,
        'crown of the inward eye': 50,
        'mind of the council': 15,
        // Gloves
        'atziri\'s acuity': 150,
        'grip of the council': 10,
        'storm\'s gift': 30,
        'the embalmer': 5,
        // Boots
        'wanderlust': 1,
        'atziri\'s step': 15,
        'bones of ullr': 5,
        'sin trek': 10,
        'corpsewalker': 25,
        'victario\'s flight': 5,
        'ralakesh\'s impatience': 30,
        // Belts
        'darkness enthroned': 20,
        'headhunter': 5000,
        'mageblood': 10000,
        'ryslatha\'s coil': 100,
        // Amulets
        'atziri\'s foible': 3,
        'sidhebreath': 1,
        'astramentis': 25,
        'stone of lazhwar': 2,
        'impresence': 50,
        'ashes of the stars': 500,
        'pandemonius': 80,
        'aul\'s uprising': 200,
        'daresso\'s salute': 15,
        // Rings
        'snakepit': 5,
        'kalandra\'s touch': 1000,
        // Shields
        'rathpith globe': 50,
        'aegis aurora': 150,
        'advancing fortress': 5,
        'prism guardian': 40,
        // Jewels
        'violent dead': 10,
        'anatomical knowledge': 15,
        'undying hate': 30,
        'heart of the well': 20,
        'from nothing': 40,
        'grand spectrum': 25,
        'conqueror\'s efficiency': 5,
        'conqueror\'s potency': 5,
        // More Armour
        'queen of the forest': 40,
        'rat\'s nest': 15,
        'shadows and dust': 10,
        'seven-league step': 20,
        'crown of eyes': 80,
        'veil of the night': 5,
        'maligaro\'s virtuosity': 10,
        'kaom\'s roots': 20,
        'lycosidae': 25,
        // More Accessories
        'ngamahu\'s sign': 5,
        'call of the brotherhood': 40,
        'xoph\'s blood': 150,
        'dyadian dawn': 10,
        'pyre': 5,
        'carnage heart': 10,
        'mark of the elder': 30,
        'mark of the shaper': 30,
        'le heup of all': 3,
        'thief\'s torment': 20,
        'ungil\'s harmony': 5,
        'dream fragments': 10,
        'belt of the deceiver': 5,
        'polaric devastation': 25,
        'badge of the brotherhood': 200,
    },

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
    async init() {
        const settings = Storage.getSettings();
        this.league = settings.league || 'Standard';

        // Try to load cached prices
        const cached = Storage.getPriceCache();
        if (cached) {
            this.cache = cached;
            this.cacheTimestamp = Date.now();
        }

        // Check if backend API is available
        if (typeof API !== 'undefined' && API.isAvailable && API.BASE_URL) {
            this.BACKEND_URL = API.BASE_URL;
            console.log('Prices: Using backend API');
        } else {
            // Test if poe.ninja is accessible (it likely isn't due to CORS)
            try {
                const testUrl = `${this.API_BASE}/currencyoverview?type=Currency&league=Standard`;
                const response = await fetch(testUrl, { method: 'HEAD', mode: 'cors' });
                if (!response.ok) throw new Error('API not accessible');
            } catch (e) {
                console.log('Prices: poe.ninja not accessible (CORS), using estimates');
                this.usingEstimates = true;
            }
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
            // PoE2 early access leagues (as of Dec 2024)
            return [
                { id: 'Standard', name: 'Standard' },
                { id: 'Settlers', name: 'Settlers (Current League)' },
                { id: 'HC Settlers', name: 'HC Settlers' }
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

        // If using estimates (CORS blocked), return estimated price
        if (this.usingEstimates) {
            return this.getEstimatedPrice(itemName);
        }

        // Try backend API first if available
        if (this.BACKEND_URL) {
            try {
                const response = await fetch(`${this.BACKEND_URL}/prices/item/${encodeURIComponent(itemName)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.chaos_equivalent) {
                        const priceData = {
                            name: itemName,
                            chaos: data.chaos_equivalent,
                            divine: data.divine_equivalent || 0,
                            change: data.change_percent || 0,
                            listingCount: data.listing_count || 0,
                            icon: null,
                            source: 'backend'
                        };
                        Storage.setCachedPrice(cacheKey, priceData);
                        return priceData;
                    }
                }
            } catch (e) {
                console.warn('Backend price fetch failed, trying poe.ninja');
            }
        }

        // Determine item type
        let itemTypes = ['UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueJewel'];
        if (slot && this.SLOT_TO_TYPE[slot]) {
            itemTypes = [this.SLOT_TO_TYPE[slot]];
        }

        // Search in each item type via poe.ninja
        try {
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
                        icon: match.icon || null,
                        source: 'poe.ninja'
                    };

                    // Cache the result
                    Storage.setCachedPrice(cacheKey, priceData);
                    return priceData;
                }
            }
        } catch (e) {
            console.warn('poe.ninja fetch failed, using estimates');
            this.usingEstimates = true;
            return this.getEstimatedPrice(itemName);
        }

        // Fallback to estimates
        return this.getEstimatedPrice(itemName);
    },

    /**
     * Get estimated price for an item (fallback)
     */
    getEstimatedPrice(itemName) {
        const key = itemName.toLowerCase();
        const estimate = this.ESTIMATED_PRICES[key];

        if (estimate) {
            return {
                name: itemName,
                chaos: estimate,
                divine: estimate >= 200 ? estimate / 200 : 0,
                change: 0,
                listingCount: 0,
                icon: null,
                source: 'estimate',
                isEstimate: true
            };
        }

        // If not in our list, make a rough guess based on tier
        // Assume ~50c for unknown uniques
        return {
            name: itemName,
            chaos: 50,
            divine: 0,
            change: 0,
            listingCount: 0,
            icon: null,
            source: 'estimate',
            isEstimate: true,
            isGuess: true
        };
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
        // If using estimates, return reasonable defaults
        if (this.usingEstimates) {
            return { divine: 200, exalted: 15, chaos: 1 };
        }

        // Try backend first
        if (this.BACKEND_URL) {
            try {
                const response = await fetch(`${this.BACKEND_URL}/prices/currency`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        divine: data.divine || 200,
                        exalted: data.exalted || 15,
                        chaos: 1
                    };
                }
            } catch (e) {
                console.warn('Backend currency fetch failed');
            }
        }

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
            this.usingEstimates = true;
            return { divine: 200, exalted: 15, chaos: 1 }; // Fallback
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
