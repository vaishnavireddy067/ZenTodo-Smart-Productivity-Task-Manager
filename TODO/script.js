document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const themeBtn = document.getElementById('theme-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // New Selectors
    const todoPriority = document.getElementById('todo-priority');
    const todoDate = document.getElementById('todo-date');
    const todoCategory = document.getElementById('todo-category');
    const searchInput = document.getElementById('search-input');
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');

    // State
    let todos = JSON.parse(localStorage.getItem('zen-todos')) || [];
    let currentFilter = 'all';
    let searchQuery = '';

    // Initialize
    const init = () => {
        render();
        setupTheme();
    };

    // Theme Logic
    const setupTheme = () => {
        const savedTheme = localStorage.getItem('zen-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('zen-theme', newTheme);
        updateThemeIcons(newTheme);
    };

    const updateThemeIcons = (theme) => {
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    };

    // Todo Logic
    const addTodo = (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        const priority = todoPriority.value;
        const date = todoDate.value;
        const category = todoCategory.value;

        if (text) {
            const newTodo = {
                id: Date.now(),
                text,
                completed: false,
                priority,
                date,
                category
            };
            todos.unshift(newTodo);
            saveAndRender();
            todoForm.reset(); // Reset all fields
        }
    };

    const toggleTodo = (id) => {
        todos = todos.map(todo => {
            if (todo.id === id) {
                const newState = !todo.completed;
                if (newState) triggerConfetti();
                return { ...todo, completed: newState };
            }
            return todo;
        });
        saveAndRender();
    };

    const editTodo = (id, newText) => {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, text: newText } : todo
        );
        saveAndRender();
    };

    const triggerConfetti = () => {
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#06b6d4', '#10b981']
            });
        }
    };

    const deleteTodo = (id) => {
        todos = todos.filter(todo => todo.id !== id);
        saveAndRender();
    };

    const clearCompleted = () => {
        todos = todos.filter(todo => !todo.completed);
        saveAndRender();
    };

    const saveAndRender = () => {
        localStorage.setItem('zen-todos', JSON.stringify(todos));
        render();
    };

    const filterTodos = () => {
        let filtered = todos;

        // Search Filter
        if (searchQuery) {
            filtered = filtered.filter(todo =>
                todo.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status Filter
        if (currentFilter === 'active') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        return filtered;
    };

    const render = () => {
        const filtered = filterTodos();

        if (filtered.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clipboard-list"></i>
                    <p>No tasks found in this view.</p>
                </div>
            `;
        } else {
            todoList.innerHTML = filtered.map(todo => {
                const isOverdue = todo.date && new Date(todo.date) < new Date().setHours(0, 0, 0, 0) && !todo.completed;
                return `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <div class="checkbox-container" onclick="window.toggleTodo(${todo.id})">
                        <div class="custom-checkbox">
                            <i data-lucide="check"></i>
                        </div>
                    </div>
                    <div class="todo-content">
                        <span class="todo-text" contenteditable="true" onblur="window.handleEdit(${todo.id}, this)">${escapeHtml(todo.text)}</span>
                        <div class="todo-meta">
                            ${todo.category ? `<span class="todo-badge badge-category">${todo.category}</span>` : ''}
                            ${todo.date ? `<span class="todo-badge badge-date ${isOverdue ? 'overdue' : ''}">${formatDate(todo.date)}</span>` : ''}
                            <span class="todo-badge badge-${todo.priority}">${todo.priority}</span>
                        </div>
                    </div>
                    <button class="edit-btn" onclick="this.previousElementSibling.firstElementChild.focus()" aria-label="Edit Task">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="delete-btn" onclick="window.deleteTodo(${todo.id})" aria-label="Delete Task">
                        <i data-lucide="trash-2"></i>
                    </button>
                </li>
            `}).join('');
        }

        // Update stats
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

        // Update Progress
        updateProgress();

        // Re-initialize icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    const updateProgress = () => {
        if (todos.length === 0) {
            progressFill.style.width = '0%';
            progressPercent.textContent = '0%';
            return;
        }
        const completedCount = todos.filter(todo => todo.completed).length;
        const percent = Math.round((completedCount / todos.length) * 100);
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    };

    const handleEdit = (id, el) => {
        const newText = el.textContent.trim();
        if (newText) {
            editTodo(id, newText);
        } else {
            render(); // Reset if empty
        }
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };

    // Helper: Escape HTML to prevent XSS
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Global toggle/delete for onclick
    window.toggleTodo = toggleTodo;
    window.deleteTodo = deleteTodo;
    window.handleEdit = handleEdit;

    // Event Listeners
    todoForm.addEventListener('submit', addTodo);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            render();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
    themeBtn.addEventListener('click', toggleTheme);

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
    });

    // Initial load
    init();
});
