# PassChat - 1-Page Static Passkey Chat for GitHub Pages

A serverless, real-time encrypted chat application where users **only need a passkey to join**.

## Why did GitHub Pages show a white page before?
Previously, the root repository had an uncompiled Vite template (`/src/main.tsx`). GitHub Pages cannot compile TypeScript or execute `.tsx` files directly, so it showed a blank white screen.

## How it works now
The root **`index.html`** is now a **fully standalone, production-ready single-page application** that runs natively in any browser with zero compilation!

When you push this repository to GitHub:
1. Go to your GitHub repository **Settings** → **Pages**.
2. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`), and folder `/ (root)`
3. Click **Save**.
4. GitHub Pages will immediately serve `index.html`. Refresh the page — your chat will appear instantly with no white screen!

## Features
- **Only Passkey to Join**: Enter any passkey (e.g., `coffee`, `secret99`, `team`). Anyone who enters that exact passkey joins the same private room.
- **Direct Link Support**: Share `https://<username>.github.io/<repo>/#coffee` to auto-fill the passkey for 1-click access.
- **Client-Side AES-256 E2E Encryption**: Messages are encrypted directly in the browser via WebCrypto API (AES-GCM 256-bit with PBKDF2) derived from the passkey.
- **Serverless WebSockets**: Connects over secure SSL WebSockets using public MQTT brokers and local `BroadcastChannel` for tab-to-tab sync.
- **Zero Server Costs**: Completely static, free hosting on GitHub Pages.
