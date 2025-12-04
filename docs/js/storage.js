/**
 * Storage module - localStorage wrapper for builds and settings
 */

const Storage = {
    KEYS: {
        BUILDS: 'poe2_builds',
        SETTINGS: 'poe2_settings',
        PRICE_CACHE: 'poe2_price_cache',
        INTERVIEW_HISTORY: 'poe2_interview_history'
    },

    // Initialize storage with defaults
    init() {
        if (!this.get(this.KEYS.BUILDS)) {
            this.set(this.KEYS.BUILDS, []);
        }
        if (!this.get(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                league: 'Standard',
                theme: 'dark',
                currency: 'chaos'
            });
        }
        if (!this.get(this.KEYS.PRICE_CACHE)) {
            this.set(this.KEYS.PRICE_CACHE, { prices: {}, timestamp: 0 });
        }
    },

    // Generic get/set
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    // Build operations
    getBuilds() {
        return this.get(this.KEYS.BUILDS) || [];
    },

    getBuild(id) {
        const builds = this.getBuilds();
        return builds.find(b => b.id === id);
    },

    saveBuild(build) {
        const builds = this.getBuilds();
        const index = builds.findIndex(b => b.id === build.id);

        build.updatedAt = new Date().toISOString();

        if (index >= 0) {
            builds[index] = build;
        } else {
            build.id = build.id || this.generateId();
            build.createdAt = build.createdAt || new Date().toISOString();
            builds.push(build);
        }

        this.set(this.KEYS.BUILDS, builds);
        return build;
    },

    deleteBuild(id) {
        const builds = this.getBuilds().filter(b => b.id !== id);
        this.set(this.KEYS.BUILDS, builds);
    },

    // Settings
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {};
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        Object.assign(settings, updates);
        this.set(this.KEYS.SETTINGS, settings);
        return settings;
    },

    // Price cache (with TTL)
    getPriceCache() {
        const cache = this.get(this.KEYS.PRICE_CACHE);
        if (!cache) return null;

        // Cache expires after 30 minutes
        const CACHE_TTL = 30 * 60 * 1000;
        if (Date.now() - cache.timestamp > CACHE_TTL) {
            return null;
        }
        return cache.prices;
    },

    setPriceCache(prices) {
        this.set(this.KEYS.PRICE_CACHE, {
            prices,
            timestamp: Date.now()
        });
    },

    getCachedPrice(itemName) {
        const cache = this.getPriceCache();
        return cache ? cache[itemName.toLowerCase()] : null;
    },

    setCachedPrice(itemName, priceData) {
        const cache = this.get(this.KEYS.PRICE_CACHE) || { prices: {}, timestamp: Date.now() };
        cache.prices[itemName.toLowerCase()] = priceData;
        cache.timestamp = Date.now();
        this.set(this.KEYS.PRICE_CACHE, cache);
    },

    // Interview history
    saveInterviewResult(result) {
        const history = this.get(this.KEYS.INTERVIEW_HISTORY) || [];
        result.id = this.generateId();
        result.timestamp = new Date().toISOString();
        history.unshift(result); // Most recent first

        // Keep only last 10 interviews
        if (history.length > 10) {
            history.pop();
        }

        this.set(this.KEYS.INTERVIEW_HISTORY, history);
        return result;
    },

    getInterviewHistory() {
        return this.get(this.KEYS.INTERVIEW_HISTORY) || [];
    },

    // Export all data
    exportData() {
        return {
            builds: this.getBuilds(),
            settings: this.getSettings(),
            interviewHistory: this.getInterviewHistory(),
            exportedAt: new Date().toISOString()
        };
    },

    // Import data
    importData(data) {
        if (data.builds) {
            this.set(this.KEYS.BUILDS, data.builds);
        }
        if (data.settings) {
            this.set(this.KEYS.SETTINGS, data.settings);
        }
        if (data.interviewHistory) {
            this.set(this.KEYS.INTERVIEW_HISTORY, data.interviewHistory);
        }
        return true;
    },

    // Clear all data
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    },

    // Generate unique ID
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

// Initialize on load
Storage.init();
