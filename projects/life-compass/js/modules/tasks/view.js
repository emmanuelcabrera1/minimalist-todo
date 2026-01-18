/**
 * Life Compass - Tasks View
 * ============================================
 * Main tasks list view with Today/Inbox/Upcoming tabs.
 */

const TasksView = {
    currentTab: 'today',

    /**
     * Render the tasks view
     * @returns {Promise<string>}
     */
    async render() {
        const counts = await TasksRepo.getCounts();

        return `
            <div class="screen-header">
                <h1 class="screen-title">Tasks</h1>
                <button class="btn-icon btn-ghost" onclick="TasksView.openSettings()" aria-label="Settings">
                    ⚙️
                </button>
            </div>

            ${Components.segmentedControl([
            { id: 'today', label: `Today${counts.today > 0 ? ` (${counts.today})` : ''}`, active: this.currentTab === 'today' },
            { id: 'inbox', label: `Inbox${counts.inbox > 0 ? ` (${counts.inbox})` : ''}`, active: this.currentTab === 'inbox' },
            { id: 'upcoming', label: 'Upcoming', active: this.currentTab === 'upcoming' }
        ], 'TasksView.switchTab')}

            <div id="tasks-content" class="mt-lg">
                ${await this.renderTabContent()}
            </div>

            <div class="quick-add">
                <input 
                    type="text" 
                    class="quick-add-input" 
                    placeholder="Add a task..." 
                    id="quick-add-input"
                    onkeypress="TasksView.handleQuickAddKeypress(event)"
                    aria-label="Quick add task"
                >
                <button class="quick-add-btn" onclick="TasksView.quickAdd()" aria-label="Add task">
                    +
                </button>
            </div>
        `;
    },

    /**
     * Initialize the view after render
     */
    init() {
        // Focus quick add on desktop
        if (window.innerWidth > 768) {
            document.getElementById('quick-add-input')?.focus();
        }
    },

    /**
     * Render content for current tab
     * @returns {Promise<string>}
     */
    async renderTabContent() {
        switch (this.currentTab) {
            case 'today':
                return await this.renderToday();
            case 'inbox':
                return await this.renderInbox();
            case 'upcoming':
                return await this.renderUpcoming();
            default:
                return await this.renderToday();
        }
    },

    /**
     * Render today's tasks
     * @returns {Promise<string>}
     */
    async renderToday() {
        const tasks = await TasksRepo.getToday();

        if (tasks.length === 0) {
            return Components.emptyState(
                '✨',
                'All caught up!',
                'No tasks due today. Enjoy your day or add something new.',
                'Add Task',
                'TasksView.openNewTask()'
            );
        }

        // Group by overdue vs today
        const today = Utils.startOfDay().toISOString().split('T')[0];
        const overdue = tasks.filter(t => new Date(t.dueDate).toISOString().split('T')[0] < today);
        const dueToday = tasks.filter(t => new Date(t.dueDate).toISOString().split('T')[0] === today);

        let html = '';

        if (overdue.length > 0) {
            html += `
                <div class="date-group">
                    <h3 class="date-group-header overdue">Overdue (${overdue.length})</h3>
                    <div class="task-list">
                        ${overdue.map(task => this.renderTaskItem(task, 'overdue')).join('')}
                    </div>
                </div>
            `;
        }

        if (dueToday.length > 0) {
            html += `
                <div class="date-group">
                    <h3 class="date-group-header today">Today (${dueToday.length})</h3>
                    <div class="task-list">
                        ${dueToday.map(task => this.renderTaskItem(task, 'today')).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    },

    /**
     * Render inbox tasks
     * @returns {Promise<string>}
     */
    async renderInbox() {
        const tasks = await TasksRepo.getInbox();

        if (tasks.length === 0) {
            return Components.emptyState(
                '📥',
                'Inbox Zero!',
                'No uncategorized tasks. Great job staying organized!',
                'Add Task',
                'TasksView.openNewTask()'
            );
        }

        return `
            <div class="task-list">
                ${tasks.map(task => this.renderTaskItem(task)).join('')}
            </div>
        `;
    },

    /**
     * Render upcoming tasks
     * @returns {Promise<string>}
     */
    async renderUpcoming() {
        const grouped = await TasksRepo.getUpcoming();
        const dates = Object.keys(grouped).sort();

        if (dates.length === 0) {
            return Components.emptyState(
                '📅',
                'Nothing scheduled',
                'No tasks scheduled for the next 7 days.',
                'Add Task',
                'TasksView.openNewTask()'
            );
        }

        return dates.map(dateStr => {
            const tasks = grouped[dateStr];
            const date = new Date(dateStr);
            const label = Utils.formatDate(date, 'relative');

            return `
                <div class="date-group">
                    <h3 class="date-group-header">${label}</h3>
                    <div class="task-list">
                        ${tasks.map(task => this.renderTaskItem(task)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render a single task item
     * @param {Object} task - Task object
     * @param {string} dueDateType - 'overdue', 'today', or null
     * @returns {string}
     */
    renderTaskItem(task, dueDateType = null) {
        const priorityClass = task.priority < 4 ? `priority-${task.priority}` : '';
        const completedClass = task.isCompleted ? 'completed' : '';

        let dueBadge = '';
        if (task.dueDate && dueDateType !== 'today') {
            const dueClass = dueDateType === 'overdue' ? 'overdue' : '';
            dueBadge = `<span class="task-due ${dueClass}">📅 ${Utils.formatDate(task.dueDate, 'relative')}</span>`;
        }

        let linkBadge = '';
        if (task.experimentId) {
            linkBadge = '<span class="task-link experiment">🧪 Experiment</span>';
        } else if (task.habitId) {
            linkBadge = '<span class="task-link habit">✓ Habit</span>';
        }

        return `
            <div class="task-item ${completedClass}" data-id="${task.id}" onclick="TasksView.openTask('${task.id}')">
                <div class="task-checkbox ${priorityClass} ${task.isCompleted ? 'checked' : ''}" 
                     onclick="event.stopPropagation(); TasksView.toggleComplete('${task.id}')"
                     role="checkbox"
                     aria-checked="${task.isCompleted}"
                     tabindex="0">
                </div>
                <div class="task-content">
                    <div class="task-title">${Utils.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        ${dueBadge}
                        ${Components.priority(task.priority)}
                        ${linkBadge}
                        ${task.labels.map(l => `<span class="task-label">${Utils.escapeHtml(l)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Switch tab
     * @param {string} tabId - Tab ID
     */
    async switchTab(tabId) {
        this.currentTab = tabId;

        // Update segment UI
        document.querySelectorAll('.segment').forEach(seg => {
            seg.classList.toggle('active', seg.dataset.id === tabId);
            seg.setAttribute('aria-selected', seg.dataset.id === tabId);
        });

        // Re-render content
        const container = document.getElementById('tasks-content');
        container.innerHTML = await this.renderTabContent();
    },

    /**
     * Toggle task completion
     * @param {string} taskId - Task ID
     */
    async toggleComplete(taskId) {
        const task = await TasksRepo.get(taskId);

        if (task.isCompleted) {
            await TasksRepo.uncomplete(taskId);
        } else {
            await TasksRepo.complete(taskId);
            Utils.haptic('success');
            Toast.success('Task completed!');
        }

        // Re-render
        const container = document.getElementById('tasks-content');
        container.innerHTML = await this.renderTabContent();
    },

    /**
     * Quick add a task
     */
    async quickAdd() {
        const input = document.getElementById('quick-add-input');
        const title = input.value.trim();

        if (!title) return;

        await TasksRepo.create({
            title,
            projectId: 'inbox',
            dueDate: this.currentTab === 'today' ? new Date().toISOString() : null
        });

        input.value = '';
        Utils.haptic('light');
        Toast.success('Task added!');

        // Re-render
        const container = document.getElementById('tasks-content');
        container.innerHTML = await this.renderTabContent();
    },

    /**
     * Handle quick add keypress
     * @param {KeyboardEvent} event
     */
    handleQuickAddKeypress(event) {
        if (event.key === 'Enter') {
            this.quickAdd();
        }
    },

    /**
     * Open task details/edit
     * @param {string} taskId - Task ID
     */
    async openTask(taskId) {
        const task = await TasksRepo.get(taskId);
        if (!task) return;

        await TaskForm.show(task);

        // Re-render after edit
        const container = document.getElementById('tasks-content');
        container.innerHTML = await this.renderTabContent();
    },

    /**
     * Open new task form
     */
    async openNewTask() {
        await TaskForm.show(null);

        // Re-render after create
        const container = document.getElementById('tasks-content');
        container.innerHTML = await this.renderTabContent();
    },

    /**
     * Open settings
     */
    openSettings() {
        Toast.info('Settings coming soon!');
    }
};

window.TasksView = TasksView;
