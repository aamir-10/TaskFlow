// Check login state and redirect if user is not logged in
const userData = localStorage.getItem('taskflowUser');
const isLoggedIn = localStorage.getItem('isLoggedIn');

if (!userData || isLoggedIn !== 'true') {
  window.location.href = 'index.html';
}

const user = JSON.parse(userData);
const username = user.name;
const STORAGE_KEY = `myTodoTasks_${username}`;

// Display username and avatar
document.getElementById('username').textContent = username;
document.getElementById('avatar').src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`;

// Sign out logic
document.getElementById('signout').onclick = () => {
  localStorage.setItem('isLoggedIn', 'false');
  window.location.href = 'index.html';
};

const taskListElement = document.getElementById('task-list');
const notification = document.getElementById('notification');

let tasks = { todo: [], completed: [], archived: [] };

// Load tasks from localStorage or dummy API
function loadInitialData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    tasks = JSON.parse(stored);
    updateCounts();
    updateUI();
  } else {
    fetch('https://dummyjson.com/todos')
      .then(res => res.json())
      .then(data => {
        tasks.todo = data.todos.slice(0, 10).map(item => ({
          text: item.todo,
          modified: formatDate(new Date()),
        }));
        saveTasks();
        updateUI();
      });
  }
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  updateCounts();
}

// Update task counts in UI
function updateCounts() {
  document.getElementById('todo-count').textContent = tasks.todo.length;
  document.getElementById('completed-count').textContent = tasks.completed.length;
  document.getElementById('archived-count').textContent = tasks.archived.length;
}

// Render UI for active tab
function updateUI(activeTab = getActiveTab()) {
  taskListElement.innerHTML = '';
  const list = tasks[activeTab];

  if (list.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'task empty';
    emptyMsg.textContent = 'No tasks in this section.';
    taskListElement.appendChild(emptyMsg);
    return;
  }

  list.forEach((task, index) => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task';

    const leftContainer = document.createElement('div');
    leftContainer.className = 'task-left';

    const text = document.createElement('div');
    text.className = 'task-text';
    text.textContent = task.text;
    leftContainer.appendChild(text);

    // Add action buttons based on current tab
    if (activeTab === 'todo') {
      const completeBtn = createButton('Mark as Completed', 'complete', () => moveTask('todo', 'completed', index));
      const archiveBtn = createButton('Archive', 'archive', () => moveTask('todo', 'archived', index));
      leftContainer.append(completeBtn, archiveBtn);
    } else if (activeTab === 'completed') {
      const restoreBtn = createButton('Move to Todo', 'restore', () => moveTask('completed', 'todo', index));
      const archiveBtn = createButton('Archive', 'archive', () => moveTask('completed', 'archived', index));
      leftContainer.append(restoreBtn, archiveBtn);
    } else if (activeTab === 'archived') {
      const restoreTodoBtn = createButton('Move to Todo', 'restore', () => moveTask('archived', 'todo', index));
      const restoreCompletedBtn = createButton('Move to Completed', 'complete', () => moveTask('archived', 'completed', index));
      leftContainer.append(restoreTodoBtn, restoreCompletedBtn);
    }

    const rightContainer = document.createElement('div');
    rightContainer.className = 'task-right';

    const deleteBtn = createButton('Delete', 'delete', () => deleteTask(activeTab, index));
    rightContainer.appendChild(deleteBtn);

    const topRow = document.createElement('div');
    topRow.className = 'task-row';
    topRow.append(leftContainer, rightContainer);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Last modified: ${task.modified}`;

    taskEl.append(topRow, meta);
    taskListElement.appendChild(taskEl);
  });
}

// Filter tasks across all tabs based on search term
function filterTasks() {
  const searchTerm = document.getElementById('task-search').value.toLowerCase();

  if (!searchTerm) {
    updateUI(getActiveTab());
    return;
  }

  taskListElement.innerHTML = '';
  let foundAny = false;

  ['todo', 'completed', 'archived'].forEach(tab => {
    const filtered = tasks[tab].filter(task => task.text.toLowerCase().includes(searchTerm));

    if (filtered.length > 0) {
      foundAny = true;

      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = capitalize(tab) + ' Tasks';
      sectionTitle.className = 'section-title';
      taskListElement.appendChild(sectionTitle);

      filtered.forEach((task, indexInFiltered) => {
        const originalIndex = tasks[tab].findIndex(t => t.text === task.text && t.modified === task.modified);

        const taskEl = document.createElement('div');
        taskEl.className = 'task';

        const leftContainer = document.createElement('div');
        leftContainer.className = 'task-left';

        const text = document.createElement('div');
        text.className = 'task-text';
        text.textContent = task.text;
        leftContainer.appendChild(text);

        // Add action buttons
        if (tab === 'todo') {
          leftContainer.append(
            createButton('Mark as Completed', 'complete', () => moveTask('todo', 'completed', originalIndex)),
            createButton('Archive', 'archive', () => moveTask('todo', 'archived', originalIndex))
          );
        } else if (tab === 'completed') {
          leftContainer.append(
            createButton('Move to Todo', 'restore', () => moveTask('completed', 'todo', originalIndex)),
            createButton('Archive', 'archive', () => moveTask('completed', 'archived', originalIndex))
          );
        } else {
          leftContainer.append(
            createButton('Move to Todo', 'restore', () => moveTask('archived', 'todo', originalIndex)),
            createButton('Move to Completed', 'complete', () => moveTask('archived', 'completed', originalIndex))
          );
        }

        const rightContainer = document.createElement('div');
        rightContainer.className = 'task-right';

        const deleteBtn = createButton('Delete', 'delete', () => deleteTask(tab, originalIndex));
        rightContainer.appendChild(deleteBtn);

        const topRow = document.createElement('div');
        topRow.className = 'task-row';
        topRow.append(leftContainer, rightContainer);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `Last modified: ${task.modified}`;

        taskEl.append(topRow, meta);
        taskListElement.appendChild(taskEl);
      });
    }
  });

  if (!foundAny) {
    const noResult = document.createElement('div');
    noResult.className = 'task empty';
    noResult.textContent = 'No matching tasks found.';
    taskListElement.appendChild(noResult);
  }
}

// Show/hide clear button and run filtering
function handleSearchInput() {
  const input = document.getElementById('task-search');
  const clearBtn = document.getElementById('clear-search');

  if (input.value.trim() !== '') {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  filterTasks();
}

// Clear search input and restore UI
function clearSearch() {
  const input = document.getElementById('task-search');
  input.value = '';
  document.getElementById('clear-search').classList.add('hidden');
  updateUI(getActiveTab());
}

// Confirm and delete task
function deleteTask(stage, index) {
  const modal = document.getElementById('confirm-modal');
  const message = document.getElementById('confirm-message');
  const yesBtn  = document.getElementById('confirm-yes');
  const noBtn   = document.getElementById('confirm-no');

  message.textContent = "Are you sure you want to delete this task?";
  modal.classList.add('show');

  const cleanup = () => {
    modal.classList.remove('show');
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };

  yesBtn.onclick = () => {
    tasks[stage].splice(index, 1);
    saveTasks();
    updateUI(stage);
    showNotification('Task deleted!');
    cleanup();
  };
  noBtn.onclick = cleanup;
}

// Close modal manually
document.getElementById('modal-close').onclick = () => {
  document.getElementById('confirm-modal').classList.remove('show');
};

// Reusable button creator with optional icon
function createButton(text, className, onClick) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.onclick = onClick;

  if (className === 'delete') {
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 6h18v2H3zm2 3h14v13H5zm3 2v9h2v-9zm4 0v9h2v-9zm4 0v9h2v-9z"/>
      </svg>
    `;
    btn.title = text;
    btn.classList.add('icon-button');
  } else {
    btn.textContent = text;
  }

  return btn;
}

// Move task between lists and update UI
function moveTask(from, to, index) {
  const task = tasks[from].splice(index, 1)[0];
  task.modified = formatDate(new Date());
  tasks[to].unshift(task);
  saveTasks();
  updateUI(from);
  filterTasks(); // maintain search state
  showNotification(`Task moved to ${capitalize(to)}.`);
}

// Show success toast when adding task
function showAddTaskNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('hidden');
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.classList.add('hidden'), 400);
  }, 2000);
}

// Add new task with error feedback if empty
function addTask() {
  const input = document.getElementById('new-task');
  const value = input.value.trim();
  const error = document.getElementById('task-error');

  if (!value) {
    error.classList.remove('hidden');
    error.classList.add('show');
    input.classList.add('error-shake');
    setTimeout(() => input.classList.remove('error-shake'), 300);
    setTimeout(() => {
      error.classList.remove('show');
      error.classList.add('hidden');
    }, 2500);
    return;
  }

  tasks.todo.unshift({
    text: value,
    modified: formatDate(new Date()),
  });

  input.value = '';
  saveTasks();
  updateUI('todo');
  filterTasks();
  showAddTaskNotification("Task added successfully!");
}

// Format date in readable format
function formatDate(date) {
  return date.toLocaleString('en-US');
}

// Generic toast notification
function showNotification(msg) {
  notification.innerHTML = msg;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 3000);
}

// Activate tab and load corresponding tasks
function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.tab:nth-child(${tabName === 'todo' ? 1 : tabName === 'completed' ? 2 : 3})`).classList.add('active');
  document.getElementById('task-search').value = '';
  updateUI(tabName);
}

// Get current tab from UI
function getActiveTab() {
  const activeTab = document.querySelector('.tab.active');
  if (activeTab.textContent.includes('Todo')) return 'todo';
  if (activeTab.textContent.includes('Completed')) return 'completed';
  return 'archived';
}

// Capitalize first letter of string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initial load
loadInitialData();

// Animate task fade-in on page load
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".task").forEach((el, i) => {
    el.style.animationDelay = `${i * 100}ms`;
    el.classList.add("fade-in");
  });
});
