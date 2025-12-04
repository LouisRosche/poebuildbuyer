/**
 * Analytics module - User engagement tracking
 * Tracks click-throughs on items and external links for engagement monitoring
 */

const Analytics = {
    // Storage key for analytics data
    STORAGE_KEY: 'poe2_build_analytics',

    // Maximum events to store (prevent unbounded growth)
    MAX_EVENTS: 10000,

    // Current session ID
    sessionId: null,

    // Session start time
    sessionStart: null,

    /**
     * Initialize analytics
     */
    init() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.trackEvent('session', 'start', { referrer: document.referrer });
        console.log('Analytics: Initialized, session:', this.sessionId);

        // Track session end on page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session', 'end', {
                duration: Date.now() - this.sessionStart
            });
        });
    },

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Track a click event on an item/link
     */
    trackClick(itemName, destination, context = 'unknown') {
        const event = {
            type: 'click',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: {
                item: itemName,
                destination: destination,
                context: context,
                page: window.location.pathname
            }
        };

        this.saveEvent(event);
        this.updateAggregates(itemName, destination);

        console.log('Analytics: Click tracked', event.data);
    },

    /**
     * Track a general event
     */
    trackEvent(category, action, data = {}) {
        const event = {
            type: category,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: {
                action: action,
                ...data
            }
        };

        this.saveEvent(event);
    },

    /**
     * Track build view
     */
    trackBuildView(buildId, buildName, source = 'unknown') {
        this.trackEvent('build', 'view', {
            buildId,
            buildName,
            source
        });
    },

    /**
     * Track recommendation interaction
     */
    trackRecommendation(action, archetype, tier = null) {
        this.trackEvent('recommendation', action, {
            archetype,
            tier
        });
    },

    /**
     * Track interview completion
     */
    trackInterviewComplete(responses) {
        this.trackEvent('interview', 'complete', {
            responseCount: Object.keys(responses).length,
            class: responses.class,
            budget: responses.budget,
            playstyle: responses.playstyle
        });
    },

    /**
     * Save event to storage
     */
    saveEvent(event) {
        try {
            const data = this.loadData();
            data.events.push(event);

            // Trim old events if over limit
            if (data.events.length > this.MAX_EVENTS) {
                data.events = data.events.slice(-this.MAX_EVENTS);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Analytics: Failed to save event', e);
        }
    },

    /**
     * Update aggregate statistics
     */
    updateAggregates(itemName, destination) {
        try {
            const data = this.loadData();

            // Item click counts
            if (!data.aggregates.itemClicks[itemName]) {
                data.aggregates.itemClicks[itemName] = { total: 0, byDestination: {} };
            }
            data.aggregates.itemClicks[itemName].total++;
            data.aggregates.itemClicks[itemName].byDestination[destination] =
                (data.aggregates.itemClicks[itemName].byDestination[destination] || 0) + 1;

            // Destination totals
            data.aggregates.destinationClicks[destination] =
                (data.aggregates.destinationClicks[destination] || 0) + 1;

            // Total clicks
            data.aggregates.totalClicks++;

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Analytics: Failed to update aggregates', e);
        }
    },

    /**
     * Load analytics data from storage
     */
    loadData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Analytics: Failed to load data', e);
        }

        // Return default structure
        return {
            version: 1,
            events: [],
            aggregates: {
                itemClicks: {},
                destinationClicks: {},
                totalClicks: 0
            }
        };
    },

    /**
     * Get engagement report
     */
    getReport() {
        const data = this.loadData();

        // Calculate top items
        const topItems = Object.entries(data.aggregates.itemClicks)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 20);

        // Calculate destination breakdown
        const destinations = Object.entries(data.aggregates.destinationClicks)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Recent events
        const recentEvents = data.events.slice(-100).reverse();

        // Session stats
        const sessions = new Set(data.events.map(e => e.sessionId)).size;

        return {
            summary: {
                totalClicks: data.aggregates.totalClicks,
                uniqueItems: Object.keys(data.aggregates.itemClicks).length,
                totalSessions: sessions,
                eventsRecorded: data.events.length
            },
            topItems,
            destinations,
            recentEvents
        };
    },

    /**
     * Get click stats for a specific item
     */
    getItemStats(itemName) {
        const data = this.loadData();
        return data.aggregates.itemClicks[itemName] || { total: 0, byDestination: {} };
    },

    /**
     * Export analytics data as JSON
     */
    exportData() {
        const data = this.loadData();
        const report = this.getReport();

        return {
            exportDate: new Date().toISOString(),
            raw: data,
            report: report
        };
    },

    /**
     * Export as downloadable file
     */
    downloadReport() {
        const data = this.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `poe2-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Clear all analytics data
     */
    clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Analytics: Data cleared');
    },

    /**
     * Get daily click trend (last 30 days)
     */
    getDailyTrend() {
        const data = this.loadData();
        const days = {};
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Initialize last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(now - (i * 24 * 60 * 60 * 1000));
            const key = date.toISOString().split('T')[0];
            days[key] = 0;
        }

        // Count clicks per day
        data.events
            .filter(e => e.type === 'click' && e.timestamp > thirtyDaysAgo)
            .forEach(e => {
                const key = new Date(e.timestamp).toISOString().split('T')[0];
                if (days[key] !== undefined) {
                    days[key]++;
                }
            });

        return Object.entries(days)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Get popular search destinations
     */
    getPopularDestinations() {
        const data = this.loadData();

        return Object.entries(data.aggregates.destinationClicks)
            .map(([destination, count]) => {
                const sourceInfo = Tooltips?.SOURCES?.[destination] || { name: destination };
                return {
                    id: destination,
                    name: sourceInfo.name,
                    count,
                    percentage: data.aggregates.totalClicks > 0
                        ? ((count / data.aggregates.totalClicks) * 100).toFixed(1)
                        : 0
                };
            })
            .sort((a, b) => b.count - a.count);
    }
};

// Initialize on load
Analytics.init();
