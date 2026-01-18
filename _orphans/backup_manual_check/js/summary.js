/**
 * Experiments - Summary & Retrospective System
 * Weekly summaries and experiment retrospectives
 */

const SUMMARIES_KEY = 'experiments_summaries';
const RETROSPECTIVES_KEY = 'experiments_retrospectives';

const SummaryManager = {
    /**
     * Load summaries
     */
    loadSummaries() {
        try {
            return JSON.parse(localStorage.getItem(SUMMARIES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    /**
     * Save summaries
     */
    saveSummaries(summaries) {
        localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
    },

    /**
     * Load retrospectives
     */
    loadRetrospectives() {
        try {
            return JSON.parse(localStorage.getItem(RETROSPECTIVES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    /**
     * Save retrospectives
     */
    saveRetrospectives(retrospectives) {
        localStorage.setItem(RETROSPECTIVES_KEY, JSON.stringify(retrospectives));
    },

    /**
     * Get week start date (Sunday) - returns Date object
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Get week start as string
     */
    getWeekStartString(date) {
        return StreakCalculator.toDateString(this.getWeekStart(date));
    },

    /**
     * Generate weekly summary
     */
    generateWeeklySummary(experiments, weekStart = null) {
        const startDate = weekStart ? new Date(weekStart) : this.getWeekStart(new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const experimentSummaries = experiments
            .filter(exp => exp.status !== 'archived')
            .map(exp => {
                const weekEntries = (exp.entries || []).filter(e => {
                    const entryDate = new Date(e.date);
                    return entryDate >= startDate && entryDate <= endDate;
                });

                const completed = weekEntries.filter(e =>
                    e.type === 'completed' || e.isCompleted
                ).length;
                const minimum = weekEntries.filter(e => e.type === 'minimum').length;
                const missed = 7 - completed - minimum;

                // Calculate trend vs previous week
                const prevWeekStart = new Date(startDate);
                prevWeekStart.setDate(prevWeekStart.getDate() - 7);
                const prevWeekEnd = new Date(startDate);
                prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

                const prevWeekEntries = (exp.entries || []).filter(e => {
                    const entryDate = new Date(e.date);
                    return entryDate >= prevWeekStart && entryDate <= prevWeekEnd;
                });

                const prevCompleted = prevWeekEntries.filter(e =>
                    e.type === 'completed' || e.isCompleted
                ).length;

                let trend = 'stable';
                if (completed > prevCompleted + 1) trend = 'up';
                if (completed < prevCompleted - 1) trend = 'down';

                return {
                    experimentId: exp.id,
                    title: exp.title,
                    category: exp.category,
                    completed,
                    minimum,
                    missed,
                    completionRate: Math.round(((completed + minimum) / 7) * 100),
                    trend,
                    streak: StreakCalculator.calculate(exp),
                    highlight: completed === 7 ? 'Perfect week!' :
                        completed >= 5 ? 'Great progress!' :
                            missed >= 4 ? 'Needs attention' : null
                };
            });

        // Get mood data for the week
        const moodEntries = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const mood = MoodTracker.getMoodForDate(StreakCalculator.toDateString(d));
            if (mood) moodEntries.push(mood);
        }

        const avgMood = moodEntries.length > 0
            ? Math.round((moodEntries.reduce((s, m) => s + m.mood, 0) / moodEntries.length) * 10) / 10
            : null;

        const avgEnergy = moodEntries.length > 0
            ? Math.round((moodEntries.reduce((s, m) => s + m.energy, 0) / moodEntries.length) * 10) / 10
            : null;

        // Calculate overall score
        const totalCompleted = experimentSummaries.reduce((s, e) => s + e.completed + e.minimum, 0);
        const totalPossible = experimentSummaries.length * 7;
        const overallScore = Math.round((totalCompleted / totalPossible) * 100) || 0;

        // Generate insights
        const insights = InsightsEngine.generateWeeklyInsights(experiments);

        // Top insight
        const sortedByCompletion = [...experimentSummaries].sort((a, b) => b.completionRate - a.completionRate);
        const topPerformer = sortedByCompletion[0];
        const needsWork = sortedByCompletion[sortedByCompletion.length - 1];

        let topInsight = '';
        if (topPerformer && topPerformer.completionRate >= 80) {
            topInsight = `${topPerformer.title} was your star this week at ${topPerformer.completionRate}%!`;
        } else if (needsWork && needsWork.completionRate < 50) {
            topInsight = `${needsWork.title} needs some love - only ${needsWork.completionRate}% this week.`;
        } else {
            topInsight = `Solid week overall with ${overallScore}% completion across all experiments.`;
        }

        const weekOfString = StreakCalculator.toDateString(startDate);
        return {
            id: 'summary_' + weekOfString,
            weekOf: weekOfString,
            weekEnd: StreakCalculator.toDateString(endDate),
            generatedAt: new Date().toISOString(),
            experiments: experimentSummaries,
            mood: {
                average: avgMood,
                energy: avgEnergy,
                entries: moodEntries.length,
                trend: MoodTracker.getMoodTrend(7).trend
            },
            overallScore,
            topInsight,
            insights,
            stats: {
                totalExperiments: experimentSummaries.length,
                perfectWeeks: experimentSummaries.filter(e => e.completed === 7).length,
                atRisk: experimentSummaries.filter(e => e.missed >= 4).length
            }
        };
    },

    /**
     * Save weekly summary
     */
    saveWeeklySummary(summary) {
        const summaries = this.loadSummaries();

        // Remove existing summary for same week
        const filtered = summaries.filter(s => s.weekOf !== summary.weekOf);
        filtered.push(summary);

        // Keep last 12 weeks
        const sorted = filtered.sort((a, b) => new Date(b.weekOf) - new Date(a.weekOf));
        this.saveSummaries(sorted.slice(0, 12));
    },

    /**
     * Get summary for a specific week
     */
    getSummary(weekOf) {
        return this.loadSummaries().find(s => s.weekOf === weekOf);
    },

    /**
     * Get latest summary
     */
    getLatestSummary() {
        const summaries = this.loadSummaries();
        return summaries.length > 0 ? summaries[0] : null;
    },

    /**
     * Check if should show weekly summary (Sunday evening)
     */
    shouldShowWeeklySummary() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        const hour = now.getHours();

        // Show on Sunday after 6pm
        if (day !== 0 || hour < 18) return false;

        // Check if already shown this week
        const thisWeekStart = this.getWeekStartString(now);
        const existing = this.getSummary(thisWeekStart);

        if (existing && existing.shownAt) {
            return false; // Already shown
        }

        return true;
    },

    /**
     * Mark summary as shown
     */
    markSummaryShown(weekOf) {
        const summaries = this.loadSummaries();
        const summary = summaries.find(s => s.weekOf === weekOf);

        if (summary) {
            summary.shownAt = new Date().toISOString();
            this.saveSummaries(summaries);
        }
    },

    // ==========================================
    // RETROSPECTIVES
    // ==========================================

    /**
     * Retrospective questions by category
     */
    getRetrospectiveQuestions(category) {
        const baseQuestions = [
            { id: 'goal_achieved', question: 'Did this experiment achieve your goal?', type: 'rating', min: 1, max: 5 },
            { id: 'hardest_part', question: 'What was the hardest part?', type: 'text' },
            { id: 'surprise', question: 'What surprised you?', type: 'text' },
            { id: 'continuation', question: 'Will you continue this habit?', type: 'choice', options: ['Yes, as is', 'Yes, modified', 'No'] },
            { id: 'advice', question: 'What would you tell someone starting this?', type: 'text' }
        ];

        const categoryQuestions = {
            Health: [
                { id: 'energy_change', question: 'How did your energy levels change?', type: 'rating', min: 1, max: 5 }
            ],
            Emotions: [
                { id: 'mood_impact', question: 'How did this affect your overall mood?', type: 'rating', min: 1, max: 5 }
            ],
            Work: [
                { id: 'productivity_change', question: 'Did your productivity improve?', type: 'rating', min: 1, max: 5 }
            ]
        };

        return [
            ...baseQuestions,
            ...(categoryQuestions[category] || [])
        ];
    },

    /**
     * Save retrospective
     */
    saveRetrospective(experimentId, responses) {
        const retrospectives = this.loadRetrospectives();

        const retrospective = {
            id: 'retro_' + Date.now(),
            experimentId,
            responses,
            completedAt: new Date().toISOString()
        };

        retrospectives.push(retrospective);
        this.saveRetrospectives(retrospectives);

        return retrospective;
    },

    /**
     * Get retrospective for experiment
     */
    getRetrospective(experimentId) {
        return this.loadRetrospectives().find(r => r.experimentId === experimentId);
    },

    /**
     * Check if experiment needs retrospective
     */
    needsRetrospective(experiment) {
        if (experiment.status !== 'archived') return false;

        const hasRetro = this.getRetrospective(experiment.id);
        return !hasRetro;
    },

    /**
     * Get all retrospectives for analysis
     */
    getAllRetrospectives() {
        return this.loadRetrospectives();
    },

    /**
     * Get lessons learned from retrospectives
     */
    getLessonsLearned(category = null) {
        const retrospectives = this.loadRetrospectives();

        return retrospectives
            .filter(r => {
                if (!category) return true;
                // Would need to join with experiments to filter by category
                return true;
            })
            .map(r => ({
                experimentId: r.experimentId,
                advice: r.responses.advice,
                hardestPart: r.responses.hardest_part,
                continuation: r.responses.continuation,
                completedAt: r.completedAt
            }))
            .filter(l => l.advice);
    },

    /**
     * Generate summary share text
     */
    generateShareText(summary) {
        let text = `📊 Weekly Summary - Week of ${summary.weekOf}\n\n`;

        text += `Overall Score: ${summary.overallScore}%\n\n`;

        summary.experiments.forEach(exp => {
            const trendEmoji = exp.trend === 'up' ? '📈' : exp.trend === 'down' ? '📉' : '➡️';
            text += `${trendEmoji} ${exp.title}: ${exp.completionRate}% (${exp.streak} day streak)\n`;
        });

        if (summary.mood.average) {
            text += `\n😊 Avg Mood: ${summary.mood.average}/5\n`;
        }

        text += `\n💡 ${summary.topInsight}`;

        return text;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SummaryManager;
}
