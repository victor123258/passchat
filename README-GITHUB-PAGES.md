# PassChat - 1-Page Passkey Suite for GitHub Pages

A serverless, real-time encrypted communication suite where users **only need a passkey to join**.

## Features Included (100% 1-Page Static)
- **Only Passkey to Join**: Enter any passkey (e.g. `coffee`, `secret99`). Anyone with the same passkey connects to the same private room.
- **WebRTC Voice Call (P2P)**: Encrypted browser-to-browser voice calling with mute toggle, timer, and active audio indicator.
- **WebRTC Video Call (P2P)**: High-definition video calling with Picture-in-Picture (PIP) local preview, remote video feed, camera flip/toggle, and mic controls.
- **Voice Messages (Audio Notes)**: Record and send voice messages directly with audio waveform preview, recording timer, and integrated custom playback.
- **File Sharing (Any File)**: Send PDFs, ZIP archives, documents, images, audio, and videos. Supports Drag-and-Drop and clipboard pasting with quick download buttons.
- **End-to-End Encryption**: Derived from your passkey using browser WebCrypto (AES-GCM 256-bit with PBKDF2).
- **Zero Server Setup**: Ready for instant deployment on GitHub Pages.

## How to Host on GitHub Pages
1. Push this repository to GitHub.
2. In your repository on GitHub, go to **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`), Folder: `/ (root)`
4. Click **Save**.
5. Your application will be live at `https://<username>.github.io/<repo>/`!
