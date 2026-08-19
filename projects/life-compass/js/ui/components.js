/**
 * Life Compass - UI Components
 * ============================================
 * Reusable UI component factories.
 */

const Components = {
    /**
     * Create a progress ring SVG
     * @param {number} percentage - Progress percentage (0-100)
     * @param {number} size - Size in pixels
     * @param {string} color - Stroke color (CSS variable name)
     * @returns {string} SVG HTML string
     */
    progressRing(percentage, size = 60, color = '--accent-experiments') {
        const strokeWidth = 4;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        return `
            <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle 
                    class="progress-ring-bg"
                    cx="${size / 2}" 
                    cy="${size / 2}" 
                    r="${radius}"
                    stroke-width="${strokeWidth}"
                />
                <circle 
                    class="progress-ring-fill"
                    cx="${size / 2}" 
                    cy="${size / 2}" 
                    r="${radius}"
                    stroke-width="${strokeWidth}"
                    stroke="var(${color})"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    style="--ring-circumference: ${circumference}; --ring-offset: ${offset};"
                />
            </svg>
        `;
    },

    /**
     * Create a checkbox element
     * @param {boolean} checked - Whether checked
     * @param {string} id - Element ID
     * @returns {string} HTML string
     */
    checkbox(checked = false, id = '') {
        const checkedClass = checked ? 'checked' : '';
        return `
            <div class="form-check-input ${checkedClass}" 
                 role="checkbox" 
                 aria-checked="${checked}"
                 ${id ? `id="${id}"` : ''}
                 tabindex="0">
            </div>
        `;
    },

    /**
     * Create a toggle switch
     * @param {boolean} active - Whether active
     * @param {string} id - Element ID
     * @returns {string} HTML string
     */
    toggle(active = false, id = '') {
        const activeClass = active ? 'active' : '';
        return `
            <div class="toggle ${activeClass}" 
                 role="switch" 
                 aria-checked="${active}"
                 ${id ? `id="${id}"` : ''}
                 tabindex="0">
                <div class="toggle-handle"></div>
            </div>
        `;
    },

    /**
     * Create a streak badge
     * @param {number} count - Streak count
     * @param {boolean} animate - Whether to animate
     * @returns {string} HTML string
     */
    streak(count, animate = false) {
        if (count <= 0) return '';
        const animateClass = animate && count >= 7 ? 'active' : '';
        return `
            <span class="streak">
                <span class="streak-fire ${animateClass}">🔥</span>
                <span class="streak-count">${count} ${count === 1 ? 'day' : 'days'}</span>
            </span>
        `;
    },

    /**
     * Create a priority indicator
     * @param {number} priority - Priority level (1-4)
     * @returns {string} HTML string
     */
    priority(priority) {
        if (!priority || priority === 4) return '';
        const colors = {
            1: 'var(--priority-1)',
            2: 'var(--priority-2)',
            3: 'var(--priority-3)'
        };
        const labels = {
            1: 'P1',
            2: 'P2',
            3: 'P3'
        };
        return `
            <span class="badge" style="background: ${colors[priority]}; color: var(--bg-primary);">
                ${labels[priority]}
            </span>
        `;
    },

    /**
     * Create an empty state
     * @param {string} icon - Emoji icon
     * @param {string} title - Title text
     * @param {string} description - Description text
     * @param {string} actionText - Action button text (optional)
     * @param {string} actionHandler - Action button onclick handler (optional)
     * @returns {string} HTML string
     */
    emptyState(icon, title, description, actionText = '', actionHandler = '') {
        const actionButton = actionText
            ? `<button class="btn btn-primary" onclick="${actionHandler}">${actionText}</button>`
            : '';

        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${Utils.escapeHtml(title)}</h3>
                <p class="empty-state-description">${Utils.escapeHtml(description)}</p>
                ${actionButton}
            </div>
        `;
    },

    /**
     * Create a list item
     * @param {Object} options - Item options
     * @returns {string} HTML string
     */
    listItem({
        id = '',
        icon = '',
        title = '',
        subtitle = '',
        rightContent = '',
        onClick = '',
        dataAttrs = {}
    }) {
        const dataAttributes = Object.entries(dataAttrs)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        return `
            <div class="list-item" 
                 ${id ? `id="${id}"` : ''}
                 ${onClick ? `onclick="${onClick}"` : ''}
                 ${dataAttributes}
                 tabindex="0"
                 role="button">
                ${icon ? `<div class="list-item-icon">${icon}</div>` : ''}
                <div class="list-item-content">
                    <div class="list-item-title">${Utils.escapeHtml(title)}</div>
                    ${subtitle ? `<div class="list-item-subtitle">${Utils.escapeHtml(subtitle)}</div>` : ''}
                </div>
                ${rightContent ? `<div class="list-item-action">${rightContent}</div>` : ''}
            </div>
        `;
    },

    /**
     * Create a card
     * @param {Object} options - Card options
     * @returns {string} HTML string
     */
    card({
        id = '',
        title = '',
        subtitle = '',
        content = '',
        footer = '',
        accentModule = '',
        onClick = ''
    }) {
        const accentClass = accentModule ? `card-accent ${accentModule}` : '';

        return `
            <div class="card ${accentClass}" 
                 ${id ? `id="${id}"` : ''}
                 ${onClick ? `onclick="${onClick}" role="button" tabindex="0"` : ''}>
                ${title ? `
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">${Utils.escapeHtml(title)}</h3>
                            ${subtitle ? `<p class="card-subtitle">${Utils.escapeHtml(subtitle)}</p>` : ''}
                        </div>
                    </div>
                ` : ''}
                ${content ? `<div class="card-body">${content}</div>` : ''}
                ${footer ? `<div class="card-footer">${footer}</div>` : ''}
            </div>
        `;
    },

    /**
     * Create a section with title
     * @param {string} title - Section title
     * @param {string} content - Section content HTML
     * @returns {string} HTML string
     */
    section(title, content) {
        return `
            <section class="section">
                <h2 class="section-title">${Utils.escapeHtml(title)}</h2>
                ${content}
            </section>
        `;
    },

    /**
     * Create filter chips
     * @param {Array} options - Array of { id, label, active }
     * @param {string} onClickHandler - Click handler function name
     * @returns {string} HTML string
     */
    filterChips(options, onClickHandler) {
        const chips = options.map(opt => `
            <button class="filter-chip ${opt.active ? 'active' : ''}" 
                    data-id="${opt.id}"
                    onclick="${onClickHandler}('${opt.id}')"
                    aria-pressed="${opt.active}">
                ${opt.icon || ''} ${Utils.escapeHtml(opt.label)}
            </button>
        `).join('');

        return `<div class="filter-chips">${chips}</div>`;
    },

    /**
     * Create segmented control
     * @param {Array} options - Array of { id, label, active }
     * @param {string} onClickHandler - Click handler function name
     * @returns {string} HTML string
     */
    segmentedControl(options, onClickHandler) {
        const segments = options.map(opt => `
            <button class="segment ${opt.active ? 'active' : ''}" 
                    data-id="${opt.id}"
                    onclick="${onClickHandler}('${opt.id}')"
                    role="tab"
                    aria-selected="${opt.active}">
                ${Utils.escapeHtml(opt.label)}
            </button>
        `).join('');

        return `<div class="segmented-control" role="tablist">${segments}</div>`;
    },

    /**
     * Create a category badge
     * @param {string} category - Category name
     * @returns {string} HTML string
     */
    categoryBadge(category) {
        const colors = {
            health: '#34C759',
            work: '#FF9500',
            relationships: '#FF2D55',
            parenting: '#AF52DE',
            creativity: '#5AC8FA',
            other: '#8E8E93'
        };

        const color = colors[category?.toLowerCase()] || colors.other;
        const label = category || 'Other';

        return `
            <span class="badge" style="background: ${color}20; color: ${color};">
                ${Utils.escapeHtml(label)}
            </span>
        `;
    },

    /**
     * Create loading spinner
     * @returns {string} HTML string
     */
    spinner() {
        return '<div class="loading-spinner"></div>';
    },

    /**
     * Create skeleton loading placeholders
     * @param {number} count - Number of skeleton items
     * @returns {string} HTML string
     */
    skeletonList(count = 3) {
        const items = Array(count).fill('').map(() => `
            <div class="list-item">
                <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
                <div class="list-item-content">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                </div>
            </div>
        `).join('');

        return `<div class="list stagger-children">${items}</div>`;
    }
};

// Make Components globally available
window.Components = Components;
