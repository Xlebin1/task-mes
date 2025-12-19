document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const taskSearch = document.getElementById('taskSearch');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text');
    
    // Элементы формы
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    const taskDueDate = document.getElementById('taskDueDate');
    const titleChars = document.getElementById('titleChars');
    const descChars = document.getElementById('descChars');
    
    // Элементы статистики
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const categoryCounts = {
        all: document.getElementById('countAll'),
        work: document.getElementById('countWork'),
        personal: document.getElementById('countPersonal'),
        study: document.getElementById('countStudy'),
        health: document.getElementById('countHealth')
    };
    
    // Состояние приложения
    let tasks = [];
    let currentFilter = 'all';
    let currentCategory = 'all';
    let currentSort = 'dateAdded';
    let searchQuery = '';
    let editingTaskId = null;
    
    // Инициализация
    loadTasks();
    renderTasks();
    updateStats();
    
    // Слушатели событий для формы
    taskTitle.addEventListener('input', function() {
        titleChars.textContent = this.value.length;
    });
    
    taskDescription.addEventListener('input', function() {
        descChars.textContent = this.value.length;
    });
    
    addTaskBtn.addEventListener('click', addTask);
    clearFormBtn.addEventListener('click', clearForm);
    
    // Слушатели для фильтров и поиска
    taskSearch.addEventListener('input', function() {
        searchQuery = this.value.toLowerCase();
        renderTasks();
    });
    
    statusFilter.addEventListener('change', function() {
        currentFilter = this.value;
        renderTasks();
    });
    
    sortBy.addEventListener('change', function() {
        currentSort = this.value;
        renderTasks();
    });
    
    // Слушатели для категорий
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            // Удаляем active у всех категорий
            document.querySelectorAll('.category-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Добавляем active к выбранной
            this.classList.add('active');
            
            // Устанавливаем текущую категорию
            currentCategory = this.dataset.category;
            renderTasks();
        });
    });
    
    // Устанавливаем активную категорию "Все задачи"
    document.querySelector('.category-item[data-category="all"]').classList.add('active');
    
    // Модальное окно
    closeModalBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Устанавливаем минимальную дату как сегодня
    const today = new Date().toISOString().split('T')[0];
    taskDueDate.min = today;
    
    // Функция добавления задачи
    function addTask() {
        const title = taskTitle.value.trim();
        
        if (!title) {
            showNotification('Введите название задачи!', 'error');
            taskTitle.focus();
            return;
        }
        
        const task = {
            id: Date.now(),
            title: title,
            description: taskDescription.value.trim(),
            priority: taskPriority.value,
            category: taskCategory.value,
            dueDate: taskDueDate.value,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        updateStats();
        clearForm();
        
        showNotification('Задача успешно добавлена!', 'success');
    }
    
    // Функция очистки формы
    function clearForm() {
        taskTitle.value = '';
        taskDescription.value = '';
        taskPriority.value = 'medium';
        taskCategory.value = 'personal';
        taskDueDate.value = '';
        titleChars.textContent = '0';
        descChars.textContent = '0';
        taskTitle.focus();
    }
    
    // Функция отображения задач
    function renderTasks() {
        // Фильтрация задач
        let filteredTasks = tasks.filter(task => {
            // Поиск
            if (searchQuery) {
                const searchInTitle = task.title.toLowerCase().includes(searchQuery);
                const searchInDesc = task.description.toLowerCase().includes(searchQuery);
                if (!searchInTitle && !searchInDesc) return false;
            }
            
            // Фильтр по статусу
            if (currentFilter === 'completed' && !task.completed) return false;
            if (currentFilter === 'pending' && task.completed) return false;
            
            // Фильтр по категории
            if (currentCategory !== 'all' && task.category !== currentCategory) return false;
            
            return true;
        });
        
        // Сортировка задач
        filteredTasks.sort((a, b) => {
            switch (currentSort) {
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                    
                case 'priority':
                    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                    
                case 'title':
                    return a.title.localeCompare(b.title);
                    
                default: // dateAdded
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
        
        // Очистка списка
        taskList.innerHTML = '';
        
        // Показ состояния "пусто"
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            taskList.appendChild(emptyState);
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Добавление задач в список
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    // Функция создания элемента задачи
    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
        taskEl.dataset.id = task.id;
        
        // Определение цвета приоритета
        const priorityText = {
            urgent: 'Срочный',
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        };
        
        // Определение иконки категории
        const categoryIcon = {
            work: 'fa-briefcase',
            personal: 'fa-user',
            study: 'fa-graduation-cap',
            health: 'fa-heartbeat',
            home: 'fa-home',
            other: 'fa-folder'
        };
        
        // Определение текста категории
        const categoryText = {
            work: 'Работа',
            personal: 'Личное',
            study: 'Учёба',
            health: 'Здоровье',
            home: 'Дом',
            other: 'Другое'
        };
        
        // Проверка просроченности
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        
        // Форматирование даты
        let dueDateText = 'Без срока';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDateText = dueDate.toLocaleDateString('ru-RU');
        }
        
        taskEl.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="task-priority priority-${task.priority}">${priorityText[task.priority]}</span>
            </div>
            
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            
            <div class="task-meta">
                <div class="task-category">
                    <i class="fas ${categoryIcon[task.category]}"></i>
                    <span>${categoryText[task.category]}</span>
                </div>
                
                <div class="task-due-date ${isOverdue ? 'due-date-warning' : ''}">
                    <i class="fas fa-calendar${isOverdue ? '-times' : '-alt'}"></i>
                    <span>${dueDateText}${isOverdue ? ' (Просрочено!)' : ''}</span>
                </div>
                
                <div class="task-actions">
                    <button class="action-btn complete" title="${task.completed ? 'Вернуть в работу' : 'Выполнить'}">
                        <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="action-btn edit" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Добавляем слушатели для кнопок
        const completeBtn = taskEl.querySelector('.complete');
        const editBtn = taskEl.querySelector('.edit');
        const deleteBtn = taskEl.querySelector('.delete');
        
        completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
        editBtn.addEventListener('click', () => openEditModal(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return taskEl;
    }
    
    // Функция переключения статуса задачи
    function toggleTaskComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            tasks[taskIndex].updatedAt = new Date().toISOString();
            saveTasks();
            renderTasks();
            updateStats();
            
            const message = tasks[taskIndex].completed 
                ? 'Задача отмечена как выполненная!' 
                : 'Задача возвращена в работу!';
            showNotification(message, 'success');
        }
    }
    
    // Функция открытия модального окна редактирования
    function openEditModal(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        editingTaskId = id;
        
        const modalBody = editModal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="form-group">
                <label for="editTitle">Название задачи*</label>
                <input type="text" id="editTitle" value="${escapeHtml(task.title)}" maxlength="100">
                <div class="char-count"><span id="editTitleChars">${task.title.length}</span>/100</div>
            </div>
            
            <div class="form-group">
                <label for="editDescription">Описание</label>
                <textarea id="editDescription" rows="3" maxlength="500">${escapeHtml(task.description)}</textarea>
                <div class="char-count"><span id="editDescChars">${task.description.length}</span>/500</div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editPriority">Приоритет</label>
                    <select id="editPriority">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Средний</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                        <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Срочный</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editCategory">Категория</label>
                    <select id="editCategory">
                        <option value="work" ${task.category === 'work' ? 'selected' : ''}>Работа</option>
                        <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Личное</option>
                        <option value="study" ${task.category === 'study' ? 'selected' : ''}>Учёба</option>
                        <option value="health" ${task.category === 'health' ? 'selected' : ''}>Здоровье</option>
                        <option value="home" ${task.category === 'home' ? 'selected' : ''}>Дом</option>
                        <option value="other" ${task.category === 'other' ? 'selected' : ''}>Другое</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="editDueDate">Срок выполнения</label>
                <input type="date" id="editDueDate" value="${task.dueDate || ''}" min="${today}">
            </div>
            
            <div class="form-group">
                <label class="checkbox">
                    <input type="checkbox" id="editCompleted" ${task.completed ? 'checked' : ''}>
                    <span>Задача выполнена</span>
                </label>
            </div>
            
            <div class="form-actions">
                <button type="button" id="saveEditBtn" class="btn btn-primary">
                    <i class="fas fa-save"></i> Сохранить изменения
                </button>
                <button type="button" id="cancelEditBtn" class="btn btn-secondary">
                    <i class="fas fa-times"></i> Отмена
                </button>
            </div>
        `;
        
        // Слушатели для редактирования
        const editTitle = document.getElementById('editTitle');
        const editDescription = document.getElementById('editDescription');
        const editTitleChars = document.getElementById('editTitleChars');
        const editDescChars = document.getElementById('editDescChars');
        const saveEditBtn = document.getElementById('saveEditBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        
        editTitle.addEventListener('input', function() {
            editTitleChars.textContent = this.value.length;
        });
        
        editDescription.addEventListener('input', function() {
            editDescChars.textContent = this.value.length;
        });
        
        saveEditBtn.addEventListener('click', saveEdit);
        cancelEditBtn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
        
        editModal.style.display = 'flex';
    }
    
    // Функция сохранения редактирования
    function saveEdit() {
        const title = document.getElementById('editTitle').value.trim();
        
        if (!title) {
            showNotification('Название задачи не может быть пустым!', 'error');
            return;
        }
        
        const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title: title,
                description: document.getElementById('editDescription').value.trim(),
                priority: document.getElementById('editPriority').value,
                category: document.getElementById('editCategory').value,
                dueDate: document.getElementById('editDueDate').value || null,
                completed: document.getElementById('editCompleted').checked,
                updatedAt: new Date().toISOString()
            };
            
            saveTasks();
            renderTasks();
            updateStats();
            editModal.style.display = 'none';
            
            showNotification('Задача успешно обновлена!', 'success');
        }
    }
    
    // Функция удаления задачи
    function deleteTask(id) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            
            showNotification('Задача удалена!', 'success');
        }
    }
    
    // Функция сохранения задач в LocalStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Функция загрузки задач из LocalStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            // Примеры задач для демонстрации
            tasks = [
                {
                    id: 1,
                    title: 'Изучить JavaScript',
                    description: 'Повторить асинхронное программирование и промисы',
                    priority: 'high',
                    category: 'study',
                    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                    completed: false,
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: '2024-01-15T10:00:00Z'
                },
                {
                    id: 2,
                    title: 'Записаться к врачу',
                    description: 'Записаться на ежегодный осмотр к терапевту',
                    priority: 'medium',
                    category: 'health',
                    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                    completed: false,
                    createdAt: '2024-01-14T14:30:00Z',
                    updatedAt: '2024-01-14T14:30:00Z'
                },
                {
                    id: 3,
                    title: 'Подготовить отчет',
                    description: 'Еженедельный отчет по проекту для начальства',
                    priority: 'urgent',
                    category: 'work',
                    dueDate: new Date().toISOString().split('T')[0],
                    completed: true,
                    createdAt: '2024-01-13T09:15:00Z',
                    updatedAt: '2024-01-14T16:20:00Z'
                }
            ];
        }
    }
    
    // Функция обновления статистики
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
        
        // Обновление счетчиков по категориям
        categoryCounts.all.textContent = totalTasks;
        categoryCounts.work.textContent = tasks.filter(task => task.category === 'work').length;
        categoryCounts.personal.textContent = tasks.filter(task => task.category === 'personal').length;
        categoryCounts.study.textContent = tasks.filter(task => task.category === 'study').length;
        categoryCounts.health.textContent = tasks.filter(task => task.category === 'health').length;
    }
    
    // Функция показа уведомления
    function showNotification(message, type) {
        notificationText.textContent = message;
        
        // Устанавливаем цвет в зависимости от типа
        if (type === 'error') {
            notification.style.background = '#f44336';
            notification.querySelector('i').className = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            notification.style.background = '#ff9800';
            notification.querySelector('i').className = 'fas fa-exclamation-triangle';
        } else {
            notification.style.background = '#4CAF50';
            notification.querySelector('i').className = 'fas fa-check-circle';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Функция экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});