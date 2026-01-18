/**
 * Life Compass - Habits Today View
 * ============================================
 * Daily habits check-in view.
 */

const HabitsToday = {
    /**
     * Render the habits view
     * @returns {Promise<string>}
     */
    async render() {
        const stats = await HabitsRepo.getStats();
        const grouped = await HabitsRepo.getTodayGrouped();

        const totalHabits = Object.values(grouped).reduce((sum, g) => sum + g.length, 0);

        if (totalHabits === 0) {
            return `
                <div class="screen-header">
                    <h1 class="screen-title">Habits</h1>
                    <button class="btn-icon btn-ghost" onclick="HabitsForm.show()" aria-label="Add habit">
                        +
                    </button>
                </div>
                ${Components.emptyState(
                '✓',
                'No habits yet',
                'Start building routines by adding your first habit.',
                'Add Habit',
                'HabitsForm.show()'
            )}
            `;
        }

        return `
            <div class="screen-header">
                <h1 class="screen-title">Habits</h1>
                <button class="btn-icon btn-ghost" onclick="HabitsForm.show()" aria-label="Add habit">
                    +
                </button>
            </div>

            <div class="habit-progress-summary">
                <div class="habit-progress-text">
                    <span>${stats.completedToday}</span> / ${stats.totalToday} completed
                </div>
                ${Components.progressRing(stats.percentage, 48, '--accent-habits')}
            </div>

            ${this.renderTimeGroup('Morning', grouped.morning, '🌅')}
            ${this.renderTimeGroup('Afternoon', grouped.afternoon, '☀️')}
            ${this.renderTimeGroup('Evening', grouped.evening, '🌙')}
            ${this.renderTimeGroup('Anytime', grouped.anytime, '⏰')}
        `;
    },

    /**
     * Initialize after render
     */
    init() {
        // Any post-render initialization
    },

    /**
     * Render a time-of-day group
     * @param {string} title - Group title
     * @param {Array} habits - Habits in this group
     * @param {string} icon - Icon emoji
     * @returns {string}
     */
    renderTimeGroup(title, habits, icon) {
        if (habits.length === 0) return '';

        return `
            <div class="time-group">
                <h3 class="time-group-header">${icon} ${title}</h3>
                <div class="habit-list">
                    ${habits.map(habit => this.renderHabitItem(habit)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single habit item
     * @param {Object} habit - Habit object
     * @returns {string}
     */
    renderHabitItem(habit) {
        const checkedClass = habit.completedToday ? 'checked' : '';
        const streakHtml = habit.currentStreak > 0
            ? `<div class="habit-streak">
                   <span class="habit-streak-fire ${habit.currentStreak >= 7 ? 'animate' : ''}">🔥</span>
                   ${habit.currentStreak}
               </div>`
            : '';

        const originBadge = habit.originExperimentId
            ? '<div class="habit-origin">🧪 From experiment</div>'
            : '';

        return `
            <div class="habit-item ${checkedClass}" data-id="${habit.id}">
                <div class="habit-checkbox ${checkedClass}" 
                     onclick="HabitsToday.toggleHabit('${habit.id}')"
                     role="checkbox"
                     aria-checked="${habit.completedToday}"
                     aria-label="Mark ${habit.title} as complete"
                     tabindex="0">
                </div>
                <div class="habit-icon">${habit.emoji}</div>
                <div class="habit-content" onclick="HabitsToday.openHabit('${habit.id}')">
                    <div class="habit-title">${Utils.escapeHtml(habit.title)}</div>
                    ${originBadge}
                </div>
                ${streakHtml}
            </div>
        `;
    },

    /**
     * Toggle habit completion for today
     * @param {string} habitId - Habit ID
     */
    async toggleHabit(habitId) {
        await HabitsRepo.log(habitId);
        Utils.haptic('success');

        // Re-render
        Navigation.renderModule('habits');
    },

    /**
     * Open habit details
     * @param {string} habitId - Habit ID
     */
    async openHabit(habitId) {
        const habit = await HabitsRepo.get(habitId);
        if (!habit) return;

        const weekData = await HabitsRepo.getWeekData(habitId);

        const heatmapLabels = weekData.map(d => `
            <div class="heatmap-label">${d.dayName.charAt(0)}</div>
        `).join('');

        const heatmapDays = weekData.map(d => {
            let className = 'heatmap-day';
            if (d.completed) className += ' completed';
            if (d.isToday) className += ' today';
            if (d.isFuture) className += ' future';

            return `<div class="${className}">${d.completed ? '✓' : ''}</div>`;
        }).join('');

        const content = `
            <div class="flex items-center gap-md mb-lg">
                <div style="font-size: 48px;">${habit.emoji}</div>
                <div>
                    <h2 class="text-title-2">${Utils.escapeHtml(habit.title)}</h2>
                    ${Components.categoryBadge(habit.category)}
                </div>
            </div>

            <div class="habit-stats">
                <div class="habit-stat">
                    <div class="habit-stat-value">${habit.currentStreak}</div>
                    <div class="habit-stat-label">Current</div>
                </div>
                <div class="habit-stat">
                    <div class="habit-stat-value">${habit.longestStreak}</div>
                    <div class="habit-stat-label">Longest</div>
                </div>
                <div class="habit-stat">
                    <div class="habit-stat-value">${habit.totalCompletions}</div>
                    <div class="habit-stat-label">Total</div>
                </div>
            </div>

            <div class="section mt-lg">
                <h3 class="section-title">This Week</h3>
                <div class="heatmap-labels">${heatmapLabels}</div>
                <div class="habit-heatmap">${heatmapDays}</div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="HabitsToday.editHabit('${habitId}')">
                Edit
            </button>
            <button class="btn btn-danger" onclick="HabitsToday.deleteHabit('${habitId}')">
                Delete
            </button>
        `;

        await Modal.show({
            title: 'Habit Details',
            content,
            footer,
            type: 'full'
        });
    },

    /**
     * Edit a habit
     * @param {string} habitId - Habit ID
     */
    async editHabit(habitId) {
        Modal.close();
        const habit = await HabitsRepo.get(habitId);
        await HabitsForm.show(habit);
        Navigation.renderModule('habits');
    },

    /**
     * Delete a habit
     * @param {string} habitId - Habit ID
     */
    async deleteHabit(habitId) {
        const confirmed = await Modal.confirm({
            icon: '🗑️',
            title: 'Delete Habit?',
            message: 'This will also delete all completion history. This action cannot be undone.',
            confirmText: 'Delete',
            confirmDestructive: true
        });

        if (confirmed) {
            await HabitsRepo.delete(habitId);
            Toast.success('Habit deleted');
            Modal.close();
            Navigation.renderModule('habits');
        }
    }
};

window.HabitsToday = HabitsToday;
