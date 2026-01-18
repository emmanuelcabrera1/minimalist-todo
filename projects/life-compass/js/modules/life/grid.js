/**
 * Life Compass - Life Grid View
 * ============================================
 * Life in Weeks visualization.
 */

const LifeGrid = {
    async render() {
        const data = await LifeRepo.getLifeGridData();

        if (!data.configured) {
            return `
                <div class="screen-header"><h1 class="screen-title">Life</h1></div>
                ${Components.emptyState('📅', 'Configure your life calendar', 'Set your birth date to visualize your life in weeks.', 'Set Birth Date', 'LifeGrid.showSettings()')}
            `;
        }

        const statsHtml = `
            <div class="life-stats">
                <div class="life-stat"><div class="life-stat-value">${data.currentAge}</div><div class="life-stat-label">Years</div></div>
                <div class="life-stat"><div class="life-stat-value">${data.weeksLived}</div><div class="life-stat-label">Weeks</div></div>
                <div class="life-stat"><div class="life-stat-value">${data.weeksRemaining}</div><div class="life-stat-label">Left</div></div>
                <div class="life-stat"><div class="life-stat-value">${data.percentageLived}%</div><div class="life-stat-label">Lived</div></div>
            </div>
        `;

        const focusYearsHtml = `
            <div class="focus-years">
                <div class="focus-years-value">${data.healthyWeeksRemaining}</div>
                <div class="focus-years-label">healthy weeks remaining</div>
                <div class="focus-years-sublabel">Make them count</div>
            </div>
        `;

        // Simplified grid (show 10 years around current age)
        const startYear = Math.max(0, data.currentYear - 2);
        const endYear = Math.min(data.lifespan, data.currentYear + 8);

        let gridHtml = '<div class="life-grid-container"><div class="life-grid">';
        for (let year = startYear; year < endYear; year++) {
            gridHtml += `<div class="life-grid-year">${year}</div>`;
            for (let week = 0; week < 52; week++) {
                const weekData = data.weeks.find(w => w.year === year && w.week === week);
                if (weekData) {
                    gridHtml += `<div class="life-week ${weekData.status}${weekData.hasEvent ? ' has-event' : ''}" 
                                     data-week="${weekData.weekNumber}"
                                     onclick="LifeGrid.showWeek(${weekData.weekNumber})"></div>`;
                } else {
                    gridHtml += '<div class="life-week empty"></div>';
                }
            }
        }
        gridHtml += '</div></div>';

        const legendHtml = `
            <div class="life-grid-legend">
                <div class="life-grid-legend-item"><div class="life-grid-legend-swatch lived"></div>Lived</div>
                <div class="life-grid-legend-item"><div class="life-grid-legend-swatch current"></div>Now</div>
                <div class="life-grid-legend-item"><div class="life-grid-legend-swatch healthy"></div>Healthy</div>
                <div class="life-grid-legend-item"><div class="life-grid-legend-swatch later"></div>Later</div>
            </div>
        `;

        return `
            <div class="screen-header">
                <h1 class="screen-title">Life</h1>
                <button class="btn-icon btn-ghost" onclick="LifeGrid.showSettings()" aria-label="Settings">⚙️</button>
            </div>
            ${focusYearsHtml}
            ${statsHtml}
            ${gridHtml}
            ${legendHtml}
        `;
    },

    init() { },

    async showWeek(weekNumber) {
        const stats = await LifeRepo.getWeekStats(weekNumber);
        if (!stats) return;

        const weekLabel = `Week ${(weekNumber % 52) + 1}, Year ${Math.floor(weekNumber / 52)}`;
        const dateRange = `${Utils.formatDate(stats.startDate, 'short')} - ${Utils.formatDate(stats.endDate, 'short')}`;

        const eventsHtml = stats.events.length > 0
            ? stats.events.map(e => `<div class="life-event"><div class="life-event-icon" style="background:${e.color}">${e.emoji}</div><div class="life-event-content"><div class="life-event-title">${Utils.escapeHtml(e.title)}</div><div class="life-event-date">${Utils.formatDate(e.date, 'short')}</div></div></div>`).join('')
            : '<p class="text-tertiary">No events this week</p>';

        const content = `
            <div class="week-detail">
                <div class="week-detail-header">
                    <div class="week-detail-title">${weekLabel}</div>
                    <div class="week-detail-dates">${dateRange}</div>
                </div>
                <div class="week-detail-stats">
                    <div class="week-detail-stat"><div class="week-detail-stat-value">${stats.tasksCompleted}</div><div class="week-detail-stat-label">Tasks</div></div>
                    <div class="week-detail-stat"><div class="week-detail-stat-value">${stats.averageMood !== null ? stats.averageMood : '-'}</div><div class="week-detail-stat-label">Mood</div></div>
                </div>
                <div class="section"><h3 class="section-title">Events</h3>${eventsHtml}</div>
            </div>
        `;

        const footer = `<button class="btn btn-primary btn-block" onclick="LifeEvents.add(${stats.startDate.getTime()})">Add Event</button>`;
        await Modal.show({ title: 'Week Details', content, footer, type: 'full' });
    },

    async showSettings() {
        const settings = await SettingsRepo.get();
        const content = `
            <form id="life-settings" onsubmit="LifeGrid.saveSettings(event)">
                <div class="form-group">
                    <label class="form-label">Birth Date</label>
                    <input type="date" class="form-input" name="birthDate" value="${settings.birthDate ? new Date(settings.birthDate).toISOString().split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Lifespan</label>
                    <input type="number" class="form-input" name="estimatedLifespan" value="${settings.estimatedLifespan || 80}" min="50" max="120">
                </div>
                <div class="form-group">
                    <label class="form-label">Healthy Years Estimate</label>
                    <input type="number" class="form-input" name="healthyYearsRemaining" value="${settings.healthyYearsRemaining || 70}" min="40" max="100">
                </div>
            </form>
        `;
        const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button type="submit" form="life-settings" class="btn btn-primary">Save</button>`;
        await Modal.show({ title: 'Life Settings', content, footer, type: 'full' });
    },

    async saveSettings(event) {
        event.preventDefault();
        const fd = new FormData(event.target);
        await SettingsRepo.update({
            birthDate: new Date(fd.get('birthDate')).toISOString(),
            estimatedLifespan: parseInt(fd.get('estimatedLifespan')),
            healthyYearsRemaining: parseInt(fd.get('healthyYearsRemaining'))
        });
        Modal.close();
        Toast.success('Settings saved!');
        Navigation.renderModule('life');
    }
};

window.LifeGrid = LifeGrid;
