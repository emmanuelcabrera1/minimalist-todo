/**
 * Life Compass - Life Calendar Repository
 * ============================================
 * Handles life events, phases, and counters.
 */

const LifeRepo = {
    /**
     * Get all life events
     * @returns {Promise<Array>}
     */
    async getEvents() {
        const events = await DB.getAll(DB.stores.LIFE_EVENTS);
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Get all life phases
     * @returns {Promise<Array>}
     */
    async getPhases() {
        const phases = await DB.getAll(DB.stores.LIFE_PHASES);
        return phases.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },

    /**
     * Get all special counters
     * @returns {Promise<Array>}
     */
    async getCounters() {
        return await DB.getAll(DB.stores.SPECIAL_COUNTERS);
    },

    /**
     * Create a life event
     * @param {Object} data - Event data
     * @returns {Promise<string>} Event ID
     */
    async createEvent(data) {
        const event = {
            id: Utils.generateId(),
            title: data.title,
            date: data.date,
            type: data.type || 'milestone', // milestone, recurring, phase_start, phase_end
            color: data.color || '#64D2FF',
            emoji: data.emoji || '✦',
            reflection: data.reflection || null
        };

        await DB.add(DB.stores.LIFE_EVENTS, event);
        return event.id;
    },

    /**
     * Update a life event
     * @param {string} id - Event ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async updateEvent(id, updates) {
        const event = await DB.get(DB.stores.LIFE_EVENTS, id);
        if (!event) throw new Error('Event not found');

        await DB.update(DB.stores.LIFE_EVENTS, { ...event, ...updates });
    },

    /**
     * Delete a life event
     * @param {string} id - Event ID
     * @returns {Promise<void>}
     */
    async deleteEvent(id) {
        await DB.delete(DB.stores.LIFE_EVENTS, id);
    },

    /**
     * Create a life phase
     * @param {Object} data - Phase data
     * @returns {Promise<string>} Phase ID
     */
    async createPhase(data) {
        const phase = {
            id: Utils.generateId(),
            title: data.title,
            startDate: data.startDate,
            endDate: data.endDate || null,
            color: data.color || '#3478F6',
            reflection: data.reflection || null
        };

        await DB.add(DB.stores.LIFE_PHASES, phase);
        return phase.id;
    },

    /**
     * Update a life phase
     * @param {string} id - Phase ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async updatePhase(id, updates) {
        const phase = await DB.get(DB.stores.LIFE_PHASES, id);
        if (!phase) throw new Error('Phase not found');

        await DB.update(DB.stores.LIFE_PHASES, { ...phase, ...updates });
    },

    /**
     * Delete a life phase
     * @param {string} id - Phase ID
     * @returns {Promise<void>}
     */
    async deletePhase(id) {
        await DB.delete(DB.stores.LIFE_PHASES, id);
    },

    /**
     * Create a special counter
     * @param {Object} data - Counter data
     * @returns {Promise<string>} Counter ID
     */
    async createCounter(data) {
        const counter = {
            id: Utils.generateId(),
            title: data.title,
            calculationType: data.calculationType || 'weekends_left', // weekends_left, holidays_left, custom
            personBirthDate: data.personBirthDate || null,
            personEstimatedLifespan: data.personEstimatedLifespan || 85,
            frequency: data.frequency || 'weekly' // weekly, monthly, yearly
        };

        await DB.add(DB.stores.SPECIAL_COUNTERS, counter);
        return counter.id;
    },

    /**
     * Delete a special counter
     * @param {string} id - Counter ID
     * @returns {Promise<void>}
     */
    async deleteCounter(id) {
        await DB.delete(DB.stores.SPECIAL_COUNTERS, id);
    },

    /**
     * Calculate counter value
     * @param {Object} counter - Counter object
     * @returns {number}
     */
    calculateCounterValue(counter) {
        if (!counter.personBirthDate) return 0;

        const today = new Date();
        const personBirth = new Date(counter.personBirthDate);
        const personAge = Utils.calculateAge(personBirth);
        const yearsRemaining = counter.personEstimatedLifespan - personAge;

        if (yearsRemaining <= 0) return 0;

        switch (counter.frequency) {
            case 'weekly':
                return yearsRemaining * 52;
            case 'monthly':
                return yearsRemaining * 12;
            case 'yearly':
                return yearsRemaining;
            default:
                return yearsRemaining * 12; // Default to monthly
        }
    },

    /**
     * Calculate life grid data
     * @returns {Promise<Object>}
     */
    async getLifeGridData() {
        const settings = await SettingsRepo.get();

        if (!settings.birthDate) {
            return {
                configured: false,
                message: 'Please set your birth date in settings'
            };
        }

        const birthDate = new Date(settings.birthDate);
        const lifespan = settings.estimatedLifespan || 80;
        const healthyYears = settings.healthyYearsRemaining || lifespan - 10;

        const currentAge = Utils.calculateAge(birthDate);
        const weeksLived = Utils.calculateWeeksLived(birthDate);
        const totalWeeks = lifespan * 52;
        const currentWeek = weeksLived % 52;
        const currentYear = Math.floor(weeksLived / 52);

        const events = await this.getEvents();
        const phases = await this.getPhases();

        // Create week data
        const weeks = [];
        for (let year = 0; year < lifespan; year++) {
            for (let week = 0; week < 52; week++) {
                const weekNumber = year * 52 + week;
                const weekDate = Utils.addDays(birthDate, weekNumber * 7);

                let status;
                if (weekNumber < weeksLived) {
                    status = 'lived';
                } else if (weekNumber === weeksLived) {
                    status = 'current';
                } else if (year < healthyYears) {
                    status = 'healthy-future';
                } else {
                    status = 'later-future';
                }

                // Check for events in this week
                const weekStart = Utils.addDays(birthDate, weekNumber * 7);
                const weekEnd = Utils.addDays(weekStart, 7);
                const weekEvents = events.filter(e => {
                    const eventDate = new Date(e.date);
                    return eventDate >= weekStart && eventDate < weekEnd;
                });

                weeks.push({
                    year,
                    week,
                    weekNumber,
                    date: weekDate,
                    status,
                    hasEvent: weekEvents.length > 0,
                    events: weekEvents
                });
            }
        }

        return {
            configured: true,
            birthDate,
            currentAge,
            weeksLived,
            weeksRemaining: totalWeeks - weeksLived,
            healthyWeeksRemaining: (healthyYears * 52) - weeksLived,
            percentageLived: Utils.percentage(weeksLived, totalWeeks),
            currentWeek,
            currentYear,
            lifespan,
            healthyYears,
            weeks,
            events,
            phases
        };
    },

    /**
     * Get event by week
     * @param {number} weekNumber - Week number from birth
     * @returns {Promise<Array>}
     */
    async getEventsByWeek(weekNumber) {
        const settings = await SettingsRepo.get();
        if (!settings.birthDate) return [];

        const birthDate = new Date(settings.birthDate);
        const weekStart = Utils.addDays(birthDate, weekNumber * 7);
        const weekEnd = Utils.addDays(weekStart, 7);

        const events = await this.getEvents();
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= weekStart && eventDate < weekEnd;
        });
    },

    /**
     * Get statistics for a specific week
     * @param {number} weekNumber - Week number from birth
     * @returns {Promise<Object>}
     */
    async getWeekStats(weekNumber) {
        const settings = await SettingsRepo.get();
        if (!settings.birthDate) return null;

        const birthDate = new Date(settings.birthDate);
        const weekStart = Utils.addDays(birthDate, weekNumber * 7);
        const weekEnd = Utils.addDays(weekStart, 7);

        // Get data from other modules for this week
        const tasks = await TasksRepo.getAll();
        const weekTasks = tasks.filter(t => {
            if (!t.completedAt) return false;
            const date = new Date(t.completedAt);
            return date >= weekStart && date < weekEnd;
        });

        const moodEntries = await MoodRepo.getRange(weekStart, weekEnd);
        const avgMood = moodEntries.length > 0
            ? parseFloat((moodEntries.reduce((sum, e) => sum + e.valence, 0) / moodEntries.length).toFixed(1))
            : null;

        return {
            weekNumber,
            startDate: weekStart,
            endDate: weekEnd,
            tasksCompleted: weekTasks.length,
            moodEntries: moodEntries.length,
            averageMood: avgMood,
            events: await this.getEventsByWeek(weekNumber)
        };
    }
};

window.LifeRepo = LifeRepo;
