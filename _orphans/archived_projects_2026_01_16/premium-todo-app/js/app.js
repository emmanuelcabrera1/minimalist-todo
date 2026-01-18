/**
 * Premium Todo App - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');

    let tasks = loadTasks();

    renderTasks();

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    todoList.addEventListener('click', handleTaskAction);

    // Functions

    function addTask() {
        const text = todoInput.value.trim();
        if (text === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        todoInput.value = '';
    }

    function handleTaskAction(e) {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        const id = Number(item.dataset.id);

        if (e.target.closest('.delete-btn')) {
            deleteTask(id);
        } else if (e.target.closest('.checkbox-btn')) {
            toggleTask(id);
        }
    }

    function toggleTask(id) {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('premium_todo_tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const stored = localStorage.getItem('premium_todo_tasks');
        return stored ? JSON.parse(stored) : [];
    }

    function renderTasks() {
        todoList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.style.display = 'block';
            todoList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            todoList.style.display = 'block';

            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `todo-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;

                li.innerHTML = `
                    <button class="checkbox-btn" aria-label="Toggle completion">
                        <span class="checkbox-icon"></span>
                    </button>
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <button class="delete-btn" aria-label="Delete task">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                `;
                todoList.appendChild(li);
            });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
