// ==========================================
// MINIMALIST TODO APP - REACT LOGIC (WITH CRUD)
// ==========================================

const { useState, useEffect } = React;

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
            />
            <div className="task-text">{task.text}</div>
            <button className="delete-btn" onClick={() => onDelete(task.id)}>×</button>
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
            <button className="delete-btn" onClick={() => onDelete(group.id)}>×</button>
        </div>
    );
}

// Add Task Form
function AddTaskForm({ onAdd }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onAdd(text.trim());
            setText('');
        }
    };

    return (
        <form className="add-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="add-input"
                placeholder="Add a new task..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="add-btn">+</button>
        </form>
    );
}

// Add Group Form
function AddGroupForm({ onAdd }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd(name.trim());
            setName('');
        }
    };

    return (
        <form className="add-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="add-input"
                placeholder="Add a new list..."
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="add-btn">+</button>
        </form>
    );
}

// Main App Component
function App() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [groups, setGroups] = useState(INITIAL_GROUPS);

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const addTask = (text) => {
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };
        setTasks([...tasks, newTask]);
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const addGroup = (name) => {
        const newGroup = {
            id: Date.now(),
            name: name,
            count: 0,
            color: '#34C759'
        };
        setGroups([...groups, newGroup]);
    };

    const deleteGroup = (id) => {
        setGroups(groups.filter(group => group.id !== id));
    };

    return (
        <>
            {/* Layer 1: Today List */}
            <div id="today-tasks">
                {tasks.map(task => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                    />
                ))}
                <AddTaskForm onAdd={addTask} />
            </div>

            {/* Layer 2: Groups */}
            <div id="groups-content" style={{ display: 'none' }}>
                {groups.map(group => (
                    <GroupItem
                        key={group.id}
                        group={group}
                        onDelete={deleteGroup}
                    />
                ))}
                <AddGroupForm onAdd={addGroup} />
            </div>
        </>
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

// ========== RENDER ==========
document.addEventListener('DOMContentLoaded', () => {
    const todayContainer = document.getElementById('today-list');
    const root1 = ReactDOM.createRoot(todayContainer);
    root1.render(<App />);

    const groupsContainer = document.getElementById('groups-list');
    const root2 = ReactDOM.createRoot(groupsContainer);
    root2.render(<App />);
});
