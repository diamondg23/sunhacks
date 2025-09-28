Serverless-ready chat (sunhacks3)

This folder contains a converted version of the simple chat app that uses serverless HTTP endpoints and Upstash Redis to store users, inbox and history. It's prepared for deployment on Vercel.

What changed
- Replaced WebSocket server with Vercel serverless functions under `api/`.
- Client (`public/chat.js`) now uses fetch + polling to talk to the API.
- Uses Upstash Redis to persist users, inbox and history.

Required environment variables (set these on Vercel):
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Deploy steps
1. Create an Upstash Redis instance and copy the REST URL and token.
2. Create a new Vercel project and connect this repository/folder.
3. Add the two environment variables above in the Vercel dashboard.
4. Deploy. The static `public/` folder will be served and API endpoints will be available under `/api/*`.

Notes and limitations
- This is a minimal conversion to be deployable quickly. It uses polling for simplicity — you can swap to WebSocket via Vercel's WebSocket-compatible server or use a realtime transform (Pusher, Supabase Realtime) if needed.
- Message history and inbox are stored in Redis lists. No authentication is implemented, so treat usernames as public and not secret.
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
