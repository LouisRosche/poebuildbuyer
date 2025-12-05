/**
 * Prices module - poe.ninja API integration for Path of Exile 2
 * Fetches live price data for PoE2 items
 * Falls back to estimated prices when API is unavailable (CORS)
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

    // Estimated prices for PoE2 uniques (fallback when API unavailable)
    // These are rough estimates based on PoE2 Early Access - real prices vary by league
    // Source: Validated items from poe2-items.js
    ESTIMATED_PRICES: {
        // === WANDS ===
        'lifesprig': 5,
        'adonia\'s ego': 15,
        'enezun\'s charge': 30,
        'sanguine diviner': 40,

        // === SCEPTRES ===
        'font of power': 20,
        'palm of the dreamer': 35,
        'sacred flame': 25,

        // === STAFFS ===
        'dusk vigil': 20,
        'earthbound': 15,
        'taryn\'s shiver': 80,
        'the searing touch': 60,
        'whispering ice': 100,
        'the unborn lich': 150,

        // === BOWS ===
        'widowhail': 10,
        'quill rain': 5,
        'doomfletch': 40,
        'slivertongue': 50,

        // === CROSSBOWS ===
        'mist whisper': 15,
        'rampart raptor': 25,
        'the last lament': 60,
        'double vision': 80,
        'fairgraves\' curse': 45,

        // === QUARTERSTAFFS ===
        'matsya': 20,
        'nazir\'s judgement': 35,
        'pillar of the caged god': 50,
        'blood thorn': 40,

        // === MACES ===
        'frostbreath': 30,
        'seeing stars': 25,
        'wylund\'s stake': 35,
        'olrovasara': 60,

        // === GREAT MACES ===
        'brain rattler': 40,
        'chober chaber': 15,
        'hrimnor\'s hymn': 30,
        'quecholli': 45,
        'trephina': 55,
        'marohi erqi': 25,

        // === SPEARS ===
        'saitha\'s spear': 20,
        'chainsting': 30,
        'daevata\'s wind': 45,
        'tyranny\'s grip': 50,

        // === DAGGERS ===
        'winter\'s bite': 35,

        // === BODY ARMOUR ===
        'ghostwrithe': 25,
        'enfolding dawn': 60,
        'bitterbloom': 50,
        'lightning coil': 80,
        'cospri\'s will': 100,
        'hyrri\'s ire': 70,
        'gloamgown': 90,
        'sacrosanctum': 75,
        'tabula rasa': 10,

        // === HELMETS ===
        'goldrim': 3,
        'thrillsteel': 25,
        'greymake': 15,
        'demigod\'s virtue': 500,

        // === GLOVES ===
        'thunderfist': 40,

        // === BOOTS ===
        'wanderlust': 2,
        'bushwhack': 20,
        'luminous pace': 35,
        'shankgonne': 45,

        // === SHIELDS ===
        'kaltenhalt': 30,
        'calgyra\'s arc': 25,

        // === QUIVERS ===
        'asphyxia\'s wrath': 35,
        'blackgleam': 15,

        // === BELTS ===
        'darkness enthroned': 50,
        'headhunter': 8000,
        'umbilicus immortalis': 100,

        // === RINGS ===
        'thief\'s torment': 25,
        'dream fragments': 15,
        'grip of kulemak': 60,

        // === AMULETS ===
        'hinekora\'s sight': 80,
        'revered resin': 20,

        // === JEWELS ===
        'heart of the well': 30,
        'undying hate': 40,

        // === CHARMS ===
        'beira\'s anguish': 50,

        // === FLASKS ===
        'blood of the warrior': 35,
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
    // Note: offhand can be shields (armour) or quivers (armour on poe.ninja)
    SLOT_TO_TYPE: {
        weapon: 'UniqueWeapon',
        offhand: 'UniqueArmour', // shields and quivers are classified as armour
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
        quiver: 'UniqueArmour', // quivers classified as armour
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
            // PoE2 leagues (as of Dec 2024)
            return [
                { id: 'Standard', name: 'Standard' },
                { id: 'Dawn of the Hunt', name: 'Dawn of the Hunt (Current League)' },
                { id: 'HC Dawn of the Hunt', name: 'HC Dawn of the Hunt' }
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
