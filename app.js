// ==========================================
// MINIMALIST TODO APP - REACT LOGIC (FIXED)
// ==========================================

const { useState, useEffect } = React;

// ========== STORAGE HELPERS ==========
const STORAGE_KEYS = {
    TASKS: 'minimalist-todo-tasks',
    GROUPS: 'minimalist-todo-groups'
};

// Generate unique ID to prevent collisions (timestamp + random)
const generateUniqueId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
};

const loadFromStorage = (key, fallback) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return fallback;
    }
};

const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
};

// ========== DATA ==========
const INITIAL_TASKS = [
    { id: 1, text: 'Read clean code principles', completed: false },
    { id: 2, text: 'Review system architecture', completed: false },
    { id: 3, text: 'Meditate for 15 mins', completed: false }
];

const INITIAL_GROUPS = [
    { id: 1, name: 'Work', count: 5, color: '#34C759' },
    { id: 2, name: 'Personal', count: 3, color: '#007AFF' },
    { id: 3, name: 'Groceries', count: 2, color: '#FF9500' }
];

// ========== COMPONENTS ==========

// Task Item Component
function TaskItem({ task, onToggle, onDelete }) {
    return (
        <div className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div
                className={`checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => onToggle(task.id)}
                role="checkbox"
                aria-checked={task.completed}
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && onToggle(task.id)}
            />
            <div className="task-text">{task.text}</div>
            <button
                className="delete-btn"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete task: ${task.text}`}
            >
                ×
            </button>
        </div>
    );
}

// Group Item Component
function GroupItem({ group, onDelete }) {
    return (
        <div className="group-item">
            <div className="group-content">
                <div className="group-name">{group.name}</div>
                <div className="group-count">{group.count} {group.count === 1 ? 'task' : 'tasks'}</div>
            </div>
            <button
                className="delete-btn"
                onClick={() => onDelete(group.id)}
                aria-label={`Delete group: ${group.name}`}
            >
                ×
            </button>
        </div>
    );
}

// Add Task Form
function AddTaskForm({ onAdd }) {
    const [text, setText] = useState('');
    const MAX_LENGTH = 500;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (trimmed && trimmed.length <= MAX_LENGTH) {
            onAdd(trimmed);
            setText('');
        }
    };

    return (
        <form className="add-form" onSubmit={handleSubmit}>
            <label htmlFor="task-input" className="visually-hidden">Add new task</label>
            <input
                id="task-input"
                type="text"
                className="add-input"
                placeholder="Add a new task..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_LENGTH}
            />
            <button type="submit" className="add-btn" aria-label="Add task">+</button>
        </form>
    );
}

// Add Group Form
function AddGroupForm({ onAdd }) {
    const [name, setName] = useState('');
    const MAX_LENGTH = 100;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed && trimmed.length <= MAX_LENGTH) {
            onAdd(trimmed);
            setName('');
        }
    };

    return (
        <form className="add-form" onSubmit={handleSubmit}>
            <label htmlFor="group-input" className="visually-hidden">Add new list</label>
            <input
                id="group-input"
                type="text"
                className="add-input"
                placeholder="Add a new list..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_LENGTH}
            />
            <button type="submit" className="add-btn" aria-label="Add list">+</button>
        </form>
    );
}

// Today View Component
function TodayView({ tasks, onToggle, onDelete, onAdd }) {
    return (
        <>
            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                />
            ))}
            <AddTaskForm onAdd={onAdd} />
        </>
    );
}

// Lists View Component
function ListsView({ groups, onDelete, onAdd }) {
    return (
        <>
            {groups.map(group => (
                <GroupItem
                    key={group.id}
                    group={group}
                    onDelete={onDelete}
                />
            ))}
            <AddGroupForm onAdd={onAdd} />
        </>
    );
}

// Today Container Component
function TodayContainer() {
    const [tasks, setTasks] = useState(() =>
        loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS)
    );

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
    }, [tasks]);

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
        console.log('[Task] Toggled task:', id);
    };

    const addTask = (text) => {
        const newTask = {
            id: generateUniqueId(),
            text: text,
            completed: false
        };
        setTasks([...tasks, newTask]);
        console.log('[Task] Added new task:', newTask);
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
        console.log('[Task] Deleted task:', id);
    };

    return (
        <TodayView
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAdd={addTask}
        />
    );
}

// Groups Container Component
function GroupsContainer() {
    const [groups, setGroups] = useState(() =>
        loadFromStorage(STORAGE_KEYS.GROUPS, INITIAL_GROUPS)
    );

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.GROUPS, groups);
    }, [groups]);

    const addGroup = (name) => {
        const newGroup = {
            id: generateUniqueId(),
            name: name,
            count: 0,
            color: '#34C759'
        };
        setGroups([...groups, newGroup]);
        console.log('[Group] Added new group:', newGroup);
    };

    const deleteGroup = (id) => {
        setGroups(groups.filter(group => group.id !== id));
        console.log('[Group] Deleted group:', id);
    };

    return (
        <ListsView
            groups={groups}
            onDelete={deleteGroup}
            onAdd={addGroup}
        />
    );
}

// ========== VANILLA JS LAYER CONTROL ==========
let currentLayer = 1;
let isMenuOpen = false;

function switchLayer(layerId) {
    currentLayer = layerId;

    const layer1 = document.getElementById('view-layer-1');
    const layer2 = document.getElementById('view-layer-2');

    if (layerId === 1) {
        layer1.classList.add('view-active');
        layer1.classList.remove('view-hidden');
        layer2.classList.add('view-hidden');
        layer2.classList.remove('view-active');
    } else {
        layer2.classList.add('view-active');
        layer2.classList.remove('view-hidden');
        layer1.classList.add('view-hidden');
        layer1.classList.remove('view-active');
    }
}

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const menu = document.getElementById('bottom-menu');

    if (isMenuOpen) {
        menu.classList.add('open');
    } else {
        menu.classList.remove('open');
    }
}

// ========== RENDER (FIXED: Two separate roots, no portals) ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App Init] DOM Content Loaded - Starting React initialization...');

    try {
        // Verify React is loaded
        if (typeof React === 'undefined') {
            throw new Error('React library not loaded');
        }
        if (typeof ReactDOM === 'undefined') {
            throw new Error('ReactDOM library not loaded');
        }
        console.log('[App Init] React libraries verified ✓');

        // Render Today view
        const todayContainer = document.getElementById('today-list');
        if (todayContainer) {
            console.log('[App Init] Rendering TodayContainer...');
            const todayRoot = ReactDOM.createRoot(todayContainer);
            todayRoot.render(<TodayContainer />);
            console.log('[App Init] TodayContainer rendered ✓');
        } else {
            console.error('[App Error] today-list container not found!');
        }

        // Render Groups view
        const groupsContainer = document.getElementById('groups-list');
        if (groupsContainer) {
            console.log('[App Init] Rendering GroupsContainer...');
            const groupsRoot = ReactDOM.createRoot(groupsContainer);
            groupsRoot.render(<GroupsContainer />);
            console.log('[App Init] GroupsContainer rendered ✓');
        } else {
            console.error('[App Error] groups-list container not found!');
        }

        console.log('[App Init] ✅ Application initialized successfully!');
    } catch (error) {
        console.error('[App Error] ❌ Failed to initialize application:', error);
        console.error('[App Error] Stack trace:', error.stack);
        // Display user-friendly error
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,59,48,0.9);color:white;padding:20px;border-radius:12px;text-align:center;z-index:9999;';
        errorMsg.innerHTML = `<strong>App Error</strong><br>Failed to load. Check console for details.<br><small>${error.message}</small>`;
        document.body.appendChild(errorMsg);
    }
});
