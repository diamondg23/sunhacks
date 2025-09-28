const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
// Removed Fernet as it is not needed for this implementation
// ...existing code...
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// REST API endpoints


const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Simple in-memory chat
// Map usernames to WebSocket connections

// Permanent user registry
let registeredUsers = {};
let userSockets = {};
// Store messages waiting for delivery as { recipient: { sender: [msg,...] } }
let messagesStore = {};
// Conversation history in memory (per-user view): history[userA][userB] = [{ sender, text, timestamp }]
let messagesHistory = {};

wss.on('connection', (ws) => {
    let currentUser = null;
    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
            return;
        }
        // Registration logic
            if (msg.type === 'register' && msg.username) {
                // If this connection already set a username, prevent changing it
                if (currentUser) {
                    ws.send(JSON.stringify({ error: 'Username already set for this connection and cannot be changed.' }));
                    return;
                }
                const username = msg.username.trim();
                console.log(`[DEBUG] Registration request received for username: ${username}`);
                // If already registered, update socket mapping for reconnection
                registeredUsers[username] = registeredUsers[username] || { username, created: Date.now() };
                currentUser = username;
                userSockets[currentUser] = ws;
                if (!messagesStore[currentUser]) messagesStore[currentUser] = {};
                if (!messagesHistory[currentUser]) messagesHistory[currentUser] = {};
                console.log(`[DEBUG] User registered: ${currentUser}`);
                // Send info
                ws.send(JSON.stringify({ info: `Registered as ${currentUser}` }));

                // Deliver any stored messages for this user (offline deliveries)
                if (messagesStore[currentUser]) {
                    for (const sender in messagesStore[currentUser]) {
                        const msgs = messagesStore[currentUser][sender] || [];
                        msgs.forEach(m => {
                            // send to ws
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'message', text: m.text, username: m.username, timestamp: m.timestamp }));
                            }
                            // record into history
                            if (!messagesHistory[currentUser][sender]) messagesHistory[currentUser][sender] = [];
                            messagesHistory[currentUser][sender].push({ sender: m.username, text: m.text, timestamp: m.timestamp });
                            // also keep symmetric history for sender
                            if (!messagesHistory[sender]) messagesHistory[sender] = {};
                            if (!messagesHistory[sender][currentUser]) messagesHistory[sender][currentUser] = [];
                            messagesHistory[sender][currentUser].push({ sender: m.username, text: m.text, timestamp: m.timestamp });
                        });
                    }
                    // clear stored messages
                    messagesStore[currentUser] = {};
                }

                // Broadcast updated user list (presence) to all connected clients
                const onlineUsers = Object.keys(userSockets);
                const userListMsg = JSON.stringify({ type: 'userlist', users: registeredUsers ? Object.keys(registeredUsers).map(u => ({ username: u, online: onlineUsers.includes(u) })) : [] });
                wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(userListMsg); });

                return;
        }
        if (msg.type === 'message') {
            if (msg.username) msg.username = msg.username.trim();
            if (msg.recipient) msg.recipient = msg.recipient.trim();
            const sender = msg.username;
            const recipient = msg.recipient;
            const text = msg.text || '';
            const ts = Date.now();

            // Save to history for both views
            if (!messagesHistory[sender]) messagesHistory[sender] = {};
            if (!messagesHistory[sender][recipient]) messagesHistory[sender][recipient] = [];
            if (!messagesHistory[recipient]) messagesHistory[recipient] = {};
            if (!messagesHistory[recipient][sender]) messagesHistory[recipient][sender] = [];
            const msgObj = { sender, text, timestamp: ts };
            

            // If recipient connected, send immediately
            if (recipient && userSockets[recipient] && userSockets[recipient].readyState === WebSocket.OPEN) {
                   messagesHistory[sender][recipient].push(msgObj);
                   messagesHistory[recipient][sender].push(msgObj);
                userSockets[recipient].send(JSON.stringify({ type: 'message', text, username: sender, timestamp: ts }));
            } else {
                   messagesHistory[sender][recipient].push(msgObj);
                   messagesHistory[recipient][sender].push(msgObj);
                     
                // Store for later delivery
              //  if (!messagesStore[recipient]) messagesStore[recipient] = {};
              //  if (!messagesStore[recipient][sender]) messagesStore[recipient][sender] = [];
              //  messagesStore[recipient][sender].push({ text, username: sender, timestamp: ts });
            }

            // Echo to sender's UI (confirmation)
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'message', text, username: sender, timestamp: ts }));
            }
            // If recipient offline, notify sender
            if (!userSockets[recipient] || userSockets[recipient].readyState !== WebSocket.OPEN) {
                ws.send(JSON.stringify({ info: `Recipient ${recipient} is offline. Message stored for delivery.` }));
            }
        }
        if (msg.type === 'history' && currentUser) {
            const other = (msg.with || '').trim();
            const conv = (messagesHistory[currentUser] && messagesHistory[currentUser][other]) ? messagesHistory[currentUser][other] : [];
            ws.send(JSON.stringify({ type: 'history', with: other, messages: conv }));
        }
        if (msg.type === 'poll' && currentUser) {
            // Return all messages sent to this user
            let allMessages = [];
            if (messagesStore[currentUser]) {
                for (const sender in messagesStore[currentUser]) {
                    allMessages = allMessages.concat(messagesStore[currentUser][sender]);
                }
                // Clear messages after sending
                messagesStore[currentUser] = {};
            }
            allMessages.forEach(m => {
                ws.send(JSON.stringify(m));
            });
        }
    });
    ws.on('close', () => {
        if (currentUser) {
            delete userSockets[currentUser];
            // Broadcast updated user list
            const onlineUsers = Object.keys(userSockets);
            const userListMsg = JSON.stringify({ type: 'userlist', users: registeredUsers ? Object.keys(registeredUsers).map(u => ({ username: u, online: onlineUsers.includes(u) })) : [] });
            wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(userListMsg); });
        }
    });
});

const os = require('os');
const PORT = process.env.PORT || 3000;
// Bind to 0.0.0.0 so the server is reachable from other devices on the LAN
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    // Print local IPv4 addresses for convenience
    const nets = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                addresses.push(net.address);
            }
        }
    }
    if (addresses.length) {
        console.log('Accessible on your LAN at:');
        addresses.forEach(a => console.log(`  http://${a}:${PORT}/public/index.html`));
    } else {
        console.log('No external network interfaces detected — connect locally at http://localhost:' + PORT + '/public/index.html');
    }
});
