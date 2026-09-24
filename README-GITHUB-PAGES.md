# PassChat - 1-Page HTML for GitHub Pages

A serverless, real-time encrypted chat application where users **only need a passkey to join**.

## Quick Deployment to GitHub Pages (2 Minutes)

1. **Get the single-page HTML file**:
   - In the web app UI, click **"GitHub Pages 1-Page HTML"** → **"Download index.html"**
   - Or directly grab the file located at `public/index-github-pages.html` in this repo and rename it to `index.html`.

2. **Create a GitHub repository**:
   - Go to [github.com/new](https://github.com/new) and create a repository (e.g. `passchat`).
   - Upload `index.html` to the repository root.
   - Commit changes.

3. **Enable GitHub Pages**:
   - In your repository, go to **Settings** → **Pages** (under Code and automation).
   - Under **Build and deployment**:
     - **Source**: `Deploy from a branch`
     - **Branch**: `main` (or `master`) and folder `/(root)`
   - Click **Save**.
   - Your chat site will be live at `https://<username>.github.io/<repo>/`!

## Features

- **Only Passkey to Join**: Enter any passkey (e.g. `coffee`, `secret99`). Anyone with the same passkey connects to the same private room.
- **Direct Share Links**: Share `https://<username>.github.io/<repo>/#coffee` to let friends auto-fill the passkey with 1 click.
- **End-to-End Encryption**: Messages are encrypted in the browser using the WebCrypto API (AES-GCM 256-bit with PBKDF2) derived directly from your passkey.
- **Real-Time WebSockets**: Connects over secure SSL WebSockets (WSS) via public MQTT broker and local `BroadcastChannel` with zero backend setup.
- **Zero Server Costs**: Completely static, hosted for free on GitHub Pages.
