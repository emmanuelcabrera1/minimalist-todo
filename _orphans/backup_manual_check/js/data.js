/**
 * Experiments - Data Layer
 * LocalStorage-based persistence with Tiny Experiments models
 */

const DB_KEY = 'experiments_db';

// Default templates - organized by category
const TEMPLATES = [
    // HEALTH
    {
        id: 'meditation-30',
        title: '30 Days of Meditation',
        purpose: 'Reduce stress and improve mental clarity',
        successCriteria: 'Meditate for at least 10 minutes each day',
        durationDays: 30,
        frequency: 'daily',
        category: 'Health',
        icon: '🧘',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '2-minute breathing', duration: 2 },
            { level: 2, name: 'Standard', description: '10-minute meditation', duration: 10 },
            { level: 3, name: 'Advanced', description: '20-minute deep meditation', duration: 20 }
        ],
        minimumAction: { description: 'Take 5 deep breaths', duration: 1 },
        baselineQuestions: [
            { id: 'stress', question: 'Current stress level (1-10)?', type: 'number' },
            { id: 'focus', question: 'Ability to focus (1-10)?', type: 'number' }
        ]
    },
    {
        id: 'cold-shower-14',
        title: 'Cold Shower Challenge',
        purpose: 'Build mental resilience and boost energy',
        successCriteria: 'End shower with 30 seconds cold water',
        durationDays: 14,
        frequency: 'daily',
        category: 'Health',
        icon: '❄️',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '10 seconds cold', duration: 1 },
            { level: 2, name: 'Standard', description: '30 seconds cold', duration: 1 },
            { level: 3, name: 'Advanced', description: '60 seconds cold', duration: 2 }
        ],
        minimumAction: { description: 'Splash cold water on face', duration: 1 }
    },
    {
        id: 'walking-30',
        title: '10,000 Steps Daily',
        purpose: 'Improve cardiovascular health and energy levels',
        successCriteria: 'Reach 10,000 steps before bedtime',
        durationDays: 30,
        frequency: 'daily',
        category: 'Health',
        icon: '🚶',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '5,000 steps', duration: 30 },
            { level: 2, name: 'Standard', description: '10,000 steps', duration: 60 },
            { level: 3, name: 'Advanced', description: '15,000 steps', duration: 90 }
        ],
        minimumAction: { description: '10-minute walk', duration: 10 }
    },
    {
        id: 'sleep-schedule-21',
        title: 'Sleep by 10pm Challenge',
        purpose: 'Improve sleep quality and morning energy',
        successCriteria: 'Be in bed with lights off by 10pm',
        durationDays: 21,
        frequency: 'daily',
        category: 'Health',
        icon: '😴',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'In bed by 11pm', duration: 0 },
            { level: 2, name: 'Standard', description: 'In bed by 10pm', duration: 0 },
            { level: 3, name: 'Advanced', description: 'In bed by 9:30pm', duration: 0 }
        ],
        minimumAction: { description: 'Start bedtime routine by 10:30pm', duration: 15 }
    },

    // WORK
    {
        id: 'deep-work-30',
        title: 'Deep Work Sessions',
        purpose: 'Increase productivity and focus at work',
        successCriteria: 'Complete 2 hours of uninterrupted deep work',
        durationDays: 30,
        frequency: 'daily',
        category: 'Work',
        icon: '💻',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '30-minute focused block', duration: 30 },
            { level: 2, name: 'Standard', description: '2-hour deep work', duration: 120 },
            { level: 3, name: 'Advanced', description: '4-hour deep work', duration: 240 }
        ],
        minimumAction: { description: 'One 25-minute pomodoro', duration: 25 }
    },
    {
        id: 'inbox-zero-14',
        title: 'Inbox Zero Challenge',
        purpose: 'Reduce email stress and improve organization',
        successCriteria: 'Process all emails to zero by end of day',
        durationDays: 14,
        frequency: 'daily',
        category: 'Work',
        icon: '📧',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Process 10 emails', duration: 15 },
            { level: 2, name: 'Standard', description: 'Inbox to zero', duration: 30 },
            { level: 3, name: 'Advanced', description: 'Zero + unsubscribe 3', duration: 45 }
        ],
        minimumAction: { description: 'Process 5 most urgent emails', duration: 10 }
    },
    {
        id: 'no-meeting-mornings-21',
        title: 'No-Meeting Mornings',
        purpose: 'Protect creative time for important work',
        successCriteria: 'Keep mornings meeting-free until noon',
        durationDays: 21,
        frequency: 'daily',
        category: 'Work',
        icon: '🚫',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'No meetings until 10am', duration: 0 },
            { level: 2, name: 'Standard', description: 'No meetings until noon', duration: 0 },
            { level: 3, name: 'Advanced', description: 'No meetings until 2pm', duration: 0 }
        ],
        minimumAction: { description: 'Block 1 hour for focus time', duration: 60 }
    },

    // PARENTING
    {
        id: 'quality-time-30',
        title: 'Daily Quality Time',
        purpose: 'Strengthen bond with your children',
        successCriteria: 'Spend 30 minutes of undivided attention with kids',
        durationDays: 30,
        frequency: 'daily',
        category: 'Parenting',
        icon: '👨‍👧',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '10 minutes phone-free', duration: 10 },
            { level: 2, name: 'Standard', description: '30 minutes quality time', duration: 30 },
            { level: 3, name: 'Advanced', description: '1 hour dedicated activity', duration: 60 }
        ],
        minimumAction: { description: 'One genuine conversation', duration: 5 }
    },
    {
        id: 'bedtime-stories-21',
        title: 'Bedtime Story Routine',
        purpose: 'Create meaningful bedtime rituals',
        successCriteria: 'Read a story together before bed',
        durationDays: 21,
        frequency: 'daily',
        category: 'Parenting',
        icon: '📖',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'One short story', duration: 5 },
            { level: 2, name: 'Standard', description: 'One chapter', duration: 15 },
            { level: 3, name: 'Advanced', description: 'Story + discussion', duration: 25 }
        ],
        minimumAction: { description: 'Read one page together', duration: 2 }
    },
    {
        id: 'patience-practice-14',
        title: 'Patience Practice',
        purpose: 'Respond calmly in challenging moments',
        successCriteria: 'Pause and breathe before reacting to frustration',
        durationDays: 14,
        frequency: 'daily',
        category: 'Parenting',
        icon: '🧘‍♂️',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Notice frustration once', duration: 0 },
            { level: 2, name: 'Standard', description: 'Pause before 3 reactions', duration: 0 },
            { level: 3, name: 'Advanced', description: 'Journal each pause', duration: 10 }
        ],
        minimumAction: { description: 'One conscious breath before responding', duration: 1 }
    },

    // RELATIONSHIPS
    {
        id: 'date-night-12',
        title: 'Weekly Date Night',
        purpose: 'Nurture your romantic relationship',
        successCriteria: 'Have a dedicated date (home or out)',
        durationDays: 84,
        frequency: 'weekly',
        category: 'Relationships',
        icon: '💑',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '30-min dedicated time', duration: 30 },
            { level: 2, name: 'Standard', description: 'Full evening date', duration: 180 },
            { level: 3, name: 'Advanced', description: 'Planned special activity', duration: 240 }
        ],
        minimumAction: { description: '15 minutes phone-free conversation', duration: 15 }
    },
    {
        id: 'gratitude-partner-30',
        title: 'Daily Partner Appreciation',
        purpose: 'Express gratitude and strengthen connection',
        successCriteria: 'Tell your partner one thing you appreciate about them',
        durationDays: 30,
        frequency: 'daily',
        category: 'Relationships',
        icon: '💝',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'One appreciation', duration: 1 },
            { level: 2, name: 'Standard', description: 'Specific appreciation + why', duration: 3 },
            { level: 3, name: 'Advanced', description: 'Written note', duration: 10 }
        ],
        minimumAction: { description: 'Think of one thing you appreciate', duration: 1 }
    },
    {
        id: 'active-listening-21',
        title: 'Active Listening Practice',
        purpose: 'Improve communication in relationships',
        successCriteria: 'Practice listening without interrupting in one conversation',
        durationDays: 21,
        frequency: 'daily',
        category: 'Relationships',
        icon: '👂',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Listen for 2 minutes', duration: 2 },
            { level: 2, name: 'Standard', description: 'Full conversation without interrupting', duration: 10 },
            { level: 3, name: 'Advanced', description: 'Listen + reflect back', duration: 15 }
        ],
        minimumAction: { description: 'Let someone finish one thought', duration: 1 }
    },

    // LEARNING
    {
        id: 'reading-30',
        title: 'Read 30 Minutes Daily',
        purpose: 'Expand knowledge and build reading habit',
        successCriteria: 'Read for 30 minutes (books, not social media)',
        durationDays: 30,
        frequency: 'daily',
        category: 'Learning',
        icon: '📚',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Read 10 minutes', duration: 10 },
            { level: 2, name: 'Standard', description: 'Read 30 minutes', duration: 30 },
            { level: 3, name: 'Advanced', description: 'Read 1 hour + notes', duration: 60 }
        ],
        minimumAction: { description: 'Read one page', duration: 2 }
    },
    {
        id: 'language-learning-30',
        title: 'Daily Language Practice',
        purpose: 'Learn or improve a new language',
        successCriteria: 'Complete one language lesson or 15 min practice',
        durationDays: 30,
        frequency: 'daily',
        category: 'Learning',
        icon: '🗣️',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '5-minute lesson', duration: 5 },
            { level: 2, name: 'Standard', description: '15-minute practice', duration: 15 },
            { level: 3, name: 'Advanced', description: '30 min + conversation', duration: 30 }
        ],
        minimumAction: { description: 'Learn one new word', duration: 1 }
    },
    {
        id: 'skill-building-21',
        title: 'New Skill Challenge',
        purpose: 'Develop a new professional or personal skill',
        successCriteria: 'Practice or study the new skill for 30 minutes',
        durationDays: 21,
        frequency: 'daily',
        category: 'Learning',
        icon: '🎯',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '15-minute practice', duration: 15 },
            { level: 2, name: 'Standard', description: '30-minute focused practice', duration: 30 },
            { level: 3, name: 'Advanced', description: '1-hour deliberate practice', duration: 60 }
        ],
        minimumAction: { description: 'Watch one tutorial', duration: 5 }
    },

    // HOBBIES
    {
        id: 'creative-practice-30',
        title: 'Daily Creative Practice',
        purpose: 'Nurture creativity and self-expression',
        successCriteria: 'Spend 20 minutes on creative activity (art, music, writing)',
        durationDays: 30,
        frequency: 'daily',
        category: 'Hobbies',
        icon: '🎨',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '10-minute doodle/write', duration: 10 },
            { level: 2, name: 'Standard', description: '20-minute creative session', duration: 20 },
            { level: 3, name: 'Advanced', description: '45-minute project work', duration: 45 }
        ],
        minimumAction: { description: 'One sketch or sentence', duration: 2 }
    },
    {
        id: 'hobby-exploration-8',
        title: 'Try 8 New Hobbies',
        purpose: 'Discover new interests and passions',
        successCriteria: 'Try a different hobby each week',
        durationDays: 56,
        frequency: 'weekly',
        category: 'Hobbies',
        icon: '🔍',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Research one hobby', duration: 15 },
            { level: 2, name: 'Standard', description: 'Try hobby for 1 hour', duration: 60 },
            { level: 3, name: 'Advanced', description: 'Full session + reflection', duration: 120 }
        ],
        minimumAction: { description: 'Watch one video about the hobby', duration: 10 }
    },
    {
        id: 'digital-detox-7',
        title: '7-Day Digital Detox',
        purpose: 'Reclaim time for offline hobbies',
        successCriteria: 'No social media or streaming after 7pm',
        durationDays: 7,
        frequency: 'daily',
        category: 'Hobbies',
        icon: '📵',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'No screens after 9pm', duration: 0 },
            { level: 2, name: 'Standard', description: 'No screens after 7pm', duration: 0 },
            { level: 3, name: 'Advanced', description: 'No screens after 6pm', duration: 0 }
        ],
        minimumAction: { description: 'Put phone in another room for 30min', duration: 30 }
    },

    // EMOTIONS
    {
        id: 'journaling-30',
        title: 'Daily Journaling',
        purpose: 'Process emotions and gain self-awareness',
        successCriteria: 'Write in journal for at least 10 minutes',
        durationDays: 30,
        frequency: 'daily',
        category: 'Emotions',
        icon: '📝',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '3 sentences', duration: 3 },
            { level: 2, name: 'Standard', description: '10-minute freewrite', duration: 10 },
            { level: 3, name: 'Advanced', description: '20-minute reflection', duration: 20 }
        ],
        minimumAction: { description: 'Write one sentence about your day', duration: 1 }
    },
    {
        id: 'gratitude-21',
        title: '21-Day Gratitude Practice',
        purpose: 'Shift perspective toward positivity',
        successCriteria: 'Write 3 things you are grateful for',
        durationDays: 21,
        frequency: 'daily',
        category: 'Emotions',
        icon: '🙏',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Think of 1 thing', duration: 1 },
            { level: 2, name: 'Standard', description: 'Write 3 things', duration: 5 },
            { level: 3, name: 'Advanced', description: '3 things + why each matters', duration: 10 }
        ],
        minimumAction: { description: 'Name one good thing from today', duration: 1 }
    },
    {
        id: 'mindfulness-14',
        title: 'Mindfulness Moments',
        purpose: 'Reduce anxiety and increase presence',
        successCriteria: 'Take 3 mindful breathing breaks throughout the day',
        durationDays: 14,
        frequency: 'daily',
        category: 'Emotions',
        icon: '🌿',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: '1 mindful moment', duration: 2 },
            { level: 2, name: 'Standard', description: '3 mindful breaks', duration: 6 },
            { level: 3, name: 'Advanced', description: '5 breaks + body scan', duration: 15 }
        ],
        minimumAction: { description: 'Take 3 conscious breaths', duration: 1 }
    },

    // MONEY
    {
        id: 'no-spend-7',
        title: 'No-Spend Week',
        purpose: 'Reset spending habits and save money',
        successCriteria: 'No discretionary purchases (only essentials)',
        durationDays: 7,
        frequency: 'daily',
        category: 'Money',
        icon: '💰',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'No online shopping', duration: 0 },
            { level: 2, name: 'Standard', description: 'No discretionary spending', duration: 0 },
            { level: 3, name: 'Advanced', description: 'Essentials only + track savings', duration: 5 }
        ],
        minimumAction: { description: 'Delay one purchase by 24 hours', duration: 1 }
    },
    {
        id: 'expense-tracking-30',
        title: 'Daily Expense Tracking',
        purpose: 'Gain awareness of spending patterns',
        successCriteria: 'Log every expense at end of day',
        durationDays: 30,
        frequency: 'daily',
        category: 'Money',
        icon: '📊',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Track purchases over $10', duration: 3 },
            { level: 2, name: 'Standard', description: 'Track all expenses', duration: 5 },
            { level: 3, name: 'Advanced', description: 'Track + categorize + review', duration: 15 }
        ],
        minimumAction: { description: 'Note your largest purchase today', duration: 1 }
    },
    {
        id: 'savings-streak-30',
        title: 'Daily Savings Challenge',
        purpose: 'Build a savings habit',
        successCriteria: 'Transfer any amount to savings account',
        durationDays: 30,
        frequency: 'daily',
        category: 'Money',
        icon: '🐷',
        difficultyLevels: [
            { level: 1, name: 'Starter', description: 'Save $1', duration: 2 },
            { level: 2, name: 'Standard', description: 'Save $5', duration: 2 },
            { level: 3, name: 'Advanced', description: 'Save 10% of daily spending', duration: 5 }
        ],
        minimumAction: { description: 'Move $0.50 to savings', duration: 1 }
    }
];

/**
 * Data Manager - handles all CRUD operations
 */
const DataManager = {

    /**
     * Load all data from localStorage
     */
    load() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) {
            return { experiments: [], labs: [] };
        }
        try {
            return JSON.parse(raw);
        } catch {
            return { experiments: [], labs: [] };
        }
    },

    /**
     * Save all data to localStorage
     */
    save(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    /**
     * Get all active experiments
     */
    getExperiments() {
        const data = this.load();
        return data.experiments.filter(e => e.status === 'active');
    },

    /**
     * Get a single experiment by ID
     */
    getExperiment(id) {
        const data = this.load();
        return data.experiments.find(e => e.id === id);
    },

    /**
     * Create a new experiment
     */
    createExperiment(experiment) {
        const data = this.load();
        const newExp = {
            id: this.generateId(),
            ...experiment,
            status: 'active',
            entries: [],
            reflections: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.experiments.push(newExp);
        this.save(data);
        return newExp;
    },

    /**
     * Update an experiment
     */
    updateExperiment(id, updates) {
        const data = this.load();
        const index = data.experiments.findIndex(e => e.id === id);
        if (index !== -1) {
            data.experiments[index] = {
                ...data.experiments[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.save(data);
            return data.experiments[index];
        }
        return null;
    },

    /**
     * Archive an experiment
     */
    archiveExperiment(id) {
        return this.updateExperiment(id, { status: 'archived' });
    },

    /**
     * Delete an experiment
     */
    deleteExperiment(id) {
        const data = this.load();
        data.experiments = data.experiments.filter(e => e.id !== id);
        this.save(data);
    },

    /**
     * Add a check-in entry
     */
    addEntry(experimentId, entry) {
        const data = this.load();
        const exp = data.experiments.find(e => e.id === experimentId);
        if (exp) {
            // Remove existing entry for same date
            exp.entries = exp.entries.filter(e => e.date !== entry.date);
            exp.entries.push({
                id: this.generateId(),
                ...entry,
                createdAt: new Date().toISOString()
            });
            this.save(data);
            return exp;
        }
        return null;
    },

    /**
     * Update an existing entry
     */
    updateEntry(experimentId, entryId, updates) {
        const data = this.load();
        const exp = data.experiments.find(e => e.id === experimentId);
        if (exp) {
            const entryIndex = exp.entries.findIndex(e => e.id === entryId);
            if (entryIndex !== -1) {
                exp.entries[entryIndex] = {
                    ...exp.entries[entryIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                this.save(data);
                return exp.entries[entryIndex];
            }
        }
        return null;
    },

    /**
     * Delete an entry
     */
    deleteEntry(experimentId, entryId) {
        const data = this.load();
        const exp = data.experiments.find(e => e.id === experimentId);
        if (exp) {
            exp.entries = exp.entries.filter(e => e.id !== entryId);
            this.save(data);
            return true;
        }
        return false;
    },

    /**
     * Add a reflection
     */
    addReflection(experimentId, reflection) {
        const data = this.load();
        const exp = data.experiments.find(e => e.id === experimentId);
        if (exp) {
            exp.reflections.push({
                id: this.generateId(),
                ...reflection,
                createdAt: new Date().toISOString()
            });
            this.save(data);
            return exp;
        }
        return null;
    },

    /**
     * Get all labs
     */
    getLabs() {
        const data = this.load();
        return data.labs || [];
    },

    /**
     * Create a lab
     */
    createLab(name) {
        const data = this.load();
        if (!data.labs) data.labs = [];
        const lab = { id: this.generateId(), name };
        data.labs.push(lab);
        this.save(data);
        return lab;
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    },

    /**
     * Get templates
     */
    getTemplates() {
        return TEMPLATES;
    },

    /**
     * Get all categories (default + custom)
     */
    getCategories() {
        const custom = JSON.parse(localStorage.getItem('experiments_categories') || '[]');
        const defaultCategories = ['Health', 'Work', 'Parenting', 'Relationships', 'Learning', 'Hobbies', 'Emotions', 'Money'];

        // Merge and deduplicate
        const allCategories = [...new Set([...defaultCategories, ...custom])];
        return allCategories;
    },

    /**
     * Add a custom category
     */
    addCategory(name) {
        const custom = JSON.parse(localStorage.getItem('experiments_categories') || '[]');
        const trimmed = name.trim();

        if (!trimmed || custom.includes(trimmed)) {
            return false;
        }

        custom.push(trimmed);
        localStorage.setItem('experiments_categories', JSON.stringify(custom));
        return true;
    },

    /**
     * Delete a custom category
     */
    deleteCategory(name) {
        const custom = JSON.parse(localStorage.getItem('experiments_categories') || '[]');
        const filtered = custom.filter(c => c !== name);
        localStorage.setItem('experiments_categories', JSON.stringify(filtered));
        return true;
    }
};

// NOTE: StreakCalculator is defined in streak.js with full functionality
// including getStreakStatus, calculateEarnedSkipDays, canUseSkipDay, etc.
