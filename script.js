document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const taskSearch = document.getElementById('taskSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sortBy = document.getElementById('sortBy');
    const sortDirectionBtn = document.getElementById('sortDirectionBtn');
    const themeToggle = document.getElementById('themeToggle');
    const tagModal = document.getElementById('tagModal');
    const createTagBtn = document.getElementById('createTagBtn');
    const saveTagBtn = document.getElementById('saveTagBtn');
    const cancelTagBtn = document.getElementById('cancelTagBtn');
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text');
    
    // Элементы формы
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskPriority = document.getElementById('taskPriority');
    const taskDueDate = document.getElementById('taskDueDate');
    const tagInput = document.getElementById('tagInput');
    const selectedTags = document.getElementById('selectedTags');
    const tagSuggestions = document.getElementById('tagSuggestions');
    const newTagName = document.getElementById('newTagName');
    const tagChars = document.getElementById('tagChars');
    const colorPicker = document.getElementById('colorPicker');
    
    // Счётчики символов
    const titleChars = document.getElementById('titleChars');
    const descChars = document.getElementById('descChars');
    
    // Статистика
    const totalTasksEl = document.getElementById('totalTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const overdueTasksEl = document.getElementById('overdueTasks');
    
    // Состояние приложения
    let tasks = [];
    let tags = [];
    let currentTags = [];
    let currentFilter = 'all';
    let currentSort = 'dueDate';
    let sortAscending = true;
    let searchQuery = '';
    let selectedColor = '#4361ee';
    
    // Инициализация
    loadData();
    renderTasks();
    updateStats();
    renderTags();
    
    // Слушатели для формы
    taskTitle.addEventListener('input', function() {
        titleChars.textContent = this.value.length;
    });
    
    taskDescription.addEventListener('input', function() {
        descChars.textContent = this.value.length;
    });
    
    addTaskBtn.addEventListener('click', addTask);
    clearFormBtn.addEventListener('click', clearForm);
    
    // Слушатели для поиска
    taskSearch.addEventListener('input', function() {
        searchQuery = this.value.toLowerCase();
        renderTasks();
    });
    
    clearSearchBtn.addEventListener('click', function() {
        taskSearch.value = '';
        searchQuery = '';
        renderTasks();
    });
    
    // Слушатели для сортировки
    sortBy.addEventListener('change', function() {
        currentSort = this.value;
        renderTasks();
    });
    
    sortDirectionBtn.addEventListener('click', function() {
        sortAscending = !sortAscending;
        this.innerHTML = sortAscending ? 
            '<i class="fas fa-sort-amount-down"></i>' : 
            '<i class="fas fa-sort-amount-up"></i>';
        renderTasks();
    });
    
    // Слушатель для тегов
    tagInput.addEventListener('input', function() {
        showTagSuggestions(this.value);
    });
    
    tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            const tagName = this.value.trim();
            const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            
            if (existingTag) {
                if (!currentTags.includes(existingTag.id)) {
                    currentTags.push(existingTag.id);
                    renderSelectedTags();
                }
            } else {
                // Создать новый тег
                openTagModal(tagName);
            }
            
            this.value = '';
            hideTagSuggestions();
        }
    });
    
    // Слушатели для быстрых фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    // Слушатели для темы
    themeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-theme', this.checked);
        document.body.classList.toggle('light-theme', !this.checked);
        saveTheme(this.checked);
    });
    
    // Загружаем сохранённую тему
    const savedTheme = localStorage.getItem('darkTheme') === 'true';
    themeToggle.checked = savedTheme;
    document.body.classList.toggle('dark-theme', savedTheme);
    document.body.classList.toggle('light-theme', !savedTheme);
    
    // Модальное окно тегов
    createTagBtn.addEventListener('click', () => openTagModal());
    
    saveTagBtn.addEventListener('click', saveTag);
    
    cancelTagBtn.addEventListener('click', function() {
        tagModal.classList.remove('show');
        tagInput.value = '';
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            tagModal.classList.remove('show');
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === tagModal) {
            tagModal.classList.remove('show');
        }
    });
    
    // Выбор цвета тега
    colorPicker.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            e.target.classList.add('selected');
            selectedColor = e.target.dataset.color;
        }
    });
    
    newTagName.addEventListener('input', function() {
        tagChars.textContent = this.value.length;
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
            dueDate: taskDueDate.value || null,
            tags: [...currentTags],
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
        taskDueDate.value = '';
        currentTags = [];
        renderSelectedTags();
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
                const searchInTags = task.tags.some(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag && tag.name.toLowerCase().includes(searchQuery);
                });
                if (!searchInTitle && !searchInDesc && !searchInTags) return false;
            }
            
            // Быстрые фильтры
            switch (currentFilter) {
                case 'today':
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate).toDateString();
                    const todayStr = new Date().toDateString();
                    if (dueDate !== todayStr) return false;
                    break;
                    
                case 'overdue':
                    if (!task.dueDate || task.completed) return false;
                    if (new Date(task.dueDate) >= new Date()) return false;
                    break;
                    
                case 'high':
                    if (task.priority !== 'high' && task.priority !== 'urgent') return false;
                    break;
                    
                case 'completed':
                    if (!task.completed) return false;
                    break;
            }
            
            return true;
        });
        
        // Сортировка задач
        filteredTasks.sort((a, b) => {
            let aValue, bValue;
            
            switch (currentSort) {
                case 'dueDate':
                    aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    break;
                    
                case 'priority':
                    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                    
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                    
                case 'created':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                    
                default:
                    aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            }
            
            return sortAscending ? aValue - bValue : bValue - aValue;
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
        taskEl.className = `task-item priority-${task.priority}`;
        if (task.completed) taskEl.classList.add('completed');
        
        // Проверка просроченности
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        if (isOverdue) taskEl.classList.add('overdue');
        
        taskEl.dataset.id = task.id;
        
        // Тексты приоритета
        const priorityText = {
            urgent: 'Срочный',
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        };
        
        // Форматирование даты
        let dueDateText = 'Без срока';
        let dueDateClass = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDateText = dueDate.toLocaleDateString('ru-RU');
            if (isOverdue) {
                dueDateText += ' (Просрочено!)';
                dueDateClass = 'date-overdue';
            }
        }
        
        // Теги задачи
        let tagsHtml = '';
        if (task.tags.length > 0) {
            tagsHtml = '<div class="task-tags">';
            task.tags.forEach(tagId => {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    tagsHtml += `<span class="tag" style="background: ${tag.color}">${tag.name}</span>`;
                }
            });
            tagsHtml += '</div>';
        }
        
        taskEl.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="task-priority priority-${task.priority}">${priorityText[task.priority]}</span>
            </div>
            
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            
            ${tagsHtml}
            
            <div class="task-meta">
                <div class="task-date ${dueDateClass}">
                    <i class="fas fa-calendar${isOverdue ? '-times' : '-alt'}"></i>
                    <span>${dueDateText}</span>
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
        editBtn.addEventListener('click', () => openEditModal(task));
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
    function openEditModal(task) {
        // Создаем модальное окно редактирования
        const editModal = document.createElement('div');
        editModal.className = 'modal show';
        editModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Редактировать задачу</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <input type="text" id="editTaskTitle" value="${escapeHtml(task.title)}" maxlength="100">
                        <div class="char-count"><span id="editTitleChars">${task.title.length}</span>/100</div>
                    </div>
                    
                    <div class="form-group">
                        <textarea id="editTaskDescription" rows="3" maxlength="500">${escapeHtml(task.description)}</textarea>
                        <div class="char-count"><span id="editDescChars">${task.description.length}</span>/500</div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-flag"></i> Приоритет</label>
                            <select id="editTaskPriority">
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Средний</option>
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                                <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Срочный</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-day"></i> Дедлайн</label>
                            <input type="date" id="editTaskDueDate" value="${task.dueDate || ''}" min="${today}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-tags"></i> Теги</label>
                        <div class="tags-input" id="editTagsInput">
                            <div class="selected-tags" id="editSelectedTags"></div>
                            <input type="text" id="editTagInput" placeholder="Добавить тег...">
                            <div class="tag-suggestions" id="editTagSuggestions"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="editTaskCompleted" ${task.completed ? 'checked' : ''}>
                            <span>Задача выполнена</span>
                        </label>
                    </div>
                    
                    <div class="modal-actions">
                        <button id="saveEditBtn" class="btn btn-primary">
                            <i class="fas fa-save"></i> Сохранить
                        </button>
                        <button id="cancelEditBtn" class="btn btn-secondary">Отмена</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(editModal);
        
        // Инициализация тегов для редактирования
        let editTags = [...task.tags];
        const editSelectedTags = editModal.querySelector('#editSelectedTags');
        
        function renderEditTags() {
            editSelectedTags.innerHTML = '';
            editTags.forEach(tagId => {
                const tag = tags.find(t => t.id === tagId);
                if (tag) {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'tag';
                    tagEl.style.background = tag.color;
                    tagEl.innerHTML = `
                        ${tag.name}
                        <button class="tag-remove" data-id="${tag.id}">&times;</button>
                    `;
                    editSelectedTags.appendChild(tagEl);
                }
            });
        }
        
        renderEditTags();
        
        // Слушатели для модального окна
        const closeBtn = editModal.querySelector('.close-modal');
        const cancelBtn = editModal.querySelector('#cancelEditBtn');
        const saveBtn = editModal.querySelector('#saveEditBtn');
        const editTagInput = editModal.querySelector('#editTagInput');
        
        closeBtn.addEventListener('click', () => editModal.remove());
        cancelBtn.addEventListener('click', () => editModal.remove());
        
        saveBtn.addEventListener('click', function() {
            const title = editModal.querySelector('#editTaskTitle').value.trim();
            
            if (!title) {
                showNotification('Название задачи не может быть пустым!', 'error');
                return;
            }
            
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title: title,
                    description: editModal.querySelector('#editTaskDescription').value.trim(),
                    priority: editModal.querySelector('#editTaskPriority').value,
                    dueDate: editModal.querySelector('#editTaskDueDate').value || null,
                    tags: [...editTags],
                    completed: editModal.querySelector('#editTaskCompleted').checked,
                    updatedAt: new Date().toISOString()
                };
                
                saveTasks();
                renderTasks();
                updateStats();
                editModal.remove();
                
                showNotification('Задача успешно обновлена!', 'success');
            }
        });
        
        // Удаление тегов в режиме редактирования
        editSelectedTags.addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-remove')) {
                const tagId = parseInt(e.target.dataset.id);
                editTags = editTags.filter(id => id !== tagId);
                renderEditTags();
            }
        });
        
        // Добавление тегов в режиме редактирования
        editTagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                const tagName = this.value.trim();
                const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                
                if (existingTag) {
                    if (!editTags.includes(existingTag.id)) {
                        editTags.push(existingTag.id);
                        renderEditTags();
                    }
                } else {
                    showNotification('Сначала создайте тег через менеджер тегов', 'warning');
                }
                
                this.value = '';
            }
        });
        
        // Клик вне модального окна
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                editModal.remove();
            }
        });
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
    
    // Функция отображения выбранных тегов
    function renderSelectedTags() {
        selectedTags.innerHTML = '';
        currentTags.forEach(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (tag) {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.style.background = tag.color;
                tagEl.innerHTML = `
                    ${tag.name}
                    <button class="tag-remove" data-id="${tag.id}">&times;</button>
                `;
                selectedTags.appendChild(tagEl);
            }
        });
        
        // Удаление тегов
        selectedTags.addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-remove')) {
                const tagId = parseInt(e.target.dataset.id);
                currentTags = currentTags.filter(id => id !== tagId);
                renderSelectedTags();
            }
        });
    }
    
    // Функция показа подсказок тегов
    function showTagSuggestions(query) {
        if (!query.trim()) {
            hideTagSuggestions();
            return;
        }
        
        const filteredTags = tags.filter(tag => 
            tag.name.toLowerCase().includes(query.toLowerCase()) && 
            !currentTags.includes(tag.id)
        );
        
        if (filteredTags.length === 0) {
            tagSuggestions.innerHTML = `
                <div class="tag-suggestion">
                    <i class="fas fa-plus"></i>
                    <span>Создать тег "${query}"</span>
                </div>
            `;
        } else {
            tagSuggestions.innerHTML = filteredTags.map(tag => `
                <div class="tag-suggestion" data-id="${tag.id}">
                    <span class="tag-preview" style="background: ${tag.color}"></span>
                    <span>${tag.name}</span>
                </div>
            `).join('');
        }
        
        tagSuggestions.style.display = 'block';
        
        // Обработка клика по подсказке
        tagSuggestions.querySelectorAll('.tag-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
                if (this.querySelector('.fa-plus')) {
                    openTagModal(query);
                } else {
                    const tagId = parseInt(this.dataset.id);
                    if (!currentTags.includes(tagId)) {
                        currentTags.push(tagId);
                        renderSelectedTags();
                    }
                    tagInput.value = '';
                    hideTagSuggestions();
                }
            });
        });
    }
    
    // Функция скрытия подсказок тегов
    function hideTagSuggestions() {
        tagSuggestions.style.display = 'none';
    }
    
    // Функция открытия модального окна тегов
    function openTagModal(presetName = '') {
        newTagName.value = presetName;
        tagChars.textContent = presetName.length;
        
        // Сброс выбора цвета
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.color === '#4361ee') {
                opt.classList.add('selected');
            }
        });
        selectedColor = '#4361ee';
        
        tagModal.classList.add('show');
        newTagName.focus();
    }
    
    // Функция сохранения тега
    function saveTag() {
        const tagName = newTagName.value.trim();
        
        if (!tagName) {
            showNotification('Введите название тега!', 'error');
            return;
        }
        
        // Проверка на существующий тег
        if (tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
            showNotification('Тег с таким названием уже существует!', 'error');
            return;
        }
        
        const newTag = {
            id: Date.now(),
            name: tagName,
            color: selectedColor,
            createdAt: new Date().toISOString()
        };
        
        tags.push(newTag);
        saveTags();
        renderTags();
        tagModal.classList.remove('show');
        
        // Автоматически добавляем тег к текущей задаче
        currentTags.push(newTag.id);
        renderSelectedTags();
        
        showNotification('Тег успешно создан!', 'success');
    }
    
    // Функция отображения тегов
    function renderTags() {
        const tagsList = document.getElementById('tagsList');
        tagsList.innerHTML = '';
        
        if (tags.length === 0) {
            tagsList.innerHTML = '<p class="no-tags">Тегов пока нет</p>';
            return;
        }
        
        tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag-manage';
            tagEl.style.background = tag.color;
            tagEl.innerHTML = `
                ${tag.name}
                <button class="tag-remove" data-id="${tag.id}">&times;</button>
            `;
            tagsList.appendChild(tagEl);
        });
        
        // Удаление тегов
        tagsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-remove')) {
                const tagId = parseInt(e.target.dataset.id);
                
                // Проверяем, используется ли тег
                const isUsed = tasks.some(task => task.tags.includes(tagId));
                
                if (isUsed) {
                    if (!confirm('Этот тег используется в задачах. Удалить его?')) {
                        return;
                    }
                    
                    // Удаляем тег из всех задач
                    tasks.forEach(task => {
                        task.tags = task.tags.filter(id => id !== tagId);
                    });
                }
                
                tags = tags.filter(tag => tag.id !== tagId);
                currentTags = currentTags.filter(id => id !== tagId);
                
                saveTags();
                saveTasks();
                renderTags();
                renderSelectedTags();
                renderTasks();
                
                showNotification('Тег удален!', 'success');
            }
        });
    }
    
    // Функция сохранения задач
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Функция сохранения тегов
    function saveTags() {
        localStorage.setItem('tags', JSON.stringify(tags));
    }
    
    // Функция сохранения темы
    function saveTheme(isDark) {
        localStorage.setItem('darkTheme', isDark);
    }
    
    // Функция загрузки данных
    function loadData() {
        // Загрузка задач
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
                    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                    tags: [1, 3],
                    completed: false,
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: '2024-01-15T10:00:00Z'
                },
                {
                    id: 2,
                    title: 'Сделать отчет',
                    description: 'Подготовить еженедельный отчет по проекту',
                    priority: 'urgent',
                    dueDate: new Date().toISOString().split('T')[0],
                    tags: [2],
                    completed: false,
                    createdAt: '2024-01-14T14:30:00Z',
                    updatedAt: '2024-01-14T14:30:00Z'
                },
                {
                    id: 3,
                    title: 'Купить продукты',
                    description: 'Молоко, хлеб, яйца, фрукты',
                    priority: 'medium',
                    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    tags: [4],
                    completed: true,
                    createdAt: '2024-01-13T09:15:00Z',
                    updatedAt: '2024-01-14T16:20:00Z'
                }
            ];
        }
        
        // Загрузка тегов
        const savedTags = localStorage.getItem('tags');
        if (savedTags) {
            tags = JSON.parse(savedTags);
        } else {
            // Примеры тегов
            tags = [
                { id: 1, name: 'Программирование', color: '#4361ee', createdAt: '2024-01-10T10:00:00Z' },
                { id: 2, name: 'Работа', color: '#f72585', createdAt: '2024-01-10T10:00:00Z' },
                { id: 3, name: 'Обучение', color: '#4cc9f0', createdAt: '2024-01-10T10:00:00Z' },
                { id: 4, name: 'Покупки', color: '#4CAF50', createdAt: '2024-01-10T10:00:00Z' }
            ];
        }
    }
    
    // Функция обновления статистики
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = tasks.filter(task => 
            task.dueDate && 
            new Date(task.dueDate) < new Date() && 
            !task.completed
        ).length;
        
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
        overdueTasksEl.textContent = overdueTasks;
    }
    
    // Функция показа уведомления
    function showNotification(message, type) {
        notificationText.textContent = message;
        
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.add('show');
        
        const icon = notification.querySelector('i');
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
        } else {
            icon.className = 'fas fa-check-circle';
        }
        
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