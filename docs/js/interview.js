/**
 * Interview module - interview wizard logic
 */

const Interview = {
    // Current state
    state: {
        active: false,
        currentQuestion: 0,
        responses: {},
        recommendations: null,
        focusedOption: -1
    },

    // Keyboard handler reference (for cleanup)
    keyboardHandler: null,

    /**
     * Start a new interview
     */
    start() {
        this.state = {
            active: true,
            currentQuestion: 0,
            responses: {},
            recommendations: null,
            focusedOption: -1
        };
        this.setupKeyboardNavigation();
        this.render();
    },

    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        // Remove existing handler if any
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        this.keyboardHandler = (e) => {
            if (!this.state.active) return;

            const question = this.getCurrentQuestion();
            if (!question) return;

            const options = question.options || [];
            const optionCount = options.length;

            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    this.state.focusedOption = (this.state.focusedOption + 1) % optionCount;
                    this.updateFocusedOption();
                    break;

                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    this.state.focusedOption = this.state.focusedOption <= 0
                        ? optionCount - 1
                        : this.state.focusedOption - 1;
                    this.updateFocusedOption();
                    break;

                case 'Enter':
                case ' ':
                    if (this.state.focusedOption >= 0 && this.state.focusedOption < optionCount) {
                        e.preventDefault();
                        this.setResponse(options[this.state.focusedOption].value);
                        // Auto-advance for single-select questions
                        if (question.type === 'select' && this.hasValidResponse()) {
                            setTimeout(() => this.next(), 150);
                        }
                    } else if (e.key === 'Enter' && this.hasValidResponse()) {
                        e.preventDefault();
                        this.next();
                    }
                    break;

                case 'Backspace':
                    if (this.state.currentQuestion > 0) {
                        e.preventDefault();
                        this.previous();
                    }
                    break;

                case '1': case '2': case '3': case '4': case '5':
                case '6': case '7': case '8': case '9':
                    const index = parseInt(e.key) - 1;
                    if (index < optionCount) {
                        e.preventDefault();
                        this.setResponse(options[index].value);
                        if (question.type === 'select' && this.hasValidResponse()) {
                            setTimeout(() => this.next(), 150);
                        }
                    }
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    },

    /**
     * Update visual focus indicator
     */
    updateFocusedOption() {
        // Remove existing focus
        document.querySelectorAll('.option-btn.keyboard-focus').forEach(btn => {
            btn.classList.remove('keyboard-focus');
        });

        // Add focus to current option
        const buttons = document.querySelectorAll('.option-btn');
        if (this.state.focusedOption >= 0 && buttons[this.state.focusedOption]) {
            buttons[this.state.focusedOption].classList.add('keyboard-focus');
            buttons[this.state.focusedOption].scrollIntoView({ block: 'nearest' });
        }
    },

    /**
     * Clean up keyboard navigation
     */
    cleanupKeyboardNavigation() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    },

    /**
     * Get current question
     */
    getCurrentQuestion() {
        return Data.INTERVIEW_QUESTIONS[this.state.currentQuestion];
    },

    /**
     * Get progress percentage
     */
    getProgress() {
        return Math.round((this.state.currentQuestion / Data.INTERVIEW_QUESTIONS.length) * 100);
    },

    /**
     * Set response for current question
     */
    setResponse(value) {
        const question = this.getCurrentQuestion();
        if (!question) return;

        if (question.type === 'multiselect') {
            // Toggle value in array
            if (!this.state.responses[question.id]) {
                this.state.responses[question.id] = [];
            }
            const arr = this.state.responses[question.id];
            const index = arr.indexOf(value);
            if (index >= 0) {
                arr.splice(index, 1);
            } else {
                arr.push(value);
            }
        } else {
            this.state.responses[question.id] = value;
        }

        this.render();
    },

    /**
     * Check if current question has a valid response
     */
    hasValidResponse() {
        const question = this.getCurrentQuestion();
        if (!question) return false;

        if (!question.required) return true;

        const response = this.state.responses[question.id];
        if (question.type === 'multiselect') {
            return response && response.length > 0;
        }
        return response !== undefined && response !== '';
    },

    /**
     * Go to next question
     */
    next() {
        if (!this.hasValidResponse()) {
            return;
        }

        if (this.state.currentQuestion < Data.INTERVIEW_QUESTIONS.length - 1) {
            this.state.currentQuestion++;
            this.state.focusedOption = -1; // Reset focus for new question
            this.render();
        } else {
            this.finish();
        }
    },

    /**
     * Go to previous question
     */
    previous() {
        if (this.state.currentQuestion > 0) {
            this.state.currentQuestion--;
            this.state.focusedOption = -1; // Reset focus for new question
            this.render();
        }
    },

    /**
     * Finish interview and get recommendations
     */
    async finish() {
        this.state.active = false;
        this.cleanupKeyboardNavigation();

        // Show loading state
        const container = document.getElementById('interview-container');
        if (container) {
            container.innerHTML = `
                <div class="interview-loading">
                    <div class="loading-spinner"></div>
                    <p>Analyzing market conditions...</p>
                </div>
            `;
        }

        // Get market-enhanced recommendations
        try {
            const marketRecs = await Market.getMarketRecommendations(this.state.responses);
            this.state.recommendations = marketRecs.recommendations;
            this.state.marketInsights = marketRecs.marketInsights;
        } catch (error) {
            console.error('Market analysis failed, using standard recommendations:', error);
            this.state.recommendations = Recommendations.getRecommendations(this.state.responses);
            this.state.marketInsights = null;
        }

        // Save to history
        Storage.saveInterviewResult({
            responses: this.state.responses,
            recommendations: this.state.recommendations.map(r => ({
                id: r.archetype.id,
                name: r.archetype.name,
                score: r.score
            }))
        });

        this.renderResults();
    },

    /**
     * Reset interview
     */
    reset() {
        this.cleanupKeyboardNavigation();
        this.state = {
            active: false,
            currentQuestion: 0,
            responses: {},
            recommendations: null,
            focusedOption: -1
        };
        this.render();
    },

    /**
     * Render the interview UI
     */
    render() {
        const container = document.getElementById('interview-container');
        if (!container) return;

        if (!this.state.active && !this.state.recommendations) {
            // Show start screen
            container.innerHTML = `
                <div class="interview-start">
                    <h2>Build Finder</h2>
                    <p>Answer a few questions to find your perfect PoE2 build.</p>
                    <p class="interview-time">Takes about 2 minutes</p>
                    <button class="btn btn-primary btn-large" onclick="Interview.start()">
                        Start Interview
                    </button>
                    <div class="quick-filters">
                        <h3>Or browse by category:</h3>
                        <div class="filter-buttons">
                            <button class="btn btn-secondary" onclick="Interview.quickFilter('league-start')">
                                League Starters
                            </button>
                            <button class="btn btn-secondary" onclick="Interview.quickFilter('boss-killer')">
                                Boss Killers
                            </button>
                            <button class="btn btn-secondary" onclick="Interview.quickFilter('fast-mapper')">
                                Speed Mappers
                            </button>
                            <button class="btn btn-secondary" onclick="Interview.quickFilter('tanky')">
                                Tanky Builds
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (this.state.active) {
            this.renderQuestion();
        } else if (this.state.recommendations) {
            this.renderResults();
        }
    },

    /**
     * Render current question
     */
    renderQuestion() {
        const container = document.getElementById('interview-container');
        const question = this.getCurrentQuestion();
        if (!container || !question) return;

        const progress = this.getProgress();
        const response = this.state.responses[question.id];

        let optionsHtml = '';

        if (question.type === 'select') {
            optionsHtml = question.options.map((opt, index) => `
                <button class="option-btn ${response === opt.value ? 'selected' : ''} ${this.state.focusedOption === index ? 'keyboard-focus' : ''}"
                        onclick="Interview.setResponse('${opt.value}')"
                        data-index="${index}">
                    <span class="option-number">${index + 1}</span>
                    ${this.escapeHtml(opt.label)}
                </button>
            `).join('');
        } else if (question.type === 'multiselect') {
            const selected = response || [];
            optionsHtml = question.options.map((opt, index) => `
                <button class="option-btn ${selected.includes(opt.value) ? 'selected' : ''} ${this.state.focusedOption === index ? 'keyboard-focus' : ''}"
                        onclick="Interview.setResponse('${opt.value}')"
                        data-index="${index}">
                    <span class="option-number">${index + 1}</span>
                    ${this.escapeHtml(opt.label)}
                </button>
            `).join('');
            optionsHtml += '<p class="option-hint">Select all that apply</p>';
        } else if (question.type === 'text') {
            optionsHtml = `
                <input type="text"
                       class="text-input"
                       placeholder="${this.escapeHtml(question.placeholder || '')}"
                       value="${this.escapeHtml(response || '')}"
                       oninput="Interview.setResponse(this.value)">
            `;
        }

        container.innerHTML = `
            <div class="interview-wizard">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    Question ${this.state.currentQuestion + 1} of ${Data.INTERVIEW_QUESTIONS.length}
                </div>

                <div class="question-container">
                    <h3 class="question-text">${this.escapeHtml(question.question)}</h3>
                    ${question.required ? '<span class="required-badge">Required</span>' : ''}

                    <div class="options-container">
                        ${optionsHtml}
                    </div>
                </div>

                <div class="navigation-buttons">
                    <button class="btn btn-secondary"
                            onclick="Interview.previous()"
                            ${this.state.currentQuestion === 0 ? 'disabled' : ''}>
                        Back
                    </button>
                    <button class="btn btn-primary"
                            onclick="Interview.next()"
                            ${!this.hasValidResponse() ? 'disabled' : ''}>
                        ${this.state.currentQuestion === Data.INTERVIEW_QUESTIONS.length - 1 ? 'Get Recommendations' : 'Next'}
                    </button>
                </div>

                <button class="btn btn-text" onclick="Interview.reset()">
                    Cancel
                </button>

                <div class="keyboard-hint">
                    <kbd>↑</kbd><kbd>↓</kbd> navigate &nbsp;
                    <kbd>Enter</kbd> select &nbsp;
                    <kbd>1</kbd>-<kbd>9</kbd> quick select
                </div>
            </div>
        `;
    },

    /**
     * Render results
     */
    renderResults() {
        const container = document.getElementById('interview-container');
        if (!container || !this.state.recommendations) return;

        const recsHtml = this.state.recommendations.map((rec, index) => {
            const market = rec.market;
            const hasMarketData = market && market.currentCost !== Infinity;

            return `
                <div class="recommendation-card" onclick="Interview.viewArchetype('${rec.archetype.id}')">
                    <div class="rec-header">
                        <span class="rec-rank">#${index + 1}</span>
                        <div class="rec-badges">
                            <span class="rec-match">${rec.match_percentage}% Match</span>
                            ${market?.isGoodValue ? '<span class="rec-badge value-badge" title="Great value for cost">💎</span>' : ''}
                            ${market?.isPriceDropping ? '<span class="rec-badge deal-badge" title="Prices dropping">📉</span>' : ''}
                        </div>
                    </div>
                    <h3 class="rec-name">${this.escapeHtml(rec.archetype.name)}</h3>
                    <div class="rec-class">${this.escapeHtml(rec.archetype.class_name)}</div>
                    <p class="rec-desc">${this.escapeHtml(rec.archetype.description)}</p>

                    ${hasMarketData ? `
                        <div class="rec-market">
                            <div class="market-cost">
                                <span class="cost-label">Starting cost:</span>
                                <span class="cost-value ${market.affordability}">${Market.formatCost(market.currentCost)}</span>
                            </div>
                            ${market.valueScore ? `
                                <div class="market-value" title="Value score: effectiveness per chaos spent">
                                    <span class="value-label">Value:</span>
                                    <span class="value-score">${market.valueScore}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div class="rec-scores">
                        <div class="score-item">
                            <span class="score-label">Mapping</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${rec.archetype.mapping_score * 10}%"></div>
                            </div>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Bossing</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${rec.archetype.bossing_score * 10}%"></div>
                            </div>
                        </div>
                    </div>

                    ${rec.recommended_tier ? `
                        <div class="rec-tier">
                            <span class="tier-label">Recommended:</span>
                            <span class="tier-name">${this.escapeHtml(rec.recommended_tier.tier_name)}</span>
                            <span class="tier-budget">${this.formatBudget(rec.recommended_tier.min_budget, rec.recommended_tier.max_budget)}</span>
                        </div>
                    ` : ''}

                    <div class="rec-tags">
                        ${rec.archetype.tags.slice(0, 4).map(tag =>
                            `<span class="tag">${this.escapeHtml(tag)}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Market insights section
        const insightsHtml = this.state.marketInsights ? this.renderMarketInsights() : '';

        container.innerHTML = `
            <div class="interview-results">
                <h2>Your Recommended Builds</h2>
                <p class="results-subtitle">Based on your preferences and current market prices:</p>

                ${insightsHtml}

                <div class="recommendations-grid">
                    ${recsHtml}
                </div>

                <div class="results-actions">
                    <button class="btn btn-secondary" onclick="Interview.reset()">
                        Start Over
                    </button>
                    <button class="btn btn-primary" onclick="App.showTab('archetypes')">
                        Browse All Builds
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render market insights panel
     */
    renderMarketInsights() {
        const insights = this.state.marketInsights;
        if (!insights) return '';

        const insightCards = [];

        // Best value builds
        if (insights.bestValue && insights.bestValue.length > 0) {
            const best = insights.bestValue[0];
            insightCards.push(`
                <div class="insight-card insight-value">
                    <span class="insight-icon">💎</span>
                    <div class="insight-content">
                        <strong>Best Value</strong>
                        <span>${this.escapeHtml(best.archetype.name)}</span>
                    </div>
                </div>
            `);
        }

        // Price drops
        if (insights.priceDrops && insights.priceDrops.length > 0) {
            insightCards.push(`
                <div class="insight-card insight-deal">
                    <span class="insight-icon">📉</span>
                    <div class="insight-content">
                        <strong>Price Dropping</strong>
                        <span>${insights.priceDrops.length} builds getting cheaper</span>
                    </div>
                </div>
            `);
        }

        // Cheapest by selected class
        const userClass = this.state.responses?.class;
        if (userClass && userClass !== 'any' && insights.cheapestByClass) {
            const classBuilds = Object.entries(insights.cheapestByClass)
                .filter(([className]) => className.toLowerCase().includes(userClass.toLowerCase()));
            if (classBuilds.length > 0) {
                const [, cheapest] = classBuilds[0];
                insightCards.push(`
                    <div class="insight-card insight-budget">
                        <span class="insight-icon">💰</span>
                        <div class="insight-content">
                            <strong>Cheapest ${this.escapeHtml(userClass)}</strong>
                            <span>${Market.formatCost(cheapest.cost)}</span>
                        </div>
                    </div>
                `);
            }
        }

        if (insightCards.length === 0) return '';

        return `
            <div class="market-insights">
                <h3>Market Insights</h3>
                <div class="insights-grid">
                    ${insightCards.join('')}
                </div>
            </div>
        `;
    },

    /**
     * Quick filter - show builds by tag
     */
    quickFilter(tag) {
        const archetypes = Data.getArchetypesByTag(tag);

        // Use quick recommend with tag filter
        this.state.recommendations = archetypes.map(arch => ({
            archetype: arch,
            score: 100,
            match_percentage: 100,
            recommended_tier: arch.tiers[0],
            all_tiers: arch.tiers
        }));

        this.state.active = false;
        this.renderResults();
    },

    /**
     * View archetype details
     */
    viewArchetype(id) {
        App.viewArchetype(id);
    },

    /**
     * Format budget range
     */
    formatBudget(min, max) {
        if (max === null || max === undefined) {
            return `${min.toLocaleString()}+ chaos`;
        }
        return `${min.toLocaleString()} - ${max.toLocaleString()} chaos`;
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
