/**
 * Interview module - interview wizard logic
 */

const Interview = {
    // Current state
    state: {
        active: false,
        currentQuestion: 0,
        responses: {},
        recommendations: null
    },

    /**
     * Start a new interview
     */
    start() {
        this.state = {
            active: true,
            currentQuestion: 0,
            responses: {},
            recommendations: null
        };
        this.render();
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
            this.render();
        }
    },

    /**
     * Finish interview and get recommendations
     */
    finish() {
        this.state.recommendations = Recommendations.getRecommendations(this.state.responses);
        this.state.active = false;

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
        this.state = {
            active: false,
            currentQuestion: 0,
            responses: {},
            recommendations: null
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
            optionsHtml = question.options.map(opt => `
                <button class="option-btn ${response === opt.value ? 'selected' : ''}"
                        onclick="Interview.setResponse('${opt.value}')">
                    ${this.escapeHtml(opt.label)}
                </button>
            `).join('');
        } else if (question.type === 'multiselect') {
            const selected = response || [];
            optionsHtml = question.options.map(opt => `
                <button class="option-btn ${selected.includes(opt.value) ? 'selected' : ''}"
                        onclick="Interview.setResponse('${opt.value}')">
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
            </div>
        `;
    },

    /**
     * Render results
     */
    renderResults() {
        const container = document.getElementById('interview-container');
        if (!container || !this.state.recommendations) return;

        const recsHtml = this.state.recommendations.map((rec, index) => `
            <div class="recommendation-card" onclick="Interview.viewArchetype('${rec.archetype.id}')">
                <div class="rec-header">
                    <span class="rec-rank">#${index + 1}</span>
                    <span class="rec-match">${rec.match_percentage}% Match</span>
                </div>
                <h3 class="rec-name">${this.escapeHtml(rec.archetype.name)}</h3>
                <div class="rec-class">${this.escapeHtml(rec.archetype.class_name)}</div>
                <p class="rec-desc">${this.escapeHtml(rec.archetype.description)}</p>

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
        `).join('');

        container.innerHTML = `
            <div class="interview-results">
                <h2>Your Recommended Builds</h2>
                <p class="results-subtitle">Based on your preferences, here are the best builds for you:</p>

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
