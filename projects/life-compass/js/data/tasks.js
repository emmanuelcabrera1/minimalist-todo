/**
 * Life Compass - Tasks Repository
 * ============================================
 * Handles task data operations.
 */

const TasksRepo = {
    /**
     * Get all tasks
     * @returns {Promise<Array>}
     */
    async getAll() {
        return await DB.getAll(DB.stores.TASKS);
    },

    /**
     * Get a task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await DB.get(DB.stores.TASKS, id);
    },

    /**
     * Get tasks for inbox (uncategorized)
     * @returns {Promise<Array>}
     */
    async getInbox() {
        const tasks = await DB.getByIndex(DB.stores.TASKS, 'projectId', 'inbox');
        return tasks.filter(t => !t.isCompleted);
    },

    /**
     * Get tasks due today
     * @returns {Promise<Array>}
     */
    async getToday() {
        const today = Utils.startOfDay().toISOString().split('T')[0];
        const tasks = await this.getAll();

        return tasks.filter(task => {
            if (task.isCompleted) return false;
            if (!task.dueDate) return false;

            const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
            return taskDate <= today;
        }).sort((a, b) => {
            // Overdue first, then by priority
            const aDate = new Date(a.dueDate);
            const bDate = new Date(b.dueDate);
            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
            return (a.priority || 4) - (b.priority || 4);
        });
    },

    /**
     * Get upcoming tasks (next 7 days)
     * @returns {Promise<Object>} Grouped by date
     */
    async getUpcoming() {
        const today = Utils.startOfDay();
        const weekFromNow = Utils.addDays(today, 7);

        const tasks = await this.getAll();
        const upcoming = tasks.filter(task => {
            if (task.isCompleted) return false;
            if (!task.dueDate) return false;

            const taskDate = new Date(task.dueDate);
            return taskDate > today && taskDate <= weekFromNow;
        });

        // Group by date
        return Utils.groupBy(upcoming, task => {
            return new Date(task.dueDate).toISOString().split('T')[0];
        });
    },

    /**
     * Get tasks by project
     * @param {string} projectId - Project ID
     * @returns {Promise<Array>}
     */
    async getByProject(projectId) {
        return await DB.getByIndex(DB.stores.TASKS, 'projectId', projectId);
    },

    /**
     * Get tasks linked to an experiment
     * @param {string} experimentId - Experiment ID
     * @returns {Promise<Array>}
     */
    async getByExperiment(experimentId) {
        return await DB.getByIndex(DB.stores.TASKS, 'experimentId', experimentId);
    },

    /**
     * Get tasks linked to a habit
     * @param {string} habitId - Habit ID
     * @returns {Promise<Array>}
     */
    async getByHabit(habitId) {
        return await DB.getByIndex(DB.stores.TASKS, 'habitId', habitId);
    },

    /**
     * Create a new task
     * @param {Object} data - Task data
     * @returns {Promise<string>} Task ID
     */
    async create(data) {
        const task = {
            id: Utils.generateId(),
            projectId: data.projectId || 'inbox',
            title: data.title,
            notes: data.notes || null,
            dueDate: data.dueDate || null,
            dueTime: data.dueTime || null,
            priority: data.priority || 4,
            labels: data.labels || [],
            isCompleted: false,
            completedAt: null,
            experimentId: data.experimentId || null,
            habitId: data.habitId || null
        };

        await DB.add(DB.stores.TASKS, task);
        return task.id;
    },

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const task = await this.get(id);
        if (!task) throw new Error('Task not found');

        await DB.update(DB.stores.TASKS, { ...task, ...updates });
    },

    /**
     * Complete a task
     * @param {string} id - Task ID
     * @returns {Promise<void>}
     */
    async complete(id) {
        await this.update(id, {
            isCompleted: true,
            completedAt: new Date().toISOString()
        });
    },

    /**
     * Uncomplete a task
     * @param {string} id - Task ID
     * @returns {Promise<void>}
     */
    async uncomplete(id) {
        await this.update(id, {
            isCompleted: false,
            completedAt: null
        });
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        await DB.delete(DB.stores.TASKS, id);
    },

    /**
     * Reschedule a task
     * @param {string} id - Task ID
     * @param {Date} newDate - New due date
     * @returns {Promise<void>}
     */
    async reschedule(id, newDate) {
        await this.update(id, {
            dueDate: newDate.toISOString()
        });
    },

    /**
     * Get task counts
     * @returns {Promise<Object>}
     */
    async getCounts() {
        const tasks = await this.getAll();
        const incomplete = tasks.filter(t => !t.isCompleted);
        const today = Utils.startOfDay().toISOString().split('T')[0];

        return {
            total: incomplete.length,
            inbox: incomplete.filter(t => t.projectId === 'inbox').length,
            today: incomplete.filter(t => {
                if (!t.dueDate) return false;
                return new Date(t.dueDate).toISOString().split('T')[0] <= today;
            }).length,
            overdue: incomplete.filter(t => {
                if (!t.dueDate) return false;
                return new Date(t.dueDate) < Utils.startOfDay();
            }).length
        };
    }
};

window.TasksRepo = TasksRepo;
