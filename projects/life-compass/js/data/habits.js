/**
 * Life Compass - Habits Repository
 * ============================================
 * Handles habit data operations.
 */

const HabitsRepo = {
    /**
     * Get all active habits
     * @returns {Promise<Array>}
     */
    async getAll() {
        return await DB.getByIndex(DB.stores.HABITS, 'isActive', true);
    },

    /**
     * Get a habit by ID
     * @param {string} id - Habit ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await DB.get(DB.stores.HABITS, id);
    },

    /**
     * Get habits due today
     * @returns {Promise<Array>}
     */
    async getToday() {
        const habits = await this.getAll();
        const today = new Date();
        const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()];

        return habits.filter(habit => {
            if (habit.schedule.frequency === 'daily') return true;
            if (habit.schedule.frequency === 'specific_days') {
                return habit.schedule.specificDays?.includes(dayName);
            }
            return true;
        });
    },

    /**
     * Get habits by time of day
     * @returns {Promise<Object>} Grouped by timeOfDay
     */
    async getTodayGrouped() {
        const habits = await this.getToday();
        const grouped = {
            morning: [],
            afternoon: [],
            evening: [],
            anytime: []
        };

        for (const habit of habits) {
            const timeOfDay = habit.schedule.timeOfDay || 'anytime';
            grouped[timeOfDay].push(habit);
        }

        // Add completion status for today
        const today = Utils.startOfDay().toISOString().split('T')[0];
        for (const group of Object.values(grouped)) {
            for (const habit of group) {
                habit.completedToday = await this.isCompletedOn(habit.id, today);
            }
        }

        return grouped;
    },

    /**
     * Check if habit is completed for a specific date
     * @param {string} habitId - Habit ID
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Promise<boolean>}
     */
    async isCompletedOn(habitId, dateStr) {
        const logs = await DB.getByIndex(DB.stores.HABIT_LOGS, 'habitId', habitId);
        return logs.some(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === dateStr && log.completed;
        });
    },

    /**
     * Create a new habit
     * @param {Object} data - Habit data
     * @returns {Promise<string>} Habit ID
     */
    async create(data) {
        const habit = {
            id: Utils.generateId(),
            title: data.title,
            emoji: data.emoji || '✓',
            category: data.category || 'other',
            schedule: {
                frequency: data.frequency || 'daily',
                specificDays: data.specificDays || null,
                timesPerWeek: data.timesPerWeek || null,
                timeOfDay: data.timeOfDay || 'anytime',
                reminderTime: data.reminderTime || null
            },
            tracking: {
                type: data.trackingType || 'binary',
                targetValue: data.targetValue || null,
                unit: data.unit || null
            },
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
            originExperimentId: data.originExperimentId || null,
            isActive: true
        };

        await DB.add(DB.stores.HABITS, habit);
        return habit.id;
    },

    /**
     * Update a habit
     * @param {string} id - Habit ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const habit = await this.get(id);
        if (!habit) throw new Error('Habit not found');

        await DB.update(DB.stores.HABITS, { ...habit, ...updates });
    },

    /**
     * Log habit completion
     * @param {string} habitId - Habit ID
     * @param {Object} data - Log data
     * @returns {Promise<void>}
     */
    async log(habitId, data = {}) {
        const habit = await this.get(habitId);
        if (!habit) throw new Error('Habit not found');

        const today = Utils.startOfDay();
        const dateStr = today.toISOString().split('T')[0];

        // Check if already logged today
        const existingLog = await this.isCompletedOn(habitId, dateStr);
        if (existingLog) {
            // Toggle off
            const logs = await DB.getByIndex(DB.stores.HABIT_LOGS, 'habitId', habitId);
            const todayLog = logs.find(l => new Date(l.date).toISOString().split('T')[0] === dateStr);
            if (todayLog) {
                await DB.delete(DB.stores.HABIT_LOGS, todayLog.id);
                await this.updateStreak(habitId);
            }
            return;
        }

        // Create log
        await DB.add(DB.stores.HABIT_LOGS, {
            id: Utils.generateId(),
            habitId,
            date: today.toISOString(),
            completed: true,
            value: data.value || null,
            note: data.note || null
        });

        // Update streak
        await this.updateStreak(habitId);
    },

    /**
     * Update habit streak
     * @param {string} habitId - Habit ID
     * @returns {Promise<void>}
     */
    async updateStreak(habitId) {
        const habit = await this.get(habitId);
        const logs = await DB.getByIndex(DB.stores.HABIT_LOGS, 'habitId', habitId);

        // Sort logs by date descending
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        let streak = 0;
        let checkDate = Utils.startOfDay();

        for (const log of logs) {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            const checkDateStr = checkDate.toISOString().split('T')[0];

            if (logDate === checkDateStr && log.completed) {
                streak++;
                checkDate = Utils.addDays(checkDate, -1);
            } else if (logDate < checkDateStr) {
                break;
            }
        }

        await this.update(habitId, {
            currentStreak: streak,
            longestStreak: Math.max(habit.longestStreak, streak),
            totalCompletions: logs.filter(l => l.completed).length
        });
    },

    /**
     * Get habit logs for a date range
     * @param {string} habitId - Habit ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>}
     */
    async getLogs(habitId, startDate, endDate) {
        const logs = await DB.getByIndex(DB.stores.HABIT_LOGS, 'habitId', habitId);
        return logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= startDate && logDate <= endDate;
        });
    },

    /**
     * Get week data for a habit
     * @param {string} habitId - Habit ID
     * @returns {Promise<Array>}
     */
    async getWeekData(habitId) {
        const weekDates = Utils.getCurrentWeekDates();
        const weekData = [];

        for (const date of weekDates) {
            const dateStr = date.toISOString().split('T')[0];
            const completed = await this.isCompletedOn(habitId, dateStr);
            weekData.push({
                date,
                dateStr,
                dayName: Utils.getDayName(date.getDay()),
                completed,
                isToday: Utils.isToday(date),
                isFuture: date > new Date()
            });
        }

        return weekData;
    },

    /**
     * Delete a habit
     * @param {string} id - Habit ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        // Delete logs
        const logs = await DB.getByIndex(DB.stores.HABIT_LOGS, 'habitId', id);
        for (const log of logs) {
            await DB.delete(DB.stores.HABIT_LOGS, log.id);
        }

        await DB.delete(DB.stores.HABITS, id);
    },

    /**
     * Archive a habit (set inactive)
     * @param {string} id - Habit ID
     * @returns {Promise<void>}
     */
    async archive(id) {
        await this.update(id, { isActive: false });
    },

    /**
     * Get completion stats
     * @returns {Promise<Object>}
     */
    async getStats() {
        const habits = await this.getAll();
        const today = Utils.startOfDay().toISOString().split('T')[0];

        let completedToday = 0;
        let totalToday = 0;

        for (const habit of habits) {
            const dueToday = await this.isDueToday(habit);
            if (dueToday) {
                totalToday++;
                if (await this.isCompletedOn(habit.id, today)) {
                    completedToday++;
                }
            }
        }

        return {
            completedToday,
            totalToday,
            percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
        };
    },

    /**
     * Check if habit is due today
     * @param {Object} habit - Habit object
     * @returns {boolean}
     */
    isDueToday(habit) {
        const today = new Date();
        const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()];

        if (habit.schedule.frequency === 'daily') return true;
        if (habit.schedule.frequency === 'specific_days') {
            return habit.schedule.specificDays?.includes(dayName);
        }
        return true;
    }
};

window.HabitsRepo = HabitsRepo;
