/**
 * World-Class Todo Application
 * Premium vanilla JS todo with localStorage persistence
 * @author Antigravity
 */

// ==================== CONFIGURATION ====================

const STORAGE_KEY = 'world-class-todo-tasks';
const MAX_TASK_LENGTH = 200;

// ==================== STATE ====================

let tasks = [];
let currentFilter = 'all';

// ==================== DOM ELEMENTS ====================

const elements = {
    form: null,
    input: null,
    taskList: null,
    emptyState: null,
    footer: null,
    progressFill: null,
    progressText: null,
    progressPercent: null,
    itemsLeft: null,
    clearCompleted: null,
    dateDisplay: null,
    filterTabs: null,
};

// ==================== INITIALIZATION ====================

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    loadTasks();
    setupEventListeners();
    displayDate();
    render();
    console.log('[TodoApp] ✅ Initialized successfully');
});

/**
 * Cache DOM element references for performance
 */
function cacheElements() {
    elements.form = document.getElementById('add-task-form');
    elements.input = document.getElementById('task-input');
    elements.taskList = document.getElementById('task-list');
    elements.emptyState = document.getElementById('empty-state');
    elements.footer = document.getElementById('app-footer');
    elements.progressFill = document.getElementById('progress-fill');
    elements.progressText = document.getElementById('progress-text');
    elements.progressPercent = document.getElementById('progress-percent');
    elements.itemsLeft = document.getElementById('items-left');
    elements.clearCompleted = document.getElementById('clear-completed');
    elements.dateDisplay = document.getElementById('date-display');
    elements.filterTabs = document.querySelectorAll('.filter-tab');
}

/**
 * Set up all event listeners using delegation where possible
 */
function setupEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleAddTask);

    // Task list interactions (event delegation)
    elements.taskList.addEventListener('click', handleTaskClick);

    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => setFilter(tab.dataset.filter));
    });

    // Clear completed button
    elements.clearCompleted.addEventListener('click', clearCompleted);
}

// ==================== TASK OPERATIONS ====================

/**
 * Generate a unique ID for tasks
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Handle form submission to add a new task
 * @param {Event} e - Submit event
 */
function handleAddTask(e) {
    e.preventDefault();

    const text = elements.input.value.trim();
    if (!text || text.length > MAX_TASK_LENGTH) return;

    const newTask = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: Date.now(),
    };

    tasks.unshift(newTask); // Add to beginning
    saveTasks();
    render();

    // Reset input
    elements.input.value = '';
    elements.input.focus();

    console.log('[TodoApp] Task added:', newTask.text);
}

/**
 * Handle clicks within the task list (delegation)
 * @param {Event} e - Click event
 */
function handleTaskClick(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;

    // Check if checkbox was clicked
    if (e.target.closest('.checkbox')) {
        toggleTask(taskId);
        return;
    }

    // Check if delete button was clicked
    if (e.target.closest('.delete-btn')) {
        deleteTask(taskId, taskItem);
        return;
    }
}

/**
 * Toggle task completion status
 * @param {string} id - Task ID
 */
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        render();
        console.log('[TodoApp] Task toggled:', task.text, '→', task.completed ? 'done' : 'active');
    }
}

/**
 * Delete a task with animation
 * @param {string} id - Task ID
 * @param {HTMLElement} element - Task DOM element
 */
function deleteTask(id, element) {
    // Add animation class
    element.classList.add('deleting');

    // Wait for animation before removing
    element.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
        console.log('[TodoApp] Task deleted');
    }, { once: true });
}

/**
 * Clear all completed tasks
 */
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
    console.log('[TodoApp] Cleared', completedCount, 'completed tasks');
}

// ==================== FILTERING ====================

/**
 * Set the current filter and re-render
 * @param {string} filter - Filter type: 'all', 'active', or 'completed'
 */
function setFilter(filter) {
    currentFilter = filter;

    // Update active tab
    elements.filterTabs.forEach(tab => {
        const isActive = tab.dataset.filter === filter;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });

    render();
}

/**
 * Get tasks based on current filter
 * @returns {Array} Filtered tasks
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// ==================== RENDERING ====================

/**
 * Main render function - updates all UI elements
 */
function render() {
    renderTasks();
    updateProgress();
    updateFooter();
    updateEmptyState();
}

/**
 * Render the task list
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    elements.taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div 
                class="checkbox ${task.completed ? 'checked' : ''}" 
                role="checkbox" 
                aria-checked="${task.completed}"
                tabindex="0"
                aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7L5.5 10.5L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button 
                class="delete-btn" 
                type="button" 
                aria-label="Delete task: ${escapeHtml(task.text)}"
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </li>
    `).join('');

    // Add keyboard support for checkboxes
    elements.taskList.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                checkbox.click();
            }
        });
    });
}

/**
 * Update progress bar and stats
 */
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${completed} of ${total} tasks completed`;
    elements.progressPercent.textContent = `${percent}%`;

    // Update ARIA
    const progressBar = elements.progressFill.parentElement;
    progressBar.setAttribute('aria-valuenow', percent);
}

/**
 * Update footer visibility and items left count
 */
function updateFooter() {
    const hasCompletedTasks = tasks.some(t => t.completed);
    const activeCount = tasks.filter(t => !t.completed).length;

    // Show footer only if there are tasks
    elements.footer.hidden = tasks.length === 0;

    // Update items left text
    elements.itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

    // Show/hide clear button based on completed tasks
    elements.clearCompleted.style.visibility = hasCompletedTasks ? 'visible' : 'hidden';
}

/**
 * Show/hide empty state
 */
function updateEmptyState() {
    const filteredTasks = getFilteredTasks();
    elements.emptyState.hidden = filteredTasks.length > 0;
}

// ==================== STORAGE ====================

/**
 * Save tasks to localStorage
 */
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('[TodoApp] Failed to save tasks:', error);
    }
}

/**
 * Load tasks from localStorage
 */
function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        tasks = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('[TodoApp] Failed to load tasks:', error);
        tasks = [];
    }
}

// ==================== UTILITIES ====================

/**
 * Display current date in header
 */
function displayDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    elements.dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
