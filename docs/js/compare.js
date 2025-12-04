/**
 * Build Comparison module - Compare multiple builds side-by-side
 * Allows users to compare stats, costs, and features of different builds
 */

const Compare = {
    // Currently selected builds for comparison
    selectedBuilds: [],

    // Maximum builds to compare
    MAX_COMPARE: 3,

    /**
     * Add a build to comparison
     */
    addToCompare(archetypeId) {
        if (this.selectedBuilds.includes(archetypeId)) {
            return false; // Already in comparison
        }

        if (this.selectedBuilds.length >= this.MAX_COMPARE) {
            // Remove oldest
            this.selectedBuilds.shift();
        }

        this.selectedBuilds.push(archetypeId);
        this.updateCompareUI();
        this.saveSelection();

        return true;
    },

    /**
     * Remove a build from comparison
     */
    removeFromCompare(archetypeId) {
        const index = this.selectedBuilds.indexOf(archetypeId);
        if (index > -1) {
            this.selectedBuilds.splice(index, 1);
            this.updateCompareUI();
            this.saveSelection();
        }
    },

    /**
     * Toggle build in comparison
     */
    toggleCompare(archetypeId) {
        if (this.selectedBuilds.includes(archetypeId)) {
            this.removeFromCompare(archetypeId);
            return false;
        } else {
            return this.addToCompare(archetypeId);
        }
    },

    /**
     * Check if build is in comparison
     */
    isInCompare(archetypeId) {
        return this.selectedBuilds.includes(archetypeId);
    },

    /**
     * Clear all comparison selections
     */
    clearCompare() {
        this.selectedBuilds = [];
        this.updateCompareUI();
        this.saveSelection();
    },

    /**
     * Save selection to session storage
     */
    saveSelection() {
        sessionStorage.setItem('poe2_compare_builds', JSON.stringify(this.selectedBuilds));
    },

    /**
     * Load selection from session storage
     */
    loadSelection() {
        try {
            const saved = sessionStorage.getItem('poe2_compare_builds');
            if (saved) {
                this.selectedBuilds = JSON.parse(saved);
                this.updateCompareUI();
            }
        } catch (e) {
            console.warn('Failed to load comparison selection');
        }
    },

    /**
     * Update the comparison UI elements
     */
    updateCompareUI() {
        // Update compare button states
        document.querySelectorAll('[data-compare-id]').forEach(btn => {
            const id = btn.dataset.compareId;
            const isSelected = this.isInCompare(id);
            btn.classList.toggle('active', isSelected);
            btn.textContent = isSelected ? '✓ Compare' : '+ Compare';
        });

        // Update floating compare bar
        this.updateCompareBar();
    },

    /**
     * Update or create the floating compare bar
     */
    updateCompareBar() {
        let bar = document.getElementById('compare-bar');

        if (this.selectedBuilds.length === 0) {
            if (bar) bar.remove();
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'compare-bar';
            bar.className = 'compare-bar';
            document.body.appendChild(bar);
        }

        const archetypes = this.selectedBuilds
            .map(id => Data.getArchetype(id))
            .filter(Boolean);

        bar.innerHTML = `
            <div class="compare-bar-content">
                <div class="compare-builds-list">
                    ${archetypes.map(arch => `
                        <div class="compare-build-chip">
                            <span class="chip-name">${arch.name}</span>
                            <button class="chip-remove" onclick="Compare.removeFromCompare('${arch.id}')">&times;</button>
                        </div>
                    `).join('')}
                </div>
                <div class="compare-actions">
                    <button class="btn btn-secondary btn-small" onclick="Compare.clearCompare()">Clear</button>
                    <button class="btn btn-primary btn-small" onclick="Compare.showComparison()" ${archetypes.length < 2 ? 'disabled' : ''}>
                        Compare ${archetypes.length} Builds
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Show the comparison modal
     */
    async showComparison() {
        if (this.selectedBuilds.length < 2) return;

        const archetypes = this.selectedBuilds
            .map(id => Data.getArchetype(id))
            .filter(Boolean);

        // Create or get comparison modal
        let modal = document.getElementById('compare-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'compare-modal';
            modal.className = 'modal modal-large';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: var(--container-xl);">
                    <button class="modal-close" onclick="App.closeModal('compare-modal')">&times;</button>
                    <div id="compare-content"></div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    App.closeModal('compare-modal');
                }
            });
        }

        const content = document.getElementById('compare-content');
        content.innerHTML = await this.renderComparison(archetypes);

        App.openModal('compare-modal');
    },

    /**
     * Render the comparison content
     */
    async renderComparison(archetypes) {
        // Get budget tier costs for each
        const costs = await Promise.all(archetypes.map(async arch => {
            const budgetTier = arch.tiers.find(t => t.tier_name === 'Budget') || arch.tiers[0];
            if (!budgetTier) return { budget: 0, mid: 0, endgame: 0 };

            let budgetCost = 0;
            for (const item of budgetTier.items) {
                if (item.is_unique) {
                    try {
                        const price = await Prices.getPrice(item.item_name, item.slot);
                        if (price) budgetCost += price.chaos;
                    } catch (e) {}
                }
            }

            return { budget: budgetCost };
        }));

        const attributes = [
            { key: 'class_name', label: 'Class', format: v => v },
            { key: 'primary_playstyle', label: 'Playstyle', format: v => this.capitalize(v) },
            { key: 'damage_type', label: 'Damage Type', format: v => this.capitalize(v) },
            { key: 'mapping_score', label: 'Mapping', format: v => this.renderScoreBar(v, 10) },
            { key: 'bossing_score', label: 'Bossing', format: v => this.renderScoreBar(v, 10) },
            { key: 'league_start_score', label: 'League Start', format: v => this.renderScoreBar(v, 10) },
            { key: 'complexity', label: 'Complexity', format: v => this.renderComplexity(v) },
            { key: 'budget_cost', label: 'Budget Tier Cost', format: (v, i) => costs[i]?.budget ? `${costs[i].budget.toFixed(0)}c` : 'N/A' }
        ];

        return `
            <h2>Build Comparison</h2>

            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th class="attr-column">Attribute</th>
                            ${archetypes.map(arch => `
                                <th class="build-column">
                                    <div class="build-header-cell">
                                        <span class="build-name">${arch.name}</span>
                                        <button class="btn btn-small btn-secondary" onclick="App.viewArchetype('${arch.id}'); App.closeModal('compare-modal');">
                                            View Details
                                        </button>
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${attributes.map(attr => `
                            <tr>
                                <td class="attr-label">${attr.label}</td>
                                ${archetypes.map((arch, i) => `
                                    <td class="attr-value">${attr.format(arch[attr.key], i)}</td>
                                `).join('')}
                            </tr>
                        `).join('')}

                        <tr class="section-header">
                            <td colspan="${archetypes.length + 1}">Pros</td>
                        </tr>
                        <tr>
                            <td class="attr-label">Strengths</td>
                            ${archetypes.map(arch => `
                                <td class="attr-value pros-list">
                                    <ul>
                                        ${arch.pros.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
                                    </ul>
                                </td>
                            `).join('')}
                        </tr>

                        <tr class="section-header">
                            <td colspan="${archetypes.length + 1}">Cons</td>
                        </tr>
                        <tr>
                            <td class="attr-label">Weaknesses</td>
                            ${archetypes.map(arch => `
                                <td class="attr-value cons-list">
                                    <ul>
                                        ${arch.cons.slice(0, 3).map(c => `<li>${c}</li>`).join('')}
                                    </ul>
                                </td>
                            `).join('')}
                        </tr>

                        <tr class="section-header">
                            <td colspan="${archetypes.length + 1}">Tags</td>
                        </tr>
                        <tr>
                            <td class="attr-label">Build Tags</td>
                            ${archetypes.map(arch => `
                                <td class="attr-value">
                                    <div class="compare-tags">
                                        ${arch.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                    </div>
                                </td>
                            `).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="comparison-summary">
                <h3>Quick Summary</h3>
                <div class="summary-cards">
                    ${this.renderSummaryCards(archetypes, costs)}
                </div>
            </div>
        `;
    },

    /**
     * Render score bar for comparison
     */
    renderScoreBar(value, max) {
        const percent = (value / max) * 100;
        const colorClass = percent >= 80 ? 'high' : percent >= 50 ? 'mid' : 'low';
        return `
            <div class="compare-score">
                <div class="compare-score-bar ${colorClass}">
                    <div class="compare-score-fill" style="width: ${percent}%"></div>
                </div>
                <span class="compare-score-value">${value}/${max}</span>
            </div>
        `;
    },

    /**
     * Render complexity indicator
     */
    renderComplexity(value) {
        const labels = ['Simple', 'Moderate', 'Complex'];
        const label = labels[value - 1] || 'Unknown';
        const dots = '●'.repeat(value) + '○'.repeat(3 - value);
        return `<span class="complexity-indicator" title="${label}">${dots} ${label}</span>`;
    },

    /**
     * Render summary cards
     */
    renderSummaryCards(archetypes, costs) {
        // Find best for each category
        const bestMapping = [...archetypes].sort((a, b) => b.mapping_score - a.mapping_score)[0];
        const bestBossing = [...archetypes].sort((a, b) => b.bossing_score - a.bossing_score)[0];
        const bestLeagueStart = [...archetypes].sort((a, b) => b.league_start_score - a.league_start_score)[0];
        const easiest = [...archetypes].sort((a, b) => a.complexity - b.complexity)[0];

        return `
            <div class="summary-card">
                <div class="summary-icon">🗺️</div>
                <div class="summary-label">Best for Mapping</div>
                <div class="summary-value">${bestMapping.name}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">💀</div>
                <div class="summary-label">Best for Bossing</div>
                <div class="summary-value">${bestBossing.name}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">🚀</div>
                <div class="summary-label">Best League Starter</div>
                <div class="summary-value">${bestLeagueStart.name}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">✨</div>
                <div class="summary-label">Easiest to Play</div>
                <div class="summary-value">${easiest.name}</div>
            </div>
        `;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Initialize comparison module
     */
    init() {
        this.loadSelection();
        console.log('Compare: Module initialized');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Compare.init());
} else {
    Compare.init();
}
