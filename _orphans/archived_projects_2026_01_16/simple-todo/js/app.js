/**
 * Simple Todo App
 * Core application logic with localStorage persistence
 */

// =========================
// State Management
// =========================

const STORAGE_KEY = 'simple-todo-items';

/**
 * Application state
 * @type {{ todos: Array<{id: string, text: string, completed: boolean}>, filter: string }}
 */
let state = {
    todos: [],
    filter: 'all' // 'all' | 'active' | 'completed'
};

// =========================
// DOM References
// =========================

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const todoFooter = document.getElementById('todoFooter');
const todoCount = document.getElementById('todoCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// =========================
// Core Functions
// =========================

/**
 * Generates a unique ID for new todos
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Adds a new todo item
 * @param {string} text - The todo text
 */
function addTodo(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newTodo = {
        id: generateId(),
        text: trimmedText,
        completed: false
    };

    state.todos.unshift(newTodo);
    saveToStorage();
    render();
}

/**
 * Toggles the completed status of a todo
 * @param {string} id - The todo ID
 */
function toggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveToStorage();
        render();
    }
}

/**
 * Deletes a todo item
 * @param {string} id - The todo ID
 */
function deleteTodo(id) {
    state.todos = state.todos.filter(t => t.id !== id);
    saveToStorage();
    render();
}

/**
 * Sets the current filter
 * @param {'all' | 'active' | 'completed'} filter - The filter type
 */
function setFilter(filter) {
    state.filter = filter;

    // Update active state on filter buttons
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    render();
}

/**
 * Clears all completed todos
 */
function clearCompleted() {
    state.todos = state.todos.filter(t => !t.completed);
    saveToStorage();
    render();
}

/**
 * Gets filtered todos based on current filter
 * @returns {Array} Filtered todos
 */
function getFilteredTodos() {
    switch (state.filter) {
        case 'active':
            return state.todos.filter(t => !t.completed);
        case 'completed':
            return state.todos.filter(t => t.completed);
        default:
            return state.todos;
    }
}

// =========================
// Rendering
// =========================

/**
 * Creates HTML for a single todo item
 * @param {{ id: string, text: string, completed: boolean }} todo 
 * @returns {string} HTML string
 */
function createTodoHTML(todo) {
    return `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                aria-label="Mark as ${todo.completed ? 'incomplete' : 'complete'}"
            >
            <span class="todo-text">${escapeHTML(todo.text)}</span>
            <button class="btn-delete" aria-label="Delete todo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </li>
    `;
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text 
 * @returns {string} Escaped HTML
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Renders the todo list and updates UI
 */
function render() {
    const filteredTodos = getFilteredTodos();
    const activeCount = state.todos.filter(t => !t.completed).length;
    const completedCount = state.todos.filter(t => t.completed).length;

    // Render todo list
    if (filteredTodos.length === 0) {
        const emptyMessage = state.filter === 'all'
            ? 'No todos yet. Add one above!'
            : state.filter === 'active'
                ? 'No active todos.'
                : 'No completed todos.';

        todoList.innerHTML = `
            <li class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p>${emptyMessage}</p>
            </li>
        `;
    } else {
        todoList.innerHTML = filteredTodos.map(createTodoHTML).join('');
    }

    // Update count
    todoCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

    // Show/hide footer based on todos existence
    todoFooter.classList.toggle('hidden', state.todos.length === 0);

    // Show/hide clear completed button
    clearCompletedBtn.style.visibility = completedCount > 0 ? 'visible' : 'hidden';
}

// =========================
// Persistence
// =========================

/**
 * Saves todos to localStorage
 */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

/**
 * Loads todos from localStorage
 */
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state.todos = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
        state.todos = [];
    }
}

// =========================
// Event Handlers
// =========================

/**
 * Handles form submission
 * @param {Event} e 
 */
function handleSubmit(e) {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = '';
    todoInput.focus();
}

/**
 * Handles clicks on the todo list (event delegation)
 * @param {Event} e 
 */
function handleListClick(e) {
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;

    const id = todoItem.dataset.id;

    // Checkbox click
    if (e.target.classList.contains('todo-checkbox')) {
        toggleTodo(id);
        return;
    }

    // Delete button click
    if (e.target.closest('.btn-delete')) {
        deleteTodo(id);
        return;
    }
}

/**
 * Handles filter button clicks
 * @param {Event} e 
 */
function handleFilterClick(e) {
    if (e.target.classList.contains('filter-btn')) {
        setFilter(e.target.dataset.filter);
    }
}

// =========================
// Initialization
// =========================

function init() {
    // Load saved todos
    loadFromStorage();

    // Set up event listeners
    todoForm.addEventListener('submit', handleSubmit);
    todoList.addEventListener('click', handleListClick);
    document.querySelector('.filters').addEventListener('click', handleFilterClick);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Initial render
    render();

    console.log('Simple Todo App Initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
