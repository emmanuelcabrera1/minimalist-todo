/**
 * Experiments - Insights Engine
 * Pattern recognition, correlations, and intelligent recommendations
 */

const InsightsEngine = {
    /**
     * Day names for display
     */
    DAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    /**
     * Analyze day-of-week patterns for an experiment
     */
    getDayOfWeekPatterns(experiment) {
        if (!experiment.entries || experiment.entries.length < 14) {
            return null;
        }

        // Count completions by day of week
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];

        experiment.entries.forEach(entry => {
            const dayIndex = new Date(entry.date).getDay();
            dayTotals[dayIndex]++;
            if (entry.type === 'completed' || entry.type === 'minimum' || entry.isCompleted) {
                dayCounts[dayIndex]++;
            }
        });

        // Calculate completion rates
        const rates = dayCounts.map((count, i) => ({
            day: this.DAYS[i],
            dayIndex: i,
            completions: count,
            total: dayTotals[i],
            rate: dayTotals[i] > 0 ? Math.round((count / dayTotals[i]) * 100) : 0
        })).filter(d => d.total >= 2);

        if (rates.length < 5) return null;

        const sortedByRate = [...rates].sort((a, b) => b.rate - a.rate);
        const best = sortedByRate[0];
        const worst = sortedByRate[sortedByRate.length - 1];

        return {
            experimentId: experiment.id,
            experimentTitle: experiment.title,
            bestDay: best,
            worstDay: worst,
            allDays: rates,
            insight: worst.rate < 50
                ? `You complete ${experiment.title} only ${worst.rate}% of ${worst.day}s. Consider rescheduling or planning ahead.`
                : null
        };
    },

    /**
     * Analyze optimal time of day based on completion timestamps
     */
    getOptimalTimeAnalysis(experiment) {
        if (!experiment.entries || experiment.entries.length < 7) {
            return null;
        }

        // Get entries with completion timestamps
        const entriesWithTime = experiment.entries.filter(e =>
            e.completedAt && (e.type === 'completed' || e.type === 'minimum' || e.isCompleted)
        );

        if (entriesWithTime.length < 5) return null;

        // Extract hours
        const hours = entriesWithTime.map(e => new Date(e.completedAt).getHours());

        // Find mode (most common hour)
        const hourCounts = {};
        hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);

        const mode = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])[0];

        const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
        const scheduledTime = experiment.scheduledTime;

        let scheduledHour = null;
        if (scheduledTime) {
            scheduledHour = parseInt(scheduledTime.split(':')[0]);
        }

        const formatHour = (h) => {
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 || 12;
            return `${hour12}:00 ${period}`;
        };

        return {
            experimentId: experiment.id,
            experimentTitle: experiment.title,
            mostCommonHour: parseInt(mode[0]),
            mostCommonHourFormatted: formatHour(parseInt(mode[0])),
            averageHour: avgHour,
            averageHourFormatted: formatHour(avgHour),
            scheduledHour,
            scheduledTime,
            insight: scheduledHour && Math.abs(avgHour - scheduledHour) >= 2
                ? `You usually do ${experiment.title} around ${formatHour(avgHour)}, but it's scheduled for ${scheduledTime}. Consider updating your reminder.`
                : null
        };
    },

    /**
     * Detect experiments that are typically done together
     */
    findExperimentPairs(experiments) {
        if (experiments.length < 2) return [];

        const pairs = [];

        for (let i = 0; i < experiments.length; i++) {
            for (let j = i + 1; j < experiments.length; j++) {
                const expA = experiments[i];
                const expB = experiments[j];

                if (!expA.entries || !expB.entries) continue;
                if (expA.entries.length < 7 || expB.entries.length < 7) continue;

                // Get dates for each experiment
                const datesA = new Set(
                    expA.entries
                        .filter(e => e.type === 'completed' || e.type === 'minimum' || e.isCompleted)
                        .map(e => e.date)
                );
                const datesB = new Set(
                    expB.entries
                        .filter(e => e.type === 'completed' || e.type === 'minimum' || e.isCompleted)
                        .map(e => e.date)
                );

                // Calculate overlap
                let both = 0;
                let onlyA = 0;
                let onlyB = 0;

                datesA.forEach(d => {
                    if (datesB.has(d)) both++;
                    else onlyA++;
                });
                datesB.forEach(d => {
                    if (!datesA.has(d)) onlyB++;
                });

                const total = both + onlyA + onlyB;
                if (total < 10) continue;

                const togetherRate = Math.round((both / Math.min(datesA.size, datesB.size)) * 100);

                if (togetherRate >= 60) {
                    pairs.push({
                        experimentA: { id: expA.id, title: expA.title },
                        experimentB: { id: expB.id, title: expB.title },
                        togetherRate,
                        daysTogether: both,
                        insight: `${expA.title} + ${expB.title} are completed together ${togetherRate}% of the time. Consider stacking them!`
                    });
                }
            }
        }

        return pairs.sort((a, b) => b.togetherRate - a.togetherRate);
    },

    /**
     * Predict streak risk based on recent patterns
     */
    predictStreakRisk(experiment) {
        if (!experiment.entries || experiment.entries.length < 7) {
            return { atRisk: false, reason: null };
        }

        // Analyze last 7 days
        const today = new Date();
        const last7Days = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = StreakCalculator.toDateString(d);
            const entry = experiment.entries.find(e => e.date === dateStr);
            last7Days.push({
                date: dateStr,
                type: entry?.type || entry?.isCompleted ? 'completed' : 'missed'
            });
        }

        const missedCount = last7Days.filter(d => d.type === 'missed').length;
        const minimumCount = last7Days.filter(d => d.type === 'minimum').length;

        let atRisk = false;
        let riskLevel = 'low';
        let reason = null;

        if (missedCount >= 3) {
            atRisk = true;
            riskLevel = 'high';
            reason = `You've missed ${missedCount} of the last 7 days`;
        } else if (minimumCount >= 4) {
            atRisk = true;
            riskLevel = 'medium';
            reason = `You've only done the minimum ${minimumCount} times in the last week`;
        } else if (missedCount >= 2) {
            atRisk = true;
            riskLevel = 'medium';
            reason = `${missedCount} missed days in the last week`;
        }

        return {
            atRisk,
            riskLevel,
            reason,
            missedLast7: missedCount,
            minimumLast7: minimumCount,
            suggestion: atRisk
                ? 'Consider scaling down to the minimum version to rebuild momentum'
                : null
        };
    },

    /**
     * Get personalized recommendations
     */
    getRecommendations(experiments, moodData) {
        const recommendations = [];

        experiments.forEach(exp => {
            // Check streak risk
            const risk = this.predictStreakRisk(exp);
            if (risk.atRisk) {
                recommendations.push({
                    type: 'streak_risk',
                    priority: risk.riskLevel === 'high' ? 1 : 2,
                    experimentId: exp.id,
                    experimentTitle: exp.title,
                    message: risk.reason,
                    action: risk.suggestion,
                    actionType: 'scale_down'
                });
            }

            // Check day patterns
            const dayPattern = this.getDayOfWeekPatterns(exp);
            if (dayPattern && dayPattern.worstDay.rate < 40) {
                recommendations.push({
                    type: 'day_pattern',
                    priority: 3,
                    experimentId: exp.id,
                    experimentTitle: exp.title,
                    message: `${dayPattern.worstDay.day}s are your weakest day for ${exp.title}`,
                    action: `Plan ahead or reschedule ${exp.title} on ${dayPattern.worstDay.day}s`,
                    actionType: 'reschedule'
                });
            }

            // Check timing optimization
            const timing = this.getOptimalTimeAnalysis(exp);
            if (timing && timing.insight) {
                recommendations.push({
                    type: 'timing',
                    priority: 4,
                    experimentId: exp.id,
                    experimentTitle: exp.title,
                    message: timing.insight,
                    action: `Update reminder to ${timing.averageHourFormatted}`,
                    actionType: 'update_time',
                    suggestedTime: `${String(timing.averageHour).padStart(2, '0')}:00`
                });
            }
        });

        // Sort by priority
        return recommendations.sort((a, b) => a.priority - b.priority);
    },

    /**
     * Generate weekly insights summary
     */
    generateWeeklyInsights(experiments) {
        const insights = [];

        // Best performing experiment
        const withEntries = experiments.filter(e => e.entries && e.entries.length >= 7);
        if (withEntries.length > 0) {
            const sorted = withEntries
                .map(exp => ({
                    exp,
                    rate: this.getCompletionRate(exp, 7)
                }))
                .sort((a, b) => b.rate - a.rate);

            if (sorted[0].rate >= 70) {
                insights.push({
                    type: 'top_performer',
                    emoji: '🏆',
                    title: 'Star Performer',
                    message: `${sorted[0].exp.title} is on fire with ${sorted[0].rate}% completion this week!`
                });
            }

            if (sorted.length > 1 && sorted[sorted.length - 1].rate < 50) {
                insights.push({
                    type: 'needs_attention',
                    emoji: '⚠️',
                    title: 'Needs Attention',
                    message: `${sorted[sorted.length - 1].exp.title} is at ${sorted[sorted.length - 1].rate}% this week. Scale down?`
                });
            }
        }

        // Experiment pairs
        const pairs = this.findExperimentPairs(experiments);
        if (pairs.length > 0) {
            insights.push({
                type: 'habit_stack',
                emoji: '🔗',
                title: 'Habit Stack Detected',
                message: pairs[0].insight
            });
        }

        return insights;
    },

    /**
     * Calculate completion rate for last N days
     */
    getCompletionRate(experiment, days = 7) {
        if (!experiment.entries) return 0;

        const today = new Date();
        let completed = 0;
        let total = 0;

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = StreakCalculator.toDateString(d);
            const entry = experiment.entries.find(e => e.date === dateStr);

            total++;
            if (entry && (entry.type === 'completed' || entry.type === 'minimum' || entry.isCompleted)) {
                completed++;
            }
        }

        return Math.round((completed / total) * 100);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InsightsEngine;
}
