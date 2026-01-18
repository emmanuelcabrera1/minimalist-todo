/**
 * Life Compass - Toast Notifications
 * ============================================
 * Non-blocking notification system.
 */

const Toast = {
    container: null,
    queue: [],
    timeout: null,

    /**
     * Initialize toast container
     */
    init() {
        this.container = document.getElementById('toast-container');
    },

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     */
    show({
        message,
        type = 'info', // info, success, warning, error
        duration = 3000,
        icon = null,
        action = null // { label, onClick }
    }) {
        if (!this.container) this.init();

        const icons = {
            info: 'ℹ️',
            success: '✓',
            warning: '⚠️',
            error: '✕'
        };

        const toastIcon = icon || icons[type] || icons.info;
        const toastId = `toast-${Date.now()}`;

        const actionHtml = action
            ? `<button class="btn btn-sm btn-ghost" data-action="toast-action">${Utils.escapeHtml(action.label)}</button>`
            : '';

        const toastHtml = `
            <div class="toast ${type}" id="${toastId}" role="alert">
                <span class="toast-icon">${toastIcon}</span>
                <span class="toast-message">${Utils.escapeHtml(message)}</span>
                ${actionHtml}
                <button class="toast-close" aria-label="Dismiss" data-action="close">×</button>
            </div>
        `;

        // Insert toast
        this.container.insertAdjacentHTML('beforeend', toastHtml);
        const toast = document.getElementById(toastId);

        // Event listeners
        toast.querySelector('[data-action="close"]').addEventListener('click', () => {
            this.dismiss(toast);
        });

        if (action) {
            toast.querySelector('[data-action="toast-action"]').addEventListener('click', () => {
                action.onClick();
                this.dismiss(toast);
            });
        }

        // Haptic feedback
        if (type === 'success') {
            Utils.haptic('success');
        } else if (type === 'error') {
            Utils.haptic('error');
        } else {
            Utils.haptic('light');
        }

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    },

    /**
     * Dismiss a toast
     * @param {HTMLElement} toast 
     */
    dismiss(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.add('exiting');
        setTimeout(() => {
            toast.remove();
        }, 200);
    },

    /**
     * Show success toast
     * @param {string} message 
     */
    success(message) {
        this.show({ message, type: 'success' });
    },

    /**
     * Show error toast
     * @param {string} message 
     */
    error(message) {
        this.show({ message, type: 'error', duration: 5000 });
    },

    /**
     * Show warning toast
     * @param {string} message 
     */
    warning(message) {
        this.show({ message, type: 'warning', duration: 4000 });
    },

    /**
     * Show info toast
     * @param {string} message 
     */
    info(message) {
        this.show({ message, type: 'info' });
    },

    /**
     * Clear all toasts
     */
    clearAll() {
        if (!this.container) return;
        this.container.innerHTML = '';
    }
};

// Make Toast globally available
window.Toast = Toast;
