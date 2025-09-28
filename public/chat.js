


const ws = new WebSocket(`ws://${location.host}/ws`);
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

ws.onopen = () => {
  // Register username only after user enters it
  usernameInput.addEventListener('change', () => {
    const username = usernameInput.value.trim();
    if (username) {
      ws.send(JSON.stringify({ type: 'register', username }));
    }
  });
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.error) {
    appendMessage(`System: ${data.error}`);
    return;
  }
  // Handle userlist updates
  if (data.type === 'userlist') {
    renderUserList(data.users || []);
    return;
  }
  // History payload
  if (data.type === 'history') {
    // clear current messages and render history
    messages.innerHTML = '';
    data.messages.forEach(m => {
      const cls = m.sender === usernameInput.value.trim() ? 'user' : 'bot';
      appendMessage(`${m.sender}: ${m.text}`, cls, m.timestamp);
    });
    return;
  }
  // Only display messages, not registration info or system info
  if (data.type === 'message') {
    const username = data.username;
    const text = data.text || '';
    // Only show incoming messages from others (and show timestamp)
    if (username !== usernameInput.value.trim()) {
      if(username === recipient){
           appendMessage(`${username}: ${text}`, 'bot', data.timestamp);
      }
     
    }
    return;
  }
  if (data.info) {
    appendMessage(`System: ${data.info}`);
    // If registration succeeded, disable username input to prevent changes from this instance
    if (data.info.startsWith('Registered as')) {
      usernameInput.disabled = true;
    }
  }
};

sendBtn.onclick = () => {
  const msg = input.value.trim();
  const username = usernameInput.value.trim();
  const recipient = selectedRecipient;
  if (!msg || !username || !recipient) return;
  ws.send(JSON.stringify({ type: 'message', text: msg, username, recipient }));
  appendMessage(`You: ${msg}`, 'user');
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
        ws.send(JSON.stringify({ type: 'history', with: selectedRecipient }));
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
