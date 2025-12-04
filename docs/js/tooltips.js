/**
 * Tooltips module - Rich item tooltips with source links and tracking
 * Provides hover tooltips for items with links to wiki, trade, and database
 */

const Tooltips = {
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
            baseUrl: 'https://www.pathofexile.com/trade2/search/poe2/Standard?q=',
            icon: 'shopping-cart',
            description: 'Buy this item from other players'
        },
        poedb: {
            name: 'PoE2DB',
            baseUrl: 'https://poe2db.tw/us/',
            icon: 'database',
            description: 'Database with drop locations and stats'
        },
        ninja: {
            name: 'poe.ninja',
            baseUrl: 'https://poe.ninja/economy/poe2/',
            icon: 'chart-line',
            description: 'Price history and trends'
        }
    },

    // Current tooltip element
    tooltipElement: null,

    // Debounce timer for hide
    hideTimer: null,

    // Currently shown item
    currentItem: null,

    /**
     * Initialize tooltip system
     */
    init() {
        this.createTooltipElement();
        this.attachGlobalListeners();
        console.log('Tooltips: Initialized');
    },

    /**
     * Create the tooltip DOM element
     */
    createTooltipElement() {
        // Remove existing tooltip if any
        const existing = document.getElementById('item-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.id = 'item-tooltip';
        tooltip.className = 'item-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-item-name"></span>
                <span class="tooltip-item-type"></span>
            </div>
            <div class="tooltip-price-section">
                <div class="tooltip-price"></div>
                <div class="tooltip-price-change"></div>
            </div>
            <div class="tooltip-sources">
                <div class="tooltip-sources-label">View on:</div>
                <div class="tooltip-source-links"></div>
            </div>
            <div class="tooltip-hint">Click item name for quick search</div>
        `;

        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;

        // Keep tooltip visible when hovering over it
        tooltip.addEventListener('mouseenter', () => {
            this.clearHideTimer();
        });

        tooltip.addEventListener('mouseleave', () => {
            this.scheduleHide();
        });
    },

    /**
     * Attach global event listeners for tooltips
     */
    attachGlobalListeners() {
        // Use event delegation for all item-name elements
        document.addEventListener('mouseover', (e) => {
            const itemEl = e.target.closest('[data-item-tooltip]');
            if (itemEl) {
                this.clearHideTimer();
                this.show(itemEl);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const itemEl = e.target.closest('[data-item-tooltip]');
            if (itemEl) {
                this.scheduleHide();
            }
        });

        // Handle clicks on item names for quick search
        document.addEventListener('click', (e) => {
            const itemEl = e.target.closest('[data-item-tooltip]');
            if (itemEl && itemEl.dataset.itemName) {
                e.preventDefault();
                const itemName = itemEl.dataset.itemName;
                Analytics.trackClick(itemName, 'trade', 'item-name-click');
                this.openSource(itemName, 'trade');
            }
        });

        // Hide on scroll
        document.addEventListener('scroll', () => {
            this.hide();
        }, true);
    },

    /**
     * Show tooltip for an item element
     */
    async show(element) {
        const itemName = element.dataset.itemName;
        const itemSlot = element.dataset.itemSlot || '';
        const isUnique = element.dataset.itemUnique === 'true';

        if (!itemName) return;

        this.currentItem = { name: itemName, slot: itemSlot, isUnique };

        // Get price data
        let priceData = null;
        if (isUnique) {
            try {
                priceData = await Prices.getPrice(itemName, itemSlot);
            } catch (e) {
                console.warn('Could not fetch price for tooltip:', e);
            }
        }

        // Update tooltip content
        this.updateContent(itemName, itemSlot, isUnique, priceData);

        // Position and show
        this.position(element);
        this.tooltipElement.classList.add('visible');
    },

    /**
     * Update tooltip content
     */
    updateContent(itemName, slot, isUnique, priceData) {
        const tooltip = this.tooltipElement;

        // Header
        tooltip.querySelector('.tooltip-item-name').textContent = itemName;
        tooltip.querySelector('.tooltip-item-name').className =
            `tooltip-item-name ${isUnique ? 'unique' : 'rare'}`;

        const slotDisplay = this.formatSlot(slot);
        tooltip.querySelector('.tooltip-item-type').textContent = slotDisplay;

        // Price section
        const priceSection = tooltip.querySelector('.tooltip-price-section');
        if (priceData && priceData.chaos) {
            const priceEl = tooltip.querySelector('.tooltip-price');
            const changeEl = tooltip.querySelector('.tooltip-price-change');

            priceEl.textContent = `${Prices.formatPrice(priceData.chaos)}`;

            if (priceData.change) {
                const changeClass = priceData.change > 0 ? 'price-up' : 'price-down';
                const sign = priceData.change > 0 ? '+' : '';
                changeEl.innerHTML = `<span class="${changeClass}">${sign}${priceData.change.toFixed(1)}% this week</span>`;
            } else {
                changeEl.textContent = '';
            }

            if (priceData.isEstimate) {
                priceEl.textContent += ' (est.)';
            }

            priceSection.style.display = 'block';
        } else {
            priceSection.style.display = 'none';
        }

        // Source links
        const linksContainer = tooltip.querySelector('.tooltip-source-links');
        linksContainer.innerHTML = '';

        for (const [sourceId, source] of Object.entries(this.SOURCES)) {
            const link = document.createElement('a');
            link.href = this.getSourceUrl(itemName, sourceId);
            link.className = 'tooltip-source-link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.dataset.source = sourceId;
            link.dataset.itemName = itemName;
            link.title = source.description;
            link.innerHTML = `
                <span class="source-icon">${this.getIcon(source.icon)}</span>
                <span class="source-name">${source.name}</span>
            `;

            // Track clicks
            link.addEventListener('click', (e) => {
                Analytics.trackClick(itemName, sourceId, 'tooltip-link');
            });

            linksContainer.appendChild(link);
        }
    },

    /**
     * Get URL for a source
     */
    getSourceUrl(itemName, sourceId) {
        const source = this.SOURCES[sourceId];
        if (!source) return '#';

        const encodedName = encodeURIComponent(itemName);
        const slugName = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const wikiName = itemName.replace(/ /g, '_');

        switch (sourceId) {
            case 'wiki':
                return `${source.baseUrl}${wikiName}`;
            case 'trade':
                // JSON query for trade search
                const tradeQuery = JSON.stringify({
                    query: {
                        status: { option: 'online' },
                        name: itemName,
                        type: itemName
                    },
                    sort: { price: 'asc' }
                });
                return `${source.baseUrl}${encodeURIComponent(tradeQuery)}`;
            case 'poedb':
                return `${source.baseUrl}${slugName}`;
            case 'ninja':
                return `${source.baseUrl}Standard/unique-armours?name=${encodedName}`;
            default:
                return '#';
        }
    },

    /**
     * Open a source URL directly
     */
    openSource(itemName, sourceId) {
        const url = this.getSourceUrl(itemName, sourceId);
        window.open(url, '_blank', 'noopener,noreferrer');
    },

    /**
     * Position tooltip relative to element
     */
    position(element) {
        const tooltip = this.tooltipElement;
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Default: show below and to the right
        let left = rect.left;
        let top = rect.bottom + 8;

        // Adjust if too far right
        if (left + tooltipRect.width > window.innerWidth - 16) {
            left = window.innerWidth - tooltipRect.width - 16;
        }

        // Adjust if too far down - show above instead
        if (top + tooltipRect.height > window.innerHeight - 16) {
            top = rect.top - tooltipRect.height - 8;
        }

        // Ensure not off left edge
        if (left < 16) left = 16;

        // Ensure not off top
        if (top < 16) top = 16;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * Schedule hiding the tooltip
     */
    scheduleHide() {
        this.hideTimer = setTimeout(() => {
            this.hide();
        }, 150);
    },

    /**
     * Clear the hide timer
     */
    clearHideTimer() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    },

    /**
     * Hide the tooltip
     */
    hide() {
        this.clearHideTimer();
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
        this.currentItem = null;
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
     * Get SVG icon for source
     */
    getIcon(iconName) {
        const icons = {
            'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
            'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
            'database': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
            'chart-line': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-6 6"/></svg>'
        };

        return icons[iconName] || '';
    },

    /**
     * Make an element tooltip-enabled
     * Call this when rendering items to add tooltip data attributes
     */
    enableTooltip(element, itemName, slot = '', isUnique = true) {
        element.dataset.itemTooltip = 'true';
        element.dataset.itemName = itemName;
        element.dataset.itemSlot = slot;
        element.dataset.itemUnique = isUnique.toString();
        element.classList.add('has-tooltip');
    },

    /**
     * Generate HTML attributes for tooltip-enabled item
     * Use this in template strings when rendering items
     */
    getTooltipAttrs(itemName, slot = '', isUnique = true) {
        return `data-item-tooltip="true" data-item-name="${this.escapeHtml(itemName)}" data-item-slot="${slot}" data-item-unique="${isUnique}"`;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Tooltips.init());
} else {
    Tooltips.init();
}
