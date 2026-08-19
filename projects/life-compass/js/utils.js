/**
 * Life Compass - Utility Functions
 * ============================================
 * Shared helper functions used throughout the app.
 */

const Utils = {
    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Format a date for display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type: 'short', 'long', 'time', 'relative'
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const now = new Date();

        if (format === 'relative') {
            return this.getRelativeTime(d, now);
        }

        const options = {
            short: { month: 'short', day: 'numeric' },
            long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
            time: { hour: 'numeric', minute: '2-digit' },
            datetime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
        };

        return d.toLocaleDateString('en-US', options[format] || options.short);
    },

    /**
     * Get relative time string (e.g., "Today", "Yesterday", "3 days ago")
     * @param {Date} date - Target date
     * @param {Date} now - Current date
     * @returns {string} Relative time string
     */
    getRelativeTime(date, now = new Date()) {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays === -1) return 'Tomorrow';
        if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < -1 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;

        return this.formatDate(date, 'short');
    },

    /**
     * Check if a date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    /**
     * Check if a date is in the past
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    isPast(date) {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    },

    /**
     * Get the start of a day
     * @param {Date} date - Date
     * @returns {Date}
     */
    startOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Get the end of a day
     * @param {Date} date - Date
     * @returns {Date}
     */
    endOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    /**
     * Get the start of a week (Monday)
     * @param {Date} date - Date
     * @returns {Date}
     */
    startOfWeek(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Get week number of the year
     * @param {Date} date - Date
     * @returns {number}
     */
    getWeekNumber(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * Add days to a date
     * @param {Date} date - Starting date
     * @param {number} days - Days to add
     * @returns {Date}
     */
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait = 250) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    throttle(func, limit = 250) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object}
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const copy = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    copy[key] = this.deepClone(obj[key]);
                }
            }
            return copy;
        }
        return obj;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Calculate percentage
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-100)
     */
    percentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    /**
     * Clamp a number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },

    /**
     * Group an array by a key
     * @param {Array} array - Array to group
     * @param {string|Function} key - Key to group by
     * @returns {Object}
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            (result[groupKey] = result[groupKey] || []).push(item);
            return result;
        }, {});
    },

    /**
     * Sort an array by a key
     * @param {Array} array - Array to sort
     * @param {string} key - Key to sort by
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array}
     */
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Check if device supports haptic feedback
     * @returns {boolean}
     */
    supportsHaptics() {
        return 'vibrate' in navigator;
    },

    /**
     * Trigger haptic feedback
     * @param {string} type - 'light', 'medium', 'heavy'
     */
    haptic(type = 'light') {
        if (!this.supportsHaptics()) return;

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [30, 50, 30, 50, 30]
        };

        navigator.vibrate(patterns[type] || patterns.light);
    },

    /**
     * Get day of week name
     * @param {number} index - Day index (0-6, Sunday = 0)
     * @param {string} format - 'short' or 'long'
     * @returns {string}
     */
    getDayName(index, format = 'short') {
        const days = {
            short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        };
        return days[format][index];
    },

    /**
     * Get dates for current week
     * @returns {Date[]}
     */
    getCurrentWeekDates() {
        const start = this.startOfWeek();
        return Array.from({ length: 7 }, (_, i) => this.addDays(start, i));
    },

    /**
     * Calculate age in years from birth date
     * @param {Date|string} birthDate - Birth date
     * @returns {number}
     */
    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    },

    /**
     * Calculate weeks lived since birth date
     * @param {Date|string} birthDate - Birth date
     * @returns {number}
     */
    calculateWeeksLived(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        const diffTime = today - birth;
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        return diffWeeks;
    }
};

// Make Utils globally available
window.Utils = Utils;
