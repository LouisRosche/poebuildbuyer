/**
 * PoE2 Build Tracker - Frontend Application
 */

const API_BASE = '/api';

// State
let builds = [];
let currentBuildItems = [];
let uniqueItems = null;

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const buildsList = document.getElementById('builds-list');
const buildModal = document.getElementById('build-modal');
const itemModal = document.getElementById('item-modal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadBuilds();
    loadUniqueItems();
    loadCurrencyRates();
    initEventListeners();
});

// Tab Navigation
function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Event Listeners
function initEventListeners() {
    // Refresh builds
    document.getElementById('refresh-builds').addEventListener('click', loadBuilds);

    // Create build form
    document.getElementById('create-build-form').addEventListener('submit', handleCreateBuild);

    // Add item button
    document.getElementById('add-item').addEventListener('click', () => {
        itemModal.classList.remove('hidden');
    });

    // Add item form
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);

    // Price lookup
    document.getElementById('price-lookup-form').addEventListener('submit', handlePriceLookup);

    // Currency converter
    document.getElementById('currency-converter').addEventListener('submit', handleCurrencyConvert);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            buildModal.classList.add('hidden');
            itemModal.classList.add('hidden');
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === buildModal) buildModal.classList.add('hidden');
        if (e.target === itemModal) itemModal.classList.add('hidden');
    });
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load Builds
async function loadBuilds() {
    buildsList.innerHTML = '<p class="loading">Loading builds...</p>';

    try {
        const data = await apiCall('/builds');
        builds = data.builds;
        renderBuilds();
    } catch (error) {
        buildsList.innerHTML = `<p class="text-danger">Error loading builds: ${error.message}</p>`;
    }
}

function renderBuilds() {
    if (builds.length === 0) {
        buildsList.innerHTML = '<p class="text-muted">No builds yet. Create one to get started!</p>';
        return;
    }

    buildsList.innerHTML = builds.map(build => `
        <div class="build-card" data-id="${build.id}">
            <h3>${escapeHtml(build.name)}</h3>
            <p class="class-name">${escapeHtml(build.class_name || 'No class')}</p>
            <p class="item-count">${build.items.length} items</p>
            <div class="actions">
                <button class="btn btn-primary btn-small view-build" data-id="${build.id}">View Prices</button>
                <button class="btn btn-danger btn-small delete-build" data-id="${build.id}">Delete</button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.view-build').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewBuild(btn.dataset.id);
        });
    });

    document.querySelectorAll('.delete-build').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBuild(btn.dataset.id);
        });
    });
}

// View Build with Prices
async function viewBuild(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    const buildDetail = document.getElementById('build-detail');

    // Show modal with loading state
    buildDetail.innerHTML = `
        <div class="build-detail-header">
            <div>
                <h2>${escapeHtml(build.name)}</h2>
                ${build.description ? `<p class="text-muted mt-10">${escapeHtml(build.description)}</p>` : ''}
            </div>
            ${build.class_name ? `<span class="class-badge">${escapeHtml(build.class_name)}</span>` : ''}
        </div>
        <table class="build-items-table">
            <thead>
                <tr>
                    <th>Slot</th>
                    <th>Item</th>
                    <th>Priority</th>
                    <th>Price (Chaos)</th>
                </tr>
            </thead>
            <tbody>
                ${build.items.map(item => `
                    <tr data-item="${item.item_name}">
                        <td>${formatSlot(item.slot)}</td>
                        <td>${escapeHtml(item.item_name)}</td>
                        <td>${formatPriority(item.priority)}</td>
                        <td class="price-cell"><span class="price-loading">Loading...</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="build-total">
            <span class="total-label">Total Build Cost:</span>
            <span>
                <span class="total-value" id="total-cost">Loading...</span>
                <span class="core-value" id="core-cost"></span>
            </span>
        </div>
    `;

    buildModal.classList.remove('hidden');

    // Fetch prices
    try {
        const priceData = await apiCall(`/prices/build/${buildId}`);
        updateBuildPrices(priceData);
    } catch (error) {
        document.getElementById('total-cost').textContent = 'Error loading prices';
        document.getElementById('total-cost').classList.add('text-danger');
    }
}

function updateBuildPrices(priceData) {
    priceData.items.forEach(item => {
        const row = document.querySelector(`tr[data-item="${item.item_name}"] .price-cell`);
        if (row) {
            if (item.price.error) {
                row.innerHTML = `<span class="text-warning">${escapeHtml(item.price.error)}</span>`;
            } else if (item.price.min_price === 0) {
                row.innerHTML = '<span class="text-muted">No listings</span>';
            } else {
                row.innerHTML = `
                    <span class="text-success">${item.price.min_price.toFixed(1)}</span>
                    <span class="text-muted">(med: ${item.price.median_price.toFixed(1)})</span>
                `;
            }
        }
    });

    document.getElementById('total-cost').textContent = `${priceData.total_cost.toFixed(1)} chaos`;
    document.getElementById('core-cost').textContent = `(Core items: ${priceData.core_cost.toFixed(1)} chaos)`;
}

// Delete Build
async function deleteBuild(buildId) {
    if (!confirm('Are you sure you want to delete this build?')) return;

    try {
        await apiCall(`/builds/${buildId}`, { method: 'DELETE' });
        loadBuilds();
    } catch (error) {
        alert(`Error deleting build: ${error.message}`);
    }
}

// Create Build
async function handleCreateBuild(e) {
    e.preventDefault();

    const name = document.getElementById('build-name').value;
    const className = document.getElementById('build-class').value;
    const description = document.getElementById('build-description').value;

    try {
        await apiCall('/builds', {
            method: 'POST',
            body: JSON.stringify({
                name,
                class_name: className || null,
                description: description || null,
                items: currentBuildItems,
            }),
        });

        // Reset form
        document.getElementById('create-build-form').reset();
        currentBuildItems = [];
        renderCurrentItems();

        // Switch to builds tab and refresh
        document.querySelector('.tab[data-tab="builds"]').click();
        loadBuilds();

        alert('Build created successfully!');
    } catch (error) {
        alert(`Error creating build: ${error.message}`);
    }
}

// Add Item to Current Build
function handleAddItem(e) {
    e.preventDefault();

    const item = {
        slot: document.getElementById('modal-slot').value,
        item_name: document.getElementById('modal-item-name').value,
        item_type: document.getElementById('modal-item-type').value || null,
        priority: parseInt(document.getElementById('modal-priority').value),
        is_unique: document.getElementById('modal-is-unique').checked,
        required: true,
    };

    // Check for duplicate slot
    const existingIndex = currentBuildItems.findIndex(i => i.slot === item.slot);
    if (existingIndex >= 0) {
        currentBuildItems[existingIndex] = item;
    } else {
        currentBuildItems.push(item);
    }

    renderCurrentItems();
    itemModal.classList.add('hidden');
    document.getElementById('add-item-form').reset();
}

function renderCurrentItems() {
    const container = document.getElementById('items-container');

    if (currentBuildItems.length === 0) {
        container.innerHTML = '<p class="text-muted">No items added yet. Click "Add Item" to start.</p>';
        return;
    }

    container.innerHTML = currentBuildItems.map((item, index) => `
        <div class="item-row">
            <span class="item-slot">${formatSlot(item.slot)}</span>
            <span class="item-name">${escapeHtml(item.item_name)}</span>
            <span class="item-priority ${getPriorityClass(item.priority)}">${formatPriority(item.priority)}</span>
            <button type="button" class="remove-item" data-index="${index}">&times;</button>
        </div>
    `).join('');

    // Add remove listeners
    container.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            currentBuildItems.splice(parseInt(btn.dataset.index), 1);
            renderCurrentItems();
        });
    });
}

// Price Lookup
async function handlePriceLookup(e) {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value;
    const itemType = document.getElementById('item-type').value;
    const resultDiv = document.getElementById('price-result');

    resultDiv.innerHTML = '<p class="loading">Looking up price...</p>';
    resultDiv.classList.remove('hidden');

    try {
        const data = await apiCall('/prices/lookup', {
            method: 'POST',
            body: JSON.stringify({
                item_name: itemName,
                item_type: itemType || null,
            }),
        });

        if (data.error) {
            resultDiv.innerHTML = `
                <h3>${escapeHtml(itemName)}</h3>
                <div class="price-stats">
                    <div class="price-stat">
                        <div class="label">Status</div>
                        <div class="value error">${escapeHtml(data.error)}</div>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <h3>${escapeHtml(itemName)}</h3>
                <div class="price-stats">
                    <div class="price-stat">
                        <div class="label">Min Price</div>
                        <div class="value">${data.min_price.toFixed(1)}c</div>
                    </div>
                    <div class="price-stat">
                        <div class="label">Median</div>
                        <div class="value">${data.median_price.toFixed(1)}c</div>
                    </div>
                    <div class="price-stat">
                        <div class="label">Mean</div>
                        <div class="value">${data.mean_price.toFixed(1)}c</div>
                    </div>
                    <div class="price-stat">
                        <div class="label">Max Price</div>
                        <div class="value">${data.max_price.toFixed(1)}c</div>
                    </div>
                    <div class="price-stat">
                        <div class="label">Listings</div>
                        <div class="value">${data.listings_count}</div>
                    </div>
                </div>
                ${data.cached ? '<p class="text-muted mt-10">Cached result</p>' : ''}
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}

// Currency Rates
async function loadCurrencyRates() {
    const container = document.getElementById('currency-rates');

    try {
        const data = await apiCall('/prices/currency/rates');

        container.innerHTML = Object.entries(data.rates)
            .filter(([currency]) => ['divine', 'exalt', 'annul', 'vaal', 'alch'].includes(currency))
            .map(([currency, rate]) => `
                <div class="currency-card">
                    <div class="currency-name">${currency}</div>
                    <div class="rate">${rate.toFixed(2)} chaos</div>
                </div>
            `).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-danger">Error loading rates: ${error.message}</p>`;
    }
}

// Currency Converter
async function handleCurrencyConvert(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('convert-amount').value);
    const from = document.getElementById('convert-from').value;
    const to = document.getElementById('convert-to').value;
    const resultDiv = document.getElementById('convert-result');

    try {
        const data = await apiCall('/prices/currency/convert', {
            method: 'POST',
            body: JSON.stringify({
                amount,
                from_currency: from,
                to_currency: to,
            }),
        });

        resultDiv.innerHTML = `
            <strong>${amount} ${from}</strong> = <strong class="text-success">${data.converted_amount.toFixed(2)} ${to}</strong>
        `;
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.innerHTML = `<span class="text-danger">Error: ${error.message}</span>`;
        resultDiv.classList.remove('hidden');
    }
}

// Load Unique Items for Autocomplete
async function loadUniqueItems() {
    try {
        const response = await fetch('/static/unique_items.json');
        if (!response.ok) {
            // Try data folder
            const dataResponse = await fetch('/data/unique_items.json');
            if (dataResponse.ok) {
                uniqueItems = await dataResponse.json();
            }
        } else {
            uniqueItems = await response.json();
        }

        if (uniqueItems) {
            populateItemSuggestions();
        }
    } catch (error) {
        console.log('Could not load unique items for autocomplete');
    }
}

function populateItemSuggestions() {
    if (!uniqueItems) return;

    const allItems = [];
    Object.values(uniqueItems).forEach(category => {
        category.forEach(item => {
            allItems.push(item.name);
        });
    });

    const datalists = ['item-suggestions', 'modal-item-suggestions'];
    datalists.forEach(id => {
        const datalist = document.getElementById(id);
        if (datalist) {
            datalist.innerHTML = allItems.map(name =>
                `<option value="${escapeHtml(name)}">`
            ).join('');
        }
    });
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatSlot(slot) {
    const slots = {
        weapon: 'Weapon',
        offhand: 'Offhand',
        body: 'Body',
        helmet: 'Helmet',
        gloves: 'Gloves',
        boots: 'Boots',
        belt: 'Belt',
        amulet: 'Amulet',
        ring1: 'Ring 1',
        ring2: 'Ring 2',
        jewel1: 'Jewel 1',
        jewel2: 'Jewel 2',
        jewel3: 'Jewel 3',
        jewel4: 'Jewel 4',
        jewel5: 'Jewel 5',
        support: 'Support',
    };
    return slots[slot] || slot;
}

function formatPriority(priority) {
    const priorities = {
        1: 'Core',
        2: 'Important',
        3: 'Luxury',
    };
    return priorities[priority] || priority;
}

function getPriorityClass(priority) {
    const classes = {
        1: 'core',
        2: '',
        3: 'luxury',
    };
    return classes[priority] || '';
}
