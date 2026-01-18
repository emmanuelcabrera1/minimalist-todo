/**
 * Experiments - Mood Tracking System
 * Track daily mood and energy, correlate with experiments
 */

const MOOD_LOG_KEY = 'experiments_mood_log';

const MoodTracker = {
    /**
     * Mood levels with emoji representations
     */
    MOODS: [
        { value: 1, emoji: '😢', label: 'Very Low' },
        { value: 2, emoji: '😕', label: 'Low' },
        { value: 3, emoji: '😐', label: 'Neutral' },
        { value: 4, emoji: '🙂', label: 'Good' },
        { value: 5, emoji: '😄', label: 'Great' }
    ],

    ENERGY_LEVELS: [
        { value: 1, emoji: '🪫', label: 'Exhausted' },
        { value: 2, emoji: '😴', label: 'Tired' },
        { value: 3, emoji: '⚡', label: 'Normal' },
        { value: 4, emoji: '💪', label: 'Energized' },
        { value: 5, emoji: '🔥', label: 'Peak' }
    ],

    /**
     * Load all mood entries
     */
    load() {
        try {
            return JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]');
        } catch (e) {
            console.error('Failed to load mood log:', e);
            return [];
        }
    },

    /**
     * Save mood entries
     */
    save(entries) {
        localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(entries));
    },

    /**
     * Log mood for a specific date
     */
    logMood(date, mood, energy, note = '') {
        const entries = this.load();
        const dateStr = typeof date === 'string' ? date : StreakCalculator.toDateString(date);

        // Remove existing entry for this date
        const filtered = entries.filter(e => e.date !== dateStr);

        // Add new entry
        filtered.push({
            id: this.generateId(),
            date: dateStr,
            mood: parseInt(mood),
            energy: parseInt(energy),
            note: note || null,
            timestamp: new Date().toISOString()
        });

        this.save(filtered);
        return filtered;
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'mood_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Get mood entry for a specific date
     */
    getMoodForDate(date) {
        const entries = this.load();
        const dateStr = typeof date === 'string' ? date : StreakCalculator.toDateString(date);
        return entries.find(e => e.date === dateStr);
    },

    /**
     * Get mood entries for a date range
     */
    getMoodRange(startDate, endDate) {
        const entries = this.load();
        const start = new Date(startDate);
        const end = new Date(endDate);

        return entries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= start && entryDate <= end;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Get mood trend over last N days
     */
    getMoodTrend(days = 7) {
        const entries = this.load();
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);

        const recent = entries.filter(e => new Date(e.date) >= startDate);

        if (recent.length < 2) {
            return { trend: 'insufficient_data', change: 0 };
        }

        // Calculate average for first half and second half
        const midpoint = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, midpoint);
        const secondHalf = recent.slice(midpoint);

        const avgFirst = firstHalf.reduce((sum, e) => sum + e.mood, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, e) => sum + e.mood, 0) / secondHalf.length;

        const change = avgSecond - avgFirst;

        let trend = 'stable';
        if (change > 0.3) trend = 'improving';
        if (change < -0.3) trend = 'declining';

        return {
            trend,
            change: Math.round(change * 100) / 100,
            avgMood: Math.round((recent.reduce((s, e) => s + e.mood, 0) / recent.length) * 10) / 10,
            avgEnergy: Math.round((recent.reduce((s, e) => s + e.energy, 0) / recent.length) * 10) / 10,
            entries: recent.length
        };
    },

    /**
     * Calculate average mood on days with experiment completion vs without
     */
    getCorrelationWithExperiment(experimentId, experiments) {
        const moodEntries = this.load();
        const experiment = experiments.find(e => e.id === experimentId);

        if (!experiment || !experiment.entries || moodEntries.length < 5) {
            return null;
        }

        // Get dates where experiment was completed
        const completedDates = new Set(
            experiment.entries
                .filter(e => e.type === 'completed' || e.type === 'minimum' || e.isCompleted)
                .map(e => e.date)
        );

        // Calculate mood averages
        let moodWithCompletion = [];
        let moodWithoutCompletion = [];

        moodEntries.forEach(mood => {
            if (completedDates.has(mood.date)) {
                moodWithCompletion.push(mood.mood);
            } else {
                moodWithoutCompletion.push(mood.mood);
            }
        });

        if (moodWithCompletion.length < 3 || moodWithoutCompletion.length < 3) {
            return null;
        }

        const avgWith = moodWithCompletion.reduce((a, b) => a + b, 0) / moodWithCompletion.length;
        const avgWithout = moodWithoutCompletion.reduce((a, b) => a + b, 0) / moodWithoutCompletion.length;

        return {
            experimentId,
            experimentTitle: experiment.title,
            avgMoodWithCompletion: Math.round(avgWith * 10) / 10,
            avgMoodWithoutCompletion: Math.round(avgWithout * 10) / 10,
            difference: Math.round((avgWith - avgWithout) * 10) / 10,
            sampleSize: {
                withCompletion: moodWithCompletion.length,
                withoutCompletion: moodWithoutCompletion.length
            },
            insight: avgWith > avgWithout
                ? `Your mood is ${Math.round((avgWith - avgWithout) * 10) / 10} points higher on days you complete ${experiment.title}`
                : null
        };
    },

    /**
     * Get all correlations for all experiments
     */
    getAllCorrelations(experiments) {
        return experiments
            .map(exp => this.getCorrelationWithExperiment(exp.id, experiments))
            .filter(c => c !== null && c.difference > 0.2)
            .sort((a, b) => b.difference - a.difference);
    },

    /**
     * Check if user has logged mood today
     */
    hasLoggedToday() {
        const today = StreakCalculator.toDateString(new Date());
        return this.getMoodForDate(today) !== undefined;
    },

    /**
     * Get mood emoji for value
     */
    getMoodEmoji(value) {
        const mood = this.MOODS.find(m => m.value === value);
        return mood ? mood.emoji : '😐';
    },

    /**
     * Get energy emoji for value
     */
    getEnergyEmoji(value) {
        const energy = this.ENERGY_LEVELS.find(e => e.value === value);
        return energy ? energy.emoji : '⚡';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodTracker;
}
