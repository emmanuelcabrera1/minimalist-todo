/**
 * Experiments - Adaptation Engine
 * Intelligent difficulty adjustment and smart rescheduling
 */

const AdaptationEngine = {
    /**
     * Analyze recent performance and generate recommendation
     */
    analyzePerformance(experiment) {
        if (!experiment.entries || experiment.entries.length < 5) {
            return null;
        }

        const last7Days = this.getLast7DaysEntries(experiment);
        const stats = this.calculateStats(last7Days);

        return {
            experimentId: experiment.id,
            experimentTitle: experiment.title,
            currentDifficulty: experiment.currentDifficulty || 2,
            stats,
            recommendation: this.generateRecommendation(experiment, stats)
        };
    },

    /**
     * Get last 7 days of entries
     */
    getLast7DaysEntries(experiment) {
        const today = new Date();
        const entries = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = StreakCalculator.toDateString(d);
            const entry = experiment.entries.find(e => e.date === dateStr);

            entries.push({
                date: dateStr,
                type: entry?.type || (entry?.isCompleted ? 'completed' : 'missed'),
                entry: entry || null
            });
        }

        return entries;
    },

    /**
     * Calculate performance stats
     */
    calculateStats(entries) {
        const completed = entries.filter(e => e.type === 'completed').length;
        const minimum = entries.filter(e => e.type === 'minimum').length;
        const skipped = entries.filter(e => e.type === 'skipped').length;
        const missed = entries.filter(e => e.type === 'missed').length;

        return {
            completed,
            minimum,
            skipped,
            missed,
            total: entries.length,
            completionRate: Math.round(((completed + minimum) / entries.length) * 100),
            fullCompletionRate: Math.round((completed / entries.length) * 100),
            minimumRate: Math.round((minimum / entries.length) * 100)
        };
    },

    /**
     * Generate difficulty recommendation
     */
    generateRecommendation(experiment, stats) {
        const currentDifficulty = experiment.currentDifficulty || 2;
        const difficultyLevels = experiment.difficultyLevels || [];

        // Conditions for downgrade
        if (stats.missed >= 3 || (stats.minimum >= 4 && stats.completed <= 1)) {
            return {
                type: 'downgrade',
                reason: stats.missed >= 3
                    ? `You've missed ${stats.missed} days this week`
                    : `You've only done the minimum ${stats.minimum} times`,
                suggestion: 'Try scaling down to rebuild momentum',
                newDifficulty: Math.max(1, currentDifficulty - 1),
                urgency: 'high'
            };
        }

        // Conditions for upgrade
        if (stats.completed >= 6 && stats.missed === 0 && currentDifficulty < 3) {
            return {
                type: 'upgrade',
                reason: `Perfect week! ${stats.completed} full completions`,
                suggestion: 'Ready to level up?',
                newDifficulty: Math.min(3, currentDifficulty + 1),
                urgency: 'low'
            };
        }

        // Maintain current
        return {
            type: 'maintain',
            reason: 'You\'re doing well at this level',
            suggestion: 'Keep up the good work!',
            newDifficulty: currentDifficulty,
            urgency: 'none'
        };
    },

    /**
     * Detect disruption patterns (3+ consecutive misses)
     */
    detectDisruption(experiment) {
        if (!experiment.entries || experiment.entries.length < 3) {
            return { disrupted: false };
        }

        // Check for 3+ consecutive misses
        const today = new Date();
        let consecutiveMisses = 0;
        let disruptionStartDate = null;

        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = StreakCalculator.toDateString(d);
            const entry = experiment.entries.find(e => e.date === dateStr);

            const isMissed = !entry || entry.type === 'missed' || (!entry.isCompleted && !entry.type);

            if (isMissed) {
                consecutiveMisses++;
                if (!disruptionStartDate) {
                    disruptionStartDate = dateStr;
                }
            } else {
                break;
            }
        }

        if (consecutiveMisses >= 3) {
            return {
                disrupted: true,
                consecutiveMisses,
                disruptionStartDate,
                daysSinceLastCompletion: consecutiveMisses,
                options: this.getRecoveryOptions(experiment, consecutiveMisses)
            };
        }

        return { disrupted: false };
    },

    /**
     * Get recovery options for disrupted experiment
     */
    getRecoveryOptions(experiment, missedDays) {
        const daysRemaining = experiment.durationDays - StreakCalculator.daysCompleted(experiment);

        return [
            {
                id: 'pause',
                title: 'Take a Break',
                description: 'Pause for up to 1 week, resume where you left off',
                icon: '⏸️',
                impact: 'Streak resets but progress is preserved'
            },
            {
                id: 'extend',
                title: 'Extend Timeline',
                description: `Add ${missedDays} days to your end date`,
                icon: '📅',
                impact: `New end date: +${missedDays} days`
            },
            {
                id: 'scale',
                title: 'Scale Down',
                description: 'Continue at minimum difficulty level',
                icon: '⬇️',
                impact: 'Lower barrier, maintain habit'
            },
            {
                id: 'restart',
                title: 'Fresh Start',
                description: 'Reset to day 1 with lessons learned',
                icon: '🔄',
                impact: 'Clean slate, keep reflection notes'
            },
            {
                id: 'end',
                title: 'End Early',
                description: 'Complete with a retrospective',
                icon: '🏁',
                impact: 'Capture learnings for next time'
            }
        ];
    },

    /**
     * Apply recovery option
     */
    applyRecoveryOption(experiment, optionId, DataManager) {
        const now = new Date();
        const disruption = this.detectDisruption(experiment);

        switch (optionId) {
            case 'pause':
                return {
                    ...experiment,
                    status: 'paused',
                    pausedAt: now.toISOString(),
                    pauseExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
                };

            case 'extend':
                const currentEnd = new Date(experiment.startDate);
                currentEnd.setDate(currentEnd.getDate() + experiment.durationDays);
                const newDuration = experiment.durationDays + disruption.consecutiveMisses;
                return {
                    ...experiment,
                    durationDays: newDuration,
                    extended: true,
                    extensionReason: `Extended by ${disruption.consecutiveMisses} days due to life disruption`
                };

            case 'scale':
                return {
                    ...experiment,
                    currentDifficulty: 1,
                    scaledDownAt: now.toISOString(),
                    scaledDownReason: 'Recovery from disruption'
                };

            case 'restart':
                return {
                    ...experiment,
                    entries: [],
                    startDate: StreakCalculator.toDateString(now),
                    restartedAt: now.toISOString(),
                    restartCount: (experiment.restartCount || 0) + 1,
                    previousAttemptNotes: experiment.entries?.filter(e => e.note).map(e => e.note) || []
                };

            case 'end':
                return {
                    ...experiment,
                    status: 'archived',
                    archivedAt: now.toISOString(),
                    archiveReason: 'ended_early',
                    needsRetrospective: true
                };

            default:
                return experiment;
        }
    },

    /**
     * Check if experiment should prompt for recovery
     */
    shouldPromptRecovery(experiment) {
        const disruption = this.detectDisruption(experiment);
        const hasSeenPrompt = experiment.recoveryPromptShownAt;

        if (!disruption.disrupted) return false;
        if (experiment.status === 'paused' || experiment.status === 'archived') return false;

        // Show prompt once per disruption event
        if (hasSeenPrompt) {
            const promptDate = new Date(hasSeenPrompt);
            const disruptStart = new Date(disruption.disruptionStartDate);
            if (promptDate > disruptStart) return false;
        }

        return true;
    },

    /**
     * Get difficulty level info
     */
    getDifficultyInfo(experiment, level) {
        const levels = experiment.difficultyLevels || [
            { level: 1, name: 'Starter', description: '2-minute version' },
            { level: 2, name: 'Standard', description: 'Regular version' },
            { level: 3, name: 'Advanced', description: 'Extended version' }
        ];

        return levels.find(l => l.level === level) || levels[1];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptationEngine;
}
