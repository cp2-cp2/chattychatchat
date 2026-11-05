// ================= Initial Setup & Data =================
const PROFANITY_LIST = [
  'badword',
  'crap',
  'heck',
  'darn',
  'stupid',
  'idiot',
  'dumb',
]; // Add more as needed

// Initialize Database if empty
if (!localStorage.getItem('users')) {
  const defaultUsers = [
    { name: 'Bot 1', email: 'bot1@bots.com', password: 'password' },
    { name: 'Bot 2', email: 'bot2@bots.com', password: 'password' },
  ];
  localStorage.setItem('users', JSON.stringify(defaultUsers));
  localStorage.setItem('chats', JSON.stringify([]));
}

let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
let currentChatId = null;
let selectedUsersForNewChat = [];

// ================= DOM Elements =================
const screens = {
  auth: document.getElementById('auth-screen'),
  chat: document.getElementById('chat-screen'),
};

const auth = {
  loginSec: document.getElementById('login-section'),
  signupSec: document.getElementById('signup-section'),
  showLogin: document.getElementById('show-login'),
  showSignup: document.getElementById('show-signup'),
  loginBtn: document.getElementById('login-btn'),
  signupBtn: document.getElementById('signup-btn'),
};

const ui = {
  logoutBtn: document.getElementById('logout-btn'),
  userNameDisplay: document.getElementById('current-user-name'),
  userEmailDisplay: document.getElementById('current-user-email'),
  chatList: document.getElementById('chat-list'),
  messagesDiv: document.getElementById('chat-messages'),
  chatTitle: document.getElementById('active-chat-title'),
  chatInputContainer: document.getElementById('chat-input-container'),
  msgForm: document.getElementById('message-form'),
  msgInput: document.getElementById('message-input'),
  chatMain: document.querySelector('.chat-main'),
};

const modal = {
  container: document.getElementById('create-chat-modal'),
  openBtn: document.getElementById('new-chat-btn'),
  closeBtn: document.getElementById('cancel-create-chat'),
  confirmBtn: document.getElementById('confirm-create-chat'),
  search: document.getElementById('user-search'),
  results: document.getElementById('search-results'),
  selectedArea: document.getElementById('selected-users'),
};

const cmds = {
  toggleBtn: document.getElementById('cmd-toggle-btn'),
  menu: document.getElementById('command-menu'),
  list: document.getElementById('command-list').querySelectorAll('li'),
};

// ================= Initialization =================
function init() {
  if (currentUser) {
    showScreen('chat');
    updateSidebarProfile();
    loadChats();
  } else {
    showScreen('auth');
  }
}

function showScreen(screenName) {
  screens.auth.classList.add('hidden');
  screens.chat.classList.add('hidden');
  screens[screenName].classList.remove('hidden');
}

// ================= Authentication =================
auth.showSignup.addEventListener('click', () => {
  auth.loginSec.classList.add('hidden');
  auth.signupSec.classList.remove('hidden');
});

auth.showLogin.addEventListener('click', () => {
  auth.signupSec.classList.add('hidden');
  auth.loginSec.classList.remove('hidden');
});

auth.signupBtn.addEventListener('click', () => {
  const name = document.getElementById('signup-name').value.trim();
  const email = document
    .getElementById('signup-email')
    .value.trim()
    .toLowerCase();
  const password = document.getElementById('signup-password').value;

  // Strict Name Validation: Letters and spaces only, no numbers
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name)) {
    alert(
      'Invalid Name! Please use your REAL NAME. No numbers or special characters allowed.'
    );
    return;
  }

  const users = JSON.parse(localStorage.getItem('users'));
  if (users.find((u) => u.email === email)) {
    alert('Email already in use!');
    return;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  currentUser = newUser;
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  init();
});

auth.loginBtn.addEventListener('click', () => {
  const email = document
    .getElementById('login-email')
    .value.trim()
    .toLowerCase();
  const password = document.getElementById('login-password').value;

  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    init();
  } else {
    alert('Invalid email or password.');
  }
});

ui.logoutBtn.addEventListener('click', () => {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  currentChatId = null;
  init();
});

function updateSidebarProfile() {
  ui.userNameDisplay.textContent = currentUser.name;
  ui.userEmailDisplay.textContent = currentUser.email;
}

// ================= Chat Creation & Search =================
modal.openBtn.addEventListener('click', () => {
  modal.container.classList.remove('hidden');
  selectedUsersForNewChat = [];
  renderSelectedUsers();
  modal.search.value = '';
  modal.results.innerHTML = '';
});

modal.closeBtn.addEventListener('click', () => {
  modal.container.classList.add('hidden');
});

modal.search.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  modal.results.innerHTML = '';

  if (!query) return;

  const users = JSON.parse(localStorage.getItem('users'));
  const matches = users.filter(
    (u) =>
      u.email !== currentUser.email &&
      (u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query))
  );

  matches.forEach((user) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span class="res-name">${user.name}</span>
      <span class="res-email">${user.email}</span>
    `;
    div.onclick = () => addUserToSelection(user);
    modal.results.appendChild(div);
  });
});

function addUserToSelection(user) {
  if (!selectedUsersForNewChat.find((u) => u.email === user.email)) {
    selectedUsersForNewChat.push(user);
    renderSelectedUsers();
  }
  modal.search.value = '';
  modal.results.innerHTML = '';
}

function renderSelectedUsers() {
  modal.selectedArea.innerHTML = '';
  selectedUsersForNewChat.forEach((user) => {
    const tag = document.createElement('div');
    tag.className = 'user-tag';
    tag.innerHTML = `${user.name} <span class="remove-tag" onclick="removeUser('${user.email}')">✕</span>`;
    modal.selectedArea.appendChild(tag);
  });
}

window.removeUser = (email) => {
  selectedUsersForNewChat = selectedUsersForNewChat.filter(
    (u) => u.email !== email
  );
  renderSelectedUsers();
};

modal.confirmBtn.addEventListener('click', () => {
  if (selectedUsersForNewChat.length === 0) return;

  const chats = JSON.parse(localStorage.getItem('chats'));
  const allMembers = [currentUser, ...selectedUsersForNewChat];
  const chatName = allMembers.map((m) => m.name.split(' ')[0]).join(', ');

  const newChat = {
    id: Date.now().toString(),
    name: chatName,
    members: allMembers.map((m) => m.email),
    messages: [],
    effect: 'none', // For commands like /effect neon
  };

  chats.push(newChat);
  localStorage.setItem('chats', JSON.stringify(chats));

  modal.container.classList.add('hidden');
  loadChats();
  openChat(newChat.id);
});

// ================= Chat Rendering & Logic =================
function loadChats() {
  ui.chatList.innerHTML = '';
  const chats = JSON.parse(localStorage.getItem('chats')) || [];

  const myChats = chats.filter((c) => c.members.includes(currentUser.email));

  myChats.forEach((chat) => {
    const div = document.createElement('div');
    div.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    div.textContent = chat.name;
    div.onclick = () => openChat(chat.id);
    ui.chatList.appendChild(div);
  });
}

function openChat(chatId) {
  currentChatId = chatId;
  loadChats(); // refresh active state
  ui.chatInputContainer.classList.remove('hidden');
  renderMessages();
}

function renderMessages() {
  if (!currentChatId) return;

  const chats = JSON.parse(localStorage.getItem('chats'));
  const chat = chats.find((c) => c.id === currentChatId);

  if (!chat) return;

  ui.chatTitle.textContent = chat.name;
  ui.messagesDiv.innerHTML = '';

  // Apply Effect
  ui.chatMain.className = 'chat-main'; // reset
  if (chat.effect !== 'none') {
    ui.chatMain.classList.add(`effect-${chat.effect}`);
  }

  chat.messages.forEach((msg) => {
    const isMine = msg.senderEmail === currentUser.email;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMine ? 'mine' : ''}`;

    msgDiv.innerHTML = `
      <div class="message-meta">
        <span class="msg-sender">${msg.senderName}</span>
        <span class="msg-time">${msg.time}</span>
      </div>
      <div class="msg-text">${msg.text}</div>
    `;
    ui.messagesDiv.appendChild(msgDiv);
  });

  ui.messagesDiv.scrollTop = ui.messagesDiv.scrollHeight;
}

// ================= Messaging & Commands =================
function filterProfanity(text) {
  let filtered = text;
  PROFANITY_LIST.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

ui.msgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let text = ui.msgInput.value.trim();
  if (!text || !currentChatId) return;

  const chats = JSON.parse(localStorage.getItem('chats'));
  const chatIndex = chats.findIndex((c) => c.id === currentChatId);
  let chat = chats[chatIndex];

  // --- COMMAND HANDLING ---
  if (text.startsWith('/')) {
    if (text === '/clear') {
      // Find the last message by this user and remove it
      for (let i = chat.messages.length - 1; i >= 0; i--) {
        if (chat.messages[i].senderEmail === currentUser.email) {
          chat.messages.splice(i, 1);
          break;
        }
      }
    } else if (text === '/clearall') {
      chat.messages = [];
    } else if (text.startsWith('/effect')) {
      const effectName = text.split(' ')[1];
      if (['neon', 'matrix', 'none'].includes(effectName)) {
        chat.effect = effectName;
      }
    }
  } else {
    // Standard Message
    text = filterProfanity(text);
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    chat.messages.push({
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      text: text,
      time: timeString,
    });
  }

  // Save back to DB
  chats[chatIndex] = chat;
  localStorage.setItem('chats', JSON.stringify(chats));

  ui.msgInput.value = '';
  cmds.menu.classList.add('hidden'); // Close cmd menu if open
  renderMessages();
});

// ================= Command Menu UI =================
cmds.toggleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  cmds.menu.classList.toggle('hidden');
});

cmds.list.forEach((item) => {
  item.addEventListener('click', () => {
    ui.msgInput.value = item.getAttribute('data-cmd');
    cmds.menu.classList.add('hidden');
    ui.msgInput.focus();
  });
});

// Hide command menu if clicking outside
document.addEventListener('click', (e) => {
  if (!cmds.menu.contains(e.target) && !cmds.toggleBtn.contains(e.target)) {
    cmds.menu.classList.add('hidden');
  }
});

// ================= Real-Time Sync Magic =================
// This listens to changes in localStorage made by OTHER tabs.
// When Tab 2 saves a message, Tab 1 instantly updates!
window.addEventListener('storage', (e) => {
  if (e.key === 'chats') {
    if (currentUser) {
      loadChats();
      renderMessages();
    }
  }
});

// Start the app
init();

