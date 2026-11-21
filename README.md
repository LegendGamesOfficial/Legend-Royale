# Legend Royale

**Exact Title:** `Legend Royale`

A modular, browser-based 3D Battle Royale game built with **Three.js**, **HTML5**, **CSS3**, and **ES6 Modules**, designed for static hosting on **GitHub Pages**.

## Key Features
- **Modular Architecture:** Clean separation across `core/`, `player/`, `animation/`, `bots/`, `combat/`, `inventory/`, `building/`, `world/`, `storm/`, `audio/`, `cosmetics/`, `ui/`, `lobby/`, `progression/`, and `utils/`.
- **100-Combatant Matches:** Spawn Island -> Battle Bus -> Skydiving/Gliding -> 99 AI Bots with 6 personalities (`Aggressive`, `Defensive`, `Builder`, `Explorer`, `Balanced`, `Opportunistic`) and staggered AI scheduling.
- **Full Map & Minimap:** Press `M` (or click **MAP**) for full-screen island map with zoom, pan, POIs, storm circles, and click-to-place waypoints.
- **3D Cosmetic Preview & Emote Wheel:** Interactive orbit/zoom 3D preview in Lobby, Locker, and Item Shop, plus in-game `B` Emote Wheel.
- **Multi-Channel Web Audio:** Procedural music, SFX, and ambient audio with independent Master, Music, SFX, and Ambient sliders.

## Security & Backend Limitation
GitHub Pages serves static files only. Accounts (`accounts/accounts.json`), `localStorage` (`lr_accounts_v1`), L-Bucks, and Item Shop purchases are **local client-side progression**. Before any commercial release, move authentication, currency ledgers, and shop validation to an authoritative backend.

## Running Locally & Deploying to GitHub Pages
- **Local:** `npm start` (or any static HTTP server, e.g. `python3 -m http.server 8080`)
- **Tests:** `npm test`
- **GitHub Pages:** Push this folder to your repository root and enable **Settings -> Pages -> Deploy from a branch (`main`, `/ (root)`)**.
