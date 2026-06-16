# CSES Progress Dashboard — Chrome Extension

A premium dark-mode Chrome Extension for tracking your CSES problem-solving progress.

---

## 🚀 How to Load the Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder inside your built project directory.
5. The extension is now installed! Click the puzzle piece icon in Chrome toolbar to pin it.

---

## 📁 Project Structure

```
src/
├── content/
│   ├── username.ts         # Auto-detects logged-in username (handles logouts)
│   ├── solvedProblems.ts   # Scrapes solved problems & injects random/filter buttons
│   ├── bookmarks.ts        # Injects ⭐ button on task pages
│   ├── injectDashboard.ts  # Injects the drop-down dashboard right into CSES
│   ├── submitEditor.ts     # Enhances the CSES submission page with code pasting
│   └── copyBlocks.ts       # Codeforces-style copy buttons for CSES code blocks
│
├── popup/
│   ├── index.tsx           # React root
│   ├── index.css           # Tailwind + custom dark-mode styles
│   ├── App.tsx             # State management + authentication guard
│   ├── Dashboard.tsx       # Main layout with tabs (Overview / Topics / Bookmarks)
│   ├── PieChart.tsx        # Recharts donut chart (Solved vs Unsolved)
│   ├── Heatmap.tsx         # react-calendar-heatmap (365 days)
│   ├── TopicProgress.tsx   # Per-category progress bars
│   └── MarkedProblems.tsx  # Bookmarked problems grouped by category
│
├── services/
│   ├── storage.ts          # Storage operations (handles multi-account data isolation)
│   └── parser.ts           # DOM parsing helpers for content scripts
│
├── data/
│   └── cses-problems.json  # Static map: ID → { title, category }
│
├── background/
│   └── sync.ts             # Message hub service worker
│
└── types/
    └── react-calendar-heatmap.d.ts  # Type declarations
```

---

## ✨ Features

### 🔐 Multi-Account & Auth Support
- **Isolated Data:** Your progress, bookmarks, and heatmap are securely tied to your CSES username. If you share your computer, the extension seamlessly switches data profiles when a different user logs into CSES!
- **Auto Username Detection:** Reads username from the CSES navigation bar automatically.
- **Privacy First:** If you log out, the dashboard securely hides your stats and pauses DOM tracking to save resources.

### 📈 Solved Problem Tracking
- Visit `cses.fi/problemset` → bulk scrape all solved problems
- Visit individual task pages → incremental detection of new solves
- Percentages always displayed with 1 decimal place (e.g. `40.9%`)

### 🗂️ Popup Dashboard (3 Tabs)
**Overview Tab:**
- Stats: Solved / Total / Completion % / Bookmarks
- Current Streak + Best Streak with 🔥 and 🏆 icons
- Recharts donut pie chart (green = solved, grey = unsolved)
- GitHub-style activity heatmap for the last 365 days

**Topics Tab:**
- All CSES categories in official order
- Color-coded per-category progress bars

**Bookmarks Tab:**
- Bookmarked problems grouped by official category
- External links to problems and quick-remove buttons

### 💉 In-Page DOM Injections
- **Code Paster:** Replaces the clunky file upload on `cses.fi/submit` with a smooth code pasting text area.
- **Copy Blocks:** Codeforces-style "Copy" buttons injected above every Input/Output block.
- **Bookmark Button:** Appears on every `cses.fi/problemset/task/*` page.
- **In-Page Dashboard:** A beautiful dropdown summary injected straight into the CSES problemset list page.

---

## 🛠 Development

```bash
# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Production build → outputs to dist/
npm run build
```

After `npm run build`, reload the extension at `chrome://extensions/` to see changes.

---

## 📊 Data Storage Schema

Data is stored locally in `chrome.storage.local`. To support multiple accounts securely, keys are prefixed with the active username:

```javascript
chrome.storage.local = {
  // Global active user
  "username": "Nisarg",
  
  // Prefixed data for isolation
  "Nisarg_solvedProblems": {
    "1635": true,
    "1097": true
  },
  "Nisarg_bookmarks": {
    "1635": true
  },
  "Nisarg_heatmapData": {
    "2026-05-01": 3,
    "2026-05-02": 1
  },
  "Nisarg_lastUpdated": 1749282311000
}
```

---

## 🎨 Design Tokens

| Token | Value |
|---|---|
| Background | `#0f172a` (slate-900) |
| Card background | `rgba(30,41,59,0.7)` |
| Solved color | `#22c55e` (green-500) |
| Unsolved color | `#9ca3af` (gray-400) |
| Streak color | `#f97316` (orange-400) |
| Best streak | `#a855f7` (purple-400) |
| Font | Inter + JetBrains Mono |
