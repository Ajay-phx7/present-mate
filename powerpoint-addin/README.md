# PresentMate — PowerPoint Office Add-in

A Microsoft PowerPoint Task Pane Add-in built with React + Office.js. Displays AI-generated slide summaries, key points, and live Q&A hints inside PowerPoint — working alongside the PresentMate Chrome Extension.

---

## Architecture

```
PowerPoint Add-in (Office.js + React)
    │  reads slides via Office.js
    │  REST polls for hints / Q&A
    ▼
FastAPI Backend (localhost:8000)
    │  AI processing (Gemini)
    │  MongoDB storage
    ▲
Chrome Extension (browser speech recognition)
    │  captures mic input → sends questions to backend
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 14 |
| npm | ≥ 8 |
| Microsoft PowerPoint | Desktop 2016+ or PowerPoint Online |
| PresentMate Backend | running on `http://localhost:8000` |

---

> **Important**: If on Windows, run these commands in standard **Command Prompt (cmd)** rather than PowerShell, as PowerShell's default execution policy blocks `npm` scripts.

## Installation

```cmd
cd powerpoint-addin
npm install
```

This installs React, Office.js types, Webpack, Babel, and the office-addin-dev-certs package (which creates local HTTPS certs required for sideloading).

---

## Development Server

```cmd
npm run dev-server
```

The add-in dev server starts at **https://localhost:3001**. On first run, `office-addin-dev-certs` will prompt to install a self-signed certificate — accept it.

---

## Sideloading into PowerPoint Desktop (Windows)

1. Open **Microsoft PowerPoint**.
2. Go to **Insert → Add-ins → My Add-ins → Upload My Add-in**.
3. Click **Browse** and select `powerpoint-addin/manifest.xml`.
4. Click **Upload**.
5. The **PresentMate** button appears in the **Home** tab ribbon.
6. Click it to open the task pane.

**Alternative (via registry):**
```
HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\WEF\Developer
```
Add a string value pointing to the full path of `manifest.xml`.

---

## Sideloading into PowerPoint Online

1. Open a presentation in PowerPoint Online.
2. Insert → Office Add-ins → Upload My Add-in.
3. Select `manifest.xml`.

> **Note:** The dev server must be running at `https://localhost:3000` and your machine must be reachable from the browser (same machine for local dev).

---

## Session Flow

```
1. Open PowerPoint with your presentation
2. Open PresentMate task pane (Home → Open PresentMate)
3. Click [Sync Slides] — extracts text via Office.js, uploads to backend
4. Wait for "✓ X slides synced and ready"
5. Click [Start Session] — creates a backend session, task pane goes green
6. Open Chrome Extension in browser, enter the session ID shown in the task pane
7. Navigate PowerPoint slides — task pane auto-updates within ~1.5s
8. Chrome Extension: click Listen to capture audience questions
9. Answer hints appear in the task pane Q&A section within ~2s
```

---

## API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/presentations/from-addin` | Upload slide text, trigger AI processing |
| `GET`  | `/presentations/{id}` | Poll processing status |
| `POST` | `/sessions/start` | Create a new session |
| `POST` | `/sessions/{id}/slide` | Update current slide number |
| `GET`  | `/sessions/{id}/hints/current-slide` | Fetch slide AI hints |
| `GET`  | `/sessions/{id}/latest-response` | Poll for latest Q&A (from extension) |
| `POST` | `/sessions/{id}/end` | End session |

---

## Project Structure

```
powerpoint-addin/
├── manifest.xml              ← Office Add-in manifest
├── package.json
├── tsconfig.json
├── webpack.config.js
├── .babelrc
└── src/
    ├── commands/
    │   ├── commands.html     ← required by manifest (no UI)
    │   └── commands.ts
    └── taskpane/
        ├── taskpane.html     ← HTML shell (loads Office.js)
        ├── index.tsx         ← React entry (Office.onReady)
        ├── App.tsx           ← Main layout
        ├── styles.css        ← Global teal-green theme
        ├── services/
        │   ├── officeService.ts  ← Office.js wrappers
        │   └── apiService.ts    ← Backend REST calls
        ├── hooks/
        │   ├── useSession.ts    ← Session state + localStorage
        │   ├── useSlideSync.ts  ← Slide change detection + hints
        │   └── useQA.ts         ← Polling for latest Q&A
        └── components/
            ├── SlideInfo.tsx    ← Slide summary + key points
            ├── QASection.tsx   ← Question + answer hint display
            ├── Controls.tsx    ← Sync/Session buttons
            └── StatusBar.tsx   ← Connection status indicator
```

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Task pane shows "Office.js not available" | Make sure you opened the add-in inside PowerPoint, not a regular browser |
| HTTPS cert error | Run `npx office-addin-dev-certs install` manually |
| Slides not extracted | Some slide shapes don't have `textFrame` — only text boxes/placeholders are read |
| Backend unavailable | Start the FastAPI server: `uvicorn main:app --reload` in `/backend` |
| Q&A not updating | Ensure Chrome Extension uses the same session ID shown in the task pane status bar |

---

## Security Notes

- No API keys are stored in the add-in — all AI processing happens server-side.
- The `user_id` is a simple string for now; replace with real auth in production.
- The add-in only reads slide text — it does not write to or modify the presentation.
