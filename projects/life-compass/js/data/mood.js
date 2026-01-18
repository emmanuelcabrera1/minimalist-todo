/**
 * Life Compass - Mood Repository
 * ============================================
 * Handles mood entry data operations.
 */

const MoodRepo = {
    /**
     * Get all mood entries
     * @returns {Promise<Array>}
     */
    async getAll() {
        const entries = await DB.getAll(DB.stores.MOOD_ENTRIES);
        return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    /**
     * Get a mood entry by ID
     * @param {string} id - Entry ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await DB.get(DB.stores.MOOD_ENTRIES, id);
    },

    /**
     * Get entries for today
     * @returns {Promise<Array>}
     */
    async getToday() {
        const entries = await this.getAll();
        return entries.filter(e => Utils.isToday(e.timestamp));
    },

    /**
     * Get entries for a date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>}
     */
    async getRange(startDate, endDate) {
        const entries = await this.getAll();
        return entries.filter(e => {
            const date = new Date(e.timestamp);
            return date >= startDate && date <= endDate;
        });
    },

    /**
     * Create a quick mood entry
     * @param {Object} data - Mood data
     * @returns {Promise<string>} Entry ID
     */
    async createQuick(data) {
        const entry = {
            id: Utils.generateId(),
            timestamp: new Date().toISOString(),
            entryType: 'quick',
            valence: data.valence, // -3 to +3
            energy: data.energy, // 1 to 5
            emotion: null,
            activities: [],
            location: null,
            peopleWith: [],
            notes: null
        };

        await DB.add(DB.stores.MOOD_ENTRIES, entry);
        return entry.id;
    },

    /**
     * Create a detailed mood entry
     * @param {Object} data - Mood data
     * @returns {Promise<string>} Entry ID
     */
    async createDetailed(data) {
        const entry = {
            id: Utils.generateId(),
            timestamp: new Date().toISOString(),
            entryType: 'detailed',
            valence: data.valence,
            energy: data.energy,
            emotion: data.emotion || null,
            activities: data.activities || [],
            location: data.location || null,
            peopleWith: data.peopleWith || [],
            notes: data.notes || null
        };

        await DB.add(DB.stores.MOOD_ENTRIES, entry);
        return entry.id;
    },

    /**
     * Update an entry
     * @param {string} id - Entry ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const entry = await this.get(id);
        if (!entry) throw new Error('Mood entry not found');

        await DB.update(DB.stores.MOOD_ENTRIES, { ...entry, ...updates });
    },

    /**
     * Delete an entry
     * @param {string} id - Entry ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        await DB.delete(DB.stores.MOOD_ENTRIES, id);
    },

    /**
     * Get average mood for a time period
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>}
     */
    async getAverages(startDate, endDate) {
        const entries = await this.getRange(startDate, endDate);

        if (entries.length === 0) {
            return { valence: 0, energy: 0, count: 0 };
        }

        const sum = entries.reduce((acc, e) => ({
            valence: acc.valence + e.valence,
            energy: acc.energy + e.energy
        }), { valence: 0, energy: 0 });

        return {
            valence: parseFloat((sum.valence / entries.length).toFixed(1)),
            energy: parseFloat((sum.energy / entries.length).toFixed(1)),
            count: entries.length
        };
    },

    /**
     * Get mood by activity correlation
     * @returns {Promise<Object>}
     */
    async getActivityCorrelations() {
        const entries = await this.getAll();
        const activityMoods = {};

        for (const entry of entries) {
            for (const activity of entry.activities || []) {
                if (!activityMoods[activity]) {
                    activityMoods[activity] = { total: 0, count: 0 };
                }
                activityMoods[activity].total += entry.valence;
                activityMoods[activity].count++;
            }
        }

        // Calculate averages
        const correlations = {};
        for (const [activity, data] of Object.entries(activityMoods)) {
            correlations[activity] = parseFloat((data.total / data.count).toFixed(1));
        }

        // Sort by correlation
        return Object.entries(correlations)
            .sort((a, b) => b[1] - a[1])
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    },

    /**
     * Get trend data for chart
     * @param {number} days - Number of days
     * @returns {Promise<Array>}
     */
    async getTrend(days = 30) {
        const endDate = Utils.endOfDay();
        const startDate = Utils.addDays(Utils.startOfDay(), -days);

        const entries = await this.getRange(startDate, endDate);
        const dailyAverages = {};

        // Group by day
        for (const entry of entries) {
            const dayStr = new Date(entry.timestamp).toISOString().split('T')[0];
            if (!dailyAverages[dayStr]) {
                dailyAverages[dayStr] = { valence: 0, count: 0 };
            }
            dailyAverages[dayStr].valence += entry.valence;
            dailyAverages[dayStr].count++;
        }

        // Create array of all days
        const trend = [];
        for (let i = 0; i < days; i++) {
            const date = Utils.addDays(startDate, i);
            const dayStr = date.toISOString().split('T')[0];
            const data = dailyAverages[dayStr];

            trend.push({
                date: dayStr,
                valence: data ? parseFloat((data.valence / data.count).toFixed(1)) : null,
                hasData: !!data
            });
        }

        return trend;
    },

    /**
     * Get dominant emotion
     * @param {number} days - Number of days
     * @returns {Promise<string|null>}
     */
    async getDominantEmotion(days = 7) {
        const endDate = Utils.endOfDay();
        const startDate = Utils.addDays(Utils.startOfDay(), -days);

        const entries = await this.getRange(startDate, endDate);
        const emotionCounts = {};

        for (const entry of entries) {
            if (entry.emotion) {
                emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            }
        }

        if (Object.keys(emotionCounts).length === 0) return null;

        return Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    },

    /**
     * Get mood at specific time of day correlations
     * @returns {Promise<Object>}
     */
    async getTimeOfDayMoods() {
        const entries = await this.getAll();
        const timeGroups = {
            morning: { total: 0, count: 0 },   // 5-12
            afternoon: { total: 0, count: 0 }, // 12-17
            evening: { total: 0, count: 0 },   // 17-21
            night: { total: 0, count: 0 }      // 21-5
        };

        for (const entry of entries) {
            const hour = new Date(entry.timestamp).getHours();
            let timeGroup;

            if (hour >= 5 && hour < 12) timeGroup = 'morning';
            else if (hour >= 12 && hour < 17) timeGroup = 'afternoon';
            else if (hour >= 17 && hour < 21) timeGroup = 'evening';
            else timeGroup = 'night';

            timeGroups[timeGroup].total += entry.valence;
            timeGroups[timeGroup].count++;
        }

        // Calculate averages
        const result = {};
        for (const [time, data] of Object.entries(timeGroups)) {
            result[time] = data.count > 0
                ? parseFloat((data.total / data.count).toFixed(1))
                : null;
        }

        return result;
    }
};

window.MoodRepo = MoodRepo;
