/**
 * Life Compass - Navigation System
 * ============================================
 * Handles tab bar navigation and module routing.
 */

const Navigation = {
    currentModule: 'tasks',
    modules: ['tasks', 'habits', 'experiments', 'mood', 'life'],
    history: [],
    views: {},

    /**
     * Initialize navigation
     */
    init() {
        this.bindEvents();
        this.loadFromHash();
    },

    /**
     * Bind navigation event listeners
     */
    bindEvents() {
        // Tab bar clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const module = item.dataset.module;
                this.navigateTo(module);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.module) {
                this.loadModule(e.state.module, false);
            }
        });
    },

    /**
     * Load module from URL hash
     */
    loadFromHash() {
        const hash = window.location.hash.slice(1);
        const module = this.modules.includes(hash) ? hash : 'tasks';
        this.loadModule(module, false);
    },

    /**
     * Navigate to a module
     * @param {string} module - Module name
     */
    navigateTo(module) {
        if (!this.modules.includes(module)) {
            console.error(`[Nav] Unknown module: ${module}`);
            return;
        }

        if (module === this.currentModule) {
            // Scroll to top on same tab click
            this.scrollToTop();
            return;
        }

        this.loadModule(module, true);
    },

    /**
     * Load a module's content
     * @param {string} module - Module name
     * @param {boolean} updateHistory - Whether to push to browser history
     */
    loadModule(module, updateHistory = true) {
        // Update current
        this.currentModule = module;

        // Update URL
        if (updateHistory) {
            history.pushState({ module }, '', `#${module}`);
        }

        // Update tab bar
        document.querySelectorAll('.nav-item').forEach(item => {
            const isActive = item.dataset.module === module;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        // Render module content
        this.renderModule(module);

        // Haptic feedback
        Utils.haptic('light');
    },

    /**
     * Render a module's content
     * @param {string} module - Module name
     */
    async renderModule(module) {
        const main = document.getElementById('main-content');

        // Show loading state
        main.innerHTML = `
            <div class="loading-state flex items-center justify-center" style="min-height: 60vh;">
                ${Components.spinner()}
            </div>
        `;

        try {
            // Call module's render function
            let content = '';

            switch (module) {
                case 'tasks':
                    content = await TasksView.render();
                    break;
                case 'habits':
                    content = await HabitsToday.render();
                    break;
                case 'experiments':
                    content = await ExperimentsLab.render();
                    break;
                case 'mood':
                    content = await MoodEntry.render();
                    break;
                case 'life':
                    content = await LifeGrid.render();
                    break;
                default:
                    content = this.renderPlaceholder(module);
            }

            // Animate in
            main.innerHTML = content;
            main.classList.add('animate-fadeIn');

            // Initialize module after render
            this.initModule(module);

        } catch (error) {
            console.error(`[Nav] Error rendering ${module}:`, error);
            main.innerHTML = this.renderError(module, error);
        }
    },

    /**
     * Initialize a module after render
     * @param {string} module - Module name
     */
    initModule(module) {
        switch (module) {
            case 'tasks':
                TasksView.init?.();
                break;
            case 'habits':
                HabitsToday.init?.();
                break;
            case 'experiments':
                ExperimentsLab.init?.();
                break;
            case 'mood':
                MoodEntry.init?.();
                break;
            case 'life':
                LifeGrid.init?.();
                break;
        }
    },

    /**
     * Render placeholder for modules not yet implemented
     * @param {string} module - Module name
     * @returns {string} HTML string
     */
    renderPlaceholder(module) {
        const icons = {
            tasks: '📋',
            habits: '✓',
            experiments: '🧪',
            mood: '😊',
            life: '📅'
        };

        const titles = {
            tasks: 'Tasks',
            habits: 'Habits',
            experiments: 'Lab',
            mood: 'Mood',
            life: 'Life'
        };

        return `
            <div class="screen-header">
                <h1 class="screen-title">${titles[module]}</h1>
            </div>
            ${Components.emptyState(
            icons[module],
            'Coming Soon',
            `The ${titles[module]} module is being built. Check back soon!`
        )}
        `;
    },

    /**
     * Render error state
     * @param {string} module - Module name
     * @param {Error} error - Error object
     * @returns {string} HTML string
     */
    renderError(module, error) {
        return Components.emptyState(
            '⚠️',
            'Something went wrong',
            `Unable to load ${module}. ${error.message}`,
            'Retry',
            `Navigation.loadModule('${module}')`
        );
    },

    /**
     * Scroll main content to top
     */
    scrollToTop() {
        const main = document.getElementById('main-content');
        main.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Push a sub-view onto the navigation stack
     * @param {string} viewName - View identifier
     * @param {Function} renderFn - Function that returns view HTML
     */
    pushView(viewName, renderFn) {
        this.history.push({
            module: this.currentModule,
            scrollPosition: document.getElementById('main-content').scrollTop
        });

        this.views[viewName] = renderFn;

        const main = document.getElementById('main-content');
        main.classList.remove('animate-fadeIn');
        main.classList.add('page-enter');
        main.innerHTML = renderFn();
    },

    /**
     * Pop back to previous view
     */
    popView() {
        if (this.history.length === 0) {
            return;
        }

        const previous = this.history.pop();
        const main = document.getElementById('main-content');

        main.classList.remove('page-enter');
        main.classList.add('page-exit-back');

        setTimeout(() => {
            this.renderModule(previous.module);
            main.scrollTop = previous.scrollPosition;
            main.classList.remove('page-exit-back');
        }, 300);
    },

    /**
     * Check if we can go back
     * @returns {boolean}
     */
    canGoBack() {
        return this.history.length > 0;
    }
};

// Make Navigation globally available
window.Navigation = Navigation;
