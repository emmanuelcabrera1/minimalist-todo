/**
 * Life Compass - Main Application
 * ============================================
 * Application initialization and global state.
 */

const App = {
    version: '1.0.0',
    initialized: false,
    settings: null,

    /**
     * Initialize the application
     */
    async init() {
        console.log('[App] Initializing Life Compass v' + this.version);

        try {
            // Initialize database
            await DB.init();
            console.log('[App] Database initialized');

            // Load or create settings
            await this.loadSettings();
            console.log('[App] Settings loaded');

            // Initialize UI components
            Toast.init();
            Navigation.init();
            console.log('[App] UI initialized');

            // Register for app updates
            this.registerUpdateListener();

            // Mark as initialized
            this.initialized = true;
            console.log('[App] Initialization complete');

        } catch (error) {
            console.error('[App] Initialization failed:', error);
            this.showFatalError(error);
        }
    },

    /**
     * Load user settings from database
     */
    async loadSettings() {
        let settings = await DB.get(DB.stores.SETTINGS, 'settings');

        if (!settings) {
            // Create default settings
            settings = {
                id: 'settings',
                birthDate: null,
                estimatedLifespan: 80,
                healthyYearsRemaining: 70,
                theme: 'dark',
                notificationsEnabled: true,
                onboardingComplete: false,
                createdAt: new Date().toISOString()
            };

            await DB.add(DB.stores.SETTINGS, settings);
        }

        this.settings = settings;

        // Check if onboarding needed
        if (!settings.onboardingComplete) {
            this.showOnboarding();
        }
    },

    /**
     * Update a setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     */
    async updateSetting(key, value) {
        this.settings[key] = value;
        await DB.update(DB.stores.SETTINGS, this.settings);
    },

    /**
     * Show onboarding flow for new users
     */
    async showOnboarding() {
        // For now, just complete onboarding
        // TODO: Implement full onboarding wizard
        await this.updateSetting('onboardingComplete', true);

        // Create default inbox project
        const inbox = await DB.get(DB.stores.PROJECTS, 'inbox');
        if (!inbox) {
            await DB.add(DB.stores.PROJECTS, {
                id: 'inbox',
                name: 'Inbox',
                color: '#8E8E93',
                icon: '📥',
                isInbox: true,
                sortOrder: 0,
                parentId: null
            });
        }
    },

    /**
     * Register listener for service worker updates
     */
    registerUpdateListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            this.showUpdateAvailable();
                        }
                    });
                });
            });
        }
    },

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        Toast.show({
            message: 'A new version is available!',
            type: 'info',
            duration: 0, // Don't auto-dismiss
            action: {
                label: 'Update',
                onClick: () => this.applyUpdate()
            }
        });
    },

    /**
     * Apply service worker update
     */
    applyUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    },

    /**
     * Show fatal error screen
     * @param {Error} error 
     */
    showFatalError(error) {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">😵</div>
                <h3 class="empty-state-title">Something went wrong</h3>
                <p class="empty-state-description">
                    We couldn't start Life Compass. Please try refreshing the page.
                    <br><br>
                    <small style="color: var(--text-tertiary);">${Utils.escapeHtml(error.message)}</small>
                </p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh
                </button>
            </div>
        `;
    },

    /**
     * Export all user data
     * @returns {Promise<Object>}
     */
    async exportData() {
        return await DB.exportAll();
    },

    /**
     * Import user data
     * @param {Object} data 
     */
    async importData(data) {
        await DB.importAll(data);
        Toast.success('Data imported successfully');
        Navigation.loadModule(Navigation.currentModule);
    },

    /**
     * Clear all user data
     */
    async clearAllData() {
        const confirmed = await Modal.confirm({
            icon: '🗑️',
            title: 'Delete All Data?',
            message: 'This will permanently delete all your tasks, habits, experiments, mood entries, and life events. This action cannot be undone.',
            confirmText: 'Delete Everything',
            cancelText: 'Cancel',
            confirmDestructive: true
        });

        if (confirmed) {
            for (const storeName of Object.values(DB.stores)) {
                await DB.clear(storeName);
            }

            Toast.success('All data cleared');
            await this.loadSettings();
            Navigation.loadModule('tasks');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally available
window.App = App;
