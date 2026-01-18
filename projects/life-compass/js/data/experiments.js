/**
 * Life Compass - Experiments Repository
 * ============================================
 * Handles experiment data operations.
 */

const ExperimentsRepo = {
    /**
     * Get all experiments
     * @returns {Promise<Array>}
     */
    async getAll() {
        return await DB.getAll(DB.stores.EXPERIMENTS);
    },

    /**
     * Get active experiments
     * @returns {Promise<Array>}
     */
    async getActive() {
        return await DB.getByIndex(DB.stores.EXPERIMENTS, 'status', 'active');
    },

    /**
     * Get completed experiments
     * @returns {Promise<Array>}
     */
    async getCompleted() {
        const all = await this.getAll();
        return all.filter(e => e.status !== 'active');
    },

    /**
     * Get an experiment by ID
     * @param {string} id - Experiment ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await DB.get(DB.stores.EXPERIMENTS, id);
    },

    /**
     * Create a new experiment
     * @param {Object} data - Experiment data
     * @returns {Promise<string>} Experiment ID
     */
    async create(data) {
        const experiment = {
            id: Utils.generateId(),
            title: data.title,
            emoji: data.emoji || '🧪',
            category: data.category || 'other',
            observation: data.observation || '',
            hypothesis: data.hypothesis || '',
            expectedOutcome: data.expectedOutcome || '',
            pact: {
                action: data.action,
                durationType: data.durationType || 'days',
                durationValue: data.durationValue || 21,
                frequency: data.frequency || 'daily',
                specificDays: data.specificDays || null,
                reminderTime: data.reminderTime || null,
                startDate: data.startDate || new Date().toISOString()
            },
            status: 'active',
            outcome: null,
            outcomeNotes: null
        };

        await DB.add(DB.stores.EXPERIMENTS, experiment);
        return experiment.id;
    },

    /**
     * Update an experiment
     * @param {string} id - Experiment ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const experiment = await this.get(id);
        if (!experiment) throw new Error('Experiment not found');

        await DB.update(DB.stores.EXPERIMENTS, { ...experiment, ...updates });
    },

    /**
     * Log a check-in for an experiment
     * @param {string} experimentId - Experiment ID
     * @param {Object} data - Log data
     * @returns {Promise<void>}
     */
    async logCheckin(experimentId, data) {
        const today = Utils.startOfDay();

        await DB.add(DB.stores.EXPERIMENT_LOGS, {
            id: Utils.generateId(),
            experimentId,
            date: today.toISOString(),
            completed: data.completed,
            note: data.note || null
        });
    },

    /**
     * Check if experiment has been checked in today
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<boolean>}
     */
    async isCheckedInToday(experimentId) {
        const today = Utils.startOfDay().toISOString().split('T')[0];
        const logs = await DB.getByIndex(DB.stores.EXPERIMENT_LOGS, 'experimentId', experimentId);

        return logs.some(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === today;
        });
    },

    /**
     * Get experiment progress
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<Object>}
     */
    async getProgress(experimentId) {
        const experiment = await this.get(experimentId);
        if (!experiment) return null;

        const logs = await DB.getByIndex(DB.stores.EXPERIMENT_LOGS, 'experimentId', experimentId);
        const completedDays = logs.filter(l => l.completed).length;
        const totalDays = experiment.pact.durationValue;

        // Calculate current streak
        let streak = 0;
        const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        let checkDate = Utils.startOfDay();

        for (const log of sortedLogs) {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            const checkDateStr = checkDate.toISOString().split('T')[0];

            if (logDate === checkDateStr && log.completed) {
                streak++;
                checkDate = Utils.addDays(checkDate, -1);
            } else {
                break;
            }
        }

        return {
            daysCompleted: completedDays,
            daysTotal: totalDays,
            percentage: Utils.percentage(completedDays, totalDays),
            currentStreak: streak,
            isComplete: completedDays >= totalDays
        };
    },

    /**
     * Add a reflection
     * @param {string} experimentId - Experiment ID
     * @param {Object} data - Reflection data
     * @returns {Promise<void>}
     */
    async addReflection(experimentId, data) {
        await DB.add(DB.stores.REFLECTIONS, {
            id: Utils.generateId(),
            experimentId,
            date: new Date().toISOString(),
            plus: data.plus || '',
            minus: data.minus || '',
            next: data.next || ''
        });
    },

    /**
     * Get reflections for an experiment
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<Array>}
     */
    async getReflections(experimentId) {
        return await DB.getByIndex(DB.stores.REFLECTIONS, 'experimentId', experimentId);
    },

    /**
     * Complete an experiment
     * @param {string} experimentId - Experiment ID
     * @param {Object} data - Completion data
     * @returns {Promise<void>}
     */
    async complete(experimentId, data) {
        await this.update(experimentId, {
            status: 'completed',
            outcome: data.outcome, // persist, pause, pivot
            outcomeNotes: data.notes || ''
        });

        // If persisting and creating habit, do that
        if (data.outcome === 'persist' && data.createHabit) {
            const experiment = await this.get(experimentId);
            await HabitsRepo.create({
                title: experiment.title,
                emoji: experiment.emoji,
                category: experiment.category,
                frequency: experiment.pact.frequency,
                specificDays: experiment.pact.specificDays,
                timeOfDay: 'anytime',
                reminderTime: experiment.pact.reminderTime,
                originExperimentId: experimentId
            });
        }
    },

    /**
     * Pause an experiment
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<void>}
     */
    async pause(experimentId) {
        await this.update(experimentId, { status: 'paused' });
    },

    /**
     * Resume a paused experiment
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<void>}
     */
    async resume(experimentId) {
        await this.update(experimentId, { status: 'active' });
    },

    /**
     * Delete an experiment
     * @param {string} id - Experiment ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        // Delete logs
        const logs = await DB.getByIndex(DB.stores.EXPERIMENT_LOGS, 'experimentId', id);
        for (const log of logs) {
            await DB.delete(DB.stores.EXPERIMENT_LOGS, log.id);
        }

        // Delete reflections
        const reflections = await DB.getByIndex(DB.stores.REFLECTIONS, 'experimentId', id);
        for (const reflection of reflections) {
            await DB.delete(DB.stores.REFLECTIONS, reflection.id);
        }

        await DB.delete(DB.stores.EXPERIMENTS, id);
    },

    /**
     * Get experiments by category
     * @param {string} category - Category name
     * @returns {Promise<Array>}
     */
    async getByCategory(category) {
        return await DB.getByIndex(DB.stores.EXPERIMENTS, 'category', category);
    },

    /**
     * Get experiments needing check-in today
     * @returns {Promise<Array>}
     */
    async getNeedingCheckin() {
        const active = await this.getActive();
        const needingCheckin = [];

        for (const experiment of active) {
            const checkedIn = await this.isCheckedInToday(experiment.id);
            if (!checkedIn) {
                const progress = await this.getProgress(experiment.id);
                needingCheckin.push({ ...experiment, progress });
            }
        }

        return needingCheckin;
    }
};

window.ExperimentsRepo = ExperimentsRepo;
