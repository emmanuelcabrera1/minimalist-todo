document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const dateDisplay = document.getElementById('dateDisplay');
    const itemsLeftElement = document.getElementById('itemsLeft');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialization
    function init() {
        updateDate();
        renderTasks();
        setupEventListeners();
    }

    // Set Date
    function updateDate() {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Event Listeners
    function setupEventListeners() {
        // Add Task
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Filter Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Logic
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
    }

    // Core Logic: Add Task
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask); // Add to top
        saveTasks();
        renderTasks();
        taskInput.value = '';
    }

    // Core Logic: Toggle Completion
    window.toggleTask = (id) => {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    };

    // Core Logic: Delete Task
    window.deleteTask = (id) => {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.style.animation = 'slideOut 0.4s ease-out forwards';
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
            }, 300); // Wait for animation
        } else {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    };

    // Persistence
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Rendering
    function renderTasks() {
        taskList.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <div class="task-content">
                    <div class="custom-checkbox" onclick="toggleTask(${task.id})"></div>
                    <span class="task-text">${escapeHtml(task.text)}</span>
                </div>
                <button class="delete-btn" onclick="deleteTask(${task.id})" aria-label="Delete task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            taskList.appendChild(li);
        });

        updateStats();
    }

    function updateStats() {
        const activeCount = tasks.filter(t => !t.completed).length;
        itemsLeftElement.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    // Utility
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    init();
});
