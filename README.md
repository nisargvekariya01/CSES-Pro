# CSES Pro — Ultimate CSES Enhancer (Chrome Extension)

A premium, feature-rich Chrome Extension that seamlessly enhances your competitive programming experience on [cses.fi](https://cses.fi/). It adds progress tracking, dynamic filtering, Codeforces-style code pasting and input/output copy buttons, streak tracking, and interactive dashboards—fully integrated into the CSES native user interface with adaptive light/dark theme support.

---

## ✨ What's New in CSES Pro v2.0

This massive update transforms CSES into a fully integrated IDE experience right in your browser. 
*(Note: This version still includes all the original features like the Progress Dashboards, Bookmarks, and Copy Boxes. For documentation on the base features, please refer to the [v1 Legacy Branch](https://github.com/nisargvekariya01/CSES-Pro/tree/v1)).*

### 💻 1. In-Browser Split Pane Code Editor
- **LeetCode-Style Layout**: Replaces the standard problem view with an interactive CodeMirror editor right next to the problem description on `/task` pages.
- **Themes & Auto-formatting**: Supports themes like One Dark, syntax highlighting, auto-indentation, and **auto-closing brackets**.

### 📝 2. Custom Template Management
- Create, manage, and instantly insert your custom Competitive Programming templates directly into the editor for any supported language.

### 🚀 3. In-Browser Code Runner (via Wandbox)
- **Run Without Submitting**: Execute your code directly in the browser against custom inputs using the Wandbox API.
- **Auto-Extracted Sample Tests**: The extension automatically extracts sample inputs and expected outputs directly from the problem statement, so you can test your code against them with a single click.
- **Custom Expected Outputs**: Add your own custom test cases and specify an *Expected Output*. The runner will automatically compare your code's output and visually flag any mismatches (Accepted vs Wrong Answer)!

### 📤 4. Direct CSES Submission
- **Seamless Submissions**: Submit your solution directly from the problem task page without navigating away to the `/submit` page. The extension handles the form submission transparently using your active session.

### 🔍 5. Global Search
- **Quick Jump**: Press `Ctrl+K` (or `Cmd+K` on Mac) anywhere on the problemset list page to open a fast search palette.
- Instantly find and jump to any CSES problem by typing its name.

---

## 🚀 How to Install (100% Free & Open Source)

Because we believe this tool should be completely free for student developers, it is **not** published on the official Chrome Web Store (avoiding registration and listing fees). You can easily build and load it directly from the source code.

### 🛠️ Build and Load from Source

1. **Clone or Download the Repository**
   Download this project as a ZIP file and extract it, or clone it using git:

   ```bash
   git clone https://github.com/nisargvekariya01/CSES-Pro.git
   cd CSES-Pro
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

## 📁 Project Structure

```text
CSES Extension/
├── dist/                      # Bundled Chrome Extension files (auto-generated on build)
├── icons/
│   └── image.png              # Chrome toolbar and store icon
├── images/
│   └── .gitkeep               # Directory containing before/after comparison screenshots
├── public/
│   └── icons/                 # Subfolders matching manifest.json icon sizes
├── src/
│   ├── background/
│   │   └── sync.ts            # Background service worker message relayer and storage sync
│   ├── content/
│   │   ├── bookmarks.ts       
│   │   ├── codeEditor.ts      # NEW: In-browser CodeMirror IDE, Templates & Runner
│   │   ├── copyBlocks.ts      
│   │   ├── globalSearch.ts    # NEW: Quick Ctrl+K search palette
│   │   ├── injectDashboard.ts 
│   │   ├── preventFouc.ts     # NEW: Prevents theme flickering
│   │   ├── solvedProblems.ts  
│   │   ├── submissionAnalytics.ts
│   │   ├── submitEditor.ts    
│   │   └── username.ts        
│   ├── data/
│   │   └── cses-problems.json 
│   ├── services/
│   │   ├── csesSubmit.ts      # NEW: Direct CSES submission logic without redirect
│   │   ├── parser.ts          
│   │   ├── pistonApi.ts       # NEW: Wandbox code runner API integration
│   │   └── storage.ts         
│   └── types/                 
├── .gitignore                 
├── manifest.json              
├── package-lock.json          
├── package.json               
├── tsconfig.json              
├── tsconfig.node.json         
└── vite.config.ts             
```
