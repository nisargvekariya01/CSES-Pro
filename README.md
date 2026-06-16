# CSES Pro — Ultimate CSES Enhancer (Chrome Extension)

A premium, feature-rich Chrome Extension that seamlessly enhances your competitive programming experience on [cses.fi](https://cses.fi/). It adds progress tracking, dynamic filtering, Codeforces-style code pasting and input/output copy buttons, streak tracking, and interactive dashboards—fully integrated into the CSES native user interface with adaptive light/dark theme support.

---

## 🚀 How to Install (100% Free & Open Source)

Because we believe this tool should be completely free for student developers, it is **not** published on the official Chrome Web Store (avoiding registration and listing fees). You can easily build and load it directly from the source code.

### 🛠️ Build and Load from Source

1. **Clone or Download the Repository**
   Download this project as a ZIP file and extract it, or clone it using git:
   ```bash
   git clone https://github.com/your-username/cses-pro.git
   cd cses-pro
   ```

2. **Install Developer Dependencies**
   Make sure you have [Node.js](https://nodejs.org/) installed. Run:
   ```bash
   npm install
   ```

3. **Build the Extension**
   Compile the TypeScript files and bundle the extension using Vite:
   ```bash
   npm run build
   ```
   *(Note: On Windows systems with strict script execution policies, you can run `cmd /c "npm run build"`)*

4. **Load the Extension in Google Chrome**
   - Open Chrome and navigate to: `chrome://extensions/`
   - Enable **Developer Mode** by toggling the switch in the top-right corner.
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the newly generated `dist` folder located in your project's root directory.
   - 🎉 You're done! Pin **CSES Pro** to your Chrome toolbar for quick access.

---

## ✨ Features

### 🔐 1. Multi-Account & Authentication Isolation
* **Seamless Switching:** Your solved problem statistics, daily streaks, and bookmarks are isolated and mapped specifically to your active CSES username. If you share a computer, the extension automatically switches user profiles as soon as a different account logs in.
* **Auto-Detection:** The extension reads the logged-in user directly from the CSES header navigation bar.
* **Privacy First:** When logged out, the extension securely unmounts the dashboard, pauses tracking, and protects your database profiles.

#### 🔄 Comparison
| Before (Shared / Mixed Storage) | After (Isolated Profiles & Auto-detection) |
| :---: | :---: |
| ![Logged Out or Mixed State](images/before_auth.png) | ![Isolated Profile Mounted](images/after_auth.png) |

---

### 📊 2. Dynamic In-Page Progress Dashboard
The extension injects a premium dashboard directly at the top of the CSES Problemset pages (`/problemset` and `/problemset/list`) as well as on your public user profile page (`/user/USERNAME`).
* **Collapsible summary panel:** Styled with modern glassmorphism, backdrop filters, and hover transitions that blend natively with both CSES light and dark themes.
* **Interactive SVG Donut Pie Chart:** A smooth visualization showing your Solved vs Unsolved problem ratios.
* **Overall Progress stats:** Real-time problem counts (Solved / Total) and progress percentage calculated to exactly 1 decimal place.
* **Streak Tracking:** Displays your current daily solve streak (🔥) and your all-time best streak (🏆) using date calculation.
* **Category Progress Matrix:** A detailed table listing all CSES categories with custom progress bars indicating completion percentage.

#### 🔄 Comparison
| Before (Linear Task Lists Only) | After (Premium Analytics Overlay) |
| :---: | :---: |
| ![Original CSES Problemset](images/before_dashboard.png) | ![CSES Pro Progress Dashboard](images/after_dashboard.png) |

---

### 🔍 3. Advanced Filtering & Sorting Controls
Injected right below the dashboard, these interactive toggles give you powerful control over the massive CSES problem list:
* **Show Only Marked Problems:** A checkbox filter that instantly narrows down the task lists to show only your bookmarked/starred problems. It automatically collapses and hides empty categories and category headers to clean up your view.
* **Sort by Most Solved:** A checkbox filter that re-orders the problems within each category in descending order of their total solve count (popularity). Unchecking it instantly restores the original CSES ordering.
* **🎲 Random Problem Selector:** Injects a button that redirects you to a random task. If you have "Show only marked problems" active, it intelligently selects from your bookmarked tasks; otherwise, it redirects to any random problem from the entire set.

#### 🔄 Comparison
| Before (Static & Fixed Listings) | After (Interactive Filters, Sorting & Random Pick) |
| :---: | :---: |
| ![Static Problem Grid](images/before_filters.png) | ![Filtering & Sorting Controls](images/after_filters.png) |

---

### 📝 4. Codeforces-Style Code Paste Submit Editor
* Replaces the native, restrictive file upload input on the `cses.fi/submit` page with a clean Codeforces-style code paste editor text area.
* Includes a toggle switch ("Paste code" / "Upload file") so you can switch back to standard file uploads at any time.
* **Auto Language Extension:** Detects your selected language (C++, Python, Java, Rust, etc.) in the dropdown, automatically names the virtual file (e.g., `solution.cpp`, `solution.py`), and handles the multi-part form submission transparently behind the scenes.

#### 🔄 Comparison
| Before (File Upload Only) | After (Text Paste Area with Auto File-Naming) |
| :---: | :---: |
| ![Original File Upload Interface](images/before_editor.png) | ![Code Paste Editor Interface](images/after_editor.png) |

---

### 📋 5. Codeforces-Style Copy Boxes
* Automatically transforms all standard input, output, and code block panels on problem task pages into structured, styled boxes.
* Injects a **"Copy"** button on the title header of each box. Clicking it instantly copies the contents to your clipboard with a 2-second visual confirmation ("Copied!").
* Integrates original page text (e.g., "Input" / "Output" paragraph labels) directly into the box headers for a clean, compact layout.

#### 🔄 Comparison
| Before (Raw Preformatted Text) | After (Copy-to-Clipboard Wrapped Box) |
| :---: | :---: |
| ![Original Text Blocks](images/before_copy.png) | ![Enhanced Copyable Code Boxes](images/after_copy.png) |

---

### ⭐ 6. Problem Bookmark Button
* Injects an elegant star bookmark icon (⭐) directly next to the problem title on all `cses.fi/problemset/task/*` pages.
* Bookmarking a problem highlights its row on the main problem list in a subtle gold accent, making it easy to spot and filter.

#### 🔄 Comparison
| Before (No Problem Bookmarking) | After (One-click Star / Gold Highlighted Rows) |
| :---: | :---: |
| ![No Way to Mark Problems](images/before_bookmark.png) | ![Bookmarked Problem & List Highlight](images/after_bookmark.png) |

---

## 📁 Project Structure

```
CSES Extension/
├── dist/                     # Bundled, ready-to-load Chrome Extension assets (generated on build)
├── icons/
│   └── image.png             # Adaptive extension logo
├── public/
│   └── icons/                # Extension icons/assets (if any)
├── src/
│   ├── background/
│   │   └── sync.ts           # Background service worker message listener
│   ├── content/
│   │   ├── bookmarks.ts      # Bookmarking button injector and click listener
│   │   ├── copyBlocks.ts     # In-page Codeforces-style copy button wrapper
│   │   ├── injectDashboard.ts # In-page dashboard HTML builder and UI injector
│   │   ├── solvedProblems.ts  # Problem scraping, bookmarks filters, sorting, and random button
│   │   ├── submitEditor.ts   # Form submission text area and file naming logic
│   │   └── username.ts       # Active user session detector
│   ├── data/
│   │   └── cses-problems.json # Static mapping of problem IDs to title and category
│   ├── services/
│   │   ├── parser.ts         # DOM querying helpers for username and solves
│   │   └── storage.ts        # User-prefixed local storage wrapper (chrome.storage.local)
│   └── types/                # TS type definitions (empty folder after cleanup)
├── manifest.json             # Manifest V3 extension configuration
├── package.json              # Node.js dependencies and scripts
├── tsconfig.json             # TypeScript rules configuration
└── vite.config.ts            # Vite compiler configuration utilizing @crxjs/vite-plugin
```

---

## ⚙️ How It Works (Under the Hood)

The extension relies on a clean, modular architecture combining Content Scripts, a Background Service Worker, and Chrome's Storage APIs:

1. **Passive Scraping Engine (`solvedProblems.ts`):** Whenever you load the main CSES list, the script scans the page, identifies problems with the green checkmark (`.task-score.full`), and merges them into storage.
2. **Authentication Guards (`username.ts`):** Scans the page header. If a username exists, it loads the corresponding database namespace. If a "Login" button is found, it unmounts the data layout to maintain privacy.
3. **Data Prefixing & Multi-Account Isolation (`storage.ts`):** All saved keys are dynamically prefixed with the active username. For example, if user `Nisarg` is logged in, their solved problems list is stored under `Nisarg_solvedProblems` while another user's is kept under `OtherUser_solvedProblems`.
4. **Reactive Theme Adaptation:** Custom CSS elements use HSL/RGBA colors (e.g. `rgba(128, 128, 128, 0.08)`) and inherit theme colors using CSS variables. A `MutationObserver` actively watches the document `<head>` for stylesheet swaps to toggle custom classes natively.

---

## 📊 Local Storage Data Schema

All data is written to and read from `chrome.storage.local`. Keys are prefixed dynamically:

```javascript
chrome.storage.local = {
  // Global active session pointer
  "username": "NISARG_07",
  
  // User isolated solved problem list
  "NISARG_07_solvedProblems": {
    "1068": true,
    "1069": true,
    "1070": true
  },
  
  // User bookmarked problems
  "NISARG_07_bookmarks": {
    "1068": true
  },
  
  // Daily solve stats (date string -> solved count) to compute streaks
  "NISARG_07_heatmapData": {
    "2026-06-15": 2,
    "2026-06-16": 1
  },
  
  // Unix timestamp of the last local database sync
  "NISARG_07_lastUpdated": 1781603689000
}
```

---

## 🎨 Theme & Design Token Guide

To ensure that the dashboard overlays fit CSES perfectly, we adhere to the following design tokens:

| Element / Action | Color Token | Native CSES Matching Style |
|---|---|---|
| Dashboard Card Background | `rgba(128, 128, 128, 0.05)` | Blends smoothly with page background |
| Dashboard Border | `rgba(128, 128, 128, 0.2)` | Matches native grid lines |
| Progress Solved Indicator | `#22c55e` (Green-500) | Matches CSES success badge |
| Active Progress Bar | `#2563eb` (Blue-600) | Standard utility progress |
| Unsolved / Muted Indicator | `rgba(128, 128, 128, 0.8)` | Muted gray matching native secondary text |
| Streak Icon & Fire Count | `#f97316` (Orange-500) | Custom active 🔥 color |
| Best Streak & Trophy Count | `#a855f7` (Purple-500) | Custom milestone 🏆 color |
| Font Families | `Inter`, `system-ui`, `monospace` | Inherited from the browser / CSES styling |
