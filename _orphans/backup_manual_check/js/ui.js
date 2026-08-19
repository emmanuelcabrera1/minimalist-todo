/**
 * Experiments - UI Components
 * Renders all UI elements
 */

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} str - Untrusted string
 * @returns {string} - Safe HTML string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const UI = {

    // SVG Icons
    icons: {
        flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v7l4 9H5l4-9V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>`,
        sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>`,
        settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
        plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        flame: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.773.5 1.604.5 2.47A7.5 7.5 0 0112 23z"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
        clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
        edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
        archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
        chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
        back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
        chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
        shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    },

    /**
     * Render progress ring
     */
    progressRing(progress, size = 'normal') {
        const isLarge = size === 'large';
        const radius = isLarge ? 52 : 26;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress * circumference);
        const percent = Math.round(progress * 100);

        return `
            <div class="progress-ring ${isLarge ? 'large' : ''}">
                <svg width="100%" height="100%" viewBox="0 0 ${isLarge ? 120 : 60} ${isLarge ? 120 : 60}">
                    <circle class="progress-ring-bg" cx="${isLarge ? 60 : 30}" cy="${isLarge ? 60 : 30}" r="${radius}"/>
                    <circle class="progress-ring-fill" cx="${isLarge ? 60 : 30}" cy="${isLarge ? 60 : 30}" r="${radius}" 
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                </svg>
                <span class="progress-ring-text">${percent}%</span>
            </div>
        `;
    },

    /**
     * Render streak badge
     */
    streakBadge(streak) {
        if (streak === 0) return '';
        return `
            <div class="streak-badge">
                ${this.icons.flame}
                <span>${streak}</span>
            </div>
        `;
    },

    /**
     * Render experiment row with swipe container
     */
    experimentRow(experiment) {
        const progress = StreakCalculator.progress(experiment);
        const streak = StreakCalculator.calculate(experiment);
        const daysCompleted = StreakCalculator.daysCompleted(experiment);
        const timeDisplay = experiment.scheduledTime ? `⏰ ${experiment.scheduledTime}` : '';

        return `
            <div class="swipe-container" data-swipe-id="${escapeHtml(experiment.id)}" 
                 aria-label="Swipe left to delete, right to archive">
                <div class="swipe-action swipe-action-archive">
                    <span class="swipe-action-icon">📦</span>
                </div>
                <div class="swipe-action swipe-action-delete">
                    <span class="swipe-action-icon">🗑️</span>
                </div>
                <div class="experiment-row" data-id="${escapeHtml(experiment.id)}">
                    ${this.progressRing(progress)}
                    <div class="experiment-info">
                        <div class="experiment-title">${escapeHtml(experiment.title)} ${timeDisplay ? `<span style="color: var(--text-tertiary); font-size: var(--text-xs); margin-left: var(--space-sm);">${timeDisplay}</span>` : ''}</div>
                        <div class="experiment-meta">${daysCompleted} days completed</div>
                    </div>
                    ${this.streakBadge(streak)}
                </div>
            </div>
        `;
    },

    /**
     * Render empty state
     */
    emptyState(title, message) {
        return `
            <div class="empty-state">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Render entry row
     */
    entryRow(entry) {
        const date = new Date(entry.date);
        const formatted = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="entry-row" data-id="${escapeHtml(entry.id)}">
                <div class="entry-check ${entry.isCompleted ? 'completed' : ''}">
                    ${entry.isCompleted ? this.icons.check : ''}
                </div>
                <div class="entry-content">
                    <div class="entry-date">${formatted}</div>
                    ${entry.note ? `<div class="entry-note" style="white-space: pre-wrap; overflow: visible;">${escapeHtml(entry.note)}</div>` : ''}
                    ${entry.reflection ? `
                        <div class="entry-reflection-card" style="margin-top: 8px; font-size: 13px; background: var(--inactive-bg); padding: 8px; border-radius: 8px;">
                            ${entry.reflection.plus ? `<div><strong>+</strong> ${escapeHtml(entry.reflection.plus)}</div>` : ''}
                            ${entry.reflection.minus ? `<div><strong>−</strong> ${escapeHtml(entry.reflection.minus)}</div>` : ''}
                            ${entry.reflection.next ? `<div><strong>→</strong> ${escapeHtml(entry.reflection.next)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render template card
     */
    templateCard(template) {
        return `
            <div class="template-card" data-id="${escapeHtml(template.id)}">
                <div class="template-icon">${escapeHtml(template.icon)}</div>
                <div class="template-title">${escapeHtml(template.title)}</div>
                <div class="template-meta">${template.durationDays} days • ${escapeHtml(template.frequency)}</div>
            </div>
        `;
    },

    /**
     * Render calendar
     */
    calendar(experiment, month = new Date()) {
        const year = month.getFullYear();
        const monthNum = month.getMonth();
        const firstDay = new Date(year, monthNum, 1);
        const lastDay = new Date(year, monthNum + 1, 0);
        const startOffset = firstDay.getDay();

        const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        // Build completed dates set
        const completedDates = new Set(
            experiment.entries.filter(e => e.isCompleted).map(e => e.date)
        );
        const missedDates = new Set(
            experiment.entries.filter(e => !e.isCompleted).map(e => e.date)
        );

        let days = '';

        // Weekday headers
        weekdays.forEach(d => {
            days += `<div class="calendar-weekday">${d}</div>`;
        });

        // Empty cells before first day
        for (let i = 0; i < startOffset; i++) {
            days += `<div class="calendar-day outside"></div>`;
        }

        // Days of month
        const today = StreakCalculator.toDateString(new Date());
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let classes = 'calendar-day';

            if (dateStr === today) classes += ' today';
            if (completedDates.has(dateStr)) classes += ' completed';
            else if (missedDates.has(dateStr)) classes += ' missed';

            days += `<div class="${classes}">${d}</div>`;
        }

        return `
            <div class="calendar">
                <div class="calendar-header">
                    <button class="calendar-nav" data-dir="-1">${this.icons.chevronLeft}</button>
                    <h3>${monthName}</h3>
                    <button class="calendar-nav" data-dir="1">${this.icons.chevronRight}</button>
                </div>
                <div class="calendar-grid">${days}</div>
            </div>
        `;
    },

    /**
     * Format date for display
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    },

    /**
     * Format short date
     */
    formatShortDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    }
};
