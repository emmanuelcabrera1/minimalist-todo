/**
 * Todo List Application
 * A premium, localStorage-backed todo list with filtering capabilities.
 */

// ===========================
// Constants & State
// ===========================
const LOCAL_STORAGE_KEY = 'todoListTasks';

let tasks = [];
let currentFilter = 'all';

// ===========================
// DOM Elements
// ===========================
const dateDisplayEl = document.getElementById('dateDisplay');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const taskListEl = document.getElementById('taskList');
const emptyStateEl = document.getElementById('emptyState');
const taskCountEl = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===========================
// Utility Functions
// ===========================

/**
 * Generates a unique ID for a task.
 * @returns {string} A unique identifier.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Formats the current date for display.
 * @returns {string} Formatted date string (e.g., "Tuesday, January 6, 2026").
 */
function formatDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

/**
 * Escapes HTML to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===========================
// LocalStorage
// ===========================

/**
 * Loads tasks from localStorage.
 */
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        tasks = storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        tasks = [];
    }
}

/**
 * Saves tasks to localStorage.
 */
function saveTasks() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
    }
}

// ===========================
// Task CRUD Operations
// ===========================

/**
 * Adds a new task.
 * @param {string} text - The task description.
 */
function addTask(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newTask = {
        id: generateId(),
        text: trimmedText,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask); // Add to beginning
    saveTasks();
    renderTasks();
}

/**
 * Toggles the completion status of a task.
 * @param {string} id - The task ID.
 */
function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

/**
 * Deletes a task with animation.
 * @param {string} id - The task ID.
 */
function deleteTask(id) {
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    if (taskItem) {
        taskItem.classList.add('removing');
        taskItem.addEventListener('animationend', () => {
            tasks = tasks.filter((t) => t.id !== id);
            saveTasks();
            renderTasks();
        }, { once: true });
    } else {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        renderTasks();
    }
}

/**
 * Clears all completed tasks.
 */
function clearCompleted() {
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    renderTasks();
}

// ===========================
// Filtering
// ===========================

/**
 * Filters tasks based on the current filter.
 * @returns {Array} The filtered tasks.
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter((t) => !t.completed);
        case 'completed':
            return tasks.filter((t) => t.completed);
        default:
            return tasks;
    }
}

/**
 * Sets the active filter and re-renders.
 * @param {string} filter - The filter type ('all', 'active', 'completed').
 */
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach((btn) => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
    renderTasks();
}

// ===========================
// Rendering
// ===========================

/**
 * Renders the task list to the DOM.
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    const activeTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    // Update task count
    taskCountEl.textContent = activeTasks.length;

    // Update clear button state
    clearCompletedBtn.disabled = completedTasks.length === 0;

    // Show/hide empty state
    if (filteredTasks.length === 0) {
        emptyStateEl.classList.add('visible');
        taskListEl.innerHTML = '';
    } else {
        emptyStateEl.classList.remove('visible');
        taskListEl.innerHTML = filteredTasks.map(createTaskHTML).join('');
    }
}

/**
 * Creates the HTML for a single task item.
 * @param {Object} task - The task object.
 * @returns {string} The HTML string.
 */
function createTaskHTML(task) {
    const completedClass = task.completed ? 'completed' : '';
    const escapedText = escapeHTML(task.text);

    return `
    <li class="task-item ${completedClass}" data-id="${task.id}">
      <label class="custom-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}" />
        <span class="checkmark"></span>
      </label>
      <span class="task-text">${escapedText}</span>
      <button class="delete-btn" aria-label="Delete task">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </li>
  `;
}

// ===========================
// Event Listeners
// ===========================

/**
 * Initializes all event listeners.
 */
function initEventListeners() {
    // Form submission
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value);
        taskInput.value = '';
        taskInput.focus();
    });

    // Task list delegation for checkbox and delete
    taskListEl.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.dataset.id;

        // Checkbox toggle
        if (e.target.matches('input[type="checkbox"]')) {
            toggleTask(taskId);
        }

        // Delete button
        if (e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        }
    });

    // Filter buttons
    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

// ===========================
// Initialization
// ===========================

/**
 * Initializes the application.
 */
function init() {
    dateDisplayEl.textContent = formatDate();
    loadTasks();
    renderTasks();
    initEventListeners();
}

// Run on DOM ready
init();
