/**
 * Life Compass - Modal System
 * ============================================
 * Handles modal dialogs, action sheets, and confirmations.
 */

const Modal = {
    currentModal: null,
    focusTrap: null,
    previousFocus: null,

    /**
     * Show a modal
     * @param {Object} options - Modal configuration
     * @returns {Promise<any>} Resolves when modal closes
     */
    show({
        title = '',
        content = '',
        footer = '',
        type = 'default', // default, full, center
        onClose = null
    }) {
        return new Promise((resolve) => {
            // Store current focus
            this.previousFocus = document.activeElement;

            // Create modal HTML
            const modalHtml = `
                <div class="modal-overlay ${type === 'center' ? 'center' : ''}" tabindex="-1">
                    <div class="modal ${type === 'full' ? 'full' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                        ${type === 'full' ? '<div class="modal-handle"></div>' : ''}
                        
                        ${title ? `
                            <div class="modal-header">
                                <h2 class="modal-title" id="modal-title">${Utils.escapeHtml(title)}</h2>
                                <button class="modal-close" aria-label="Close modal" data-action="close">×</button>
                            </div>
                        ` : ''}
                        
                        <div class="modal-body">
                            ${content}
                        </div>
                        
                        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                    </div>
                </div>
            `;

            // Insert modal
            const root = document.getElementById('modal-root');
            root.innerHTML = modalHtml;
            root.setAttribute('aria-hidden', 'false');

            const overlay = root.querySelector('.modal-overlay');
            const modal = root.querySelector('.modal');

            // Store reference
            this.currentModal = { overlay, modal, resolve, onClose };

            // Setup event listeners
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });

            modal.querySelector('[data-action="close"]')?.addEventListener('click', () => {
                this.close();
            });

            // Setup keyboard handling
            document.addEventListener('keydown', this.handleKeydown);

            // Setup focus trap
            this.setupFocusTrap(modal);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('animate-fadeIn');
                modal.classList.add('animate-scaleIn');
            });

            // Focus first focusable element
            setTimeout(() => {
                const focusable = modal.querySelector('input, button, [tabindex="0"]');
                focusable?.focus();
            }, 100);
        });
    },

    /**
     * Show a confirmation dialog
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} Resolves to true if confirmed
     */
    confirm({
        icon = '⚠️',
        title = 'Are you sure?',
        message = '',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmDestructive = false
    }) {
        return new Promise((resolve) => {
            const content = `
                <div class="dialog">
                    <div class="dialog-icon">${icon}</div>
                    <h3 class="dialog-title">${Utils.escapeHtml(title)}</h3>
                    ${message ? `<p class="dialog-message">${Utils.escapeHtml(message)}</p>` : ''}
                    <div class="dialog-actions">
                        <button class="btn ${confirmDestructive ? 'btn-danger' : 'btn-primary'}" data-action="confirm">
                            ${Utils.escapeHtml(confirmText)}
                        </button>
                        <button class="btn btn-secondary" data-action="cancel">
                            ${Utils.escapeHtml(cancelText)}
                        </button>
                    </div>
                </div>
            `;

            const root = document.getElementById('modal-root');
            root.innerHTML = `
                <div class="modal-overlay center" tabindex="-1">
                    ${content}
                </div>
            `;
            root.setAttribute('aria-hidden', 'false');

            const overlay = root.querySelector('.modal-overlay');
            const dialog = root.querySelector('.dialog');

            this.currentModal = { overlay, modal: dialog, resolve };

            // Button handlers
            dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
                this.close(true);
            });

            dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
                this.close(false);
            });

            // Keyboard handling
            document.addEventListener('keydown', this.handleKeydown);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('animate-fadeIn');
                dialog.classList.add('animate-scaleIn');
            });

            // Focus confirm button
            setTimeout(() => {
                dialog.querySelector('[data-action="confirm"]')?.focus();
            }, 100);
        });
    },

    /**
     * Show an action sheet
     * @param {Object} options - Action sheet options
     * @returns {Promise<string|null>} Resolves to action ID or null if cancelled
     */
    actionSheet({
        title = '',
        actions = [], // Array of { id, label, icon, destructive }
        cancelText = 'Cancel'
    }) {
        return new Promise((resolve) => {
            const actionsHtml = actions.map(action => `
                <button class="action-sheet-item ${action.destructive ? 'destructive' : ''}" 
                        data-action="${action.id}">
                    ${action.icon || ''} ${Utils.escapeHtml(action.label)}
                </button>
            `).join('');

            const content = `
                <div class="action-sheet">
                    ${title ? `<div class="action-sheet-group"><div class="action-sheet-item" style="font-size: 13px; color: var(--text-tertiary);">${Utils.escapeHtml(title)}</div></div>` : ''}
                    <div class="action-sheet-group">
                        ${actionsHtml}
                    </div>
                    <div class="action-sheet-group">
                        <button class="action-sheet-item action-sheet-cancel" data-action="cancel">
                            ${Utils.escapeHtml(cancelText)}
                        </button>
                    </div>
                </div>
            `;

            const root = document.getElementById('modal-root');
            root.innerHTML = `<div class="modal-overlay" tabindex="-1">${content}</div>`;
            root.setAttribute('aria-hidden', 'false');

            const overlay = root.querySelector('.modal-overlay');
            const sheet = root.querySelector('.action-sheet');

            this.currentModal = { overlay, modal: sheet, resolve };

            // Click handlers
            sheet.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const actionId = btn.dataset.action;
                    this.close(actionId === 'cancel' ? null : actionId);
                });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(null);
                }
            });

            document.addEventListener('keydown', this.handleKeydown);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('animate-fadeIn');
                sheet.classList.add('animate-slideInUp');
            });
        });
    },

    /**
     * Close the current modal
     * @param {any} result - Result to pass back
     */
    close(result = null) {
        if (!this.currentModal) return;

        const { overlay, modal, resolve, onClose } = this.currentModal;

        // Animate out
        overlay.classList.add('closing');
        modal.classList.add('closing');

        // Clean up after animation
        setTimeout(() => {
            const root = document.getElementById('modal-root');
            root.innerHTML = '';
            root.setAttribute('aria-hidden', 'true');

            // Remove keyboard handler
            document.removeEventListener('keydown', this.handleKeydown);

            // Restore focus
            this.previousFocus?.focus();

            // Call callbacks
            if (onClose) onClose(result);
            resolve(result);

            this.currentModal = null;
        }, 200);
    },

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e 
     */
    handleKeydown(e) {
        if (e.key === 'Escape') {
            Modal.close(null);
        }

        // Tab trap
        if (e.key === 'Tab' && Modal.currentModal) {
            const modal = Modal.currentModal.modal;
            const focusable = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    },

    /**
     * Setup focus trap for a modal
     * @param {HTMLElement} modal 
     */
    setupFocusTrap(modal) {
        // Focus trap is handled in handleKeydown
    }
};

// Bind handleKeydown to Modal
Modal.handleKeydown = Modal.handleKeydown.bind(Modal);

// Make Modal globally available
window.Modal = Modal;
