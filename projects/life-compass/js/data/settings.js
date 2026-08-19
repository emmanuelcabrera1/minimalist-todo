/**
 * Life Compass - Settings Repository
 * ============================================
 * Handles user settings persistence.
 */

const SettingsRepo = {
    /**
     * Get current settings
     * @returns {Promise<Object>}
     */
    async get() {
        return await DB.get(DB.stores.SETTINGS, 'settings');
    },

    /**
     * Update settings
     * @param {Object} updates - Partial settings to update
     * @returns {Promise<void>}
     */
    async update(updates) {
        const current = await this.get();
        const updated = { ...current, ...updates };
        await DB.update(DB.stores.SETTINGS, updated);
        App.settings = updated;
    },

    /**
     * Get a specific setting value
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default if not set
     * @returns {Promise<any>}
     */
    async getValue(key, defaultValue = null) {
        const settings = await this.get();
        return settings?.[key] ?? defaultValue;
    }
};

window.SettingsRepo = SettingsRepo;
