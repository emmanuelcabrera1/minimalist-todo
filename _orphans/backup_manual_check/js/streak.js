/**
 * Experiments - Enhanced Streak Calculator
 * Handles streaks with skip days, grace periods, and difficulty levels
 */

const StreakCalculator = {
    /**
     * Convert date to YYYY-MM-DD string
     */
    toDateString(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    /**
     * Get today's date string
     */
    today() {
        return this.toDateString(new Date());
    },

    /**
     * Get yesterday's date string
     */
    yesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return this.toDateString(d);
    },

    /**
     * Calculate current streak with skip day support
     * @param {Object} experiment - The experiment object
     * @returns {number} Current streak count
     */
    calculate(experiment) {
        if (!experiment.entries || experiment.entries.length === 0) return 0;

        const validEntries = experiment.entries.filter(e =>
            e.type === 'completed' || e.type === 'minimum' || e.type === 'skipped'
        );

        if (validEntries.length === 0) return 0;

        // Sort by date descending
        const sorted = [...validEntries].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let streak = 0;
        let currentDate = new Date();

        // Check if today or yesterday has an entry
        const todayStr = this.today();
        const yesterdayStr = this.yesterday();
        const hasTodayEntry = sorted.some(e => e.date === todayStr);
        const hasYesterdayEntry = sorted.some(e => e.date === yesterdayStr);

        if (!hasTodayEntry && !hasYesterdayEntry) {
            // Check for grace period
            if (experiment.gracePeriodActive && experiment.gracePeriodExpires) {
                const graceExpires = new Date(experiment.gracePeriodExpires);
                if (new Date() < graceExpires) {
                    // Still in grace period, count from yesterday
                    currentDate = new Date();
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        }

        // Start from the most recent valid date
        if (!hasTodayEntry) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Count consecutive days (including skipped days)
        const frequency = experiment.frequency || 'daily';
        const step = frequency === 'weekly' ? 7 : 1;

        for (let i = 0; i < 365; i++) {
            const dateStr = this.toDateString(currentDate);
            const entry = sorted.find(e => e.date === dateStr);

            if (entry) {
                if (entry.type === 'completed' || entry.type === 'minimum') {
                    streak++;
                } else if (entry.type === 'skipped') {
                    // Skipped days don't break streak but don't add to count
                    // Continue checking previous days
                }
                currentDate.setDate(currentDate.getDate() - step);
            } else {
                // No entry for this date, streak broken
                break;
            }
        }

        return streak;
    },

    /**
     * Calculate total days completed (completed + minimum)
     */
    daysCompleted(experiment) {
        if (!experiment.entries) return 0;
        return experiment.entries.filter(e =>
            e.type === 'completed' || e.type === 'minimum' || e.isCompleted === true
        ).length;
    },

    /**
     * Calculate progress percentage
     */
    progress(experiment) {
        const completed = this.daysCompleted(experiment);
        const target = experiment.durationDays || 30;
        return Math.min(completed / target, 1);
    },

    /**
     * Calculate days remaining
     */
    daysRemaining(experiment) {
        const completed = this.daysCompleted(experiment);
        const target = experiment.durationDays || 30;
        return Math.max(0, target - completed);
    },

    /**
     * Calculate earned skip days (1 per 7 consecutive completions)
     */
    calculateEarnedSkipDays(experiment) {
        const baseEarned = Math.floor(this.calculate(experiment) / 7);
        const used = (experiment.skipDaysUsed || []).length;
        return Math.max(0, baseEarned - used);
    },

    /**
     * Check if user can use a skip day
     */
    canUseSkipDay(experiment) {
        const available = this.calculateEarnedSkipDays(experiment);
        const yesterday = this.yesterday();
        const hasYesterdayEntry = experiment.entries?.some(e => e.date === yesterday);

        // Can use skip day if: has available skip days AND missed yesterday AND within grace period
        return available > 0 && !hasYesterdayEntry && experiment.gracePeriodActive;
    },

    /**
     * Check if experiment is in grace period
     */
    isInGracePeriod(experiment) {
        if (!experiment.gracePeriodActive || !experiment.gracePeriodExpires) {
            return false;
        }
        return new Date() < new Date(experiment.gracePeriodExpires);
    },

    /**
     * Get streak status with detailed info
     */
    getStreakStatus(experiment) {
        const streak = this.calculate(experiment);
        const skipDaysAvailable = this.calculateEarnedSkipDays(experiment);
        const inGracePeriod = this.isInGracePeriod(experiment);
        const canSkip = this.canUseSkipDay(experiment);
        const today = this.today();
        const hasCheckedInToday = experiment.entries?.some(e => e.date === today);

        let status = 'on_track';
        let message = '';

        if (hasCheckedInToday) {
            status = 'completed_today';
            message = 'Great job today!';
        } else if (inGracePeriod) {
            status = 'grace_period';
            const hoursLeft = Math.ceil((new Date(experiment.gracePeriodExpires) - new Date()) / (1000 * 60 * 60));
            message = `${hoursLeft} hours to save your streak`;
        } else if (streak === 0) {
            status = 'no_streak';
            message = 'Start your streak today!';
        } else {
            status = 'pending';
            message = 'Check in to continue your streak';
        }

        return {
            streak,
            skipDaysAvailable,
            inGracePeriod,
            canSkip,
            hasCheckedInToday,
            status,
            message
        };
    },

    /**
     * Detect if streak is at risk (declining performance)
     */
    isStreakAtRisk(experiment) {
        if (!experiment.entries || experiment.entries.length < 7) return false;

        // Get last 7 entries
        const recentEntries = [...experiment.entries]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);

        // Count minimum-only days
        const minimumDays = recentEntries.filter(e => e.type === 'minimum').length;

        // At risk if >50% minimum days or 2+ missed in last 7
        const missedDays = recentEntries.filter(e => e.type === 'missed').length;

        return minimumDays >= 4 || missedDays >= 2;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakCalculator;
}
