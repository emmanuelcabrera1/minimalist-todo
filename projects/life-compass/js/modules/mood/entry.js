/**
 * Life Compass - Mood Entry View
 * ============================================
 * Quick and detailed mood logging.
 */

const MoodEntry = {
    currentValence: 0,
    currentEnergy: 3,

    async render() {
        const todayEntries = await MoodRepo.getToday();
        const avgMood = todayEntries.length > 0
            ? (todayEntries.reduce((sum, e) => sum + e.valence, 0) / todayEntries.length).toFixed(1)
            : null;

        return `
            <div class="screen-header">
                <h1 class="screen-title">Mood</h1>
                <button class="btn-icon btn-ghost" onclick="MoodHistory.show()" aria-label="History">📊</button>
            </div>

            ${avgMood !== null ? `
                <div class="card mb-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-headline">Today's Average</div>
                            <div class="text-secondary">${todayEntries.length} entries</div>
                        </div>
                        <div class="text-title-1" style="color: ${avgMood >= 0 ? 'var(--success)' : 'var(--error)'}">
                            ${avgMood >= 0 ? '😊' : '😔'} ${avgMood > 0 ? '+' : ''}${avgMood}
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="section">
                <h2 class="section-title">How are you feeling?</h2>
                <div class="mood-grid" id="mood-grid" onclick="MoodEntry.handleGridClick(event)">
                    <div class="mood-grid-inner">
                        <div class="mood-quadrant high-unpleasant"></div>
                        <div class="mood-quadrant high-pleasant"></div>
                        <div class="mood-quadrant low-unpleasant"></div>
                        <div class="mood-quadrant low-pleasant"></div>
                        <span class="mood-emoji anxious">😰</span>
                        <span class="mood-emoji excited">🤩</span>
                        <span class="mood-emoji sad">😔</span>
                        <span class="mood-emoji calm">😌</span>
                    </div>
                    <span class="mood-axis-label top">High Energy</span>
                    <span class="mood-axis-label bottom">Low Energy</span>
                    <span class="mood-axis-label left">Unpleasant</span>
                    <span class="mood-axis-label right">Pleasant</span>
                    <div class="mood-dot" id="mood-dot" style="left: 50%; top: 50%;"></div>
                </div>
            </div>

            <div class="flex gap-md mt-lg">
                <button class="btn btn-secondary flex-1" onclick="MoodEntry.quickLog()">Quick Log</button>
                <button class="btn btn-primary flex-1" style="background: var(--accent-mood)" onclick="MoodEntry.detailedLog()">Add Details</button>
            </div>

            ${todayEntries.length > 0 ? `
                <div class="section mt-xl">
                    <h2 class="section-title">Today's Entries</h2>
                    <div class="list">${todayEntries.map(e => this.renderEntry(e)).join('')}</div>
                </div>
            ` : ''}
        `;
    },

    init() {
        const grid = document.getElementById('mood-grid');
        if (grid) {
            grid.addEventListener('touchmove', (e) => this.handleGridMove(e), { passive: false });
            grid.addEventListener('mousemove', (e) => { if (e.buttons) this.handleGridMove(e); });
        }
    },

    handleGridClick(event) {
        const grid = document.getElementById('mood-grid');
        const rect = grid.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        this.updateMoodPosition(x, y);
    },

    handleGridMove(event) {
        event.preventDefault();
        const grid = document.getElementById('mood-grid');
        const rect = grid.getBoundingClientRect();
        const touch = event.touches ? event.touches[0] : event;
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;
        this.updateMoodPosition(x, y);
    },

    updateMoodPosition(x, y) {
        x = Utils.clamp(x, 0, 1);
        y = Utils.clamp(y, 0, 1);
        this.currentValence = Math.round((x - 0.5) * 6);
        this.currentEnergy = Math.round((1 - y) * 4) + 1;
        const dot = document.getElementById('mood-dot');
        if (dot) { dot.style.left = `${x * 100}%`; dot.style.top = `${y * 100}%`; }
    },

    async quickLog() {
        await MoodRepo.createQuick({ valence: this.currentValence, energy: this.currentEnergy });
        Utils.haptic('success');
        Toast.success('Mood logged!');
        Navigation.renderModule('mood');
    },

    async detailedLog() {
        const emotions = ['Happy', 'Excited', 'Calm', 'Anxious', 'Sad', 'Angry', 'Tired', 'Energized'];
        const activities = ['🏃 Exercise', '💼 Work', '👥 Social', '🎮 Leisure', '🍽️ Eating', '😴 Sleep', '🧘 Mindfulness', '📱 Screen'];

        const content = `
            <form id="mood-form" onsubmit="MoodEntry.submitDetailed(event)">
                <input type="hidden" name="valence" value="${this.currentValence}">
                <input type="hidden" name="energy" value="${this.currentEnergy}">
                <div class="form-group">
                    <label class="form-label">What emotion best describes this?</label>
                    <div class="emotion-picker">${emotions.map(e => `<div class="emotion-option" data-emotion="${e}" onclick="this.classList.toggle('selected')">${e}</div>`).join('')}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">What were you doing?</label>
                    <div class="activity-tags">${activities.map(a => `<button type="button" class="activity-tag" data-activity="${a}" onclick="this.classList.toggle('selected')">${a}</button>`).join('')}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-input form-textarea" name="notes" rows="2" placeholder="Optional notes..."></textarea>
                </div>
            </form>
        `;
        const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button type="submit" form="mood-form" class="btn btn-primary" style="background:var(--accent-mood)">Log Mood</button>`;
        await Modal.show({ title: 'How are you feeling?', content, footer, type: 'full' });
    },

    async submitDetailed(event) {
        event.preventDefault();
        const fd = new FormData(event.target);
        const selectedEmotion = document.querySelector('.emotion-option.selected')?.dataset.emotion || null;
        const selectedActivities = Array.from(document.querySelectorAll('.activity-tag.selected')).map(el => el.dataset.activity);

        await MoodRepo.createDetailed({
            valence: parseInt(fd.get('valence')),
            energy: parseInt(fd.get('energy')),
            emotion: selectedEmotion,
            activities: selectedActivities,
            notes: fd.get('notes')
        });
        Modal.close();
        Toast.success('Mood logged!');
        Navigation.renderModule('mood');
    },

    renderEntry(entry) {
        const emoji = entry.valence >= 1 ? '😊' : entry.valence <= -1 ? '😔' : '😐';
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return `
            <div class="mood-entry-card">
                <div class="mood-entry-indicator ${entry.valence >= 0 ? 'positive' : 'negative'}">${emoji}</div>
                <div class="mood-entry-content">
                    <div class="mood-entry-emotion">${entry.emotion || (entry.valence >= 0 ? 'Good' : 'Not great')}</div>
                    ${entry.activities?.length ? `<div class="mood-entry-activities">${entry.activities.map(a => `<span class="tag">${a}</span>`).join('')}</div>` : ''}
                </div>
                <div class="mood-entry-time">${time}</div>
            </div>
        `;
    }
};

window.MoodEntry = MoodEntry;
