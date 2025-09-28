


// Client-only chat using localStorage + BroadcastChannel for tab-to-tab realtime.
// Works as a static app (GitHub Pages). Persistence is per-browser and messages sync across tabs only.

const messages = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const usernameInput = document.getElementById('username');
const usersDiv = document.getElementById('users');

let selectedRecipient = null;
const BC = (window.BroadcastChannel) ? new BroadcastChannel('chat_channel') : null;

function appendMessage(text, sender = 'bot', timestamp = null) {
  const div = document.createElement('div');
  div.className = 'message ' + sender;

  const msgText = document.createElement('div');
  msgText.className = 'message-text';
  msgText.textContent = text;

  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  const time = timestamp ? new Date(timestamp) : new Date();
  timeDiv.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.appendChild(msgText);
  div.appendChild(timeDiv);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Storage helpers
function loadUsers() {
  try { return JSON.parse(localStorage.getItem('chat_users') || '[]'); } catch { return []; }
}
function saveUsers(users) { localStorage.setItem('chat_users', JSON.stringify(users)); }

function addUser(username) {
  const users = loadUsers();
  if (!users.includes(username)) {
    users.push(username);
    saveUsers(users);
    broadcast({ type: 'userlist' });
  }
}

function getHistoryKey(a, b) { return `history:${a}:${b}`; }
function loadHistory(a, b) {
  try { return JSON.parse(localStorage.getItem(getHistoryKey(a,b)) || '[]'); } catch { return []; }
}
function saveHistory(a, b, list) { localStorage.setItem(getHistoryKey(a,b), JSON.stringify(list)); }

function broadcast(msg) {
  if (BC) BC.postMessage(msg);
  // also write to localStorage to trigger storage events for non-BroadcastChannel environments
  localStorage.setItem('chat_event', JSON.stringify({ v: Date.now(), msg }));
}

// React to cross-tab messages
if (BC) {
  BC.onmessage = (ev) => handleEvent(ev.data);
}
window.addEventListener('storage', (ev) => {
  if (ev.key === 'chat_event' && ev.newValue) {
    try { const obj = JSON.parse(ev.newValue); if (obj && obj.msg) handleEvent(obj.msg); } catch {}
  }
});

function handleEvent(data) {
  if (!data || !data.type) return;
  if (data.type === 'message') {
    const { sender, recipient, text, timestamp } = data;
    // save to history for both sides
    const histA = loadHistory(sender, recipient);
    histA.push({ sender, text, timestamp });
    saveHistory(sender, recipient, histA);
    const histB = loadHistory(recipient, sender);
    histB.push({ sender, text, timestamp });
    saveHistory(recipient, sender, histB);
    // If current view is the conversation, append
    if (selectedRecipient && ((sender === selectedRecipient && usernameInput.value.trim() !== sender) || sender === usernameInput.value.trim())) {
      appendMessage(`${sender}: ${text}`, sender === usernameInput.value.trim() ? 'user' : 'bot', timestamp);
    }
  } else if (data.type === 'userlist') {
    renderUserList(loadUsers());
  }
}

// UI interactions
usernameInput.addEventListener('change', () => {
  const username = usernameInput.value.trim();
  if (!username) return;
  addUser(username);
  usernameInput.disabled = true;
  appendMessage(`System: Registered as ${username}`);
  renderUserList(loadUsers());
});

sendBtn.onclick = () => {
  const msg = input.value.trim();
  const username = usernameInput.value.trim();
  const recipient = selectedRecipient;
  if (!msg || !username || !recipient) return;
  const ts = Date.now();
  // Broadcast message to other tabs and save locally
  const payload = { type: 'message', sender: username, recipient, text: msg, timestamp: ts };
  broadcast(payload);
  // Also handle locally so sender sees confirmation immediately
  handleEvent(payload);
  appendMessage(`You: ${msg}`, 'user');
  input.value = '';
};

function renderUserList(users) {
  usersDiv.innerHTML = '';
  const me = usernameInput.value.trim();
  users.forEach(u => {
    if (me && u === me) return;
    const el = document.createElement('div');
    el.className = 'user-item';
    el.dataset.username = u;
    el.innerHTML = `<span>${u}</span>`;
    el.onclick = () => {
      const prev = usersDiv.querySelector('.user-item.selected');
      if (prev) prev.classList.remove('selected');
      el.classList.add('selected');
      selectedRecipient = u;
      // render history
      if (usernameInput.value.trim()) {
        const conv = loadHistory(usernameInput.value.trim(), selectedRecipient);
        messages.innerHTML = '';
        conv.forEach(m => appendMessage(`${m.sender}: ${m.text}`, m.sender === usernameInput.value.trim() ? 'user' : 'bot', m.timestamp));
      }
    };
    usersDiv.appendChild(el);
  });
  if (selectedRecipient && me && selectedRecipient === me) { selectedRecipient = null; messages.innerHTML = ''; }
}

// initial render
renderUserList(loadUsers());
