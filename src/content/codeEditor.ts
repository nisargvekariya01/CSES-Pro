// ─── CSES Pro: LeetCode-style Code Editor ────────────────────────────────────
// Activates on: /problemset/task/* pages only.
// Adds a split-pane layout: problem statement (left) + CodeMirror editor (right).
// Run Code → Piston API. Submit → direct CSES post (same session cookies).

import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { oneDark } from '@codemirror/theme-one-dark';
import { runCode } from '../services/pistonApi';
import { submitToCSES, fetchSubmitPageData } from '../services/csesSubmit';
import type { CsesLangOption, SubmitPageData } from '../services/csesSubmit';
import { extractProblemIdFromUrl } from '../services/parser';

// ─── Types ───────────────────────────────────────────────────────────────────

// We use string for language because CSES's exact option values are fetched
// at runtime — they might differ from display names.
type SupportedLanguage = string;

interface EditorState_Local {
  language: string;
  code: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Fallback language list shown if CSES submit page can't be fetched
const FALLBACK_LANGUAGES = ['C++17', 'C++20', 'Python3', 'Java', 'Rust'];

const DEFAULT_CODE: Record<string, string> = {
  'C++17': `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your code here
    
    return 0;
}`,
  'C++20': `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your code here
    
    return 0;
}`,
  'Python3': `import sys
input = sys.stdin.readline

def main():
    # your code here
    pass

main()`,
  'Java': `import java.util.*;
import java.io.*;

public class solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // your code here
    }
}`,
  'Rust': `use std::io::{self, BufRead, Write};

fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = io::BufWriter::new(stdout.lock());
    
    // your code here
}`,
};

const STORAGE_KEY_PREFIX = 'cses-editor-';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDark(): boolean {
  const darkSheet = document.getElementById('styles-dark') as HTMLLinkElement | null;
  return darkSheet?.rel === 'stylesheet';
}

// Fuzzy-match a CSES language value/text to the right CodeMirror language extension
function getLanguageExtension(lang: string) {
  const l = lang.toLowerCase();
  if (l.includes('python') || l.includes('py'))                   return python();
  if (l.includes('java') && !l.includes('javascript'))            return java();
  if (l.includes('rust'))                                         return rust();
  // Default: C / C++ variants all get cpp() highlighting
  return cpp();
}

// Fuzzy-match a CSES language value/text to a starter code template
function getTemplateForLang(lang: string): string {
  const l = lang.toLowerCase();
  if (l.includes('python') || l.includes('py'))                   return DEFAULT_CODE['Python3'];
  if (l.includes('java') && !l.includes('javascript'))            return DEFAULT_CODE['Java'];
  if (l.includes('rust'))                                         return DEFAULT_CODE['Rust'];
  if (l.includes('c++20') || l.includes('cpp20'))                 return DEFAULT_CODE['C++20'];
  // Default: C++17 template works for C++17, C++20, C, etc.
  return DEFAULT_CODE['C++17'];
}

function loadEditorState(problemId: string): EditorState_Local {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${problemId}`);
    if (raw) return JSON.parse(raw) as EditorState_Local;
  } catch { /* ignore */ }
  return { language: 'C++17', code: DEFAULT_CODE['C++17'] };
}

function saveEditorState(problemId: string, state: EditorState_Local) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${problemId}`, JSON.stringify(state));
  } catch { /* ignore */ }
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/** Extract sample inputs from the problem's <pre> elements */
function extractSampleInputs(): string[] {
  const inputs: string[] = [];
  const pres = document.querySelectorAll<HTMLElement>('.content pre');
  let expectInput = false;

  pres.forEach((pre) => {
    const prev = pre.previousElementSibling as HTMLElement | null;
    const label = prev?.textContent?.trim().toLowerCase() ?? '';
    if (label.startsWith('input')) {
      inputs.push(pre.textContent?.trim() ?? '');
    }
  });

  // Fallback: alternate pre tags are often input/output pairs
  if (inputs.length === 0 && pres.length >= 2) {
    inputs.push(pres[0].textContent?.trim() ?? '');
  }

  return inputs;
}

// ─── Verdict Badge ────────────────────────────────────────────────────────────

function verdictColor(v: string): { bg: string; border: string; text: string } {
  switch (v) {
    case 'ACCEPTED':
      return { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' };
    case 'WRONG ANSWER':
      return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' };
    case 'TIME LIMIT EXCEEDED':
      return { bg: 'rgba(251,191,36,0.15)', border: '#f59e0b', text: '#f59e0b' };
    case 'COMPILE ERROR':
      return { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', text: '#8b5cf6' };
    case 'RUNTIME ERROR':
      return { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#f97316' };
    default:
      return { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#64748b' };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const url = window.location.href;
  const problemId = extractProblemIdFromUrl(url, document);
  if (!problemId) return; // Only run if we are on a problem-related page

  // Avoid double-injection
  if (document.getElementById('cses-editor-root')) return;

  // Wait for content div
  const contentEl = document.querySelector<HTMLElement>('.content');
  if (!contentEl) return;

  // ── Load persisted state ──────────────────────────────────────────────────
  const state = loadEditorState(problemId);
  let currentLang = state.language;
  let currentCode = state.code;

  // ── Collect sample inputs ─────────────────────────────────────────────────
  // (Only really relevant on the /task/ tab where inputs are shown, but safe to run anywhere)
  const sampleInputs = extractSampleInputs();
  let customInputText = sampleInputs[0] ?? '';

  // ── Measure CSES header height BEFORE moving any DOM elements ─────────────
  const csesHeader = document.querySelector<HTMLElement>('.header');
  const headerH    = csesHeader ? Math.round(csesHeader.getBoundingClientRect().bottom) : 56;
  // Detect page background so our overlay matches (dark/light mode)
  const pageBg     = getComputedStyle(document.body).backgroundColor || '#ffffff';

  // ── Build layout wrapper ──────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'cses-editor-root';

  const leftPane = document.createElement('div');
  leftPane.id = 'cses-left-pane';

  const divider = document.createElement('div');
  divider.id = 'cses-pane-divider';
  divider.title = 'Drag to resize';

  const rightPane = document.createElement('div');
  rightPane.id = 'cses-right-pane';

  // ── Extract the CSES problem navigation (TASK|SUBMIT|RESULTS|... tabs) ─────
  // On CSES problem pages, the nav is either inside .content or a sibling of it.
  const csesNavEl =
    contentEl.querySelector<HTMLElement>('.nav') ??
    document.querySelector<HTMLElement>('.nav') ??
    (() => {
      // Fallback: find by sibling links containing /task/, /submit/
      const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[href]');
      for (const a of allLinks) {
        if (/\/(task|submit|result|statistics|analysis)\//.test(a.href)) {
          const p = a.parentElement;
          if (p && p !== document.body) return p;
        }
      }
      return null;
    })();

  if (csesNavEl) {
    // Remove the "SUBMIT" option since our Code Editor handles submission directly
    const navLinks = csesNavEl.querySelectorAll<HTMLAnchorElement>('a');
    navLinks.forEach(link => {
      if (link.textContent?.trim().toUpperCase() === 'SUBMIT' || link.href.includes('/submit/')) {
        link.style.display = 'none'; // hide instead of remove to avoid breaking CSS child selectors
      }
    });
  }

  // Nav tab bar wrapper (sticky at top of left pane)
  const navTabBar = document.createElement('div');
  navTabBar.id = 'cses-nav-tabbar';
  if (csesNavEl) navTabBar.appendChild(csesNavEl);

  // Scrollable content wrapper (below the nav)
  const contentScroll = document.createElement('div');
  contentScroll.id = 'cses-content-scroll';
  contentScroll.appendChild(contentEl);

  leftPane.appendChild(navTabBar);
  leftPane.appendChild(contentScroll);
  root.appendChild(leftPane);
  root.appendChild(divider);
  root.appendChild(rightPane);
  document.body.appendChild(root);
  document.body.classList.add('cses-editor-active');

  // Cache for CSES submit page data (CSRF token + exact language options + hidden fields)
  let submitPageData: SubmitPageData | null = null;

  // ── Inject styles ─────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.id = 'cses-editor-styles';
  styleEl.textContent = `
    /* ── Full-viewport overlay starting below CSES header ── */
    #cses-editor-root {
      position: fixed;
      top: ${headerH}px;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: row;
      z-index: 9000;
      overflow: hidden;
      background: ${pageBg};
      box-sizing: border-box;
    }
    /* Body scroll should be suppressed when editor is active */
    body.cses-editor-active {
      overflow: hidden !important;
    }
    #cses-left-pane {
      flex: 0 0 45%;
      min-width: 300px;
      max-width: 60%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      border-right: 1px solid rgba(128,128,128,0.25);
    }
    /* ── CSES nav tab bar (TASK | SUBMIT | RESULTS | ...) ── */
    #cses-nav-tabbar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      overflow-x: auto;
      border-bottom: 1px solid rgba(128,128,128,0.2);
      padding: 0 16px;
      gap: 0;
      min-height: 42px;
      scrollbar-width: none;
    }
    #cses-nav-tabbar::-webkit-scrollbar { display: none; }
    /* Style CSES's own nav links as LeetCode-style tabs */
    #cses-nav-tabbar .nav {
      display: flex;
      align-items: center;
      gap: 0;
      flex-wrap: nowrap;
      white-space: nowrap;
    }
    #cses-nav-tabbar .nav a {
      display: inline-block;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      color: rgba(128,128,128,0.8);
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      letter-spacing: 0.3px;
    }
    #cses-nav-tabbar .nav a:hover {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    /* Active tab — whichever page we're currently on */
    #cses-nav-tabbar .nav a[href*="/task/"] {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    /* Separators between nav links */
    #cses-nav-tabbar .nav {
      gap: 0;
    }
    /* ── Scrollable problem content below the nav ── */
    #cses-content-scroll {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 16px 20px 20px 20px;
      box-sizing: border-box;
    }
    #cses-pane-divider {
      flex: 0 0 5px;
      background: rgba(128, 128, 128, 0.2);
      cursor: col-resize;
      border-radius: 0;
      transition: background 0.2s;
      position: relative;
    }
    #cses-pane-divider::after {
      content: '⠿';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(128,128,128,0.5);
      font-size: 14px;
      pointer-events: none;
    }
    #cses-pane-divider:hover {
      background: rgba(59, 130, 246, 0.5);
    }
    #cses-right-pane {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-width: 320px;
      overflow: hidden;
      box-sizing: border-box;
    }
    /* Toolbar */
    #cses-editor-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 1px solid rgba(128,128,128,0.2);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    #cses-lang-select {
      background: rgba(128,128,128,0.08);
      border: 1px solid rgba(128,128,128,0.3);
      color: inherit;
      font-family: inherit;
      font-size: 13px;
      padding: 4px 8px;
      border-radius: 5px;
      cursor: pointer;
      outline: none;
    }
    #cses-lang-select:hover { background: rgba(128,128,128,0.15); }
    .cses-toolbar-btn {
      background: rgba(128,128,128,0.08);
      border: 1px solid rgba(128,128,128,0.3);
      color: inherit;
      font-family: inherit;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.15s;
      outline: none;
    }
    .cses-toolbar-btn:hover { background: rgba(128,128,128,0.18); }
    #cses-editor-label {
      font-size: 12px;
      color: rgba(128,128,128,0.7);
      margin-left: auto;
      font-weight: 500;
    }
    /* CodeMirror wrapper */
    #cses-cm-wrapper {
      flex: 1 1 0;
      overflow: hidden;
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 4px;
      margin: 6px 0;
      min-height: 200px;
    }
    #cses-cm-wrapper .cm-editor {
      height: 100%;
      font-size: 14px;
    }
    #cses-cm-wrapper .cm-scroller {
      overflow: auto;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
    }
    /* Test case area */
    #cses-testcase-area {
      flex-shrink: 0;
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 4px;
      overflow: hidden;
    }
    #cses-testcase-tabs {
      display: flex;
      border-bottom: 1px solid rgba(128,128,128,0.2);
    }
    .cses-tab-btn {
      background: transparent;
      border: none;
      color: inherit;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      padding: 7px 14px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: border-color 0.15s, color 0.15s;
      outline: none;
    }
    .cses-tab-btn:hover { color: #3b82f6; }
    .cses-tab-btn.active {
      border-bottom-color: #3b82f6;
      color: #3b82f6;
    }
    .cses-tab-content { display: none; padding: 8px; }
    .cses-tab-content.active { display: block; }
    #cses-sample-tabs-inner {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }
    .cses-sample-tab {
      background: rgba(128,128,128,0.08);
      border: 1px solid rgba(128,128,128,0.25);
      color: inherit;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      outline: none;
      font-family: inherit;
    }
    .cses-sample-tab.active {
      background: rgba(59,130,246,0.15);
      border-color: #3b82f6;
      color: #3b82f6;
    }
    #cses-custom-input {
      width: 100%;
      min-height: 80px;
      font-family: monospace;
      font-size: 13px;
      background: rgba(128,128,128,0.05);
      border: 1px solid rgba(128,128,128,0.2);
      color: inherit;
      border-radius: 3px;
      padding: 6px 8px;
      resize: vertical;
      box-sizing: border-box;
      outline: none;
    }
    /* Console output */
    #cses-console-area {
      flex-shrink: 0;
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }
    #cses-console-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(128,128,128,0.07);
      border-bottom: 1px solid rgba(128,128,128,0.2);
      color: rgba(128,128,128,0.8);
      cursor: pointer;
      user-select: none;
    }
    #cses-console-body {
      font-family: monospace;
      font-size: 13px;
      min-height: 60px;
      max-height: 160px;
      overflow-y: auto;
      padding: 8px 10px;
      white-space: pre-wrap;
      word-break: break-all;
      background: rgba(128,128,128,0.03);
    }
    /* Action bar */
    #cses-action-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0 4px 0;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    #cses-run-btn {
      background: #2563eb;
      border: none;
      color: #fff;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 18px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      outline: none;
    }
    #cses-run-btn:hover:not(:disabled) { background: #1d4ed8; }
    #cses-run-btn:active:not(:disabled) { transform: scale(0.97); }
    #cses-run-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    #cses-submit-btn {
      background: #16a34a;
      border: none;
      color: #fff;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 18px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      outline: none;
    }
    #cses-submit-btn:hover:not(:disabled) { background: #15803d; }
    #cses-submit-btn:active:not(:disabled) { transform: scale(0.97); }
    #cses-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    /* Verdict toast */
    #cses-verdict-banner {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      margin-top: 4px;
      border: 1px solid;
      flex-shrink: 0;
    }
    /* Spinner */
    @keyframes cses-spin {
      to { transform: rotate(360deg); }
    }
    .cses-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: cses-spin 0.7s linear infinite;
      vertical-align: middle;
    }
    /* Sample data boxes */
    .cses-sample-block {
      font-family: monospace;
      font-size: 12px;
      background: rgba(128,128,128,0.07);
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 3px;
      padding: 6px 8px;
      white-space: pre;
      overflow-x: auto;
      max-height: 100px;
      margin-bottom: 4px;
    }
    /* Dark mode overrides via class on body */
    body.cses-is-dark #cses-lang-select option,
    body.cses-is-dark #cses-lang-select {
      background-color: #1e293b;
      color: #e2e8f0;
    }
    /* Responsive: collapse to single column on narrow screens */
    @media (max-width: 700px) {
      #cses-editor-root { flex-direction: column; }
      #cses-pane-divider { display: none; }
      #cses-left-pane, #cses-right-pane { flex: 0 0 auto; width: 100%; }
    }
    /* ── Hide the CSES native right sidebar (problem list + submissions) ── */
    /* CSES uses .sidebar for the right panel on task pages */
    .sidebar {
      display: none !important;
    }
    /* Remove CSES's page width cap so the editor fills the full viewport */
    .content-wrapper,
    #content-wrapper,
    .wrap,
    .inner-wrap,
    .page-wrap {
      max-width: none !important;
      width: 100% !important;
    }
  `;
  document.head.appendChild(styleEl);

  // ── Right pane contents ───────────────────────────────────────────────────

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'cses-editor-toolbar';

  const langSelect = document.createElement('select');
  langSelect.id = 'cses-lang-select';

  // Helper: populate langSelect from a list of options, restoring saved lang
  const populateLangDropdown = (langs: CsesLangOption[]) => {
    langSelect.innerHTML = '';
    let matched = false;
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.value;
      opt.textContent = lang.text;
      // Restore saved language by value or by display text
      if (lang.value === currentLang || lang.text === currentLang) {
        opt.selected = true;
        matched = true;
        currentLang = lang.value; // Sync to exact CSES value
      }
      langSelect.appendChild(opt);
    });
    if (!matched && langSelect.options.length > 0) {
      langSelect.options[0].selected = true;
      currentLang = langSelect.value;
    }
  };

  // Seed with fallback list immediately (replaced by CSES options once fetched)
  populateLangDropdown(FALLBACK_LANGUAGES.map(l => ({ value: l, text: l })));

  // Fetch the real language options from CSES's submit page in the background
  fetchSubmitPageData(problemId).then(data => {
    if (data && data.langs.length > 0) {
      submitPageData = data;
      populateLangDropdown(data.langs);
    }
  });


  const resetBtn = document.createElement('button');
  resetBtn.className = 'cses-toolbar-btn';
  resetBtn.textContent = '↺ Reset';
  resetBtn.title = 'Reset editor to default template';

  const editorLabel = document.createElement('span');
  editorLabel.id = 'cses-editor-label';
  editorLabel.textContent = `Problem #${problemId}`;

  toolbar.appendChild(langSelect);
  toolbar.appendChild(resetBtn);
  toolbar.appendChild(editorLabel);
  rightPane.appendChild(toolbar);

  // CodeMirror wrapper
  const cmWrapper = document.createElement('div');
  cmWrapper.id = 'cses-cm-wrapper';
  rightPane.appendChild(cmWrapper);

  // Test case area
  const testcaseArea = document.createElement('div');
  testcaseArea.id = 'cses-testcase-area';

  const tabsRow = document.createElement('div');
  tabsRow.id = 'cses-testcase-tabs';

  const sampleTabBtn = document.createElement('button');
  sampleTabBtn.className = 'cses-tab-btn active';
  sampleTabBtn.textContent = 'Test Cases';

  const customTabBtn = document.createElement('button');
  customTabBtn.className = 'cses-tab-btn';
  customTabBtn.textContent = 'Custom Input';

  tabsRow.appendChild(sampleTabBtn);
  tabsRow.appendChild(customTabBtn);
  testcaseArea.appendChild(tabsRow);

  // Sample inputs tab content
  const sampleContent = document.createElement('div');
  sampleContent.className = 'cses-tab-content active';
  sampleContent.id = 'cses-sample-tab-content';

  if (sampleInputs.length > 0) {
    const sampleTabsInner = document.createElement('div');
    sampleTabsInner.id = 'cses-sample-tabs-inner';
    sampleInputs.forEach((inp, i) => {
      const st = document.createElement('button');
      st.className = 'cses-sample-tab' + (i === 0 ? ' active' : '');
      st.textContent = `Case ${i + 1}`;
      st.dataset.idx = String(i);
      sampleTabsInner.appendChild(st);
    });
    sampleContent.appendChild(sampleTabsInner);

    const sampleBlock = document.createElement('pre');
    sampleBlock.className = 'cses-sample-block';
    sampleBlock.id = 'cses-sample-display';
    sampleBlock.textContent = sampleInputs[0] ?? '';
    sampleContent.appendChild(sampleBlock);

    // Use current sample as custom input prefill
    customInputText = sampleInputs[0] ?? '';

    sampleTabsInner.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('cses-sample-tab')) return;
      sampleTabsInner.querySelectorAll('.cses-sample-tab').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      const idx = parseInt(target.dataset.idx ?? '0', 10);
      sampleBlock.textContent = sampleInputs[idx] ?? '';
      customInputText = sampleInputs[idx] ?? '';
      customInputEl.value = customInputText;
    });
  } else {
    sampleContent.innerHTML = '<p style="color:rgba(128,128,128,0.6);font-size:12px;margin:0">No sample inputs detected.</p>';
  }

  // Custom input tab content
  const customContent = document.createElement('div');
  customContent.className = 'cses-tab-content';
  customContent.id = 'cses-custom-tab-content';

  const customInputEl = document.createElement('textarea');
  customInputEl.id = 'cses-custom-input';
  customInputEl.placeholder = 'Enter custom input here...';
  customInputEl.value = customInputText;
  customInputEl.spellcheck = false;
  customContent.appendChild(customInputEl);

  testcaseArea.appendChild(sampleContent);
  testcaseArea.appendChild(customContent);
  rightPane.appendChild(testcaseArea);

  // Tab switching
  sampleTabBtn.addEventListener('click', () => {
    sampleTabBtn.classList.add('active');
    customTabBtn.classList.remove('active');
    sampleContent.classList.add('active');
    customContent.classList.remove('active');
  });
  customTabBtn.addEventListener('click', () => {
    customTabBtn.classList.add('active');
    sampleTabBtn.classList.remove('active');
    customContent.classList.add('active');
    sampleContent.classList.remove('active');
  });

  // Console output area
  const consoleArea = document.createElement('div');
  consoleArea.id = 'cses-console-area';

  const consoleHeader = document.createElement('div');
  consoleHeader.id = 'cses-console-header';
  consoleHeader.innerHTML = '<span>🖥 Console Output</span><span id="cses-console-status" style="font-weight:400;font-size:11px"></span>';

  const consoleBody = document.createElement('div');
  consoleBody.id = 'cses-console-body';
  consoleBody.textContent = 'Output will appear here after you run your code.';
  consoleBody.style.color = 'rgba(128,128,128,0.6)';

  consoleArea.appendChild(consoleHeader);
  consoleArea.appendChild(consoleBody);
  rightPane.appendChild(consoleArea);

  // Action bar
  const actionBar = document.createElement('div');
  actionBar.id = 'cses-action-bar';

  const runBtn = document.createElement('button');
  runBtn.id = 'cses-run-btn';
  runBtn.innerHTML = '▶ Run Code';

  const submitBtn = document.createElement('button');
  submitBtn.id = 'cses-submit-btn';
  submitBtn.innerHTML = '⬆ Submit';

  const verdictBanner = document.createElement('div');
  verdictBanner.id = 'cses-verdict-banner';

  actionBar.appendChild(runBtn);
  actionBar.appendChild(submitBtn);
  rightPane.appendChild(actionBar);
  rightPane.appendChild(verdictBanner);

  // ── CodeMirror setup ──────────────────────────────────────────────────────

  const buildExtensions = (lang: SupportedLanguage, dark: boolean) => [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    drawSelection(),
    history(),
    indentOnInput(),
    bracketMatching(),
    foldGutter(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    getLanguageExtension(lang),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    ...(dark ? [oneDark] : []),
    EditorView.lineWrapping,
  ];

  let cmView = new EditorView({
    state: EditorState.create({
      doc: currentCode,
      extensions: buildExtensions(currentLang, isDark()),
    }),
    parent: cmWrapper,
  });

  // ── Language change handler ───────────────────────────────────────────────

  const rebuildEditor = (lang: string, preserveCode = true) => {
    // Use fuzzy template matching (works for any CSES language value)
    const code = preserveCode
      ? cmView.state.doc.toString()
      : getTemplateForLang(lang);

    cmView.destroy();
    cmView = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: buildExtensions(lang, isDark()),
      }),
      parent: cmWrapper,
    });
    currentCode = code;
    currentLang = lang;
    saveEditorState(problemId, { language: lang, code });
  };

  langSelect.addEventListener('change', () => {
    rebuildEditor(langSelect.value, false);
  });

  resetBtn.addEventListener('click', () => {
    if (confirm(`Reset editor to default ${currentLang} template? Your current code will be lost.`)) {
      rebuildEditor(currentLang, false);
    }
  });

  // Auto-save code on changes
  cmWrapper.addEventListener('keyup', () => {
    const code = cmView.state.doc.toString();
    saveEditorState(problemId, { language: currentLang, code });
  });

  // ── Dark mode observer ────────────────────────────────────────────────────

  const darkObserver = new MutationObserver(() => {
    const code = cmView.state.doc.toString();
    cmView.destroy();
    cmView = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: buildExtensions(currentLang, isDark()),
      }),
      parent: cmWrapper,
    });
  });
  darkObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['rel', 'disabled'],
  });

  // ── Run Code handler ──────────────────────────────────────────────────────

  const setRunLoading = (loading: boolean) => {
    runBtn.disabled = loading;
    runBtn.innerHTML = loading
      ? '<span class="cses-spinner"></span> Running...'
      : '▶ Run Code';
  };

  runBtn.addEventListener('click', async () => {
    const code = cmView.state.doc.toString().trim();
    if (!code) {
      consoleBody.textContent = 'Please write some code first!';
      consoleBody.style.color = '#f97316';
      return;
    }

    // Determine which input to use
    const isCustomActive = customContent.classList.contains('active');
    const stdin = isCustomActive
      ? customInputEl.value
      : (document.getElementById('cses-sample-display') as HTMLElement | null)?.textContent ?? '';

    setRunLoading(true);
    consoleBody.textContent = 'Running...';
    consoleBody.style.color = 'rgba(128,128,128,0.6)';

    const consoleStatus = document.getElementById('cses-console-status')!;
    consoleStatus.textContent = '';

    const result = await runCode(currentLang, code, stdin);

    setRunLoading(false);

    if (result.error && !result.stdout && !result.stderr) {
      consoleBody.textContent = `Error: ${result.error}`;
      consoleBody.style.color = '#ef4444';
      return;
    }

    let output = '';
    if (result.error) output += `[${result.error}]\n`;
    if (result.stdout) output += result.stdout;
    if (result.stderr) output += (output ? '\n--- stderr ---\n' : '') + result.stderr;
    if (!output) output = '(no output)';

    consoleBody.textContent = output;
    consoleBody.style.color = result.exitCode === 0
      ? 'inherit'
      : '#ef4444';

    const exitLabel = result.exitCode === 0 ? '✓ Exit 0' : `✗ Exit ${result.exitCode}`;
    consoleStatus.textContent = exitLabel;
    consoleStatus.style.color = result.exitCode === 0 ? '#22c55e' : '#ef4444';
  });

  // ── Submit handler ────────────────────────────────────────────────────────

  const setSubmitLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    runBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="cses-spinner"></span> Submitting...'
      : '⬆ Submit';
  };

  const showVerdict = (verdict: string) => {
    const colors = verdictColor(verdict);
    verdictBanner.style.display = 'flex';
    verdictBanner.style.backgroundColor = colors.bg;
    verdictBanner.style.borderColor = colors.border;
    verdictBanner.style.color = colors.text;
    verdictBanner.innerHTML = '';

    const icon = verdict === 'ACCEPTED' ? '✓' : '✗';
    verdictBanner.textContent = `${icon} ${verdict}`;

    if (verdict !== 'PENDING') {
      setTimeout(() => {
        verdictBanner.style.display = 'none';
      }, 8000);
    }
  };

  submitBtn.addEventListener('click', async () => {
    const code = cmView.state.doc.toString().trim();
    if (!code) {
      showVerdict('No code to submit!');
      return;
    }

    verdictBanner.style.display = 'none';
    setSubmitLoading(true);

    // Use the exact language value from the select (fetched from CSES's form)
    // and the cached form data (CSRF + hidden fields) to avoid a second network round-trip
    const result = await submitToCSES(
      problemId,
      code,
      langSelect.value,           // Exact CSES option value
      submitPageData,             // Cached submit page data
    );

    setSubmitLoading(false);

    if (!result.success) {
      verdictBanner.style.display = 'flex';
      verdictBanner.style.backgroundColor = 'rgba(239,68,68,0.15)';
      verdictBanner.style.borderColor = '#ef4444';
      verdictBanner.style.color = '#ef4444';
      verdictBanner.textContent = `✗ ${result.error ?? 'Submit failed'}`;
      return;
    }

    const v = result.verdict ?? 'PENDING';
    showVerdict(v);

    // Always append a "View on CSES" link so user can verify the result
    if (result.submissionUrl) {
      const link = document.createElement('a');
      link.href = result.submissionUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '→ View on CSES';
      link.style.color = 'inherit';
      link.style.marginLeft = '10px';
      link.style.fontSize = '11px';
      link.style.textDecoration = 'underline';
      link.style.opacity = '0.8';
      verdictBanner.appendChild(link);
    }
    if (result.compilerOutput) {
      // Put compilation error into the console
      const consoleStatus = document.getElementById('cses-console-status')!;
      consoleStatus.textContent = 'CSES Compilation Error';
      consoleStatus.style.color = '#ef4444';
      consoleBody.innerHTML = `<pre style="margin:0;color:#ef4444;font-family:monospace;white-space:pre-wrap">${escapeHtml(result.compilerOutput)}</pre>`;
    } else {
      // Clear console if it was a CSES submission
      const consoleStatus = document.getElementById('cses-console-status')!;
      consoleStatus.textContent = 'Submit complete';
      consoleStatus.style.color = 'inherit';
    }

  });

  // ── Draggable divider ─────────────────────────────────────────────────────

  let dragging = false;
  let startX = 0;
  let startLeftWidth = 0;

  divider.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startLeftWidth = leftPane.getBoundingClientRect().width;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const newWidth = Math.max(280, Math.min(startLeftWidth + delta, window.innerWidth - 400));
    leftPane.style.flex = `0 0 ${newWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });
}

export function onExecute() {
  // Small delay to let other content scripts (copyBlocks) inject first
  setTimeout(run, 150);
}
