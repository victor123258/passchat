<div align="center">

# PassChat — 1-Page Passkey Chat Suite

A serverless, real-time **encrypted** chat suite where users **only need a passkey to join**.

**Zero backend. One HTML file. Deploy to GitHub Pages in 2 minutes.**

</div>

---

## What is PassChat?

PassChat is a fully static, single-page messaging app. Anyone who knows the **same passkey** lands in the same private room — no accounts, no signups, no servers. All message content is encrypted in your browser and only people with the passkey can read it.

## Features

- 🔑 **Only a passkey to join** — enter any passkey (e.g. `coffee`, `secret99`) to open a shared private room.
- 🔒 **End-to-End encryption** — AES-256-GCM keys derived from your passkey via WebCrypto PBKDF2. Messages are encrypted/decrypted entirely in the browser.
- 💬 **Rich real-time chat** — text messages, reply, edit, unsend, copy, message reactions (🔥 theme-aware), link previews on the fly, emoji picker, typing indicators.
- 📎 **File sharing** — send images, PDFs, ZIPs, docs, audio, video. Drag-and-drop, clipboard paste, image lightbox preview, quick download.
- 🎙️ **Voice messages** — record audio notes with live timer, waveform preview, and in-chat playback.
- 📞 **WebRTC calls (P2P)** — encrypted voice and video calls, unmute/mute mic, camera flip/toggle, PiP local preview, picture-in-picture, screen sharing, and call timer.
- 🔁 **Live reconnect & failover** — auto-reconnects across multiple public MQTT brokers, with clear connection status in the header.
- 🎨 **Modern responsive UI** — light/dark glassmorphism themes (Midnight Sky, Forest Fresh, Rose Quartz + more), works great on mobile and desktop.
- 💾 **Local encrypted vault** — messages are encrypted and stored locally (IndexedDB) so your history survives refreshes; export/import encrypted backups.
- 🧩 **No build step, no dependencies** — everything runs from a single `index.html` via CDN (Tailwind CSS, MQTT.js). The bundled React demo app and Express server are optional extras, not required.

## Try it live

Host this repo on GitHub Pages:

```
https://<your-username>.github.io/<repo>/
```

Open it in two tabs (or two devices), enter the **same passkey** in both, and start chatting instantly.

> Demo passkeys: `lounge`, `dev-squad`, `the-vault` — or invent your own!

## How to Host on GitHub Pages (2 minutes)

1. Create a new repository on GitHub.
2. Upload `index.html` (and `public/index-github-pages.html` if you want the downloadable copy) into the **root** of the repository.
3. Go to **Settings → Pages**.
4. Set **Source** to `Deploy from a branch`, **Branch** to `main`, **Folder** to `/ (root)`.
5. Click **Save**. Your chat is live at `https://<username>.github.io/<repo>/`.

## How encryption works

- Your passkey goes through **PBKDF2** (200k iterations, random salt) to derive a symmetric AES-256-GCM key.
- Every message and file is encrypted with that key **before** leaving the browser, and decrypted only on the clients that share the passkey.
- MQTT WebSocket is only used as a public relay for the already-encrypted blobs — the broker never sees plaintext.
- The room's random salt is stored encrypted with the passkey, so your messages stay unreadable even if someone dumps the relay traffic.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | ⭐ **The entire app** — the file you deploy. |
| `public/index-github-pages.html` | Downloadable mirror, byte-identical to `index.html`. |
| `src/`, `server.ts`, `vite.config.*` | Optional React demo + Express/WebSocket server (not required for GitHub Pages). |
| `README-GITHUB-PAGES.md` | Quick hosting guide. |

## Privacy notes

- Messages are stored on **no server** — only public MQTT brokers relay the ciphertext in transit, and peers via WebRTC directly.
- Your browser keeps an optional **local (IndexedDB) copy** for history across refreshes. Use the vault panel to export, import, or shred it on demand.

---

<div align="center"><sub>Made with ❤️ · Works everywhere, depends on nothing.</sub></div>