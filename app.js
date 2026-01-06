// ==========================================
// MINIMALIST TODO APP - REACT LOGIC
// ==========================================

const { useState, useEffect } = React;

// ========== DATA ==========
const INITIAL_TASKS = [
    { id: 1, text: 'Read clean code principles', completed: false },
    { id: 2, text: 'Review system architecture', completed: false },
    { id: 3, text: 'Meditate for 15 mins', completed: false }
];

const LIST_GROUPS = [
    { id: 1, name: 'Work', count: 5, color: '#34C759' },
    { id: 2, name: 'Personal', count: 3, color: '#007AFF' },
    { id: 3, name: 'Groceries', count: 2, color: '#FF9500' }
];

// ========== COMPONENTS ==========

// Task Item Component
function TaskItem({ task, onToggle }) {
    return (
        <div className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div
                className={`checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => onToggle(task.id)}
            />
            <div className="task-text">{task.text}</div>
        </div>
    );
}

// Group Item Component
function GroupItem({ group }) {
    return (
        <div className="group-item">
            <div className="group-name">{group.name}</div>
            <div className="group-count">{group.count} {group.count === 1 ? 'task' : 'tasks'}</div>
        </div>
    );
}

// Main App Component
function App() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [groups] = useState(LIST_GROUPS);

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    return (
        <>
            {/* Layer 1: Today List */}
            <div id="today-tasks">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} />
                ))}
            </div>

            {/* Layer 2: Groups */}
            <div id="groups-content" style={{ display: 'none' }}>
                {groups.map(group => (
                    <GroupItem key={group.id} group={group} />
                ))}
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
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Render React component for Today tasks
    const todayContainer = document.getElementById('today-list');
    const root1 = ReactDOM.createRoot(todayContainer);
    root1.render(<App />);

    // Render React component for Groups
    const groupsContainer = document.getElementById('groups-list');
    const root2 = ReactDOM.createRoot(groupsContainer);

    const GroupsList = () => {
        return (
            <>
                {LIST_GROUPS.map(group => (
                    <GroupItem key={group.id} group={group} />
                ))}
            </>
        );
    };

    root2.render(<GroupsList />);
});
