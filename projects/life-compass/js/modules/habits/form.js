/**
 * Life Compass - Habits Form
 * ============================================
 * Modal for creating and editing habits.
 */

const HabitsForm = {
    currentHabit: null,

    /**
     * Show the habit form modal
     * @param {Object|null} habit - Existing habit or null for new
     * @returns {Promise<void>}
     */
    async show(habit = null) {
        this.currentHabit = habit;
        const isNew = !habit;

        const categories = ['Health', 'Work', 'Relationships', 'Creativity', 'Other'];
        const timeOfDays = ['Morning', 'Afternoon', 'Evening', 'Anytime'];
        const frequencies = [
            { value: 'daily', label: 'Every day' },
            { value: 'specific_days', label: 'Specific days' },
            { value: 'x_times_per_week', label: 'X times per week' }
        ];

        const content = `
            <form id="habit-form" onsubmit="HabitsForm.handleSubmit(event)">
                <div class="form-group">
                    <div class="flex gap-sm">
                        <button type="button" class="btn btn-secondary" onclick="HabitsForm.pickEmoji()" id="emoji-picker-btn">
                            ${habit?.emoji || '✓'}
                        </button>
                        <input 
                            type="text" 
                            class="form-input flex-1" 
                            id="habit-title"
                            name="title"
                            placeholder="Habit name..."
                            value="${habit ? Utils.escapeHtml(habit.title) : ''}"
                            required
                            aria-label="Habit title"
                        >
                    </div>
                    <input type="hidden" id="habit-emoji" name="emoji" value="${habit?.emoji || '✓'}">
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="habit-category" name="category" aria-label="Category">
                        ${categories.map(c => `
                            <option value="${c.toLowerCase()}" ${(habit?.category || 'health') === c.toLowerCase() ? 'selected' : ''}>
                                ${c}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Frequency</label>
                    <select class="form-input" id="habit-frequency" name="frequency" 
                            onchange="HabitsForm.handleFrequencyChange()" aria-label="Frequency">
                        ${frequencies.map(f => `
                            <option value="${f.value}" ${(habit?.schedule?.frequency || 'daily') === f.value ? 'selected' : ''}>
                                ${f.label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group" id="specific-days-group" style="display: ${habit?.schedule?.frequency === 'specific_days' ? 'block' : 'none'};">
                    <label class="form-label">Days</label>
                    <div class="filter-chips">
                        ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => `
                            <button type="button" 
                                    class="filter-chip ${(habit?.schedule?.specificDays || []).includes(day) ? 'active' : ''}"
                                    data-day="${day}"
                                    onclick="this.classList.toggle('active')">
                                ${day}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Time of Day</label>
                    <select class="form-input" id="habit-time-of-day" name="timeOfDay" aria-label="Time of day">
                        ${timeOfDays.map(t => `
                            <option value="${t.toLowerCase()}" ${(habit?.schedule?.timeOfDay || 'anytime') === t.toLowerCase() ? 'selected' : ''}>
                                ${t}
                            </option>
                        `).join('')}
                    </select>
                </div>

                ${!isNew ? `
                    <div class="form-group mt-lg">
                        <button type="button" class="btn btn-ghost btn-block" onclick="HabitsForm.handleArchive()">
                            Archive Habit
                        </button>
                    </div>
                ` : ''}
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">
                Cancel
            </button>
            <button type="submit" form="habit-form" class="btn btn-primary" style="background: var(--accent-habits);">
                ${isNew ? 'Create Habit' : 'Save Changes'}
            </button>
        `;

        await Modal.show({
            title: isNew ? 'New Habit' : 'Edit Habit',
            content,
            footer,
            type: 'full'
        });
    },

    /**
     * Handle frequency change
     */
    handleFrequencyChange() {
        const frequency = document.getElementById('habit-frequency').value;
        const daysGroup = document.getElementById('specific-days-group');
        daysGroup.style.display = frequency === 'specific_days' ? 'block' : 'none';
    },

    /**
     * Pick emoji (simplified)
     */
    pickEmoji() {
        const emojis = ['✓', '💪', '🧘', '📚', '💧', '🏃', '😴', '🍎', '✍️', '🎯', '🧠', '💪', '🌱', '🎨', '🎵'];
        const currentEmoji = document.getElementById('habit-emoji').value;
        const currentIndex = emojis.indexOf(currentEmoji);
        const nextIndex = (currentIndex + 1) % emojis.length;

        document.getElementById('habit-emoji').value = emojis[nextIndex];
        document.getElementById('emoji-picker-btn').textContent = emojis[nextIndex];
    },

    /**
     * Handle form submission
     * @param {Event} event
     */
    async handleSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Get specific days if selected
        const specificDays = [];
        document.querySelectorAll('[data-day].active').forEach(btn => {
            specificDays.push(btn.dataset.day);
        });

        const data = {
            title: formData.get('title'),
            emoji: formData.get('emoji'),
            category: formData.get('category'),
            frequency: formData.get('frequency'),
            specificDays: specificDays.length > 0 ? specificDays : null,
            timeOfDay: formData.get('timeOfDay')
        };

        try {
            if (this.currentHabit) {
                await HabitsRepo.update(this.currentHabit.id, {
                    title: data.title,
                    emoji: data.emoji,
                    category: data.category,
                    schedule: {
                        ...this.currentHabit.schedule,
                        frequency: data.frequency,
                        specificDays: data.specificDays,
                        timeOfDay: data.timeOfDay
                    }
                });
                Toast.success('Habit updated!');
            } else {
                await HabitsRepo.create(data);
                Toast.success('Habit created!');
            }

            Modal.close(true);
            Navigation.renderModule('habits');
        } catch (error) {
            console.error('Error saving habit:', error);
            Toast.error('Failed to save habit');
        }
    },

    /**
     * Handle archive
     */
    async handleArchive() {
        if (!this.currentHabit) return;

        const confirmed = await Modal.confirm({
            icon: '📦',
            title: 'Archive Habit?',
            message: 'This will hide the habit from your daily view but keep your history.',
            confirmText: 'Archive',
            confirmDestructive: false
        });

        if (confirmed) {
            await HabitsRepo.archive(this.currentHabit.id);
            Toast.success('Habit archived');
            Modal.close(true);
            Navigation.renderModule('habits');
        }
    }
};

window.HabitsForm = HabitsForm;
