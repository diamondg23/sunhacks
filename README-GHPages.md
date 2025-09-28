Hosting sunhacks2 on GitHub Pages (static-only)

This version converts the chat UI to a static, client-only implementation that uses localStorage and BroadcastChannel to persist messages per-browser and sync between tabs. It's designed for deployment on GitHub Pages.

What it does
- The app stores users and message history in the browser's localStorage.
- BroadcastChannel (or storage events) are used to sync messages across tabs in the same browser.

Limitations
- Data is stored only in each user's browser. Messages are not shared across different devices or different browsers.
- Not suitable for multi-user chat across the internet — only a single-browser / tab-synced demo.

How to deploy to GitHub Pages
1. Push the repository to GitHub.
2. In the repository settings, enable GitHub Pages and select the `main` branch (or `gh-pages`) and `/root` or `/docs` depending on where you place the `sunhacks2/public` files.
3. You can move the contents of `sunhacks2/public` to the repository root or `docs/` folder so GitHub Pages serves them.

If you want real multi-user behavior across devices, you'll need a backend (Redis, Vercel KV, Supabase, etc.).
