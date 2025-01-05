const form = document.querySelector('#form')
const taskInput = document.querySelector('#taskInput')
const tasksList = document.querySelector('#tasksList')
const emptyList = document.querySelector('#emptyList')
const hoursDate = document.querySelector('.hours')
const minutesDate = document.querySelector('.minutes')

// Обновление времени
function myClock() {
	let allTime = new Date()
	hoursDate.innerHTML = `0${allTime.getHours()}`.slice(-2)
	minutesDate.innerHTML = `0${allTime.getMinutes()}`.slice(-2)
}
myClock()
setInterval(myClock, 1000)

// Инициализация задач из localStorage
let tasks = localStorage.getItem('tasks')
	? JSON.parse(localStorage.getItem('tasks'))
	: []

// Отображение задач из localStorage
tasks.forEach(task => renderTask(task))

// Проверяем пустой список при загрузке страницы
checkEmptyList()

// Добавление задачи
form.addEventListener('submit', addTask)

// Слушатели событий для кнопок
tasksList.addEventListener('click', event => {
	const taskContainer = event.target.closest('.task-container')
	if (!taskContainer) return

	const taskId = Number(taskContainer.id)
	const task = tasks.find(t => t.id === taskId)

	if (event.target.closest('[data-action="delete"]')) {
		deleteTask(taskId, taskContainer)
	} else if (event.target.closest('[data-action="done"]')) {
		doneTask(task, taskContainer)
	} else if (event.target.closest('[data-action="edit"]')) {
		editTask(task, taskContainer)
	}
})

// Функция рендеринга задачи
function renderTask(task) {
	const cssClass = task.done ? 'task-title task-title--done' : 'task-title'

	const taskHTML = `
    <div id="${task.id}" class="task-container">
        <div class="task-header">
            <span class="task-time">${task.createdAt}</span>
            <span class="task-number">#${task.number}</span>
            <div class="task-item__buttons">
                <button type="button" data-action="done" class="btn-action">
                    <img src="./img/tick.svg" alt="Done" width="18" height="18">
                </button>
                <button type="button" data-action="edit" class="btn-action">
                    <img src="./img/edit.svg" alt="Edit" width="18" height="18">
                </button>
                <button type="button" data-action="delete" class="btn-action">
                    <img src="./img/trash2.svg" alt="Delete" width="18" height="18">
                </button>
            </div>
        </div>
        <div class="task-item">
            <div class="task-body">
                <span class="${cssClass}">${task.text}</span>
            </div>
        </div>
    </div>`
	tasksList.insertAdjacentHTML('beforeend', taskHTML)
	checkEmptyList()
}

// Функция добавления задачи
function addTask(event) {
	event.preventDefault()

	const taskText = taskInput.value

	const newTask = {
		id: Date.now(),
		text: taskText,
		done: false,
		number: tasks.length + 1,
		createdAt: new Date().toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}),
	}

	tasks.push(newTask)
	saveToLocalStorage()
	renderTask(newTask)

	taskInput.value = ''
	taskInput.focus()
}

// Функция удаления задачи
function deleteTask(id, taskContainer) {
	tasks = tasks.filter(task => task.id !== id)
	saveToLocalStorage()
	taskContainer.remove()
	checkEmptyList()
}

// Функция завершения задачи
function doneTask(task, taskContainer) {
	task.done = !task.done
	saveToLocalStorage()

	const taskTitle = taskContainer.querySelector('.task-title')
	taskTitle.classList.toggle('task-title--done')
}

// Функция редактирования задачи
function editTask(task, taskContainer) {
	const taskBody = taskContainer.querySelector('.task-body')
	const taskText = task.text

	// Открываем поле для редактирования
	taskBody.innerHTML = `
        <input type="text" class="edit-input form-control" value="${taskText}" />
        <div class="task-edit-buttons">
            <button type="button" data-action="save" class="btn-action">
                <img src="./img/tick.svg" alt="Save" width="18" height="18">
            </button>
            <button type="button" data-action="cancel" class="btn-action">
                <img src="./img/cross2.svg" alt="Cancel" width="18" height="18">
            </button>
        </div>`

	// Обработчик для сохранения изменений
	taskBody
		.querySelector('[data-action="save"]')
		.addEventListener('click', () => {
			const input = taskBody.querySelector('.edit-input')
			task.text = input.value.trim() || task.text
			saveToLocalStorage()

			// Перерисовываем задачу с учётом её статуса (выполнена/не выполнена)
			taskBody.innerHTML = `
            <span class="task-title ${task.done ? 'task-title--done' : ''}">
                ${task.text}
            </span>`
		})

	// Обработчик для отмены изменений
	taskBody
		.querySelector('[data-action="cancel"]')
		.addEventListener('click', () => {
			taskBody.innerHTML = `
            <span class="task-title ${task.done ? 'task-title--done' : ''}">
                ${task.text}
            </span>`
		})
}

// Проверка пустого списка
function checkEmptyList() {
	if (tasks.length === 0) {
		const emptyListHTML = `
            <li id="emptyList" class="list-group-item empty-list" style="border-radius:25px;">
                <img src="./img/leaf.svg" alt="Empty" width="48" class="mt-3">
                <div class="empty-list__title">Список дел пуст</div>
            </li>`
		tasksList.innerHTML = ''
		tasksList.insertAdjacentHTML('afterbegin', emptyListHTML)
	} else {
		const emptyListEl = document.querySelector('#emptyList')
		if (emptyListEl) emptyListEl.remove()
	}
}

// Сохранение в LocalStorage
function saveToLocalStorage() {
	localStorage.setItem('tasks', JSON.stringify(tasks))
}

// Тема
const themeToggle = document.getElementById('theme-toggle')

// Инициализация темы при загрузке страницы
function initializeTheme() {
	const savedTheme = localStorage.getItem('theme')
	if (savedTheme === 'light') {
		document.body.classList.add('light-theme')
		themeToggle.checked = true // Устанавливаем ползунок
	} else {
		document.body.classList.remove('light-theme')
		themeToggle.checked = false // Устанавливаем ползунок
	}
}

// Сохранение темы в localStorage
function saveTheme(theme) {
	localStorage.setItem('theme', theme)
}

// Обработчик переключения темы
themeToggle.addEventListener('change', () => {
	document.body.classList.toggle('light-theme')
	const currentTheme = document.body.classList.contains('light-theme')
		? 'light'
		: 'dark'
	saveTheme(currentTheme)
})

// Инициализация темы при загрузке страницы
initializeTheme()
