/**
 * Experiments - Main App Controller
 * Handles navigation, state, and user interactions
 */

const App = {

    // Current state
    state: {
        currentTab: 'experiments',
        currentExperiment: null,
        calendarMonth: new Date(),
        currentFilter: 'ALL' // NEW: Track active filter
    },

    // Flag to prevent duplicate event bindings
    eventsInitialized: false,

    /**
     * Initialize the app
     */
    init() {
        this.loadAppVersion();
        this.loadTheme();
        this.setupServiceWorker();
        this.render();
        this.bindEvents();

        // Check for weekly summary on Mondays
        setTimeout(() => this.checkWeeklySummary(), 500);
    },

    /**
     * Check if we should show the weekly summary
     */
    checkWeeklySummary() {
        if (SummaryManager.shouldShowWeeklySummary()) {
            const experiments = DataManager.getExperiments();
            const lastWeekStart = SummaryManager.getWeekStart(new Date());
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);

            const summary = SummaryManager.generateWeeklySummary(experiments, lastWeekStart);
            this.showWeeklySummaryModal(summary);
        }
    },

    /**
     * Show weekly summary modal with content
     */
    showWeeklySummaryModal(summary) {
        const content = document.getElementById('weekly-summary-content');
        if (!content) return;

        // Calculate totals from experiments array
        const totalCompleted = summary.experiments.reduce((sum, e) => sum + e.completed + e.minimum, 0);
        const longestStreak = Math.max(...summary.experiments.map(e => e.streak), 0);

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">🎯</div>
                <h3 style="margin-bottom: 4px;">${summary.overallScore}% Completion</h3>
                <p style="color: var(--text-secondary);">Week of ${new Date(summary.weekOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="text-align: center; padding: 12px; background: var(--inactive-bg); border-radius: 12px;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${totalCompleted}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary);">Check-ins</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--inactive-bg); border-radius: 12px;">
                    <div style="font-size: 24px; font-weight: 700; color: #F59E0B;">${longestStreak}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary);">Best Streak</div>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--inactive-bg); border-radius: 12px;">
                    <div style="font-size: 24px; font-weight: 700; color: #10B981;">${summary.stats.perfectWeeks}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary);">Perfect</div>
                </div>
            </div>

            ${summary.experiments.length > 0 ? `
                <div style="margin-bottom: 16px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">Experiment Progress</p>
                    ${summary.experiments.map(exp => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--inactive-bg);">
                            <div style="width: 40px; text-align: center; font-size: 16px;">
                                ${exp.completed === 7 ? '🌟' : exp.completed >= 5 ? '✅' : exp.completed >= 3 ? '📈' : '💪'}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 500;">${escapeHtml(exp.title)}</div>
                                <div style="font-size: 12px; color: var(--text-tertiary);">${exp.completed}/7 days</div>
                            </div>
                            <div style="font-weight: 600; color: ${exp.completed >= 5 ? 'var(--primary-color)' : 'var(--text-secondary)'};">
                                ${exp.completionRate}%
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${summary.topInsight ? `
                <div style="background: #EDE9FE; padding: 12px 16px; border-radius: 12px;">
                    <p style="font-weight: 600; color: #7C3AED; margin-bottom: 8px;">💡 Top Insight</p>
                    <p style="font-size: 14px; color: #5B21B6;">${escapeHtml(summary.topInsight)}</p>
                </div>
            ` : ''}
        `;

        // Save that we showed this summary
        SummaryManager.saveWeeklySummary(summary);

        this.openModal('modal-weekly-summary');
    },

    /**
     * Main render function
     */
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <main role="main">
                ${this.renderCurrentScreen()}
            </main>
            ${this.renderTabBar()}
            ${this.renderFAB()}
            ${this.renderModals()}
            <div id="aria-live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>
        `;
    },

    /**
     * Render current screen based on state
     */
    renderCurrentScreen() {
        if (this.state.currentExperiment) {
            return this.renderExperimentDetail();
        }

        switch (this.state.currentTab) {
            case 'experiments':
                return this.renderExperimentsScreen();
            case 'gallery':
                return this.renderGalleryScreen();
            case 'insights':
                return this.renderInsightsScreen();
            case 'settings':
                return this.renderSettingsScreen();
            default:
                return this.renderExperimentsScreen();
        }
    },

    /**
     * Render Experiments tab
     */
    renderExperimentsScreen() {
        let experiments = DataManager.getExperiments();
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();

        // Apply filter if not "ALL"
        const filter = this.state.currentFilter;
        if (filter !== 'ALL') {
            experiments = experiments.filter(e =>
                e.category && e.category.toUpperCase() === filter
            );
        }

        let content = '';
        if (experiments.length === 0) {
            if (filter === 'ALL') {
                content = UI.emptyState('Idle Station', 'No active protocols running.');
            } else {
                content = UI.emptyState('No Results', `No ${filter.toLowerCase()} experiments found.`);
            }
        } else {
            content = experiments.map(e => UI.experimentRow(e)).join('');
        }

        // Helper to determine active pill
        const isActive = (filter) => this.state.currentFilter === filter ? 'active' : '';
        const categories = DataManager.getCategories();

        return `
            <div class="screen active" id="screen-experiments">
                <div class="header">
                    <h1>Today</h1>
                    <p class="subheader">${dayName} ${dateStr}</p>
                </div>
                
                <div class="filter-pills" role="group" aria-label="Filter experiments">
                    <button class="pill ${isActive('ALL')}" data-filter="ALL" aria-pressed="${this.state.currentFilter === 'ALL'}">ALL</button>
                    ${categories.map(cat => `
                        <button class="pill ${isActive(cat.toUpperCase())}" data-filter="${cat.toUpperCase()}" aria-pressed="${this.state.currentFilter === cat.toUpperCase()}">${cat.toUpperCase()}</button>
                    `).join('')}
                </div>
                
                <div id="experiments-list">
                    ${content}
                </div>
            </div>
        `;
    },

    /**
     * Render Experiment Detail
     */
    renderExperimentDetail() {
        const exp = DataManager.getExperiment(this.state.currentExperiment);
        if (!exp) {
            this.state.currentExperiment = null;
            return this.renderExperimentsScreen();
        }

        const progress = StreakCalculator.progress(exp);
        const streak = StreakCalculator.calculate(exp);
        const daysCompleted = StreakCalculator.daysCompleted(exp);
        const daysRemaining = StreakCalculator.daysRemaining(exp);

        const entries = (exp.entries || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        return `
            <div class="screen active" id="screen-detail">
                <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
                    <button id="btn-back" aria-label="Go back" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        ${UI.icons.back}
                    </button>
                    <h2 style="flex: 1;">${exp.title}</h2>
                    <button id="btn-edit" aria-label="Edit experiment" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        ${UI.icons.edit}
                    </button>
                </div>
                
                <div class="card" style="text-align: center; padding: var(--space-xl);">
                    <div style="display: flex; justify-content: center; margin-bottom: var(--space-lg);">
                        ${UI.progressRing(progress, 'large')}
                    </div>
                    
                    <h2>${exp.title}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">${exp.purpose}</p>
                    
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-value">${UI.icons.flame} ${streak}</div>
                            <div class="stat-label">Streak</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${UI.icons.check} ${daysCompleted}</div>
                            <div class="stat-label">Done</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${UI.icons.clock} ${daysRemaining}</div>
                            <div class="stat-label">Left</div>
                        </div>
                    </div>

                    ${this.renderStreakStatusBanner(exp)}

                    <button class="btn btn-primary" id="btn-checkin" style="margin-top: var(--space-lg);">
                        Check In
                    </button>
                </div>
                
                <div class="segmented-control" style="margin-bottom: var(--space-lg);">
                    <button class="segmented-option active" data-section="entries">Entries</button>
                    <button class="segmented-option" data-section="calendar">Calendar</button>
                </div>
                
                <div id="detail-section-entries">
                    ${entries.length > 0
                ? entries.map(e => UI.entryRow(e)).join('')
                : UI.emptyState('No entries yet', 'Check in to record your first entry.')}
                </div>
                
                <div id="detail-section-calendar" class="hidden">
                    ${UI.calendar(exp, this.state.calendarMonth)}
                </div>
            </div>
        `;
    },

    /**
     * Render Gallery tab
     */
    renderGalleryScreen() {
        const templates = DataManager.getTemplates();
        const grouped = {};
        templates.forEach(t => {
            if (!grouped[t.category]) grouped[t.category] = [];
            grouped[t.category].push(t);
        });

        let content = '';
        Object.keys(grouped).forEach(category => {
            content += `
                <div style="margin-bottom: var(--space-lg);">
                    <p class="subheader" style="margin-bottom: var(--space-sm);">${category.toUpperCase()}</p>
                    ${grouped[category].map(t => UI.templateCard(t)).join('')}
                </div>
            `;
        });

        return `
            <div class="screen active" id="screen-gallery">
                <div class="header">
                    <h1>Ideas</h1>
                    <p class="subheader">Start from a template</p>
                </div>
                ${content}
            </div>
        `;
    },

    /**
     * Render Insights Screen - patterns, correlations, recommendations
     */
    renderInsightsScreen() {
        const experiments = DataManager.getExperiments();
        const moodTrend = MoodTracker.getMoodTrend(7);
        const todayMood = MoodTracker.getMoodForDate(StreakCalculator.toDateString(new Date()));
        const recommendations = InsightsEngine.getRecommendations(experiments);
        const correlations = MoodTracker.getAllCorrelations(experiments);
        const weeklyInsights = InsightsEngine.generateWeeklyInsights(experiments);

        // Mood tracking section
        const moodSection = `
            <div class="card" style="margin-bottom: var(--space-lg);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                    <h3 style="margin: 0;">Today's Mood</h3>
                    ${todayMood ? `<span style="font-size: 24px;">${MoodTracker.getMoodEmoji(todayMood.mood)}</span>` : ''}
                </div>
                ${!todayMood ? `
                    <p style="color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-md);">How are you feeling?</p>
                    <div class="mood-picker" style="display: flex; justify-content: space-between; gap: var(--space-sm);">
                        ${MoodTracker.MOODS.map(m => `
                            <button class="mood-btn" data-mood="${m.value}" style="flex: 1; padding: var(--space-md); font-size: 24px; background: var(--inactive-bg); border-radius: var(--radius-md); text-align: center;">
                                ${m.emoji}
                            </button>
                        `).join('')}
                    </div>
                ` : `
                    <div style="display: flex; gap: var(--space-lg); align-items: center;">
                        <div>
                            <div style="font-size: var(--text-sm); color: var(--text-secondary);">Mood</div>
                            <div style="font-size: var(--text-lg); font-weight: var(--weight-semibold);">${todayMood.mood}/5</div>
                        </div>
                        <div>
                            <div style="font-size: var(--text-sm); color: var(--text-secondary);">Energy</div>
                            <div style="font-size: var(--text-lg); font-weight: var(--weight-semibold);">${todayMood.energy}/5</div>
                        </div>
                        <div style="flex: 1; text-align: right;">
                            <div style="font-size: var(--text-sm); color: var(--text-secondary);">7-day trend</div>
                            <div style="font-size: var(--text-lg);">${moodTrend.trend === 'improving' ? '📈 Improving' : moodTrend.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}</div>
                        </div>
                    </div>
                `}
            </div>
        `;

        // Weekly insights section
        let insightsSection = '';
        if (weeklyInsights.length > 0) {
            insightsSection = `
                <div style="margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md);">This Week</h3>
                    ${weeklyInsights.map(insight => `
                        <div class="card" style="margin-bottom: var(--space-sm); display: flex; gap: var(--space-md); align-items: center;">
                            <span style="font-size: 24px;">${insight.emoji}</span>
                            <div>
                                <div style="font-weight: var(--weight-semibold);">${insight.title}</div>
                                <div style="font-size: var(--text-sm); color: var(--text-secondary);">${insight.message}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Recommendations section
        let recommendationsSection = '';
        if (recommendations.length > 0) {
            recommendationsSection = `
                <div style="margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md);">Recommendations</h3>
                    ${recommendations.slice(0, 3).map(rec => `
                        <div class="card" style="margin-bottom: var(--space-sm); border-left: 3px solid ${rec.priority === 1 ? 'var(--error-color)' : rec.priority === 2 ? '#FFA500' : 'var(--text-tertiary)'};">
                            <div style="font-weight: var(--weight-semibold);">${rec.experimentTitle}</div>
                            <div style="font-size: var(--text-sm); color: var(--text-secondary); margin: var(--space-xs) 0;">${rec.message}</div>
                            <div style="font-size: var(--text-sm); color: var(--text-primary);">💡 ${rec.action}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Correlations section
        let correlationsSection = '';
        if (correlations.length > 0) {
            correlationsSection = `
                <div style="margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md);">Mood Correlations</h3>
                    ${correlations.slice(0, 3).map(cor => `
                        <div class="card" style="margin-bottom: var(--space-sm);">
                            <div style="font-weight: var(--weight-semibold);">${cor.experimentTitle}</div>
                            <div style="font-size: var(--text-sm); color: var(--text-secondary);">${cor.insight}</div>
                            <div style="display: flex; gap: var(--space-lg); margin-top: var(--space-sm);">
                                <div style="font-size: var(--text-sm);">
                                    <span style="color: var(--success-color);">✓</span> ${cor.avgMoodWithCompletion}/5 avg
                                </div>
                                <div style="font-size: var(--text-sm);">
                                    <span style="color: var(--text-tertiary);">✗</span> ${cor.avgMoodWithoutCompletion}/5 avg
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Empty state
        const hasData = experiments.length > 0;
        const emptyState = !hasData ? `
            <div class="empty-state">
                <h3>No Data Yet</h3>
                <p>Start tracking experiments and moods to see insights here.</p>
            </div>
        ` : '';

        return `
            <div class="screen active" id="screen-insights">
                <div class="header">
                    <h1>Insights</h1>
                    <p class="subheader">Patterns & Recommendations</p>
                </div>
                ${moodSection}
                ${hasData ? insightsSection + recommendationsSection + correlationsSection : emptyState}
            </div>
        `;
    },

    /**
     * Render Settings Screen - with Updates section
     */
    renderSettingsScreen() {
        const experiments = DataManager.getExperiments();
        const version = this.state.appVersion || '1.0.0';

        return `
            <div class="screen ${this.state.currentTab === 'settings' ? 'active' : ''}" id="screen-settings">
                <div class="header">
                    <h1>Settings</h1>
                </div>
                <div class="content-scrollable">
                    <div class="settings-group">
                        <p class="settings-group-title">Updates</p>
                        <div class="settings-row" style="cursor: pointer;" id="btn-check-updates">
                            <div class="settings-icon" style="background: #E8F5E9;">🔄</div>
                            <div class="settings-label">Check for Updates</div>
                            <div class="settings-value">v${this.state.appVersion}</div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <p class="settings-group-title">Appearance</p>
                        <div class="settings-row">
                            <div class="settings-icon" style="background: var(--inactive-bg);">🎨</div>
                            <div class="settings-label">Theme</div>
                            <div class="segmented-control" role="group" style="width: auto;">
                                <button type="button" class="segmented-option ${this.state.theme === 'system' ? 'active' : ''}" data-theme-opt="system">Auto</button>
                                <button type="button" class="segmented-option ${this.state.theme === 'light' ? 'active' : ''}" data-theme-opt="light">Light</button>
                                <button type="button" class="segmented-option ${this.state.theme === 'dark' ? 'active' : ''}" data-theme-opt="dark">Dark</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <p class="settings-group-title">Account</p>
                        <div class="settings-row">
                            <div class="settings-icon" style="background: var(--inactive-bg);">👤</div>
                            <div class="settings-label">Experimenter</div>
                            <div class="settings-value">Free</div>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <p class="settings-group-title">Data</p>
                        <div class="settings-row">
                            <div class="settings-icon" style="background: #E8F5E9;">📊</div>
                            <div class="settings-label">Active Experiments</div>
                            <div class="settings-value">${experiments.length}</div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-icon" style="background: #FFF3E0;">💾</div>
                            <div class="settings-label">Storage</div>
                            <div class="settings-value">Local</div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <p class="settings-group-title">Accountability Partners</p>
                        <div class="settings-row" style="cursor: pointer;" id="btn-copy-share-code">
                            <div class="settings-icon" style="background: #E3F2FD;">🔗</div>
                            <div class="settings-label">My Share Code</div>
                            <div class="settings-value">${PartnersManager.getMyShareCode()}</div>
                        </div>
                        <div class="settings-row" style="cursor: pointer;" id="btn-share-progress">
                            <div class="settings-icon" style="background: #F3E5F5;">📤</div>
                            <div class="settings-label">Share Progress</div>
                            <div class="settings-chevron">${UI.icons.chevronRight}</div>
                        </div>
                        <div class="settings-row" style="cursor: pointer;" id="btn-add-partner">
                            <div class="settings-icon" style="background: #E8F5E9;">➕</div>
                            <div class="settings-label">Add Partner</div>
                            <div class="settings-chevron">${UI.icons.chevronRight}</div>
                        </div>
                        ${this.renderPartnersList()}
                    </div>

                    <div class="settings-group">
                        <p class="settings-group-title">Challenges</p>
                        <div class="settings-row" style="cursor: pointer;" id="btn-create-challenge">
                            <div class="settings-icon" style="background: #FFF8E1;">🏆</div>
                            <div class="settings-label">Start Challenge</div>
                            <div class="settings-chevron">${UI.icons.chevronRight}</div>
                        </div>
                        ${this.renderChallengesList()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render partners list in Settings
     */
    renderPartnersList() {
        const partners = PartnersManager.getPartners();
        if (partners.length === 0) return '';

        return partners.map(p => {
            const status = PartnersManager.getPartnerStatus(p);
            return `
                <div class="settings-row" style="padding: 12px 16px;">
                    <div class="settings-icon" style="background: var(--inactive-bg);">${status.emoji}</div>
                    <div style="flex: 1;">
                        <div class="settings-label">${escapeHtml(p.name)}</div>
                        <div style="font-size: 12px; color: var(--text-tertiary);">${status.message}</div>
                    </div>
                    <button class="btn-remove-partner" data-partner-id="${p.id}" data-partner-name="${escapeHtml(p.name)}"
                            style="background: none; border: none; color: var(--error-color); padding: 8px; cursor: pointer;">
                        ${UI.icons.x}
                    </button>
                </div>
            `;
        }).join('');
    },

    /**
     * Render challenges list in Settings
     */
    renderChallengesList() {
        const challenges = ChallengesManager.getActiveChallenges();
        if (challenges.length === 0) return '';

        return challenges.map(c => {
            const summary = ChallengesManager.getProgressSummary(c.id);
            const leader = summary.leaderboard[0];
            return `
                <div class="settings-row" style="padding: 12px 16px;">
                    <div class="settings-icon" style="background: #FFF8E1;">🏃</div>
                    <div style="flex: 1;">
                        <div class="settings-label">${escapeHtml(c.name)}</div>
                        <div style="font-size: 12px; color: var(--text-tertiary);">
                            ${summary.daysRemaining} days left • Leader: ${leader ? escapeHtml(leader.name) : 'N/A'}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--primary-color);">${summary.percentComplete}%</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render streak status banner with skip day option
     */
    renderStreakStatusBanner(exp) {
        const streakStatus = StreakCalculator.getStreakStatus(exp);
        const earnedSkipDays = StreakCalculator.calculateEarnedSkipDays(exp);
        const usedSkipDays = (exp.entries || []).filter(e => e.type === 'skipped').length;
        const availableSkipDays = earnedSkipDays - usedSkipDays;
        const canUseSkipDay = StreakCalculator.canUseSkipDay(exp);
        const isAtRisk = StreakCalculator.isStreakAtRisk(exp);
        const inGracePeriod = StreakCalculator.isInGracePeriod(exp);

        let bannerHtml = '';

        // Show streak at risk warning
        if (isAtRisk && !inGracePeriod) {
            bannerHtml += `
                <div style="background: #FFF3E0; color: #E65100; padding: 12px 16px; border-radius: 12px; margin-top: 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">⚠️</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Streak at risk!</div>
                        <div style="font-size: 13px; opacity: 0.8;">Check in today to maintain your streak</div>
                    </div>
                </div>
            `;
        }

        // Show grace period banner
        if (inGracePeriod) {
            bannerHtml += `
                <div style="background: #E3F2FD; color: #1565C0; padding: 12px 16px; border-radius: 12px; margin-top: 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">🛡️</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Grace Period Active</div>
                        <div style="font-size: 13px; opacity: 0.8;">Your streak is protected - check in when ready</div>
                    </div>
                </div>
            `;
        }

        // Show skip day option
        if (availableSkipDays > 0) {
            bannerHtml += `
                <div style="background: var(--inactive-bg); padding: 12px 16px; border-radius: 12px; margin-top: 16px; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">🎯</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">Skip Days Available</div>
                        <div style="font-size: 13px; color: var(--text-tertiary);">${availableSkipDays} of ${earnedSkipDays} remaining</div>
                    </div>
                    ${canUseSkipDay ? `
                        <button id="btn-use-skip-day" class="btn" style="background: var(--primary-color); color: white; padding: 8px 16px; font-size: 14px;">
                            Use Skip Day
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return bannerHtml;
    },

    /**
     * Render Tab Bar
     */
    renderTabBar() {
        const tabs = [
            { id: 'experiments', label: 'Lab', icon: UI.icons.flask },
            { id: 'gallery', label: 'Gallery', icon: UI.icons.sparkles },
            { id: 'insights', label: 'Insights', icon: UI.icons.chart },
            { id: 'settings', label: 'Settings', icon: UI.icons.settings }
        ];

        return `
            <nav class="tab-bar" role="tablist" aria-label="Main navigation">
                ${tabs.map(tab => `
                    <button class="tab-bar-item ${this.state.currentTab === tab.id ? 'active' : ''}" 
                            data-tab="${tab.id}" 
                            role="tab" 
                            aria-selected="${this.state.currentTab === tab.id}"
                            aria-controls="screen-${tab.id}">
                        ${tab.icon}
                        <span>${tab.label}</span>
                    </button>
                `).join('')}
            </nav>
        `;
    },

    /**
     * Render FAB
     */
    renderFAB() {
        if (this.state.currentExperiment || this.state.currentTab !== 'experiments') {
            return '';
        }
        return `<button class="fab" id="fab-add" aria-label="Add new experiment">${UI.icons.plus}</button>`;
    },

    /**
     * Render Modals
     */
    renderModals() {
        return `
            <!-- Create Experiment Modal -->
            <div class="modal-overlay" id="modal-create">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2 id="modal-create-title">New Experiment</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-create">${UI.icons.x}</button>
                    </div>
                    <form id="form-create">
                        <input type="hidden" name="id" id="create-id">
                        <div class="form-group">
                            <label class="form-label" for="create-title">Action — What?</label>
                            <input class="form-input" id="create-title" name="title" placeholder="e.g., Meditate for 10 minutes" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="create-purpose">Purpose — Why?</label>
                            <textarea class="form-input" id="create-purpose" name="purpose" placeholder="e.g., Reduce stress and feel calmer" required></textarea>
                        </div>
                        <div class="form-group">
                    <label class="form-label" id="create-category-label">Category</label>
                    <div class="segmented-control" role="group" aria-labelledby="create-category-label">
                        ${DataManager.getCategories().map((cat, i) => `
                            <button type="button" class="segmented-option ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>
                        `).join('')}
                        <button type="button" class="segmented-option btn-add-category-mini" id="btn-add-category">+</button>
                    </div>
                </div>
                        <div class="form-group">
                            <label class="form-label" id="create-freq-label">Frequency</label>
                            <div class="segmented-control" role="group" aria-labelledby="create-freq-label">
                                <button type="button" class="segmented-option active" data-freq="daily">Daily</button>
                                <button type="button" class="segmented-option" data-freq="weekly">Weekly</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="create-duration">Duration (days)</label>
                            <input class="form-input" id="create-duration" type="number" name="duration" value="30" min="7" max="365">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="create-time">Preferred Time (Optional)</label>
                            <input class="form-input" id="create-time" type="time" name="scheduledTime">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="create-criteria">Success Criteria (Optional)</label>
                            <input class="form-input" id="create-criteria" name="criteria" placeholder="e.g., Complete before 8 AM">
                        </div>
                        <div class="form-actions" style="display: flex; gap: 8px; flex-direction: column;">
                            <button type="submit" class="btn btn-primary">Start Experiment</button>
                            <button type="button" id="btn-delete" class="btn" style="background: #FFEBEE; color: #D32F2F; display: none;">Delete Experiment</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Check-in Modal -->
            <div class="modal-overlay" id="modal-checkin">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Check In</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-checkin">${UI.icons.x}</button>
                    </div>
                    <form id="form-checkin">
                        <div class="form-group">
                            <label class="form-label" id="checkin-status-label">Status</label>
                            <div class="segmented-control" role="group" aria-labelledby="checkin-status-label">
                                <button type="button" class="segmented-option active" data-status="completed">Completed ✓</button>
                                <button type="button" class="segmented-option" data-status="missed">Missed ✗</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="checkin-note">Note (Optional)</label>
                            <textarea class="form-input" id="checkin-note" name="note" placeholder="How did it go?"></textarea>
                        </div>

                        <div class="form-group">
                            <button type="button" class="reflection-toggle">
                                <span style="font-size: 16px;">+</span> <span>Add Weekly Reflection</span>
                            </button>
                            <div class="reflection-fields">
                                <label class="form-label">What worked?</label>
                                <textarea class="form-input" name="ref_plus" rows="2" placeholder="Wins & progress"></textarea>
                                
                                <label class="form-label" style="margin-top: 12px;">What didn't?</label>
                                <textarea class="form-input" name="ref_minus" rows="2" placeholder="Obstacles & distractions"></textarea>
                                
                                <label class="form-label" style="margin-top: 12px;">What's next?</label>
                                <textarea class="form-input" name="ref_next" rows="2" placeholder="Focus for next week"></textarea>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </form>
                </div>
            </div>

            <!-- Confirm Modal -->
            <div class="modal-overlay" id="modal-confirm" style="z-index: 2000;">
                <div class="modal-sheet confirm-modal-content">
                    <h3 id="confirm-title" style="margin-bottom: 8px;">Are you sure?</h3>
                    <p id="confirm-message" style="color: var(--text-secondary); margin-bottom: 24px;">This action cannot be undone.</p>
                    <div class="confirm-actions">
                        <button class="btn" id="confirm-cancel" style="background: var(--inactive-bg); color: var(--text-primary);">Cancel</button>
                        <button class="btn" id="confirm-ok" style="background: var(--error-color); color: white;">Confirm</button>
                    </div>
                </div>
            </div>
            <!-- Prompt Modal -->
            <div class="modal-overlay" id="modal-prompt" style="z-index: 2001;">
                <div class="modal-sheet">
                    <h3 id="prompt-title" style="margin-bottom: 16px;">Enter Value</h3>
                    <div class="form-group">
                        <input class="form-input" id="prompt-input" type="text" placeholder="Name">
                    </div>
                    <div class="form-actions" style="display: flex; gap: 16px;">
                        <button class="btn btn-secondary" id="prompt-cancel" style="flex: 1;">Cancel</button>
                        <button class="btn btn-primary" id="prompt-ok" style="flex: 1;">Save</button>
                    </div>
                </div>
            </div>

            <!-- Edit Entry Modal -->
            <div class="modal-overlay" id="modal-edit-entry">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Edit Entry</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-edit-entry">${UI.icons.x}</button>
                    </div>
                    <form id="form-edit-entry">
                        <input type="hidden" name="entryId" id="edit-entry-id">
                        <div class="form-group">
                            <label class="form-label" id="edit-entry-status-label">Status</label>
                            <div class="segmented-control" role="group" aria-labelledby="edit-entry-status-label">
                                <button type="button" class="segmented-option active" data-status="completed">Completed ✓</button>
                                <button type="button" class="segmented-option" data-status="missed">Missed ✗</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="edit-entry-note">Note</label>
                            <textarea class="form-input" id="edit-entry-note" name="note" placeholder="How did it go?"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Reflection (Optional)</label>
                            <div style="margin-top: 8px;">
                                <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">What worked?</label>
                                <textarea class="form-input" id="edit-entry-ref-plus" name="ref_plus" rows="2" placeholder="Wins & progress"></textarea>

                                <label class="form-label" style="font-size: 12px; margin-top: 12px; margin-bottom: 4px;">What didn't?</label>
                                <textarea class="form-input" id="edit-entry-ref-minus" name="ref_minus" rows="2" placeholder="Obstacles & distractions"></textarea>

                                <label class="form-label" style="font-size: 12px; margin-top: 12px; margin-bottom: 4px;">What's next?</label>
                                <textarea class="form-input" id="edit-entry-ref-next" name="ref_next" rows="2" placeholder="Focus for next week"></textarea>
                            </div>
                        </div>
                        <div class="form-actions" style="display: flex; gap: 8px; flex-direction: column;">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" id="btn-delete-entry" class="btn" style="background: #FFEBEE; color: #D32F2F;">Delete Entry</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Energy Picker Modal -->
            <div class="modal-overlay" id="modal-energy" style="z-index: 2002;">
                <div class="modal-sheet" style="text-align: center;">
                    <h3 style="margin-bottom: 8px;">How's your energy?</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">Select your energy level</p>
                    <div class="mood-grid" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 24px;">
                        ${MoodTracker.ENERGY_LEVELS.map(e => `
                            <button class="mood-btn energy-btn" data-energy="${e.value}" style="display: flex; flex-direction: column; align-items: center; padding: 12px; background: var(--inactive-bg); border: none; border-radius: 12px; cursor: pointer; min-width: 50px;">
                                <span style="font-size: 24px;">${e.emoji}</span>
                                <span style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">${e.label}</span>
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary" data-close="modal-energy" style="width: 100%;">Cancel</button>
                </div>
            </div>

            <!-- Weekly Summary Modal -->
            <div class="modal-overlay" id="modal-weekly-summary">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Weekly Summary</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-weekly-summary">${UI.icons.x}</button>
                    </div>
                    <div id="weekly-summary-content">
                        <!-- Populated dynamically -->
                    </div>
                    <div class="form-actions" style="margin-top: 16px;">
                        <button class="btn btn-primary" data-close="modal-weekly-summary" style="width: 100%;">Got it!</button>
                    </div>
                </div>
            </div>

            <!-- Recovery Modal -->
            <div class="modal-overlay" id="modal-recovery">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Get Back on Track</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-recovery">${UI.icons.x}</button>
                    </div>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">We noticed you missed a few days. No worries - here are some options:</p>
                    <div id="recovery-options">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>

            <!-- Add Partner Modal -->
            <div class="modal-overlay" id="modal-add-partner">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Add Partner</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-add-partner">${UI.icons.x}</button>
                    </div>
                    <form id="form-add-partner">
                        <div class="form-group">
                            <label class="form-label" for="partner-name">Partner Name</label>
                            <input class="form-input" id="partner-name" name="name" placeholder="e.g., Sarah" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="partner-code">Their Share Code</label>
                            <input class="form-input" id="partner-code" name="code" placeholder="e.g., ABC123" required maxlength="6" style="text-transform: uppercase;">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Add Partner</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Create Challenge Modal -->
            <div class="modal-overlay" id="modal-create-challenge">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <h2>Start Challenge</h2>
                        <button class="modal-close" aria-label="Close modal" data-close="modal-create-challenge">${UI.icons.x}</button>
                    </div>
                    <form id="form-create-challenge">
                        <div class="form-group">
                            <label class="form-label" for="challenge-name">Challenge Name</label>
                            <input class="form-input" id="challenge-name" name="name" placeholder="e.g., January Wellness Challenge" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="challenge-template">Template</label>
                            <select class="form-input" id="challenge-template" name="template" required>
                                <option value="">Select a template...</option>
                                ${DataManager.getTemplates().map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="challenge-duration">Duration (days)</label>
                            <input class="form-input" id="challenge-duration" name="duration" type="number" value="30" min="7" max="90" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Invite Partners</label>
                            <div id="challenge-partners-list" style="margin-top: 8px;">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Start Challenge</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Bind all event handlers (called ONCE on init)
     */
    bindEvents() {
        // CRITICAL: Prevent duplicate event bindings that cause freezing
        if (this.eventsInitialized) return;
        this.eventsInitialized = true;

        const app = document.getElementById('app');

        // Tab navigation
        app.addEventListener('click', (e) => {
            const tabItem = e.target.closest('.tab-bar-item');
            if (tabItem) {
                e.stopPropagation();
                this.state.currentTab = tabItem.dataset.tab;
                this.state.currentExperiment = null;
                this.state.currentFilter = 'ALL';
                this.render();
                return;
            }
        });

        // FAB click
        app.addEventListener('click', (e) => {
            if (e.target.closest('#fab-add')) {
                e.stopPropagation();
                this.openModal('modal-create');
                return;
            }
        });

        // Check for Updates button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-check-updates')) {
                e.stopPropagation();
                this.checkForUpdates();
                return;
            }
        });

        // Theme selector
        app.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('[data-theme-opt]');
            if (themeBtn) {
                e.stopPropagation();
                this.setTheme(themeBtn.dataset.themeOpt);
                return;
            }
        });

        // Edit button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-edit')) {
                e.stopPropagation();
                this.handleEditExperiment();
                return;
            }
        });

        // Delete button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-delete')) {
                e.stopPropagation();
                this.confirmAction(
                    'Delete Experiment?',
                    'This will permanently delete this experiment and all its history. This cannot be undone.',
                    () => {
                        const id = document.getElementById('create-id').value;
                        DataManager.deleteExperiment(id);
                        this.state.currentExperiment = null;
                        this.closeModal('modal-create');
                        this.render();
                        this.showToast('Experiment deleted');
                    }
                );
                return;
            }
        });

        // Reflection toggle
        app.addEventListener('click', (e) => {
            const toggle = e.target.closest('.reflection-toggle');
            if (toggle) {
                e.stopPropagation();
                const fields = toggle.nextElementSibling;
                const isVisible = fields.classList.contains('visible');
                const symbol = toggle.querySelector('span:first-child');
                fields.classList.toggle('visible');
                if (symbol) symbol.textContent = isVisible ? '+' : '−';
                return;
            }
        });

        // Modal close
        app.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('[data-close]');
            if (closeBtn) {
                e.stopPropagation();
                this.closeModal(closeBtn.dataset.close);
                return;
            }
            // Click on overlay to close
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id);
                return;
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeModal(activeModal.id);
                }
            }
        });

        // Experiment row click (with swipe protection)
        app.addEventListener('click', (e) => {
            const row = e.target.closest('.experiment-row');
            if (row) {
                // Prevent click if we just swiped
                if (this.swipeState && this.swipeState.didSwipe) {
                    this.swipeState.didSwipe = false;
                    return;
                }
                e.stopPropagation();
                this.state.currentExperiment = row.dataset.id;
                this.render();
                return;
            }
        });

        // Back button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-back')) {
                e.stopPropagation();
                this.state.currentExperiment = null;
                this.render();
                return;
            }
        });

        // Check-in button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-checkin')) {
                e.stopPropagation();
                this.openModal('modal-checkin');
                return;
            }
        });

        // Template card click
        app.addEventListener('click', (e) => {
            const card = e.target.closest('.template-card');
            if (card) {
                e.stopPropagation();
                const template = DataManager.getTemplates().find(t => t.id === card.dataset.id);
                if (template) {
                    this.createFromTemplate(template);
                }
                return;
            }
        });

        // Segmented control (non-form) - detail view tabs
        app.addEventListener('click', (e) => {
            const option = e.target.closest('.segmented-option');
            if (option && !option.closest('form')) {
                const section = option.dataset.section;
                if (section) {
                    e.stopPropagation();
                    const control = option.closest('.segmented-control');
                    control.querySelectorAll('.segmented-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    document.getElementById('detail-section-entries')?.classList.toggle('hidden', section !== 'entries');
                    document.getElementById('detail-section-calendar')?.classList.toggle('hidden', section !== 'calendar');
                    return;
                }
            }
        });

        // Form segmented controls
        app.addEventListener('click', (e) => {
            const option = e.target.closest('.segmented-option');
            if (option && option.closest('form')) {
                e.stopPropagation();
                const parent = option.parentElement;
                parent.querySelectorAll('.segmented-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                return;
            }
        });

        // Filter pills - uses state-based filtering
        app.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill[data-filter]');
            if (pill) {
                e.stopPropagation();
                const filter = pill.dataset.filter;
                this.state.currentFilter = filter;
                this.render();
                return;
            }
        });

        // ========================================
        // SWIPE GESTURE HANDLING
        // ========================================

        // Initialize swipe state
        this.swipeState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            direction: null, // 'horizontal' or 'vertical'
            container: null,
            row: null,
            didSwipe: false,
            startTime: 0
        };

        const SWIPE_THRESHOLD = 80;
        const DIRECTION_LOCK_THRESHOLD = 15;
        const MAX_SWIPE = 150;
        const VELOCITY_THRESHOLD = 0.5;

        // Touch start
        app.addEventListener('touchstart', (e) => {
            const container = e.target.closest('.swipe-container');
            if (!container) return;

            const touch = e.touches[0];
            this.swipeState = {
                active: true,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: 0,
                direction: null,
                container: container,
                row: container.querySelector('.experiment-row'),
                didSwipe: false,
                startTime: Date.now()
            };

            // Close any other open swipes
            document.querySelectorAll('.swipe-container .experiment-row.swiping').forEach(row => {
                if (row !== this.swipeState.row) {
                    row.classList.remove('swiping');
                    row.style.transform = '';
                }
            });
        }, { passive: true });

        // Touch move
        app.addEventListener('touchmove', (e) => {
            if (!this.swipeState.active) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.swipeState.startX;
            const deltaY = touch.clientY - this.swipeState.startY;

            // Determine direction if not locked
            if (!this.swipeState.direction) {
                if (Math.abs(deltaX) > DIRECTION_LOCK_THRESHOLD || Math.abs(deltaY) > DIRECTION_LOCK_THRESHOLD) {
                    this.swipeState.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
                }
            }

            // Only handle horizontal swipes
            if (this.swipeState.direction !== 'horizontal') return;

            // Prevent scroll during horizontal swipe
            e.preventDefault();

            // Clamp swipe distance
            const clampedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
            this.swipeState.currentX = clampedX;

            // Apply transform
            const row = this.swipeState.row;
            row.classList.add('swiping');
            row.style.transform = `translateX(${clampedX}px)`;

            // Update action icon state
            const archiveIcon = this.swipeState.container.querySelector('.swipe-action-archive .swipe-action-icon');
            const deleteIcon = this.swipeState.container.querySelector('.swipe-action-delete .swipe-action-icon');

            if (clampedX > SWIPE_THRESHOLD) {
                archiveIcon?.classList.add('active');
            } else {
                archiveIcon?.classList.remove('active');
            }

            if (clampedX < -SWIPE_THRESHOLD) {
                deleteIcon?.classList.add('active');
            } else {
                deleteIcon?.classList.remove('active');
            }

            this.swipeState.didSwipe = Math.abs(clampedX) > 10;
        }, { passive: false });

        // Touch end
        app.addEventListener('touchend', (e) => {
            if (!this.swipeState.active) return;

            const { currentX, container, row, startTime } = this.swipeState;
            const experimentId = container?.dataset.swipeId;

            // Calculate velocity
            const elapsed = Date.now() - startTime;
            const velocity = Math.abs(currentX) / elapsed;

            // Determine action
            const shouldTrigger = Math.abs(currentX) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

            if (shouldTrigger && currentX < -SWIPE_THRESHOLD) {
                // Swipe left - Delete
                this.handleSwipeDelete(experimentId, container);
            } else if (shouldTrigger && currentX > SWIPE_THRESHOLD) {
                // Swipe right - Archive
                this.handleSwipeArchive(experimentId, container);
            } else {
                // Snap back
                row.classList.remove('swiping');
                row.style.transform = '';
            }

            // Reset icons
            container?.querySelectorAll('.swipe-action-icon').forEach(icon => {
                icon.classList.remove('active');
            });

            this.swipeState.active = false;
        }, { passive: true });

        // Mood button click - log mood
        app.addEventListener('click', (e) => {
            const moodBtn = e.target.closest('.mood-btn[data-mood]');
            if (moodBtn) {
                const mood = parseInt(moodBtn.dataset.mood);
                this.state.pendingMood = mood;
                // Show energy picker modal
                this.openModal('modal-energy');
            }
        });

        // Energy button click - complete mood logging
        app.addEventListener('click', (e) => {
            const energyBtn = e.target.closest('.energy-btn[data-energy]');
            if (energyBtn) {
                const energy = parseInt(energyBtn.dataset.energy);
                const mood = this.state.pendingMood || 3;
                MoodTracker.logMood(new Date(), mood, energy);
                this.closeModal('modal-energy');
                this.showToast('Mood logged!');
                this.render();
            }
        });

        // Form submissions - FIXED: Use event delegation for forms
        app.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'form-create') {
                e.preventDefault();
                this.handleCreateExperiment(form);
            } else if (form.id === 'form-checkin') {
                e.preventDefault();
                this.handleCheckin(form);
            }
        });

        // Calendar navigation - FIXED: Add missing calendar nav handlers
        app.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.calendar-nav[data-dir]');
            if (navBtn) {
                const dir = parseInt(navBtn.dataset.dir);
                this.state.calendarMonth = new Date(
                    this.state.calendarMonth.getFullYear(),
                    this.state.calendarMonth.getMonth() + dir,
                    1
                );
                this.render();
            }
        });

        // Add Category Button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-add-category')) {
                this.promptAction('New Category Name', (name) => {
                    if (name && DataManager.addCategory(name)) {
                        const container = document.querySelector('#form-create .segmented-control[aria-labelledby="create-category-label"]');
                        if (container) {
                            const cats = DataManager.getCategories();
                            const html = cats.map((cat) => `
                                <button type="button" class="segmented-option ${cat === name ? 'active' : ''}" data-category="${cat}">${cat}</button>
                            `).join('') + `<button type="button" class="segmented-option" id="btn-add-category" style="flex: 0 0 auto; padding: 0 12px; font-size: 18px;">+</button>`;
                            container.innerHTML = html;
                        }
                        this.showToast(`Category "${name}" added`);
                    } else {
                        this.showToast('Invalid or duplicate category');
                    }
                });
            }
        });

        // Entry row click - Edit entry
        app.addEventListener('click', (e) => {
            const row = e.target.closest('.entry-row');
            if (row && this.state.currentExperiment) {
                const entryId = row.dataset.id;
                this.handleEditEntry(entryId);
            }
        });

        // Edit entry form submission
        app.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'form-edit-entry') {
                e.preventDefault();
                this.handleSaveEntry(form);
            }
        });

        // Delete entry button
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-delete-entry')) {
                this.confirmAction(
                    'Delete Entry?',
                    'This will permanently delete this entry. This cannot be undone.',
                    () => {
                        const entryId = document.getElementById('edit-entry-id').value;
                        DataManager.deleteEntry(this.state.currentExperiment, entryId);
                        this.closeModal('modal-edit-entry');
                        this.render();
                        this.showToast('Entry deleted');
                    }
                );
            }
        });

        // Add Partner form submission
        app.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'form-add-partner') {
                e.preventDefault();
                const name = form.querySelector('#partner-name').value.trim();
                const code = form.querySelector('#partner-code').value.trim().toUpperCase();

                if (name && code) {
                    const result = PartnersManager.addPartner(name, code);
                    if (result.success) {
                        this.closeModal('modal-add-partner');
                        form.reset();
                        this.render();
                        this.showToast(`${name} added as partner!`);
                    } else {
                        this.showToast(result.error || 'Failed to add partner');
                    }
                }
            }
        });

        // Create Challenge form submission
        app.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'form-create-challenge') {
                e.preventDefault();
                const name = form.querySelector('#challenge-name').value.trim();
                const templateId = form.querySelector('#challenge-template').value;
                const duration = parseInt(form.querySelector('#challenge-duration').value);

                // Get selected partners
                const partnerCheckboxes = form.querySelectorAll('input[name="challenge-partner"]:checked');
                const participants = Array.from(partnerCheckboxes).map(cb => ({
                    id: cb.value,
                    name: cb.dataset.name
                }));

                if (name && templateId && duration) {
                    const today = StreakCalculator.toDateString(new Date());
                    ChallengesManager.createChallenge(templateId, name, today, duration, participants);
                    this.closeModal('modal-create-challenge');
                    form.reset();
                    this.render();
                    this.showToast('Challenge started!');
                }
            }
        });

        // Open Add Partner modal
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-add-partner')) {
                this.openModal('modal-add-partner');
            }
        });

        // Open Create Challenge modal
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-create-challenge')) {
                // Populate partners list in modal
                const listContainer = document.getElementById('challenge-partners-list');
                if (listContainer) {
                    const partners = PartnersManager.getPartners();
                    if (partners.length === 0) {
                        listContainer.innerHTML = '<p style="color: var(--text-tertiary); font-size: 14px;">No partners added yet. Add partners in Settings first.</p>';
                    } else {
                        listContainer.innerHTML = partners.map(p => `
                            <label style="display: flex; align-items: center; gap: 8px; padding: 8px 0; cursor: pointer;">
                                <input type="checkbox" name="challenge-partner" value="${p.id}" data-name="${p.name}">
                                <span>${p.name}</span>
                            </label>
                        `).join('');
                    }
                }
                this.openModal('modal-create-challenge');
            }
        });

        // Copy share code
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-copy-share-code')) {
                const code = PartnersManager.getMyShareCode();
                navigator.clipboard.writeText(code).then(() => {
                    this.showToast('Share code copied!');
                }).catch(() => {
                    this.showToast('Failed to copy');
                });
            }
        });

        // Share progress
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-share-progress')) {
                const experiments = DataManager.loadExperiments();
                const shareText = PartnersManager.generateShareText(experiments);

                if (navigator.share) {
                    navigator.share({ text: shareText }).catch(() => { });
                } else {
                    navigator.clipboard.writeText(shareText).then(() => {
                        this.showToast('Progress copied to clipboard!');
                    }).catch(() => {
                        this.showToast('Failed to copy');
                    });
                }
            }
        });

        // Remove partner
        app.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.btn-remove-partner');
            if (removeBtn) {
                const partnerId = removeBtn.dataset.partnerId;
                const partnerName = removeBtn.dataset.partnerName;
                this.confirmAction(
                    'Remove Partner?',
                    `Are you sure you want to remove ${partnerName}?`,
                    () => {
                        PartnersManager.removePartner(partnerId);
                        this.render();
                        this.showToast('Partner removed');
                    }
                );
            }
        });

        // Use skip day
        app.addEventListener('click', (e) => {
            if (e.target.closest('#btn-use-skip-day')) {
                const exp = DataManager.loadExperiments().find(x => x.id === this.state.currentExperiment);
                if (exp && StreakCalculator.canUseSkipDay(exp)) {
                    const today = StreakCalculator.toDateString(new Date());
                    DataManager.addEntry(exp.id, {
                        date: today,
                        type: 'skipped',
                        isCompleted: false,
                        note: 'Skip day used'
                    });
                    this.render();
                    this.showToast('Skip day used - streak protected!');
                }
            }
        });
    },

    /**
     * Open modal
     */
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            // Save last focused element to restore later
            this.lastFocusedElement = document.activeElement;
            this.trapFocus(modal);
        }
    },

    /**
     * Close modal
     */
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            // Restore focus
            if (this.lastFocusedElement) {
                this.lastFocusedElement.focus();
            }
        }
    },

    /**
     * Handle create experiment - FIXED: Include category from selector
     */
    handleCreateExperiment(form) {
        const data = new FormData(form);
        const freqOption = form.querySelector('[data-freq].active');
        const categoryOption = form.querySelector('[data-category].active');

        const id = data.get('id');
        // DEFENSIVE: Ensure category exists, default to 'Health' if UI glitch occurs
        const category = categoryOption?.dataset.category || DataManager.getCategories()[0] || 'Health';

        // DEFENSIVE: Validate Title
        const title = data.get('title');
        if (!title || !title.trim()) {
            this.showToast('⚠️ Title is required');
            return;
        }

        const experimentData = {
            title: title,
            purpose: data.get('purpose'),
            successCriteria: data.get('criteria') || null,
            durationDays: parseInt(data.get('duration')) || 30,
            frequency: freqOption?.dataset.freq || 'daily',
            category: category,
            scheduledTime: data.get('scheduledTime') || null,
        };

        if (id) {
            // Update existing
            DataManager.updateExperiment(id, experimentData);
            this.showToast('Experiment updated');
            this.state.currentExperiment = id; // Ensure we stay on detail view
        } else {
            // Create new
            DataManager.createExperiment({
                ...experimentData,
                startDate: new Date().toISOString()
            });
            this.showToast('Experiment created!');
        }

        this.closeModal('modal-create');
        form.reset();
        this.resetCreateForm(form); // Helper to reset UI state
        this.render();
    },

    /**
     * Handle check-in - with toast feedback
     */
    handleCheckin(form) {
        const data = new FormData(form);
        const statusOption = form.querySelector('[data-status].active');
        const isCompleted = statusOption?.dataset.status === 'completed';
        const today = StreakCalculator.toDateString(new Date());

        // Check if already checked in today
        const exp = DataManager.getExperiment(this.state.currentExperiment);
        const existingEntry = exp?.entries?.find(e => e.date === today);

        const reflection = {
            plus: data.get('ref_plus')?.trim(),
            minus: data.get('ref_minus')?.trim(),
            next: data.get('ref_next')?.trim()
        };
        const hasReflection = reflection.plus || reflection.minus || reflection.next;

        DataManager.addEntry(this.state.currentExperiment, {
            date: today,
            isCompleted: isCompleted,
            note: data.get('note') || null,
            reflection: hasReflection ? reflection : null
        });

        this.closeModal('modal-checkin');
        form.reset();
        // Reset segmented controls
        form.querySelectorAll('.segmented-control').forEach(control => {
            control.querySelectorAll('.segmented-option').forEach((opt, i) => {
                opt.classList.toggle('active', i === 0);
            });
        });

        if (existingEntry) {
            this.showToast('Entry updated!');
        } else {
            this.showToast(isCompleted ? 'Great job! 🎉' : 'Entry saved');
        }
        this.render();
    },

    /**
     * Reset create form UI
     */
    resetCreateForm(form) {
        document.getElementById('modal-create-title').textContent = 'New Experiment';
        document.getElementById('create-id').value = '';
        document.getElementById('btn-delete').style.display = 'none';

        // Reset segmented controls to default state
        form.querySelectorAll('.segmented-control').forEach(control => {
            control.querySelectorAll('.segmented-option').forEach((opt, i) => {
                opt.classList.toggle('active', i === 0);
            });
        });
    },

    /**
     * Handle Edit Experiment
     */
    handleEditExperiment() {
        const exp = DataManager.getExperiment(this.state.currentExperiment);
        if (!exp) return;

        this.openModal('modal-create');

        // Populate form
        const form = document.getElementById('form-create');
        document.getElementById('modal-create-title').textContent = 'Edit Experiment';
        document.getElementById('create-id').value = exp.id;
        document.getElementById('btn-delete').style.display = 'block';

        form.elements['title'].value = exp.title;
        form.elements['purpose'].value = exp.purpose;
        form.elements['create-duration'].value = exp.durationDays;
        form.elements['create-time'].value = exp.scheduledTime || '';
        if (exp.successCriteria) form.elements['criteria'].value = exp.successCriteria;

        // Set segmented controls
        const categoryBtn = form.querySelector(`[data-category="${exp.category}"]`);
        if (categoryBtn) categoryBtn.click(); // Trigger click to update state (simple way)

        const freqBtn = form.querySelector(`[data-freq="${exp.frequency}"]`);
        if (freqBtn) freqBtn.click();
    },

    /**
     * Create experiment from template - with toast feedback
     */
    createFromTemplate(template) {
        DataManager.createExperiment({
            title: template.title,
            purpose: template.purpose,
            successCriteria: template.successCriteria,
            durationDays: template.durationDays,
            frequency: template.frequency,
            category: template.category,
            startDate: new Date().toISOString()
        });

        this.state.currentTab = 'experiments';
        this.state.currentFilter = 'ALL';
        this.showToast(`Started: ${template.title}`);
        this.render();
    },

    /**
     * Handle swipe-to-delete action
     */
    handleSwipeDelete(experimentId, container) {
        const experiment = DataManager.getExperiment(experimentId);
        if (!experiment) return;

        // Animate row off screen
        const row = container.querySelector('.experiment-row');
        row.style.transform = 'translateX(-100%)';
        row.style.transition = 'transform 0.25s ease-out';

        // Confirm after animation
        setTimeout(() => {
            if (confirm(`Delete "${experiment.title}"? This cannot be undone.`)) {
                // Collapse container
                container.style.height = container.offsetHeight + 'px';
                container.style.overflow = 'hidden';
                requestAnimationFrame(() => {
                    container.style.transition = 'height 0.3s ease, opacity 0.3s ease';
                    container.style.height = '0';
                    container.style.opacity = '0';
                });

                setTimeout(() => {
                    DataManager.deleteExperiment(experimentId);
                    this.showToast('Experiment deleted');
                    this.render();
                }, 300);
            } else {
                // Cancel - snap back
                row.classList.remove('swiping');
                row.style.transform = '';
            }
        }, 250);
    },

    /**
     * Handle swipe-to-archive action
     */
    handleSwipeArchive(experimentId, container) {
        const experiment = DataManager.getExperiment(experimentId);
        if (!experiment) return;

        // Animate row off screen
        const row = container.querySelector('.experiment-row');
        row.style.transform = 'translateX(100%)';
        row.style.transition = 'transform 0.25s ease-out';

        // Collapse container
        setTimeout(() => {
            container.style.height = container.offsetHeight + 'px';
            container.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                container.style.transition = 'height 0.3s ease, opacity 0.3s ease';
                container.style.height = '0';
                container.style.opacity = '0';
            });
        }, 200);

        // Archive after animation
        setTimeout(() => {
            DataManager.archiveExperiment(experimentId);
            this.render();

            // Show toast with undo
            this.showToast('Experiment archived', {
                undo: () => {
                    DataManager.updateExperiment(experimentId, { status: 'active' });
                    this.render();
                }
            });
        }, 500);
    },

    /**
     * Load theme from storage
     */
    loadTheme() {
        this.state.theme = localStorage.getItem('theme') || 'system';
        this.applyTheme();

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.state.theme === 'system') {
                this.applyTheme();
            }
        });
    },

    /**
     * Set theme
     */
    setTheme(theme) {
        this.state.theme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme();
        this.render(); // Re-render to update setting toggle
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
        const root = document.documentElement;
        let isDark = this.state.theme === 'dark';

        if (this.state.theme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            document.querySelector("meta[name='theme-color']").setAttribute("content", "#000000");
        } else {
            root.removeAttribute('data-theme');
            document.querySelector("meta[name='theme-color']").setAttribute("content", "#FAFAFA");
        }
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {Object} options - Optional: { undo: callback, duration: ms }
     */
    showToast(message, options = {}) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span>${message}</span>
            ${options.undo ? '<button class="toast-undo">Undo</button>' : ''}
        `;

        document.body.appendChild(toast);

        // Undo handler
        if (options.undo) {
            toast.querySelector('.toast-undo').addEventListener('click', () => {
                options.undo();
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 200);
            });
        }

        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Auto-hide
        const duration = options.duration || 3000;
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 200);
        }, duration);
    },

    /**
     * Load app version from manifest
     */
    async loadAppVersion() {
        try {
            const response = await fetch('./manifest.json');
            const manifest = await response.json();
            this.state.appVersion = manifest.version || '1.0.0';
        } catch {
            this.state.appVersion = '1.0.0';
        }
    },

    /**
     * Log to console (Debug console removed for production)
     */
    log(msg) {
        console.log(msg); // Standard console only
    },

    /**
     * Setup Service Worker update listener
     */
    setupServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            this.log('SW: Not supported');
            return;
        }

        // Log initial state
        navigator.serviceWorker.ready.then(reg => {
            this.log(`SW: Ready. Scope: ${reg.scope}`);
            this.log(`SW: Controller state: ${navigator.serviceWorker.controller ? navigator.serviceWorker.controller.state : 'none'}`);
        });

        // Listen for controller changes (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            this.log('SW: Controller changed! Reloading...');
            this.showToast('App updated! Reloading...');
            setTimeout(() => window.location.href = window.location.href, 500);
        });
    },

    /**
     * Check for service worker updates
     */
    async checkForUpdates() {
        if (!('serviceWorker' in navigator)) {
            this.showToast('Updates not supported');
            return;
        }

        this.showToast('Checking for updates...');
        this.log('SW: Forced update check started...');

        try {
            // Unregister existing to be clean (optional but safer for "Refresh" feel)
            // const regs = await navigator.serviceWorker.getRegistrations();
            // for(let reg of regs) { await reg.unregister(); }

            // Force re-register with timestamp to bypass Safari Cache
            const swUrl = `./sw.js?v=${Date.now()}`;
            this.log(`SW: Registering ${swUrl}`);

            const registration = await navigator.serviceWorker.register(swUrl);
            this.log('SW: Registration successful. Checking state...');

            // If a new worker is found, logic is handled by setupServiceWorker's registration.onupdatefound
            // But we can also manually check here:
            if (registration.installing) {
                this.log('SW: Installing worker detected.');
                // We rely on the updatefound listener setup below or in setupServiceWorker
            } else if (registration.waiting) {
                this.log('SW: Waiting worker found. Activating instantly.');
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else if (registration.active) {
                this.log('SW: Active worker. No immediate update found (or already active).');
                // If we re-registered and got same byte-content, it might just be active.
                // We will force reload if user pushed button, just in case? 
                // User said "Only thing button need to do is refresh".
                // Asking user to reload manually is safer if no update found.
                this.showToast('You are up to date.');
            }

            // Hook into updatefound for this specific new registration
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                this.log('SW: Update found! Installing...');
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        this.log('SW: Installed. SKIP_WAITING');
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });

        } catch (error) {
            console.error('Force update failed:', error);
            this.log(`SW: Error: ${error.message}`);
            this.showToast('Update failed. Try restarting app.');
            // Fallback: Force reload anyway?
            setTimeout(() => window.location.href = window.location.href, 2000);
        }
    },

    /**
     * Show toast notification
     */
    showToast(message) {
        // Remove existing toast if any
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    /**
     * Show Confirmation Dialog
     */
    confirmAction(title, message, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');

        if (!modal) return;

        titleEl.textContent = title;
        msgEl.textContent = message;

        // Clone buttons to remove old listeners
        const newCancel = cancelBtn.cloneNode(true);
        const newOk = okBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        okBtn.parentNode.replaceChild(newOk, okBtn);

        newCancel.textContent = 'Cancel';
        newOk.textContent = 'Confirm';

        newCancel.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        newOk.addEventListener('click', () => {
            modal.classList.remove('active');
            onConfirm();
        });

        this.openModal('modal-confirm');
    },

    /**
     * Show Prompt Dialog
     */
    promptAction(title, onSave) {
        const modal = document.getElementById('modal-prompt');
        const titleEl = document.getElementById('prompt-title');
        const inputEl = document.getElementById('prompt-input');
        const cancelBtn = document.getElementById('prompt-cancel');
        const okBtn = document.getElementById('prompt-ok');

        if (!modal) return;

        titleEl.textContent = title;
        inputEl.value = '';

        // Clone buttons
        const newCancel = cancelBtn.cloneNode(true);
        const newOk = okBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        okBtn.parentNode.replaceChild(newOk, okBtn);

        newCancel.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        newOk.addEventListener('click', () => {
            const val = inputEl.value.trim();
            if (val) {
                modal.classList.remove('active');
                onSave(val);
            }
        });

        this.openModal('modal-prompt');
        setTimeout(() => inputEl.focus(), 100);
    },

    /**
     * Focus Trap for Modals (Accessibility)
     */
    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', function (e) {
            const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

            if (!isTabPressed) {
                return;
            }

            if (e.shiftKey) { // if shift key pressed for shift + tab combination
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // if tab key is pressed
                if (document.activeElement === lastElement) { // if focused has reached to last element then focus first element
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        });

        // Focus first element
        setTimeout(() => firstElement.focus(), 50);
    },

    /**
     * Handle Edit Entry - populate and open edit entry modal
     */
    handleEditEntry(entryId) {
        const exp = DataManager.getExperiment(this.state.currentExperiment);
        if (!exp) return;

        const entry = exp.entries.find(e => e.id === entryId);
        if (!entry) return;

        this.openModal('modal-edit-entry');

        // Populate form
        const form = document.getElementById('form-edit-entry');
        document.getElementById('edit-entry-id').value = entry.id;
        document.getElementById('edit-entry-note').value = entry.note || '';

        // Set status segmented control
        const statusBtns = form.querySelectorAll('[data-status]');
        statusBtns.forEach(btn => {
            btn.classList.toggle('active',
                (entry.isCompleted && btn.dataset.status === 'completed') ||
                (!entry.isCompleted && btn.dataset.status === 'missed')
            );
        });

        // Set reflection fields
        if (entry.reflection) {
            document.getElementById('edit-entry-ref-plus').value = entry.reflection.plus || '';
            document.getElementById('edit-entry-ref-minus').value = entry.reflection.minus || '';
            document.getElementById('edit-entry-ref-next').value = entry.reflection.next || '';
        } else {
            document.getElementById('edit-entry-ref-plus').value = '';
            document.getElementById('edit-entry-ref-minus').value = '';
            document.getElementById('edit-entry-ref-next').value = '';
        }
    },

    /**
     * Handle Save Entry - save edited entry
     */
    handleSaveEntry(form) {
        const data = new FormData(form);
        const entryId = data.get('entryId');
        const statusOption = form.querySelector('[data-status].active');
        const isCompleted = statusOption?.dataset.status === 'completed';

        const reflection = {
            plus: data.get('ref_plus')?.trim(),
            minus: data.get('ref_minus')?.trim(),
            next: data.get('ref_next')?.trim()
        };
        const hasReflection = reflection.plus || reflection.minus || reflection.next;

        DataManager.updateEntry(this.state.currentExperiment, entryId, {
            isCompleted: isCompleted,
            note: data.get('note') || null,
            reflection: hasReflection ? reflection : null
        });

        this.closeModal('modal-edit-entry');
        this.showToast('Entry updated');
        this.render();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
