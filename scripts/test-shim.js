const fs = require('fs');
const path = require('path');

// Mock localStorage
const store = {};
global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; }
};

// Mock window
global.window = {
    App: {
        showToast: (msg) => console.log('[TOAST]:', msg)
    }
};

// Helper to load file content
function loadScript(relativePath) {
    const fullPath = path.join('/app/HTML_Apps_Workspace/projects/experiments-web', relativePath);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Patch for Node environment: make consts global
    content = content.replace('const TodoManager =', 'global.TodoManager =');
    content = content.replace('const TodoTests =', 'global.TodoTests =');

    eval.apply(global, [content]);
}

try {
    console.log('--- Loading Scripts ---');
    loadScript('js/todo.js');
    console.log('--- Loading Tests ---');
    loadScript('tests/unit/todo.test.js');
    console.log('--- Running Tests ---');

    // Ensure TodoTests exists
    if (typeof TodoTests === 'undefined') {
        throw new Error('TodoTests not loaded correctly');
    }

    const results = TodoTests.runAll();

    if (results.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
} catch (err) {
    console.error('Test Execution Failed:', err);
    process.exit(1);
}
