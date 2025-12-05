/**
 * Item Panel module - Fixed side panel for item details
 * Shows item info, prices, and source links without blocking other content
 * Replaces hover tooltips with a click-to-open panel
 */

const ItemPanel = {
    // Source of truth URLs for PoE2 items
    SOURCES: {
        wiki: {
            name: 'PoE2 Wiki',
            baseUrl: 'https://www.poe2wiki.net/wiki/',
            icon: 'book',
            description: 'Detailed item information and mechanics'
        },
        trade: {
            name: 'PoE2 Trade',
            baseUrl: 'https://www.pathofexile.com/trade2/search/poe2/Standard',
            icon: 'shopping-cart',
            description: 'Search for this item on trade site'
        },
        ninja: {
            name: 'poe.ninja',
            baseUrl: 'https://poe.ninja/poe2/standard/',
            icon: 'chart-line',
            description: 'Price history and market trends'
        }
    },

    // Map slots to poe.ninja categories
    NINJA_CATEGORIES: {
        weapon: 'unique-weapons',
        offhand: 'unique-armours', // shields are armour
        body: 'unique-armours',
        helmet: 'unique-armours',
        gloves: 'unique-armours',
        boots: 'unique-armours',
        belt: 'unique-accessories',
        amulet: 'unique-accessories',
        ring1: 'unique-accessories',
        ring2: 'unique-accessories',
        jewel1: 'unique-jewels',
        jewel2: 'unique-jewels',
        jewel3: 'unique-jewels',
        flask: 'unique-flasks',
        quiver: 'unique-armours'
    },

    // Panel element
    panelElement: null,

    // Currently displayed item
    currentItem: null,

    // Panel open state
    isOpen: false,

    /**
     * Initialize the item panel system
     */
    init() {
        this.createPanelElement();
        this.attachGlobalListeners();
        console.log('ItemPanel: Initialized (click items to view details)');
    },

    /**
     * Create the panel DOM element
     */
    createPanelElement() {
        const existing = document.getElementById('item-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'item-panel';
        panel.className = 'item-panel';
        panel.innerHTML = `
            <div class="item-panel-header">
                <h3 class="item-panel-title">Item Details</h3>
                <button class="item-panel-close" onclick="ItemPanel.close()" aria-label="Close">&times;</button>
            </div>
            <div class="item-panel-content">
                <div class="item-panel-placeholder">
                    <p>Click on any item name to view details and external links.</p>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panelElement = panel;
    },

    /**
     * Attach global event listeners
     */
    attachGlobalListeners() {
        // Click on items with tooltip data
        document.addEventListener('click', (e) => {
            const itemEl = e.target.closest('[data-item-tooltip]');
            if (itemEl) {
                e.preventDefault();
                e.stopPropagation();
                this.showItem(itemEl);
            }
        });

        // Close panel when clicking outside (but not on the panel itself)
        document.addEventListener('click', (e) => {
            if (this.isOpen &&
                !e.target.closest('#item-panel') &&
                !e.target.closest('[data-item-tooltip]')) {
                // Don't auto-close - let user explicitly close
                // this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * Show item details in the panel
     */
    async showItem(element) {
        const itemName = element.dataset.itemName;
        const itemSlot = element.dataset.itemSlot || '';
        const isUnique = element.dataset.itemUnique === 'true';

        if (!itemName) return;

        this.currentItem = { name: itemName, slot: itemSlot, isUnique };
        this.open();

        // Show loading state
        const content = this.panelElement.querySelector('.item-panel-content');
        content.innerHTML = `
            <div class="item-panel-loading">
                <div class="loading-spinner"></div>
                <p>Loading item data...</p>
            </div>
        `;

        // Fetch price data
        let priceData = null;
        if (isUnique) {
            try {
                priceData = await Prices.getPrice(itemName, itemSlot);
            } catch (e) {
                console.warn('Could not fetch price:', e);
            }
        }

        // Render content
        this.renderContent(itemName, itemSlot, isUnique, priceData);

        // Track view
        if (typeof Analytics !== 'undefined') {
            Analytics.trackClick(itemName, 'panel-view', 'item-panel');
        }
    },

    /**
     * Render panel content
     */
    renderContent(itemName, slot, isUnique, priceData) {
        const content = this.panelElement.querySelector('.item-panel-content');
        const slotDisplay = this.formatSlot(slot);

        let priceHtml = '';
        if (priceData && priceData.chaos) {
            const changeHtml = priceData.change
                ? `<div class="panel-price-change ${priceData.change > 0 ? 'up' : 'down'}">
                     ${priceData.change > 0 ? '↑' : '↓'} ${Math.abs(priceData.change).toFixed(1)}% this week
                   </div>`
                : '';

            priceHtml = `
                <div class="panel-price-section">
                    <div class="panel-price-label">Estimated Price</div>
                    <div class="panel-price-value">${Prices.formatPrice(priceData.chaos)}${priceData.isEstimate ? ' <span class="estimate-tag">(est.)</span>' : ''}</div>
                    ${changeHtml}
                    ${priceData.listingCount ? `<div class="panel-listings">${priceData.listingCount} listings</div>` : ''}
                </div>
            `;
        }

        content.innerHTML = `
            <div class="panel-item-header">
                <div class="panel-item-name ${isUnique ? 'unique' : 'rare'}">${this.escapeHtml(itemName)}</div>
                ${slotDisplay ? `<div class="panel-item-slot">${slotDisplay}</div>` : ''}
                <div class="panel-item-rarity">${isUnique ? 'Unique Item' : 'Rare Item'}</div>
            </div>

            ${priceHtml}

            <div class="panel-sources">
                <div class="panel-sources-title">External Resources</div>
                <div class="panel-source-list">
                    ${this.renderSourceLinks(itemName, isUnique, slot)}
                </div>
            </div>

            <div class="panel-actions">
                <button class="btn btn-secondary btn-small" onclick="ItemPanel.copyItemName()">
                    Copy Name
                </button>
            </div>

            <div class="panel-help">
                <p>Click any link above to open in a new tab. Use the search bar on trade sites to find this exact item.</p>
            </div>
        `;
    },

    /**
     * Render source links
     */
    renderSourceLinks(itemName, isUnique, slot = '') {
        return Object.entries(this.SOURCES).map(([sourceId, source]) => {
            const url = this.getSourceUrl(itemName, sourceId, slot);
            return `
                <a href="${url}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="panel-source-link"
                   onclick="ItemPanel.trackClick('${this.escapeHtml(itemName)}', '${sourceId}')">
                    <span class="source-icon">${this.getIcon(source.icon)}</span>
                    <div class="source-info">
                        <span class="source-name">${source.name}</span>
                        <span class="source-desc">${source.description}</span>
                    </div>
                    <span class="source-arrow">→</span>
                </a>
            `;
        }).join('');
    },

    /**
     * Get URL for a source - with corrected formats
     * @param {string} itemName - Name of the item
     * @param {string} sourceId - Source identifier (wiki, trade, ninja)
     * @param {string} slot - Item slot for category mapping
     */
    getSourceUrl(itemName, sourceId, slot = '') {
        const source = this.SOURCES[sourceId];
        if (!source) return '#';

        // Wiki uses underscores for spaces, preserves capitalization
        const wikiName = itemName.replace(/ /g, '_');
        // URL encode for safe inclusion
        const encodedName = encodeURIComponent(itemName);

        switch (sourceId) {
            case 'wiki':
                // Wiki format: Tabula_Rasa (underscores, capitalized)
                // Using poe2wiki.net which has PoE2-specific content
                return `${source.baseUrl}${encodeURIComponent(wikiName)}`;

            case 'trade':
                // Trade site - link to search page
                // Note: The trade API uses POST with JSON body for searches
                // Direct URL linking isn't supported, so we provide the base URL
                // User can use the "Copy Name" button and paste in search
                return source.baseUrl;

            case 'ninja':
                // poe.ninja PoE2 - link to the correct category based on slot
                // Format: https://poe.ninja/poe2/standard/unique-armours
                const category = this.NINJA_CATEGORIES[slot] || this.guessNinjaCategory(itemName);
                return `${source.baseUrl}${category}`;

            default:
                return '#';
        }
    },

    /**
     * Guess the poe.ninja category based on item name patterns
     */
    guessNinjaCategory(itemName) {
        const name = itemName.toLowerCase();

        // Weapons by type suffix
        if (name.includes('wand') || name.includes('sceptre') || name.includes('staff') ||
            name.includes('bow') || name.includes('crossbow') || name.includes('mace') ||
            name.includes('sword') || name.includes('dagger') || name.includes('spear') ||
            name.includes('axe') || name.includes('quarterstaff')) {
            return 'unique-weapons';
        }

        // Accessories
        if (name.includes('ring') || name.includes('amulet') || name.includes('belt')) {
            return 'unique-accessories';
        }

        // Jewels
        if (name.includes('jewel')) {
            return 'unique-jewels';
        }

        // Flasks
        if (name.includes('flask')) {
            return 'unique-flasks';
        }

        // Default to armours (most common)
        return 'unique-armours';
    },

    /**
     * Track click on source link
     */
    trackClick(itemName, sourceId) {
        if (typeof Analytics !== 'undefined') {
            Analytics.trackClick(itemName, sourceId, 'panel-link');
        }
    },

    /**
     * Copy item name to clipboard
     */
    async copyItemName() {
        if (!this.currentItem) return;

        try {
            await navigator.clipboard.writeText(this.currentItem.name);
            this.showCopyFeedback();
        } catch (e) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentItem.name;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyFeedback();
        }
    },

    /**
     * Show copy feedback
     */
    showCopyFeedback() {
        const btn = this.panelElement.querySelector('.panel-actions .btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 1500);
        }
    },

    /**
     * Open the panel
     */
    open() {
        if (this.panelElement) {
            this.panelElement.classList.add('open');
            this.isOpen = true;
            document.body.classList.add('item-panel-open');
        }
    },

    /**
     * Close the panel
     */
    close() {
        if (this.panelElement) {
            this.panelElement.classList.remove('open');
            this.isOpen = false;
            document.body.classList.remove('item-panel-open');
            this.currentItem = null;
        }
    },

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * Format slot name for display
     */
    formatSlot(slot) {
        if (!slot) return '';

        const slotNames = {
            weapon: 'Weapon',
            offhand: 'Off-hand',
            body: 'Body Armour',
            helmet: 'Helmet',
            gloves: 'Gloves',
            boots: 'Boots',
            belt: 'Belt',
            amulet: 'Amulet',
            ring1: 'Ring',
            ring2: 'Ring',
            jewel1: 'Jewel',
            jewel2: 'Jewel',
            jewel3: 'Jewel',
            flask: 'Flask'
        };

        return slotNames[slot] || slot;
    },

    /**
     * Get SVG icon
     */
    getIcon(iconName) {
        const icons = {
            'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
            'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
            'chart-line': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-6 6"/></svg>'
        };

        return icons[iconName] || '';
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Alias for backwards compatibility with existing data-item-tooltip attributes
const Tooltips = ItemPanel;

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ItemPanel.init());
} else {
    ItemPanel.init();
}
