/**
 * Life Compass - Task Form
 * ============================================
 * Modal for creating and editing tasks.
 */

const TaskForm = {
    currentTask: null,

    /**
     * Show the task form modal
     * @param {Object|null} task - Existing task or null for new
     * @returns {Promise<void>}
     */
    async show(task = null) {
        this.currentTask = task;
        const isNew = !task;
        const projects = await ProjectsRepo.getAll();

        const content = `
            <form id="task-form" onsubmit="TaskForm.handleSubmit(event)">
                <div class="form-group">
                    <input 
                        type="text" 
                        class="form-input" 
                        id="task-title"
                        name="title"
                        placeholder="What do you need to do?"
                        value="${task ? Utils.escapeHtml(task.title) : ''}"
                        required
                        aria-label="Task title"
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea 
                        class="form-input form-textarea" 
                        id="task-notes"
                        name="notes"
                        placeholder="Add details..."
                        rows="3"
                        aria-label="Task notes"
                    >${task?.notes || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input 
                        type="date" 
                        class="form-input" 
                        id="task-due-date"
                        name="dueDate"
                        value="${task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}"
                        aria-label="Due date"
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <div class="segmented-control" role="radiogroup" aria-label="Priority">
                        ${[
                { value: 1, label: 'P1', color: 'var(--priority-1)' },
                { value: 2, label: 'P2', color: 'var(--priority-2)' },
                { value: 3, label: 'P3', color: 'var(--priority-3)' },
                { value: 4, label: 'None', color: 'var(--text-tertiary)' }
            ].map(p => `
                            <button type="button" 
                                    class="segment ${(task?.priority || 4) === p.value ? 'active' : ''}"
                                    data-priority="${p.value}"
                                    onclick="TaskForm.setPriority(${p.value})"
                                    role="radio"
                                    aria-checked="${(task?.priority || 4) === p.value}"
                                    style="${(task?.priority || 4) === p.value ? `background: ${p.color}; color: var(--bg-primary);` : ''}">
                                ${p.label}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="task-priority" name="priority" value="${task?.priority || 4}">
                </div>

                <div class="form-group">
                    <label class="form-label">Project</label>
                    <select class="form-input" id="task-project" name="projectId" aria-label="Project">
                        ${projects.map(p => `
                            <option value="${p.id}" ${(task?.projectId || 'inbox') === p.id ? 'selected' : ''}>
                                ${p.icon} ${Utils.escapeHtml(p.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>

                ${!isNew ? `
                    <div class="form-group mt-lg">
                        <button type="button" class="btn btn-danger btn-block" onclick="TaskForm.handleDelete()">
                            Delete Task
                        </button>
                    </div>
                ` : ''}
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">
                Cancel
            </button>
            <button type="submit" form="task-form" class="btn btn-primary">
                ${isNew ? 'Add Task' : 'Save Changes'}
            </button>
        `;

        await Modal.show({
            title: isNew ? 'New Task' : 'Edit Task',
            content,
            footer,
            type: 'full'
        });
    },

    /**
     * Set priority
     * @param {number} priority - Priority value (1-4)
     */
    setPriority(priority) {
        const colors = {
            1: 'var(--priority-1)',
            2: 'var(--priority-2)',
            3: 'var(--priority-3)',
            4: 'var(--text-tertiary)'
        };

        document.querySelectorAll('[data-priority]').forEach(btn => {
            const isActive = parseInt(btn.dataset.priority) === priority;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
            btn.style.background = isActive ? colors[btn.dataset.priority] : '';
            btn.style.color = isActive ? 'var(--bg-primary)' : '';
        });

        document.getElementById('task-priority').value = priority;
    },

    /**
     * Handle form submission
     * @param {Event} event
     */
    async handleSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const data = {
            title: formData.get('title'),
            notes: formData.get('notes') || null,
            dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')).toISOString() : null,
            priority: parseInt(formData.get('priority')),
            projectId: formData.get('projectId')
        };

        try {
            if (this.currentTask) {
                await TasksRepo.update(this.currentTask.id, data);
                Toast.success('Task updated!');
            } else {
                await TasksRepo.create(data);
                Toast.success('Task created!');
            }

            Modal.close(true);
        } catch (error) {
            console.error('Error saving task:', error);
            Toast.error('Failed to save task');
        }
    },

    /**
     * Handle delete
     */
    async handleDelete() {
        if (!this.currentTask) return;

        const confirmed = await Modal.confirm({
            icon: '🗑️',
            title: 'Delete Task?',
            message: 'This action cannot be undone.',
            confirmText: 'Delete',
            confirmDestructive: true
        });

        if (confirmed) {
            try {
                await TasksRepo.delete(this.currentTask.id);
                Toast.success('Task deleted');
                Modal.close(true);
            } catch (error) {
                console.error('Error deleting task:', error);
                Toast.error('Failed to delete task');
            }
        }
    }
};

window.TaskForm = TaskForm;
