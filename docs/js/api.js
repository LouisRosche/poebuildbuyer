/**
 * API module - connects to backend when available, falls back to static data
 */

const API = {
    // Backend API URL - configure for your deployment
    BASE_URL: null, // Set to 'http://localhost:8000/api' for local dev, or your production URL

    // Whether API is available
    isAvailable: false,

    // Cache for API responses
    cache: {},
    cacheTTL: 5 * 60 * 1000, // 5 minutes

    /**
     * Initialize API - check if backend is available
     */
    async init() {
        // Try to detect backend URL
        const possibleUrls = [
            window.location.origin + '/api',  // Same origin
            'http://localhost:8000/api',       // Local dev
        ];

        for (const url of possibleUrls) {
            try {
                const response = await fetch(`${url}/health`, {
                    method: 'GET',
                    timeout: 3000,
                });

                if (response.ok) {
                    this.BASE_URL = url;
                    this.isAvailable = true;
                    console.log(`Backend API available at ${url}`);
                    return true;
                }
            } catch (e) {
                // Continue trying other URLs
            }
        }

        console.log('Backend API not available, using static data');
        this.isAvailable = false;
        return false;
    },

    /**
     * Make an API request
     */
    async request(endpoint, options = {}) {
        if (!this.isAvailable) {
            throw new Error('API not available');
        }

        const url = `${this.BASE_URL}${endpoint}`;

        // Check cache
        const cacheKey = `${options.method || 'GET'}_${url}`;
        const cached = this.cache[cacheKey];
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Cache GET responses
            if (!options.method || options.method === 'GET') {
                this.cache[cacheKey] = { data, timestamp: Date.now() };
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    },

    /**
     * Get all archetypes
     */
    async getArchetypes(params = {}) {
        if (!this.isAvailable) {
            // Fall back to static data
            return {
                archetypes: Data.ARCHETYPES,
                total: Data.ARCHETYPES.length,
            };
        }

        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/archetypes${queryParams ? '?' + queryParams : ''}`);
    },

    /**
     * Get a specific archetype
     */
    async getArchetype(id) {
        if (!this.isAvailable) {
            return Data.getArchetype(id);
        }

        try {
            return await this.request(`/archetypes/${id}`);
        } catch (e) {
            // Fall back to static data
            return Data.getArchetype(id);
        }
    },

    /**
     * Get popular archetypes
     */
    async getPopularArchetypes(limit = 10) {
        if (!this.isAvailable) {
            // Sort static data by league_start_score as proxy for popularity
            return {
                archetypes: Data.ARCHETYPES
                    .slice()
                    .sort((a, b) => b.league_start_score - a.league_start_score)
                    .slice(0, limit),
            };
        }

        return this.request(`/archetypes/popular?limit=${limit}`);
    },

    /**
     * Get league starter builds
     */
    async getLeagueStarters(limit = 10) {
        if (!this.isAvailable) {
            return {
                archetypes: Data.getArchetypesByTag('league-start').slice(0, limit),
            };
        }

        return this.request(`/archetypes/league-starters?limit=${limit}`);
    },

    /**
     * Get available classes
     */
    async getClasses() {
        if (!this.isAvailable) {
            const classes = {};
            for (const arch of Data.ARCHETYPES) {
                if (!classes[arch.class_name]) {
                    classes[arch.class_name] = { count: 0, builds: [] };
                }
                classes[arch.class_name].count++;
                if (classes[arch.class_name].builds.length < 3) {
                    classes[arch.class_name].builds.push(arch.name);
                }
            }
            return {
                classes: Object.entries(classes).map(([name, data]) => ({
                    name,
                    build_count: data.count,
                    example_builds: data.builds,
                })).sort((a, b) => a.name.localeCompare(b.name)),
            };
        }

        return this.request('/archetypes/classes');
    },

    /**
     * Get available tags
     */
    async getTags() {
        if (!this.isAvailable) {
            const tags = {};
            for (const arch of Data.ARCHETYPES) {
                for (const tag of arch.tags) {
                    tags[tag] = (tags[tag] || 0) + 1;
                }
            }
            return {
                tags: Object.entries(tags)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count),
            };
        }

        return this.request('/archetypes/tags');
    },

    /**
     * Get sync status
     */
    async getSyncStatus() {
        if (!this.isAvailable) {
            return {
                status: 'static',
                message: 'Using static data (no backend)',
            };
        }

        return this.request('/archetypes/sync/status');
    },

    /**
     * Trigger manual sync
     */
    async triggerSync() {
        if (!this.isAvailable) {
            return { error: 'No backend available' };
        }

        return this.request('/archetypes/sync/trigger', { method: 'POST' });
    },

    /**
     * Search builds
     */
    async searchBuilds(query) {
        if (!this.isAvailable) {
            const queryLower = query.toLowerCase();
            const results = Data.ARCHETYPES.filter(a =>
                a.name.toLowerCase().includes(queryLower) ||
                a.class_name.toLowerCase().includes(queryLower) ||
                a.description.toLowerCase().includes(queryLower) ||
                a.tags.some(t => t.toLowerCase().includes(queryLower))
            );
            return { archetypes: results };
        }

        return this.request(`/archetypes?search=${encodeURIComponent(query)}`);
    },

    /**
     * Get similar builds
     */
    async getSimilarBuilds(archetypeId, limit = 5) {
        if (!this.isAvailable) {
            const arch = Data.getArchetype(archetypeId);
            if (!arch) return { similar: [] };

            // Find similar based on class and tags
            const similar = Data.ARCHETYPES
                .filter(a => a.id !== archetypeId)
                .map(a => {
                    let score = 0;
                    if (a.class_name === arch.class_name) score += 3;
                    const commonTags = a.tags.filter(t => arch.tags.includes(t));
                    score += commonTags.length;
                    return { arch: a, score };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(x => x.arch);

            return { similar };
        }

        return this.request(`/archetypes/${archetypeId}/similar?limit=${limit}`);
    },
};

// Initialize on load
API.init().then(() => {
    console.log(`API initialized: ${API.isAvailable ? 'backend available' : 'using static data'}`);
});
