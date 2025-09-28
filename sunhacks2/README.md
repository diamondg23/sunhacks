# Node.js Encrypted Chat Backend

This project provides a full chat backend API using Node.js, Express, and WebSocket, with Fernet-compatible encryption for secure messaging.

## Features
- REST API for sending/receiving encrypted messages
- WebSocket for real-time encrypted chat
- Fernet-compatible encryption (using `fernet` npm package)
- Simple in-memory user/session management

## Setup
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open the frontend at `http://localhost:3000/public/index.html` or from another device on your LAN using the IP printed by the server on startup.

### Run and access from other machines on the same LAN
By default the server binds to all interfaces (0.0.0.0) so other devices on your local network can reach it. Start the server and look for lines like:

	Server running on port 3000
	Accessible on your LAN at:
		http://192.168.1.42:3000/public/index.html

If other devices cannot reach the server, you may need to allow port 3000 through Windows Firewall (run PowerShell as Administrator):

```powershell
New-NetFirewallRule -DisplayName "Allow Node 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Remove the rule later with:

```powershell
Remove-NetFirewallRule -DisplayName "Allow Node 3000"
```

## Endpoints
- `POST /api/encrypt` — Encrypt a message
- `POST /api/decrypt` — Decrypt a message
- WebSocket `/ws` — Real-time encrypted chat

## Notes
- Replace in-memory storage with a database for production use.
- Use HTTPS and environment variables for key management in production.
