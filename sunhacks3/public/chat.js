


// Replace WebSocket with HTTP API calls to serverless endpoints
const API_BASE = '';
let pollInterval = null;
const messages = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const usernameInput = document.getElementById('username');
const usersDiv = document.getElementById('users');

let selectedRecipient = null;

function appendMessage(text, sender = 'bot', timestamp = null) {
  const div = document.createElement('div');
  div.className = 'message ' + sender;

  const msgText = document.createElement('div');
  msgText.className = 'message-text';
  msgText.textContent = text;

  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  const time = timestamp ? new Date(timestamp) : new Date();
  // Format to HH:MM (local)
  timeDiv.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.appendChild(msgText);
  div.appendChild(timeDiv);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Register user
usernameInput.addEventListener('change', async () => {
  const username = usernameInput.value.trim();
  if (!username) return;
  try {
    const r = await fetch(`${API_BASE}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    const j = await r.json();
    if (j.ok) {
      usernameInput.disabled = true;
      appendMessage(`System: Registered as ${username}`);
      // start polling for inbox and users
      startPolling();
    } else {
      appendMessage(`System: ${j.error || 'register failed'}`);
    }
  } catch (e) {
    appendMessage('System: could not register');
  }
});

async function fetchUsers() {
  try {
    const r = await fetch(`${API_BASE}/api/users`);
    const j = await r.json();
    if (j.ok) renderUserList(j.users || []);
  } catch (e) {
    // ignore
  }
}

async function pollInbox() {
  const username = usernameInput.value.trim();
  if (!username) return;
  try {
    // get one or more messages by checking inbox list
    const r = await fetch(`${API_BASE}/api/inbox?user=${encodeURIComponent(username)}`);
    if (!r.ok) return;
    const j = await r.json();
    if (j.ok && Array.isArray(j.messages)) {
      j.messages.forEach(m => {
        appendMessage(`${m.sender}: ${m.text}`, 'bot', m.timestamp);
      });
    }
  } catch (e) {
    // ignore
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  fetchUsers();
  pollInbox();
  pollInterval = setInterval(() => {
    fetchUsers();
    pollInbox();
  }, 3000);
}

sendBtn.onclick = () => {
  const msg = input.value.trim();
  const username = usernameInput.value.trim();
  const recipient = selectedRecipient;
  if (!msg || !username || !recipient) return;
  // send via API
  fetch(`${API_BASE}/api/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, recipient, text: msg }) })
    .then(r => r.json())
    .then(j => {
      if (j.ok) {
        appendMessage(`You: ${msg}`, 'user');
      } else {
        appendMessage(`System: ${j.error || 'send failed'}`);
      }
    }).catch(() => appendMessage('System: send failed'));
  input.value = '';
};

function renderUserList(users) {
  usersDiv.innerHTML = '';
  const me = usernameInput.value.trim();
  users.forEach(u => {
    // don't show the current user in the list
    if (me && u.username === me) return;
    const el = document.createElement('div');
    el.className = 'user-item ' + (u.online ? 'online' : '');
    el.dataset.username = u.username;
    el.innerHTML = `<span>${u.username}</span><span class=\"user-badge ${u.online ? 'online':'offline'}\"></span>`;
      el.onclick = () => {
      // select recipient
      const prev = usersDiv.querySelector('.user-item.selected');
      if (prev) prev.classList.remove('selected');
      el.classList.add('selected');
      selectedRecipient = u.username;
      // request history
      if (usernameInput.value.trim()) {
        fetch(`${API_BASE}/api/history?user=${encodeURIComponent(usernameInput.value.trim())}&withUser=${encodeURIComponent(selectedRecipient)}`)
          .then(r => r.json())
          .then(j => {
            if (j.ok) {
              messages.innerHTML = '';
              j.messages.forEach(m => appendMessage(`${m.sender}: ${m.text}`, m.sender === usernameInput.value.trim() ? 'user' : 'bot', m.timestamp));
            }
          }).catch(() => {});
      }
    };
    usersDiv.appendChild(el);
  });
  // If the selected recipient is now the current user (or was removed), clear selection
  if (selectedRecipient && me && selectedRecipient === me) {
    selectedRecipient = null;
    messages.innerHTML = '';
  }
}
