// Находим элементы
const form = document.querySelector('#form');
const taskInput = document.querySelector('#taskInput');
const tasksList = document.querySelector('#tasksList');
const emptyList = document.querySelector('#emptyList');
const emptyFooter = document.querySelector('.footer');
let tasks = [];
if(localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));
}
tasks.forEach(function(task){

    const cssClass = task.done ? "task-title task-title--done" : "task-title";


    const taskHTML = `<li id="${task.id}" class="list-group-item d-flex justify-content-between task-item">
    <span class="${cssClass}">${task.text}</span>
    <div class="task-item__buttons">
        <button type="button" data-action="done" class="btn-action">
            <img src="./img/tick.svg" alt="Done" width="18" height="18">
        </button>
        <button type="button" data-action="delete" class="btn-action">
            <img src="./img/cross.svg" alt="Done" width="18" height="18">
        </button>
    </div>
</li>`;
tasksList.insertAdjacentHTML('beforeend', taskHTML);
})

checkEmptyList();

form.addEventListener('submit', addTask)



tasksList.addEventListener('click', deleteTask)

tasksList.addEventListener('click', doneTask)

function addTask(event){
    event.preventDefault();

    const taskText = taskInput.value;
    

    const newTask = {
        id: Date.now(),
        text: taskText,
        done: false
    };

    tasks.push(newTask);
    saveToLocalStorage()

    const cssClass = newTask.done ? "task-title task-title--done" : "task-title";


    const taskHTML = `<li id="${newTask.id}" class="list-group-item d-flex justify-content-between task-item">
    <span class="${cssClass}">${newTask.text}</span>
    <div class="task-item__buttons">
        <button type="button" data-action="done" class="btn-action">
            <img src="./img/tick.svg" alt="Done" width="18" height="18">
        </button>
        <button type="button" data-action="delete" class="btn-action">
            <img src="./img/cross.svg" alt="Done" width="18" height="18">
        </button>
    </div>
</li>` 

    tasksList.insertAdjacentHTML('beforeend', taskHTML);

    taskInput.value = "";
    taskInput.focus();

    checkEmptyList();
    
}

function deleteTask(event){

    if(event.target.dataset.action !== 'delete'){
        return
    }

        console.log('delete');
        const parenNode = event.target.closest('.list-group-item');

        const id = Number(parenNode.id);

        const index = tasks.findIndex(function(task){
            return task.id === id;
        })


        tasks.splice(index, 1)

        saveToLocalStorage()


        parenNode.remove();


        checkEmptyList();   
}

function doneTask(event) {
    if(event.target.dataset.action !== "done") return;

    const parentNode = event.target.closest('.list-group-item');

    const id = Number(parentNode.id);

    const task = tasks.find(function(task){
        if(task.id === id) {
            return true;
        }
    })

    task.done = !task.done
    saveToLocalStorage()


    const taskTitle = parentNode.querySelector('.task-title');
    taskTitle.classList.toggle('task-title--done')
}

function checkEmptyList() {
    if(tasks.length === 0){
        const emptyListHTML = `<li id="emptyList" class="list-group-item empty-list" style="border-radius: 15px;">
        <img src="./img/leaf.svg" alt="Empty" width="48" class="mt-3">
        <div class="empty-list__title">Список дел пуст</div>
    </li>`;
    tasksList.insertAdjacentHTML('afterbegin', emptyListHTML);
    }

    if(tasks.length > 0) {
        const emptyListEl = document.querySelector('#emptyList');
        emptyListEl ? emptyListEl.remove() : null;
    }
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks))
}





document.getElementById('theme-toggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
});



