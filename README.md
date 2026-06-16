# CSES Progress Dashboard — Chrome Extension

A premium dark-mode Chrome Extension for tracking your CSES problem-solving progress.

---

## 🚀 How to Load the Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder inside `C:\Users\NISARG VEKARIYA\Desktop\CSES Extension\dist`
5. The extension is now installed! Click the puzzle piece icon in Chrome toolbar to pin it.

---

## 📁 Project Structure

```
src/
├── content/
│   ├── username.ts         # Auto-detects logged-in username from CSES nav
│   ├── solvedProblems.ts   # Scrapes solved problems from problemset + task pages
│   └── bookmarks.ts        # Injects ⭐ button on task pages
│
├── popup/
│   ├── index.tsx           # React root
│   ├── index.css           # Tailwind + custom dark-mode styles
│   ├── App.tsx             # State management + streak calculation
│   ├── Dashboard.tsx       # Main layout with tabs (Overview / Topics / Bookmarks)
│   ├── PieChart.tsx        # Recharts donut chart (Solved vs Unsolved)
│   ├── Heatmap.tsx         # react-calendar-heatmap (365 days)
│   ├── TopicProgress.tsx   # Per-category progress bars
│   └── MarkedProblems.tsx  # Bookmarked problems grouped by category
│
├── services/
│   ├── storage.ts          # All chrome.storage.local operations
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

### Auto Username Detection
- Reads username from CSES navigation when you visit any cses.fi page
- Stored in `chrome.storage.local`, no manual input needed

### Solved Problem Tracking
- Visit `cses.fi/problemset` → bulk scrape all solved problems
- Visit individual task pages → incremental detection of new solves
- Percentages always displayed with 1 decimal place (e.g. `40.9%`)

### Dashboard (3 Tabs)

**Overview Tab:**
- Stats: Solved / Total / Completion % / Bookmarks
- Current Streak + Best Streak with 🔥 and 🏆 icons
- Overall progress bar
- Recharts donut pie chart (green = solved, grey = unsolved)
- GitHub-style activity heatmap for the last 365 days

**Topics Tab:**
- All CSES categories in official order
- Color-coded per-category progress bars
- `solved / total (XX.X%)` format

**Bookmarks Tab:**
- Bookmarked problems grouped by official category
- Alphabetically sorted within each category
- Green dot = solved, grey dot = unsolved
- Click external link icon to open on CSES
- Click ⭐ to remove bookmark

### Bookmark Button
- Appears on every `cses.fi/problemset/task/*` page
- Click to toggle ⭐ bookmark state
- Persists across browser sessions

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

```javascript
chrome.storage.local = {
  username: "Nisarg",
  solvedProblems: {
    "1635": true,
    "1097": true,
    ...
  },
  bookmarks: {
    "1635": true,
    "1097": true
  },
  heatmapData: {
    "2026-05-01": 3,
    "2026-05-02": 1,
    ...
  },
  lastUpdated: 1749282311000
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
