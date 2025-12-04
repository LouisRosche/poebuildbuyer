/**
 * Main Application Controller
 * PoE2 Build Planner & Price Tracker - Static Version
 */

const App = {
    // Current state
    currentTab: 'interview',
    currentArchetype: null,
    currencyRates: null,
    priceStatus: 'fresh', // 'fresh', 'stale', 'error'
    lastPriceUpdate: null,
    searchQuery: '',
    activeFilters: [],

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing PoE2 Build Planner...');

        // Initialize storage
        Storage.init();

        // Initialize prices module
        Prices.init();

        // Load currency rates
        this.loadCurrencyRates();

        // Set up event listeners
        this.setupEventListeners();

        // Render initial UI
        this.render();

        // Show interview tab by default
        this.showTab('interview');

        console.log('App initialized successfully');
    },

    /**
     * Load currency exchange rates
     */
    async loadCurrencyRates() {
        try {
            this.currencyRates = await Prices.getCurrencyRates();
            this.priceStatus = 'fresh';
            this.lastPriceUpdate = new Date();
        } catch (error) {
            console.error('Failed to load currency rates:', error);
            this.currencyRates = { divine: 200, exalted: 20, chaos: 1 };
            this.priceStatus = 'error';
        }
        this.updatePriceStatusUI();
    },

    /**
     * Update price status indicator in UI
     */
    updatePriceStatusUI() {
        const container = document.getElementById('price-status');
        if (!container) return;

        const statusText = this.priceStatus === 'fresh'
            ? 'Prices updated'
            : this.priceStatus === 'stale'
                ? 'Prices may be outdated'
                : 'Using cached prices';

        const timeText = this.lastPriceUpdate
            ? this.formatTimeAgo(this.lastPriceUpdate)
            : '';

        container.innerHTML = `
            <span class="price-status-dot ${this.priceStatus}"></span>
            <span>${statusText}${timeText ? ` (${timeText})` : ''}</span>
            <button class="refresh-btn" onclick="App.refreshPrices()" title="Refresh prices">
                ↻
            </button>
        `;
    },

    /**
     * Format time ago
     */
    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTab(btn.dataset.tab);
            });
        });

        // League selector
        const leagueSelect = document.getElementById('league-select');
        if (leagueSelect) {
            leagueSelect.addEventListener('change', (e) => {
                Prices.setLeague(e.target.value);
                this.refreshPrices();
            });
        }

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    },

    /**
     * Render the application
     */
    render() {
        // Initialize interview
        Interview.render();

        // Load archetypes
        this.loadArchetypes();

        // Load builds
        this.loadBuilds();
    },

    /**
     * Show a tab
     */
    showTab(tabId) {
        this.currentTab = tabId;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });

        // Refresh tab content
        if (tabId === 'interview') {
            Interview.render();
        } else if (tabId === 'archetypes') {
            this.renderArchetypes();
        } else if (tabId === 'builds') {
            this.renderBuilds();
        }
    },

    /**
     * Load and render archetypes
     */
    loadArchetypes() {
        this.renderArchetypes();
    },

    /**
     * Get unique classes from archetypes
     */
    getUniqueClasses() {
        return [...new Set(Data.ARCHETYPES.map(a => a.class_name))].sort();
    },

    /**
     * Filter archetypes based on search and filters
     */
    getFilteredArchetypes() {
        let archetypes = Data.ARCHETYPES;

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            archetypes = archetypes.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.class_name.toLowerCase().includes(query) ||
                a.description.toLowerCase().includes(query) ||
                a.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        // Apply class filters
        if (this.activeFilters.length > 0) {
            archetypes = archetypes.filter(a =>
                this.activeFilters.includes(a.class_name)
            );
        }

        return archetypes;
    },

    /**
     * Handle search input
     */
    handleSearch(value) {
        this.searchQuery = value;
        this.renderArchetypesGrid();
    },

    /**
     * Toggle class filter
     */
    toggleFilter(className) {
        const index = this.activeFilters.indexOf(className);
        if (index >= 0) {
            this.activeFilters.splice(index, 1);
        } else {
            this.activeFilters.push(className);
        }
        this.renderArchetypes();
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this.searchQuery = '';
        this.activeFilters = [];
        this.renderArchetypes();
    },

    /**
     * Render archetypes grid
     */
    renderArchetypes() {
        const container = document.getElementById('archetypes-grid');
        if (!container) return;

        // Render search/filter bar
        const classes = this.getUniqueClasses();
        const headerHtml = `
            <div class="search-filter-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text"
                           class="search-input"
                           placeholder="Search builds..."
                           value="${this.escapeHtml(this.searchQuery)}"
                           oninput="App.handleSearch(this.value)">
                </div>
                <div class="filter-buttons">
                    ${classes.map(c => `
                        <button class="filter-btn ${this.activeFilters.includes(c) ? 'active' : ''}"
                                onclick="App.toggleFilter('${this.escapeHtml(c)}')">
                            ${this.escapeHtml(c)}
                        </button>
                    `).join('')}
                    ${(this.searchQuery || this.activeFilters.length > 0) ? `
                        <button class="clear-filters" onclick="App.clearFilters()">Clear all</button>
                    ` : ''}
                </div>
            </div>
        `;

        // Get wrapper or create it
        let wrapper = document.getElementById('archetypes-wrapper');
        if (!wrapper) {
            container.parentElement.insertBefore(
                Object.assign(document.createElement('div'), {
                    id: 'archetypes-wrapper',
                    innerHTML: headerHtml
                }),
                container
            );
            wrapper = document.getElementById('archetypes-wrapper');
        } else {
            // Update just the filter bar
            const existingBar = wrapper.querySelector('.search-filter-bar');
            if (existingBar) {
                existingBar.outerHTML = headerHtml;
            }
        }

        this.renderArchetypesGrid();
    },

    /**
     * Render just the archetypes grid (without search bar)
     */
    renderArchetypesGrid() {
        const container = document.getElementById('archetypes-grid');
        if (!container) return;

        const archetypes = this.getFilteredArchetypes();

        if (archetypes.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No builds found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button class="btn btn-secondary" onclick="App.clearFilters()">Clear filters</button>
                </div>
            `;
            return;
        }

        container.innerHTML = archetypes.map(arch => `
            <div class="archetype-card" onclick="App.viewArchetype('${arch.id}')">
                <h3 class="arch-name">${this.escapeHtml(arch.name)}</h3>
                <div class="arch-class">${this.escapeHtml(arch.class_name)}</div>

                <div class="arch-scores">
                    <div class="score-badge" title="Mapping">
                        <span class="score-icon">🗺️</span>
                        <span class="score-value">${arch.mapping_score}/10</span>
                    </div>
                    <div class="score-badge" title="Bossing">
                        <span class="score-icon">💀</span>
                        <span class="score-value">${arch.bossing_score}/10</span>
                    </div>
                    <div class="score-badge" title="League Start">
                        <span class="score-icon">🚀</span>
                        <span class="score-value">${arch.league_start_score}/10</span>
                    </div>
                </div>

                <p class="arch-desc">${this.escapeHtml(arch.description.substring(0, 120))}...</p>

                <div class="arch-tags">
                    ${arch.tags.slice(0, 3).map(tag =>
                        `<span class="tag">${this.escapeHtml(tag)}</span>`
                    ).join('')}
                </div>

                <div class="arch-tiers">
                    ${arch.tiers.length} budget tier${arch.tiers.length > 1 ? 's' : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * View archetype details
     */
    async viewArchetype(id) {
        const archetype = Data.getArchetype(id);
        if (!archetype) return;

        this.currentArchetype = archetype;

        const modal = document.getElementById('archetype-modal');
        const content = document.getElementById('archetype-detail');
        if (!modal || !content) return;

        // Generate skeleton items for loading state
        const skeletonItems = Array(5).fill(0).map(() => `
            <div class="skeleton-item">
                <div class="skeleton skeleton-name"></div>
                <div class="skeleton skeleton-price"></div>
            </div>
        `).join('');

        const skeletonTier = `
            <div class="tier-card">
                <div class="skeleton skeleton-text" style="width: 40%"></div>
                <div class="skeleton skeleton-text-sm"></div>
                <div class="tier-items-skeleton">${skeletonItems}</div>
            </div>
        `;

        // Render basic info first with skeleton loading for prices
        content.innerHTML = `
            <div class="archetype-header">
                <h2>${this.escapeHtml(archetype.name)}</h2>
                <span class="arch-class-badge">${this.escapeHtml(archetype.class_name)}</span>
            </div>

            <div class="archetype-scores-large">
                <div class="score-item">
                    <span class="score-label">Mapping</span>
                    <div class="score-bar-large">
                        <div class="score-fill" style="width: ${archetype.mapping_score * 10}%"></div>
                    </div>
                    <span class="score-num">${archetype.mapping_score}/10</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Bossing</span>
                    <div class="score-bar-large">
                        <div class="score-fill" style="width: ${archetype.bossing_score * 10}%"></div>
                    </div>
                    <span class="score-num">${archetype.bossing_score}/10</span>
                </div>
                <div class="score-item">
                    <span class="score-label">League Start</span>
                    <div class="score-bar-large">
                        <div class="score-fill" style="width: ${archetype.league_start_score * 10}%"></div>
                    </div>
                    <span class="score-num">${archetype.league_start_score}/10</span>
                </div>
            </div>

            <p class="archetype-description">${this.escapeHtml(archetype.description)}</p>

            ${archetype.guide_url ? `
                <div class="external-link">
                    <a href="${this.escapeHtml(archetype.guide_url)}" target="_blank" class="btn btn-secondary">
                        View Full Guide ↗
                    </a>
                </div>
            ` : ''}

            <div class="pros-cons">
                <div class="pros">
                    <h4>Pros</h4>
                    <ul>
                        ${archetype.pros.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>
                <div class="cons">
                    <h4>Cons</h4>
                    <ul>
                        ${archetype.cons.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="archetype-notes">
                <h4>Playstyle</h4>
                <p>${this.escapeHtml(archetype.playstyle_notes)}</p>

                <h4>Leveling</h4>
                <p>${this.escapeHtml(archetype.leveling_notes)}</p>
            </div>

            <div class="budget-tiers">
                <h3>Budget Tiers</h3>
                <div id="price-status" class="price-status"></div>
                <div class="tiers-grid">
                    ${archetype.tiers.map(() => skeletonTier).join('')}
                </div>
            </div>
        `;

        this.updatePriceStatusUI();

        this.openModal('archetype-modal');

        // Load prices for tiers
        await this.loadTierPrices(archetype);
    },

    /**
     * Load prices for archetype tiers
     */
    async loadTierPrices(archetype) {
        const tiersContainer = document.querySelector('.budget-tiers');
        if (!tiersContainer) return;

        let hasErrors = false;

        const tiersHtml = await Promise.all(archetype.tiers.map(async tier => {
            // Get prices for this tier
            let itemsHtml = '';
            let totalCost = 0;
            let pricesFound = 0;

            for (const item of tier.items) {
                let priceHtml = '';
                if (item.is_unique) {
                    try {
                        const price = await Prices.getPrice(item.item_name, item.slot);
                        if (price) {
                            totalCost += price.chaos;
                            pricesFound++;
                            const changeHtml = price.change
                                ? `<span class="${price.change > 0 ? 'price-up' : 'price-down'}">${price.change > 0 ? '+' : ''}${price.change.toFixed(0)}%</span>`
                                : '';
                            priceHtml = `<span class="item-price">${Prices.formatPrice(price.chaos, this.currencyRates)} ${changeHtml}</span>`;
                        } else {
                            priceHtml = `<span class="item-price price-unavailable">Price N/A</span>`;
                        }
                    } catch (error) {
                        hasErrors = true;
                        priceHtml = `<span class="item-price error-inline">Failed to load</span>`;
                    }
                } else {
                    priceHtml = `<span class="item-price rare">Rare - varies</span>`;
                }

                itemsHtml += `
                    <div class="tier-item">
                        <span class="item-slot">${this.escapeHtml(item.slot)}</span>
                        <span class="item-name ${item.is_unique ? 'unique' : 'rare'}">${this.escapeHtml(item.item_name)}</span>
                        ${priceHtml}
                    </div>
                `;
            }

            const uniqueCount = tier.items.filter(i => i.is_unique).length;
            const coveragePercent = uniqueCount > 0 ? Math.round((pricesFound / uniqueCount) * 100) : 100;

            return `
                <div class="tier-card">
                    <div class="tier-header">
                        <h4>${this.escapeHtml(tier.tier_name)}</h4>
                        <span class="tier-budget">${this.formatBudget(tier.min_budget, tier.max_budget)}</span>
                    </div>
                    <p class="tier-desc">${this.escapeHtml(tier.description)}</p>

                    <div class="tier-items">
                        ${itemsHtml}
                    </div>

                    <div class="tier-total">
                        <span>Estimated Total:</span>
                        <span class="total-price">${Prices.formatPrice(totalCost, this.currencyRates)}</span>
                        ${coveragePercent < 100 ? `<span class="price-coverage">(${coveragePercent}% priced)</span>` : ''}
                    </div>

                    ${tier.upgrade_notes ? `
                        <div class="tier-upgrade">
                            <strong>Next upgrades:</strong> ${this.escapeHtml(tier.upgrade_notes)}
                        </div>
                    ` : ''}

                    <button class="btn btn-primary btn-small" onclick="App.createBuildFromTier('${archetype.id}', ${tier.tier_order})">
                        Create Build from This Tier
                    </button>
                </div>
            `;
        }));

        if (hasErrors) {
            this.priceStatus = 'error';
            this.updatePriceStatusUI();
        }

        tiersContainer.innerHTML = `
            <h3>Budget Tiers</h3>
            <div id="price-status" class="price-status"></div>
            <div class="tiers-grid">
                ${tiersHtml.join('')}
            </div>
        `;

        this.updatePriceStatusUI();
    },

    /**
     * Create a build from an archetype tier
     */
    createBuildFromTier(archetypeId, tierOrder) {
        const archetype = Data.getArchetype(archetypeId);
        if (!archetype) return;

        const tier = archetype.tiers.find(t => t.tier_order === tierOrder);
        if (!tier) return;

        const build = {
            id: Storage.generateId(),
            name: `${archetype.name} (${tier.tier_name})`,
            class_name: archetype.class_name,
            description: `${archetype.description}\n\nTier: ${tier.tier_name}\n${tier.description}`,
            items: tier.items.map(item => ({
                ...item,
                id: Storage.generateId()
            })),
            archetypeId: archetype.id,
            tierOrder: tier.tier_order,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Storage.saveBuild(build);
        this.closeModal('archetype-modal');
        this.showTab('builds');
        this.showNotification(`Build "${build.name}" created!`);
    },

    /**
     * Load and render user builds
     */
    loadBuilds() {
        this.renderBuilds();
    },

    /**
     * Render builds list
     */
    renderBuilds() {
        const container = document.getElementById('builds-list');
        if (!container) return;

        const builds = Storage.getBuilds();

        if (builds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Builds Yet</h3>
                    <p>Create a build from an archetype or start from scratch.</p>
                    <button class="btn btn-primary" onclick="App.showTab('interview')">
                        Find a Build
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = builds.map(build => `
            <div class="build-card" onclick="App.viewBuild('${build.id}')">
                <div class="build-header">
                    <h3>${this.escapeHtml(build.name)}</h3>
                    <span class="build-class">${this.escapeHtml(build.class_name || 'Unknown')}</span>
                </div>
                <p class="build-desc">${this.escapeHtml((build.description || '').substring(0, 100))}...</p>
                <div class="build-meta">
                    <span>${build.items ? build.items.length : 0} items</span>
                    <span>Updated ${this.formatDate(build.updatedAt)}</span>
                </div>
                <div class="build-actions">
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); App.viewBuild('${build.id}')">
                        View
                    </button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); App.deleteBuild('${build.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * View build details
     */
    async viewBuild(id) {
        const build = Storage.getBuild(id);
        if (!build) return;

        const modal = document.getElementById('build-modal');
        const content = document.getElementById('build-detail');
        if (!modal || !content) return;

        // Calculate prices
        let totalCost = 0;
        const itemsWithPrices = await Promise.all((build.items || []).map(async item => {
            if (item.is_unique) {
                const price = await Prices.getPrice(item.item_name, item.slot);
                if (price) {
                    totalCost += price.chaos;
                    return { ...item, price: price.chaos };
                }
            }
            return { ...item, price: null };
        }));

        content.innerHTML = `
            <div class="build-header">
                <h2>${this.escapeHtml(build.name)}</h2>
                <span class="build-class-badge">${this.escapeHtml(build.class_name || 'Unknown')}</span>
            </div>

            <div class="build-description">
                <p>${this.escapeHtml(build.description || 'No description')}</p>
            </div>

            <div class="build-items">
                <h3>Items</h3>
                <div class="items-grid">
                    ${itemsWithPrices.map(item => `
                        <div class="build-item">
                            <span class="item-slot">${this.escapeHtml(item.slot)}</span>
                            <span class="item-name ${item.is_unique ? 'unique' : 'rare'}">${this.escapeHtml(item.item_name)}</span>
                            <span class="item-price">${item.price ? Prices.formatPrice(item.price, this.currencyRates) : 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="build-total">
                <span>Total Estimated Cost:</span>
                <span class="total-value">${Prices.formatPrice(totalCost, this.currencyRates)}</span>
            </div>

            <div class="build-actions">
                <button class="btn btn-secondary" onclick="App.exportBuild('${build.id}')">
                    Export JSON
                </button>
                <button class="btn btn-danger" onclick="App.deleteBuild('${build.id}'); App.closeModal('build-modal')">
                    Delete Build
                </button>
            </div>
        `;

        this.openModal('build-modal');
    },

    /**
     * Delete a build
     */
    deleteBuild(id) {
        if (confirm('Are you sure you want to delete this build?')) {
            Storage.deleteBuild(id);
            this.renderBuilds();
            this.showNotification('Build deleted');
        }
    },

    /**
     * Export build as JSON
     */
    exportBuild(id) {
        const build = Storage.getBuild(id);
        if (!build) return;

        const json = JSON.stringify(build, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${build.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Export all data
     */
    exportAllData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'poe2_builds_export.json';
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully');
    },

    /**
     * Import data from file
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                Storage.importData(data);
                this.render();
                this.showNotification('Data imported successfully');
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Failed to import data', 'error');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Refresh prices
     */
    async refreshPrices() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }

        try {
            // Clear price cache
            Storage.set(Storage.KEYS.PRICE_CACHE, { prices: {}, timestamp: 0 });

            // Reload currency rates
            await this.loadCurrencyRates();

            this.showNotification('Prices refreshed');

            // Re-render current view if showing prices
            if (this.currentTab === 'builds') {
                this.renderBuilds();
            }

            // Reload tier prices if archetype modal is open
            if (this.currentArchetype && document.getElementById('archetype-modal').classList.contains('active')) {
                await this.loadTierPrices(this.currentArchetype);
            }
        } catch (error) {
            this.priceStatus = 'error';
            this.showNotification('Failed to refresh prices', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        }
    },

    /**
     * Open a modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    },

    /**
     * Close a modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Format budget range
     */
    formatBudget(min, max) {
        if (max === null || max === undefined) {
            return `${(min || 0).toLocaleString()}+ chaos`;
        }
        return `${(min || 0).toLocaleString()} - ${max.toLocaleString()} chaos`;
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
