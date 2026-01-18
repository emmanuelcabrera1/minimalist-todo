/**
 * Life Compass - Projects Repository
 * ============================================
 * Handles project/list data operations.
 */

const ProjectsRepo = {
    /**
     * Get all projects
     * @returns {Promise<Array>}
     */
    async getAll() {
        const projects = await DB.getAll(DB.stores.PROJECTS);
        return Utils.sortBy(projects, 'sortOrder', 'asc');
    },

    /**
     * Get inbox project
     * @returns {Promise<Object>}
     */
    async getInbox() {
        return await DB.get(DB.stores.PROJECTS, 'inbox');
    },

    /**
     * Get a project by ID
     * @param {string} id - Project ID
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        return await DB.get(DB.stores.PROJECTS, id);
    },

    /**
     * Create a new project
     * @param {Object} data - Project data
     * @returns {Promise<string>} Project ID
     */
    async create(data) {
        const projects = await this.getAll();
        const maxOrder = projects.reduce((max, p) => Math.max(max, p.sortOrder || 0), 0);

        const project = {
            id: Utils.generateId(),
            name: data.name,
            color: data.color || '#8E8E93',
            icon: data.icon || '📁',
            isInbox: false,
            sortOrder: maxOrder + 1,
            parentId: data.parentId || null,
            ...data
        };

        await DB.add(DB.stores.PROJECTS, project);
        return project.id;
    },

    /**
     * Update a project
     * @param {string} id - Project ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<void>}
     */
    async update(id, updates) {
        const project = await this.get(id);
        if (!project) throw new Error('Project not found');

        await DB.update(DB.stores.PROJECTS, { ...project, ...updates });
    },

    /**
     * Delete a project (moves tasks to inbox)
     * @param {string} id - Project ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const project = await this.get(id);
        if (!project || project.isInbox) {
            throw new Error('Cannot delete this project');
        }

        // Move tasks to inbox
        const tasks = await DB.getByIndex(DB.stores.TASKS, 'projectId', id);
        for (const task of tasks) {
            await DB.update(DB.stores.TASKS, { ...task, projectId: 'inbox' });
        }

        await DB.delete(DB.stores.PROJECTS, id);
    },

    /**
     * Reorder projects
     * @param {Array} orderedIds - Array of project IDs in new order
     * @returns {Promise<void>}
     */
    async reorder(orderedIds) {
        for (let i = 0; i < orderedIds.length; i++) {
            const project = await this.get(orderedIds[i]);
            if (project) {
                await DB.update(DB.stores.PROJECTS, { ...project, sortOrder: i });
            }
        }
    }
};

window.ProjectsRepo = ProjectsRepo;
