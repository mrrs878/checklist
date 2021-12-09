/*
 * @Author: mrrs878@foxmail.com
 * @Date: 2021-12-07 20:50:34
 * @LastEditors: mrrs878@foxmail.com
 * @LastEditTime: 2021-12-08 22:03:58
 * @FilePath: \checklist\js\popup.js
 */

const storageKey = 'tasks';
const selectors = {
  taskContainer: '#taskContainer',
  addTaskBtn: '#addTaskBtn',
  addTaskTitleInput: '#addTaskTitleInput',
  editTaskTitleInput: '#editTaskTitleInput',
  editTaskModal: '#editTaskModal',
  editTaskModalSubmitBtn: '#editTaskModalSubmitBtn',
};

const TaskState = {
  pending: 0,
  resolved: 1,
}

function renderTaskTitle(task, index) {
  const { state, title } = task;
  if (state === TaskState.pending) return (`
    <label class="custom-control-label" id="customCheckLabel${index}" for="customCheck${index}">
      ${title}
    </label>
  `);
  if (state === TaskState.resolved) return (`
    <label class="custom-control-label task-resolved" id="customCheckLabel${index}" for="customCheck${index}">
      ${title}
    </label>
  `);
}

function renderTaskState(task, index) {
  const { state } = task;
  return (
    `<input
      type="checkbox"
      data-index=${index}
      ${state === TaskState.resolved ? 'checked' : ''}
      class="custom-control-input"
      id="customCheck${index}"
    >`
  );
}

function renderTaskAction(task, index) {
  return (`
    <div class="btn-group" role="group" aria-label="Basic example">
      <button type="button" class="btn btn-light" id="editTask${index}" data-index=${index} data-toggle="modal" data-target="${selectors.editTaskModal}" title="编辑">
        <img class="task-action-icon edit-icon" src="../assets/edit.svg" alt="" srcset="">
      </button>
      <button type="button" class="btn btn-light" id="copyTask${index}" title="复制新增">
        <img class="task-action-icon copy-icon" src="../assets/copy.svg" alt="" srcset="">
      </button>
      <button type="button" class="btn btn-light" id="deleteTask${index}" title="删除">
        <img class="task-action-icon delete-icon" src="../assets/delete.svg" alt="" srcset="">
      </button>
    </div>
  `);
}

function getTasks() {
  return new Promise((resolve) => {
    chrome.storage.sync.get((storage) => {
      resolve(storage[storageKey] || []);
    });
  });
}

async function addTask(task) {
  const tasks = await getTasks();
  tasks.push(task);
  chrome.storage.sync.set({
    [storageKey]: tasks
  });
  return tasks.length - 1;
}

async function deleteTask(taskIndex) {
  let tasks = await getTasks();
  tasks = tasks.filter((item, index) => index !== taskIndex);
  chrome.storage.sync.set({
    [storageKey]: tasks
  });
}

async function copyTask(taskIndex) {
  const tasks = await getTasks();
  tasks.push(tasks[taskIndex]);
  chrome.storage.sync.set({
    [storageKey]: tasks
  });
}

async function toggleTaskState(taskIndex) {
  const tasks = await getTasks();
  if (tasks.length === 0) return;

  const { state: preState } = tasks[taskIndex];
  const newState = preState === TaskState.pending ? TaskState.resolved : TaskState.pending;
  tasks[taskIndex].state = newState;

  chrome.storage.sync.set({
    [storageKey]: tasks
  });

  await renderTasks();
}

function renderTask(task, index) {
  return (`
    <li class="list-group-item list-group-item-action task-item" id="taskItem${index}">
      <div class="custom-control custom-checkbox">
        ${renderTaskState(task, index)}
        ${renderTaskTitle(task, index)}
      </div>
      ${renderTaskAction(task, index)}
    </li>
  `)
}

async function renderTasks() {
  $(selectors.taskContainer).empty();
  const tasks = await getTasks();
  console.log('tasks length', tasks.length);
  if (tasks.length === 0) {
    $(selectors.taskContainer).append(`
      <br />
      <p class="text-center">
        空空如也
      </p>
    `);
    return;
  };
  
  const content = tasks.reduce((pre, cur, index) => `
    ${pre}
    ${renderTask(cur, index)}
  `, '');
  $(selectors.taskContainer).append(content);

  $('input[type=checkbox]').each((index, input) => {
    $(input).on('change', async () => {
      console.log('toggle', index);
      toggleTaskState(index);
    });
  });

  $('.task-item .delete-icon').each((index, deleteIcon) => {
    $(deleteIcon).on('click', async () => {
      console.log('delete', index);
      await deleteTask(index);
      await renderTasks();
    });
  })

  $('.task-item .copy-icon').each((index, copyIcon) => {
    $(copyIcon).on('click', async () => {
      console.log('copy', index);
      await copyTask(index);
      await renderTasks();
    });
  })
}

window.addEventListener('load', async () => {
  await renderTasks();

  $(selectors.addTaskBtn).on('click', async () => {
    const taskTitle = $(selectors.addTaskTitleInput).prop('value');
    const newTask = {
      title: taskTitle,
      state: TaskState.pending,
    }
    await addTask(newTask);

    $(selectors.addTaskTitleInput).prop('value', '');
    renderTasks();
  });

  $(selectors.editTaskModal).on('show.bs.modal', async function (event) {
    const { index } = event.relatedTarget?.dataset || {};
    const taskIndex = parseInt(index, 10);
    if (isNaN(taskIndex)) return;

    const tasks = await getTasks();
    const { title } = tasks[taskIndex] || {};

    $(selectors.editTaskTitleInput).val(title);

    $(this).data('editTaskIndex', taskIndex);
  });

  $(selectors.editTaskModalSubmitBtn).on('click', async () => {
    const index = $(selectors.editTaskModal).data('editTaskIndex');
    const editTaskIndex = parseInt(index, 10);
    if (isNaN(editTaskIndex)) return;

    const tasks = await getTasks();
    const task = tasks[editTaskIndex];
    if (!task) return;

    task.title = $(selectors.editTaskTitleInput).val();

    chrome.storage.sync.set({
      [storageKey]: tasks
    });

    await renderTasks();

    $(selectors.editTaskModal).modal('hide');
  });
})
