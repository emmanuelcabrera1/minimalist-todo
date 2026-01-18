/**
 * Life Compass - IndexedDB Database Layer
 * ============================================
 * Handles all database operations with IndexedDB.
 * Provides a Promise-based API for CRUD operations.
 */

const DB = {
    name: 'life-compass-db',
    version: 1,
    db: null,

    // Object store names
    stores: {
        SETTINGS: 'settings',
        PROJECTS: 'projects',
        TASKS: 'tasks',
        HABITS: 'habits',
        HABIT_LOGS: 'habitLogs',
        EXPERIMENTS: 'experiments',
        EXPERIMENT_LOGS: 'experimentLogs',
        REFLECTIONS: 'reflections',
        MOOD_ENTRIES: 'moodEntries',
        LIFE_EVENTS: 'lifeEvents',
        LIFE_PHASES: 'lifePhases',
        SPECIAL_COUNTERS: 'specialCounters'
    },

    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onerror = () => {
                console.error('[DB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[DB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('[DB] Upgrading database...');
                const db = event.target.result;
                this.createStores(db);
            };
        });
    },

    /**
     * Create object stores and indexes
     * @param {IDBDatabase} db 
     */
    createStores(db) {
        // Settings (singleton store)
        if (!db.objectStoreNames.contains(this.stores.SETTINGS)) {
            db.createObjectStore(this.stores.SETTINGS, { keyPath: 'id' });
        }

        // Projects
        if (!db.objectStoreNames.contains(this.stores.PROJECTS)) {
            const projectStore = db.createObjectStore(this.stores.PROJECTS, { keyPath: 'id' });
            projectStore.createIndex('sortOrder', 'sortOrder', { unique: false });
            projectStore.createIndex('parentId', 'parentId', { unique: false });
        }

        // Tasks
        if (!db.objectStoreNames.contains(this.stores.TASKS)) {
            const taskStore = db.createObjectStore(this.stores.TASKS, { keyPath: 'id' });
            taskStore.createIndex('projectId', 'projectId', { unique: false });
            taskStore.createIndex('dueDate', 'dueDate', { unique: false });
            taskStore.createIndex('isCompleted', 'isCompleted', { unique: false });
            taskStore.createIndex('experimentId', 'experimentId', { unique: false });
            taskStore.createIndex('habitId', 'habitId', { unique: false });
            taskStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Habits
        if (!db.objectStoreNames.contains(this.stores.HABITS)) {
            const habitStore = db.createObjectStore(this.stores.HABITS, { keyPath: 'id' });
            habitStore.createIndex('category', 'category', { unique: false });
            habitStore.createIndex('isActive', 'isActive', { unique: false });
            habitStore.createIndex('originExperimentId', 'originExperimentId', { unique: false });
        }

        // Habit Logs
        if (!db.objectStoreNames.contains(this.stores.HABIT_LOGS)) {
            const habitLogStore = db.createObjectStore(this.stores.HABIT_LOGS, { keyPath: 'id' });
            habitLogStore.createIndex('habitId', 'habitId', { unique: false });
            habitLogStore.createIndex('date', 'date', { unique: false });
            habitLogStore.createIndex('habitId_date', ['habitId', 'date'], { unique: true });
        }

        // Experiments
        if (!db.objectStoreNames.contains(this.stores.EXPERIMENTS)) {
            const expStore = db.createObjectStore(this.stores.EXPERIMENTS, { keyPath: 'id' });
            expStore.createIndex('status', 'status', { unique: false });
            expStore.createIndex('category', 'category', { unique: false });
            expStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Experiment Logs
        if (!db.objectStoreNames.contains(this.stores.EXPERIMENT_LOGS)) {
            const expLogStore = db.createObjectStore(this.stores.EXPERIMENT_LOGS, { keyPath: 'id' });
            expLogStore.createIndex('experimentId', 'experimentId', { unique: false });
            expLogStore.createIndex('date', 'date', { unique: false });
            expLogStore.createIndex('experimentId_date', ['experimentId', 'date'], { unique: true });
        }

        // Reflections
        if (!db.objectStoreNames.contains(this.stores.REFLECTIONS)) {
            const reflectStore = db.createObjectStore(this.stores.REFLECTIONS, { keyPath: 'id' });
            reflectStore.createIndex('experimentId', 'experimentId', { unique: false });
            reflectStore.createIndex('date', 'date', { unique: false });
        }

        // Mood Entries
        if (!db.objectStoreNames.contains(this.stores.MOOD_ENTRIES)) {
            const moodStore = db.createObjectStore(this.stores.MOOD_ENTRIES, { keyPath: 'id' });
            moodStore.createIndex('timestamp', 'timestamp', { unique: false });
            moodStore.createIndex('entryType', 'entryType', { unique: false });
        }

        // Life Events
        if (!db.objectStoreNames.contains(this.stores.LIFE_EVENTS)) {
            const eventStore = db.createObjectStore(this.stores.LIFE_EVENTS, { keyPath: 'id' });
            eventStore.createIndex('date', 'date', { unique: false });
            eventStore.createIndex('type', 'type', { unique: false });
        }

        // Life Phases
        if (!db.objectStoreNames.contains(this.stores.LIFE_PHASES)) {
            const phaseStore = db.createObjectStore(this.stores.LIFE_PHASES, { keyPath: 'id' });
            phaseStore.createIndex('startDate', 'startDate', { unique: false });
        }

        // Special Counters
        if (!db.objectStoreNames.contains(this.stores.SPECIAL_COUNTERS)) {
            db.createObjectStore(this.stores.SPECIAL_COUNTERS, { keyPath: 'id' });
        }

        console.log('[DB] Object stores created');
    },

    /**
     * Get a transaction for an object store
     * @param {string} storeName - Name of the object store
     * @param {string} mode - 'readonly' or 'readwrite'
     * @returns {IDBObjectStore}
     */
    getStore(storeName, mode = 'readonly') {
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    },

    /**
     * Add a record to a store
     * @param {string} storeName - Name of the object store
     * @param {Object} data - Data to add
     * @returns {Promise<string>} - ID of the added record
     */
    async add(storeName, data) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, 'readwrite');
            const request = store.add({
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get a record by ID
     * @param {string} storeName - Name of the object store
     * @param {string} id - Record ID
     * @returns {Promise<Object|null>}
     */
    async get(storeName, id) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all records from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get records by index
     * @param {string} storeName - Name of the object store
     * @param {string} indexName - Name of the index
     * @param {*} value - Value to search for
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get records by index range
     * @param {string} storeName - Name of the object store
     * @param {string} indexName - Name of the index
     * @param {IDBKeyRange} range - Key range
     * @returns {Promise<Array>}
     */
    async getByRange(storeName, indexName, range) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Update a record
     * @param {string} storeName - Name of the object store
     * @param {Object} data - Data to update (must include id)
     * @returns {Promise<string>}
     */
    async update(storeName, data) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, 'readwrite');
            const request = store.put({
                ...data,
                updatedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Delete a record
     * @param {string} storeName - Name of the object store
     * @param {string} id - Record ID
     * @returns {Promise<void>}
     */
    async delete(storeName, id) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clear all records from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, 'readwrite');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Count records in a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<number>}
     */
    async count(storeName) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Perform a bulk add operation
     * @param {string} storeName - Name of the object store
     * @param {Array} items - Array of items to add
     * @returns {Promise<void>}
     */
    async bulkAdd(storeName, items) {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            const timestamp = new Date().toISOString();
            items.forEach(item => {
                store.add({
                    ...item,
                    createdAt: item.createdAt || timestamp,
                    updatedAt: timestamp
                });
            });
        });
    },

    /**
     * Export all data from the database
     * @returns {Promise<Object>}
     */
    async exportAll() {
        await this.init();

        const data = {};
        for (const storeName of Object.values(this.stores)) {
            data[storeName] = await this.getAll(storeName);
        }
        return data;
    },

    /**
     * Import data into the database
     * @param {Object} data - Data to import
     * @returns {Promise<void>}
     */
    async importAll(data) {
        await this.init();

        for (const [storeName, items] of Object.entries(data)) {
            if (this.stores[storeName.toUpperCase()] && Array.isArray(items)) {
                await this.clear(storeName);
                await this.bulkAdd(storeName, items);
            }
        }
    }
};

// Make DB globally available
window.DB = DB;
