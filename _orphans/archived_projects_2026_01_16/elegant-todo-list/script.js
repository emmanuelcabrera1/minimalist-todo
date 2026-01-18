/**
 * Elegant Todo List - Logic
 * Handles state management, DOM manipulation, and LocalStorage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');

    // State
    let todos = [];

    // Initialize
    loadTodos();

    // Event Listeners
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    /**
     * Adds a new todo item to the state and UI
     */
    function addTodo() {
        const text = todoInput.value.trim();

        if (text === '') return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false
        };

        todos.unshift(todo); // Add to top
        saveTodos();
        renderTodo(todo, true); // True for 'newly added' animation

        todoInput.value = '';
        todoInput.focus();
    }

    /**
     * Toggles the completed status of a todo
     * @param {number} id - The ID of the todo item
     */
    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();

        // Update UI without full re-render for performance/smoothness
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.toggle('completed');
            const checkbox = item.querySelector('.checkbox');
            checkbox.checked = !checkbox.checked;
        }
    }

    /**
     * Deletes a todo item
     * @param {number} id - The ID of the todo to delete
     */
    function deleteTodo(id) {
        // Find element to animate out
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'slideOut 0.3s ease forwards';

            // Wait for animation to finish before removing from state/DOM
            item.addEventListener('animationend', () => {
                todos = todos.filter(todo => todo.id !== id);
                saveTodos();
                item.remove();
            });
        }
    }

    /**
     * Renders a single todo item to the list
     * @param {Object} todo - The todo object
     * @param {boolean} isNew - Whether this is a new item (for clear list check)
     */
    function renderTodo(todo, isNew = false) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);

        // Safe HTML construction
        li.innerHTML = `
            <div class="todo-content">
                <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark task as complete">
                <span class="task-text">${escapeHtml(todo.text)}</span>
            </div>
            <button class="delete-btn" aria-label="Delete task">&times;</button>
        `;

        // Event Listeners for this specific item (Event Delegation approach)
        const checkbox = li.querySelector('.checkbox');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        // Also toggle when clicking task text
        const taskText = li.querySelector('.task-text');
        taskText.addEventListener('click', (e) => {
            // Prevent triggering if selecting text
            toggleTodo(todo.id);
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling
            deleteTodo(todo.id);
        });

        if (isNew) {
            todoList.prepend(li);
        } else {
            todoList.appendChild(li);
        }
    }

    /**
     * Helper to load todos from LocalStorage
     */
    function loadTodos() {
        const stored = localStorage.getItem('elegant-todos');
        if (stored) {
            todos = JSON.parse(stored);
            todoList.innerHTML = ''; // Clear current
            todos.forEach(todo => renderTodo(todo));
        }
    }

    /**
     * Helper to save todos to LocalStorage
     */
    function saveTodos() {
        localStorage.setItem('elegant-todos', JSON.stringify(todos));
    }

    /**
     * Security helper to prevent XSS
     * @param {string} unsafe - Unsafe string
     * @return {string} - Safe string
     */
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
