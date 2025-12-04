/**
 * PoE2 Build Tracker - Frontend Application
 */

const API_BASE = '/api';

// State
let builds = [];
let archetypes = [];
let currentBuildItems = [];
let uniqueItems = null;

// Interview state
let interviewSession = null;
let interviewQuestions = [];
let currentQuestionIndex = 0;
let interviewResponses = {};

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const buildsList = document.getElementById('builds-list');
const buildModal = document.getElementById('build-modal');
const archetypeModal = document.getElementById('archetype-modal');
const createModal = document.getElementById('create-modal');
const itemModal = document.getElementById('item-modal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadBuilds();
    loadArchetypes();
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
    // Build Finder
    document.getElementById('start-interview').addEventListener('click', startInterview);
    document.getElementById('wizard-back').addEventListener('click', prevQuestion);
    document.getElementById('wizard-next').addEventListener('click', nextQuestion);
    document.getElementById('wizard-finish').addEventListener('click', finishInterview);
    document.getElementById('restart-interview').addEventListener('click', resetInterview);

    // Quick filters
    document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.addEventListener('click', () => handleQuickFilter(btn.dataset.filter));
    });

    // Builds
    document.getElementById('refresh-builds').addEventListener('click', loadBuilds);
    document.getElementById('create-manual-build').addEventListener('click', () => {
        createModal.classList.remove('hidden');
    });

    // Create build form
    document.getElementById('create-build-form').addEventListener('submit', handleCreateBuild);
    document.getElementById('add-item').addEventListener('click', () => {
        itemModal.classList.remove('hidden');
    });

    // Add item form
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);

    // Archetypes
    document.getElementById('filter-class').addEventListener('change', loadArchetypes);
    document.getElementById('filter-playstyle').addEventListener('change', loadArchetypes);

    // Price lookup
    document.getElementById('price-lookup-form').addEventListener('submit', handlePriceLookup);

    // Currency converter
    document.getElementById('currency-converter').addEventListener('submit', handleCurrencyConvert);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            buildModal.classList.add('hidden');
            archetypeModal.classList.add('hidden');
            createModal.classList.add('hidden');
            itemModal.classList.add('hidden');
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === buildModal) buildModal.classList.add('hidden');
        if (e.target === archetypeModal) archetypeModal.classList.add('hidden');
        if (e.target === createModal) createModal.classList.add('hidden');
        if (e.target === itemModal) itemModal.classList.add('hidden');
    });
}

// ============================================
// Interview / Build Finder
// ============================================

async function startInterview() {
    try {
        const data = await apiCall('/interview/start', { method: 'POST' });
        interviewSession = data.session_id;
        interviewQuestions = data.questions;
        currentQuestionIndex = 0;
        interviewResponses = {};

        document.getElementById('finder-intro').classList.add('hidden');
        document.getElementById('interview-wizard').classList.remove('hidden');
        document.getElementById('recommendations-results').classList.add('hidden');

        renderQuestion();
    } catch (error) {
        alert('Error starting interview: ' + error.message);
    }
}

function renderQuestion() {
    const question = interviewQuestions[currentQuestionIndex];
    const questionDiv = document.getElementById('wizard-question');
    const total = interviewQuestions.length;
    const progress = ((currentQuestionIndex + 1) / total) * 100;

    document.getElementById('wizard-progress-fill').style.width = `${progress}%`;
    document.getElementById('wizard-progress-text').textContent = `Question ${currentQuestionIndex + 1} of ${total}`;

    let optionsHtml = '';
    const currentValue = interviewResponses[question.id];

    if (question.type === 'select') {
        optionsHtml = `<div class="wizard-options">
            ${question.options.map(opt => `
                <div class="wizard-option ${currentValue === opt.value ? 'selected' : ''}" onclick="selectOption('${question.id}', '${opt.value}', this)">
                    <input type="radio" name="${question.id}" value="${opt.value}" ${currentValue === opt.value ? 'checked' : ''}>
                    <label>${escapeHtml(opt.label)}</label>
                </div>
            `).join('')}
        </div>`;
    } else if (question.type === 'multiselect') {
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        optionsHtml = `<div class="wizard-options">
            ${question.options.map(opt => `
                <div class="wizard-option ${selectedValues.includes(opt.value) ? 'selected' : ''}" onclick="toggleMultiOption('${question.id}', '${opt.value}', this)">
                    <input type="checkbox" name="${question.id}" value="${opt.value}" ${selectedValues.includes(opt.value) ? 'checked' : ''}>
                    <label>${escapeHtml(opt.label)}</label>
                </div>
            `).join('')}
        </div>`;
    } else if (question.type === 'text') {
        optionsHtml = `<input type="text" class="wizard-text-input" id="text-${question.id}"
            placeholder="${question.placeholder || ''}" value="${currentValue || ''}"
            onchange="updateTextResponse('${question.id}', this.value)">`;
    }

    questionDiv.innerHTML = `
        <h3>${escapeHtml(question.question)}</h3>
        ${optionsHtml}
    `;

    // Update button states
    document.getElementById('wizard-back').disabled = currentQuestionIndex === 0;

    const isLastQuestion = currentQuestionIndex === interviewQuestions.length - 1;
    document.getElementById('wizard-next').classList.toggle('hidden', isLastQuestion);
    document.getElementById('wizard-finish').classList.toggle('hidden', !isLastQuestion);
}

// Global functions for onclick handlers
window.selectOption = function(questionId, value, element) {
    interviewResponses[questionId] = value;

    // Update UI
    element.parentElement.querySelectorAll('.wizard-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.querySelector('input').checked = false;
    });
    element.classList.add('selected');
    element.querySelector('input').checked = true;
};

window.toggleMultiOption = function(questionId, value, element) {
    if (!interviewResponses[questionId]) {
        interviewResponses[questionId] = [];
    }

    const index = interviewResponses[questionId].indexOf(value);
    if (index > -1) {
        interviewResponses[questionId].splice(index, 1);
        element.classList.remove('selected');
        element.querySelector('input').checked = false;
    } else {
        interviewResponses[questionId].push(value);
        element.classList.add('selected');
        element.querySelector('input').checked = true;
    }
};

window.updateTextResponse = function(questionId, value) {
    interviewResponses[questionId] = value;
};

function nextQuestion() {
    const question = interviewQuestions[currentQuestionIndex];

    // Validate required questions
    if (question.required && !interviewResponses[question.id]) {
        alert('Please answer this question before continuing.');
        return;
    }

    if (currentQuestionIndex < interviewQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

async function finishInterview() {
    try {
        // Save responses
        await apiCall(`/interview/session/${interviewSession}`, {
            method: 'PUT',
            body: JSON.stringify({ responses: interviewResponses }),
        });

        // Get recommendations
        const data = await apiCall(`/interview/session/${interviewSession}/recommendations?limit=5`);

        document.getElementById('interview-wizard').classList.add('hidden');
        document.getElementById('recommendations-results').classList.remove('hidden');

        renderRecommendations(data);
    } catch (error) {
        alert('Error getting recommendations: ' + error.message);
    }
}

function renderRecommendations(data) {
    const summaryDiv = document.getElementById('results-summary');
    const gridDiv = document.getElementById('recommendations-grid');

    const budgetName = data.budget_info.name || data.budget_info.tier;
    summaryDiv.innerHTML = `
        <p>Based on your preferences, here are the best builds for you:</p>
        <span class="budget-info">Budget: ${budgetName} (${formatBudgetRange(data.budget_info.min, data.budget_info.max)})</span>
    `;

    if (data.recommendations.length === 0) {
        gridDiv.innerHTML = '<p class="text-muted">No matching builds found. Try adjusting your preferences.</p>';
        return;
    }

    gridDiv.innerHTML = data.recommendations.map(rec => {
        const arch = rec.archetype;
        const tier = rec.recommended_tier;

        return `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <div>
                        <h3>${escapeHtml(arch.name)}</h3>
                        <div class="recommendation-meta">
                            <span class="tag">${escapeHtml(arch.class_name)}</span>
                            <span class="tag">${escapeHtml(arch.primary_playstyle)}</span>
                            <span class="tag">${escapeHtml(arch.damage_type)}</span>
                        </div>
                    </div>
                    <div class="match-score">
                        <div class="score">${rec.match_percentage}%</div>
                        <div class="label">match</div>
                    </div>
                </div>

                <p class="recommendation-description">${escapeHtml(arch.description || '')}</p>

                ${arch.pros && arch.pros.length > 0 ? `
                <div class="pros-cons">
                    <div class="pros">
                        <h4>Pros</h4>
                        <ul>
                            ${arch.pros.slice(0, 3).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>Cons</h4>
                        <ul>
                            ${(arch.cons || []).slice(0, 3).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <div class="recommendation-tiers">
                    ${rec.all_tiers.map(t => `
                        <div class="tier-card ${tier && t.id === tier.id ? 'recommended' : ''}"
                             onclick="viewArchetypeDetail('${arch.id}')">
                            <div class="tier-name">${escapeHtml(t.tier_name)}</div>
                            <div class="tier-cost">${formatBudgetRange(t.min_budget, t.max_budget)}</div>
                            ${tier && t.id === tier.id ? '<div class="tier-range">Recommended</div>' : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="recommendation-actions">
                    <button class="btn btn-primary" onclick="viewArchetypeDetail('${arch.id}')">View Details</button>
                    ${tier ? `<button class="btn btn-secondary" onclick="createBuildFromTier('${tier.id}', '${escapeHtml(arch.name)}')">Add to My Builds</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function resetInterview() {
    interviewSession = null;
    currentQuestionIndex = 0;
    interviewResponses = {};

    document.getElementById('finder-intro').classList.remove('hidden');
    document.getElementById('interview-wizard').classList.add('hidden');
    document.getElementById('recommendations-results').classList.add('hidden');
}

async function handleQuickFilter(filter) {
    try {
        // Map filter to quick recommend params
        const params = {
            'league-start': { budget: 'starter' },
            'boss-killer': { budget: 'mid', content_focus: 'bossing' },
            'fast-mapper': { budget: 'mid', content_focus: 'mapping' },
            'tanky': { budget: 'mid' },
        };

        const data = await apiCall('/interview/quick-recommend?limit=5', {
            method: 'POST',
            body: JSON.stringify(params[filter] || {}),
        });

        document.getElementById('finder-intro').classList.add('hidden');
        document.getElementById('interview-wizard').classList.add('hidden');
        document.getElementById('recommendations-results').classList.remove('hidden');

        // Format for renderRecommendations
        const formattedData = {
            recommendations: data.recommendations,
            budget_info: { name: filter.replace('-', ' '), min: 0, max: null },
        };
        renderRecommendations(formattedData);
    } catch (error) {
        alert('Error getting quick recommendations: ' + error.message);
    }
}

// ============================================
// Archetypes
// ============================================

async function loadArchetypes() {
    const container = document.getElementById('archetypes-list');
    container.innerHTML = '<p class="loading">Loading archetypes...</p>';

    try {
        const classFilter = document.getElementById('filter-class').value;
        const playstyleFilter = document.getElementById('filter-playstyle').value;

        let url = '/interview/archetypes';
        const params = new URLSearchParams();
        if (classFilter) params.append('class_name', classFilter);
        if (playstyleFilter) params.append('playstyle', playstyleFilter);
        if (params.toString()) url += '?' + params.toString();

        const data = await apiCall(url);
        archetypes = data.archetypes;
        renderArchetypes();
    } catch (error) {
        container.innerHTML = `<p class="text-danger">Error loading archetypes: ${error.message}</p>`;
    }
}

function renderArchetypes() {
    const container = document.getElementById('archetypes-list');

    if (archetypes.length === 0) {
        container.innerHTML = '<p class="text-muted">No archetypes found. Run the seed script to populate data.</p>';
        return;
    }

    container.innerHTML = archetypes.map(arch => `
        <div class="archetype-card" onclick="viewArchetypeDetail('${arch.id}')">
            <h3>${escapeHtml(arch.name)}</h3>
            <div class="meta">
                <span>${escapeHtml(arch.class_name)}</span>
                <span>${escapeHtml(arch.primary_playstyle)}</span>
                <span>${escapeHtml(arch.damage_type)}</span>
            </div>
            <p class="text-muted">${escapeHtml((arch.description || '').substring(0, 100))}...</p>
            <div class="scores">
                <div class="score-item">
                    <div class="value ${getScoreClass(arch.mapping_score)}">${arch.mapping_score}</div>
                    <div class="label">Mapping</div>
                </div>
                <div class="score-item">
                    <div class="value ${getScoreClass(arch.bossing_score)}">${arch.bossing_score}</div>
                    <div class="label">Bossing</div>
                </div>
                <div class="score-item">
                    <div class="value ${getScoreClass(arch.league_start_score)}">${arch.league_start_score}</div>
                    <div class="label">League Start</div>
                </div>
            </div>
        </div>
    `).join('');
}

window.viewArchetypeDetail = async function(archetypeId) {
    try {
        const data = await apiCall(`/interview/archetypes/${archetypeId}`);
        renderArchetypeDetail(data);
        archetypeModal.classList.remove('hidden');
    } catch (error) {
        alert('Error loading archetype: ' + error.message);
    }
};

function renderArchetypeDetail(data) {
    const arch = data.archetype;
    const tiers = data.tiers;
    const detailDiv = document.getElementById('archetype-detail');

    detailDiv.innerHTML = `
        <div class="archetype-detail-header">
            <h2>${escapeHtml(arch.name)}</h2>
            <div class="meta">
                <span class="badge">${escapeHtml(arch.class_name)}</span>
                <span class="badge">${escapeHtml(arch.primary_playstyle)}</span>
                <span class="badge">${escapeHtml(arch.damage_type)}</span>
                <span class="badge">Complexity: ${'*'.repeat(arch.complexity)}</span>
            </div>
            <div class="archetype-scores">
                <div class="score-box">
                    <div class="value ${getScoreClass(arch.mapping_score)}">${arch.mapping_score}/10</div>
                    <div class="label">Mapping</div>
                </div>
                <div class="score-box">
                    <div class="value ${getScoreClass(arch.bossing_score)}">${arch.bossing_score}/10</div>
                    <div class="label">Bossing</div>
                </div>
                <div class="score-box">
                    <div class="value ${getScoreClass(arch.league_start_score)}">${arch.league_start_score}/10</div>
                    <div class="label">League Start</div>
                </div>
            </div>
        </div>

        <p class="archetype-description">${escapeHtml(arch.description || '')}</p>

        ${arch.pros && arch.pros.length > 0 ? `
        <div class="pros-cons">
            <div class="pros">
                <h4>Pros</h4>
                <ul>
                    ${arch.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                </ul>
            </div>
            <div class="cons">
                <h4>Cons</h4>
                <ul>
                    ${(arch.cons || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        ${arch.playstyle_notes || arch.leveling_notes ? `
        <div class="archetype-notes">
            ${arch.playstyle_notes ? `<h4>Playstyle</h4><p>${escapeHtml(arch.playstyle_notes)}</p>` : ''}
            ${arch.leveling_notes ? `<h4>Leveling</h4><p>${escapeHtml(arch.leveling_notes)}</p>` : ''}
        </div>
        ` : ''}

        <div class="tiers-section">
            <h3>Budget Tiers</h3>
            ${tiers.map(tier => `
                <div class="tier-detail">
                    <div class="tier-detail-header">
                        <h4>${escapeHtml(tier.tier_name)}</h4>
                        <span class="cost">${formatBudgetRange(tier.min_budget, tier.max_budget)}</span>
                    </div>
                    ${tier.description ? `<p class="text-muted">${escapeHtml(tier.description)}</p>` : ''}

                    <div class="tier-detail-items">
                        ${tier.items.map(item => `
                            <div class="tier-item">
                                <span class="slot">${formatSlot(item.slot)}</span>
                                <span class="name">${escapeHtml(item.item_name)}</span>
                                <span class="priority ${item.priority === 1 ? 'core' : ''}">${formatPriority(item.priority)}</span>
                            </div>
                        `).join('')}
                    </div>

                    ${tier.upgrade_notes ? `<p class="text-muted mt-10"><strong>Next upgrades:</strong> ${escapeHtml(tier.upgrade_notes)}</p>` : ''}

                    <div class="tier-actions">
                        <button class="btn btn-primary btn-small" onclick="createBuildFromTier('${tier.id}', '${escapeHtml(arch.name)} (${escapeHtml(tier.tier_name)})')">Add to My Builds</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.createBuildFromTier = async function(tierId, buildName) {
    try {
        const data = await apiCall('/interview/create-build', {
            method: 'POST',
            body: JSON.stringify({
                tier_id: tierId,
                build_name: buildName,
            }),
        });

        alert('Build created successfully!');
        archetypeModal.classList.add('hidden');

        // Switch to builds tab and refresh
        document.querySelector('.tab[data-tab="builds"]').click();
        loadBuilds();
    } catch (error) {
        alert('Error creating build: ' + error.message);
    }
};

// ============================================
// Builds (My Builds)
// ============================================

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
        buildsList.innerHTML = '<p class="text-muted">No builds yet. Use the Build Finder or create one manually!</p>';
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

async function viewBuild(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    const buildDetail = document.getElementById('build-detail');

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
                    <tr data-item="${escapeHtml(item.item_name)}">
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

async function deleteBuild(buildId) {
    if (!confirm('Are you sure you want to delete this build?')) return;

    try {
        await apiCall(`/builds/${buildId}`, { method: 'DELETE' });
        loadBuilds();
    } catch (error) {
        alert(`Error deleting build: ${error.message}`);
    }
}

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

        createModal.classList.add('hidden');
        loadBuilds();
        alert('Build created successfully!');
    } catch (error) {
        alert(`Error creating build: ${error.message}`);
    }
}

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

    container.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            currentBuildItems.splice(parseInt(btn.dataset.index), 1);
            renderCurrentItems();
        });
    });
}

// ============================================
// Price Lookup
// ============================================

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

// ============================================
// Currency
// ============================================

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

// ============================================
// Unique Items Autocomplete
// ============================================

async function loadUniqueItems() {
    try {
        const response = await fetch('/static/unique_items.json');
        if (!response.ok) {
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

// ============================================
// API Helper
// ============================================

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

// ============================================
// Utility Functions
// ============================================

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

function getScoreClass(score) {
    if (score >= 8) return 'score-high';
    if (score >= 5) return 'score-medium';
    return 'score-low';
}

function formatBudgetRange(min, max) {
    if (max === null || max === undefined) {
        return `${formatNumber(min)}+ chaos`;
    }
    return `${formatNumber(min)}-${formatNumber(max)}c`;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return Math.round(num).toString();
}
