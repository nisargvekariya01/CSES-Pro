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
  'Assembly': `; Assembly (x86_64) starter
section .data
    msg db 'Hello, World!', 10
    len equ $ - msg

section .text
    global _start

_start:
    ; your code here
    mov rax, 1
    mov rdi, 1
    mov rsi, msg
    mov rdx, len
    syscall

    mov rax, 60
    xor rdi, rdi
    syscall`,
  'C': `#include <stdio.h>

int main() {
    // your code here
    return 0;
}`,
  'C++': `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your code here
    
    return 0;
}`,
  'Haskell': `main :: IO ()
main = do
    -- your code here
    return ()`,
  'Java': `import java.util.*;
import java.io.*;

public class solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // your code here
    }
}`,
  'Node.js': `const fs = require('fs');

function main() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    // your code here
}

main();`,
  'Pascal': `program Solution;
begin
    // your code here
end.`,
  'Python3': `import sys
input = sys.stdin.read

def main():
    # your code here
    pass

if __name__ == '__main__':
    main()`,
  'Ruby': `def main
  # your code here
end

main`,
  'Rust': `use std::io::{self, BufRead, Write};

fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = io::BufWriter::new(stdout.lock());
    
    // your code here
}`,
  'Scala': `object Solution {
  def main(args: Array[String]): Unit = {
    // your code here
  }
}`
};

const STORAGE_KEY_PREFIX = 'cses-editor-';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDark(): boolean {
  try {
    const darkFlag = document.getElementById('darkmode-enabled');
    if (darkFlag) {
      return darkFlag.textContent?.trim() === 'true';
    }
  } catch(e) {}
  
  const darkSheet = document.getElementById('styles-dark') as HTMLLinkElement | null;
  if (darkSheet) {
    return darkSheet.rel === 'stylesheet' || !darkSheet.rel.includes('alternate');
  }
  
  if (document.body && (document.body.classList.contains('dark') || document.body.classList.contains('dark-theme'))) {
    return true;
  }
  
  return false;
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
  const l = lang.toLowerCase().trim();
  if (l.includes('assembly') || l.includes('asm'))                return DEFAULT_CODE['Assembly'];
  if (l.includes('haskell'))                                      return DEFAULT_CODE['Haskell'];
  if (l.includes('node') || l.includes('js') || l.includes('javascript')) return DEFAULT_CODE['Node.js'];
  if (l.includes('pascal'))                                       return DEFAULT_CODE['Pascal'];
  if (l.includes('ruby'))                                         return DEFAULT_CODE['Ruby'];
  if (l.includes('scala'))                                        return DEFAULT_CODE['Scala'];
  if (l.includes('python') || l.includes('py'))                   return DEFAULT_CODE['Python3'];
  if (l.includes('java') && !l.includes('javascript'))            return DEFAULT_CODE['Java'];
  if (l.includes('rust'))                                         return DEFAULT_CODE['Rust'];
  if (l === 'c' || l === 'c11')                                   return DEFAULT_CODE['C'];
  
  // Default to C++ for cpp, c++17, c++20, etc.
  return DEFAULT_CODE['C++'];
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

interface SampleData {
  input: string;
  expectedOutput: string;
}

/** Extract sample inputs and expected outputs from the problem's <pre> elements */
function extractSamples(): SampleData[] {
  const samples: SampleData[] = [];
  const pres = Array.from(document.querySelectorAll<HTMLElement>('.content pre'));

  for (let i = 0; i < pres.length; i++) {
    const pre = pres[i];
    const prev = pre.previousElementSibling as HTMLElement | null;
    const label = prev?.textContent?.trim().toLowerCase() ?? '';
    
    if (label.startsWith('input')) {
      const input = pre.textContent?.trim() ?? '';
      let expectedOutput = '';
      
      // Look ahead for the corresponding output
      if (i + 1 < pres.length) {
        const nextPre = pres[i + 1];
        const nextPrev = nextPre.previousElementSibling as HTMLElement | null;
        const nextLabel = nextPrev?.textContent?.trim().toLowerCase() ?? '';
        if (nextLabel.startsWith('output')) {
          expectedOutput = nextPre.textContent?.trim() ?? '';
        }
      }
      samples.push({ input, expectedOutput });
    }
  }

  // Fallback: alternate pre tags are often input/output pairs
  if (samples.length === 0) {
    for (let i = 0; i < pres.length; i += 2) {
      if (i + 1 < pres.length) {
        samples.push({
          input: pres[i].textContent?.trim() ?? '',
          expectedOutput: pres[i + 1].textContent?.trim() ?? ''
        });
      }
    }
  }
  return samples;
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
  const removeFouc = () => document.getElementById('cses-fouc-preventer')?.remove();

  const url = window.location.href;
  const problemId = extractProblemIdFromUrl(url, document);
  if (!problemId) return removeFouc(); // Only run if we are on a problem-related page

  // Avoid double-injection
  if (document.getElementById('cses-editor-root')) return removeFouc();

  // Wait for content div
  const contentEl = document.querySelector<HTMLElement>('.content');
  if (!contentEl) return removeFouc();

  // ── Load persisted state ──────────────────────────────────────────────────
  const state = loadEditorState(problemId);
  let currentLang = state.language;
  let currentCode = state.code;

  // ── Collect sample inputs ─────────────────────────────────────────────────
  // (Only really relevant on the /task/ tab where inputs are shown, but safe to run anywhere)
  const sampleInputs = extractSamples().map(s => s.input);
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
  leftPane.className = 'cses-panel';

  const divider = document.createElement('div');
  divider.id = 'cses-pane-divider';
  divider.title = 'Drag to resize';

  const rightPane = document.createElement('div');
  rightPane.id = 'cses-right-pane';
  
  const editorPanel = document.createElement('div');
  editorPanel.id = 'cses-editor-panel';
  editorPanel.className = 'cses-panel';

  const consolePanel = document.createElement('div');
  consolePanel.id = 'cses-console-panel';
  consolePanel.className = 'cses-panel';

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
      background: #f0f0f0;
      padding: 8px;
      gap: 0; /* Gap handled by divider and padding */
      box-sizing: border-box;
    }
    #cses-editor-root.cses-theme-dark {
      background: #000000;
    }
    /* Body scroll should be suppressed when editor is active */
    body.cses-editor-active {
      overflow: hidden !important;
    }
    
    .cses-panel {
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    #cses-editor-root.cses-theme-dark .cses-panel {
      background: #1e1e1e;
      border-color: #333333;
    }

    #cses-left-pane {
      flex: 0 0 45%;
      min-width: 300px;
      max-width: 60%;
      box-sizing: border-box;
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
      color: rgba(128,128,128,0.8) !important;
      background: transparent !important;
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 2px solid transparent !important;
      transition: color 0.15s, border-color 0.15s;
      letter-spacing: 0.3px;
    }
    #cses-nav-tabbar .nav a:hover {
      color: #3b82f6 !important;
      border-bottom-color: #3b82f6 !important;
    }
    /* Active tab — CSES natively adds class="current" to whichever page we're on */
    #cses-nav-tabbar .nav a.current {
      color: #3b82f6 !important;
      border-bottom: 2px solid #3b82f6 !important;
      border-left: none !important;
      border-right: none !important;
      border-top: none !important;
      background: transparent !important;
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
      flex: 0 0 12px;
      background: transparent;
      cursor: col-resize;
      position: relative;
      z-index: 10;
    }
    #cses-pane-divider::after {
      content: '⋮';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(128,128,128,0.4);
      font-size: 18px;
      pointer-events: none;
    }
    #cses-pane-divider:hover::after {
      color: rgba(59, 130, 246, 0.8);
    }
    #cses-right-pane {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      gap: 0;
      min-width: 320px;
      box-sizing: border-box;
      background: transparent !important;
    }
    #cses-editor-panel {
      flex: 1 1 0;
      min-height: 200px;
    }
    #cses-console-panel {
      flex: none;
      height: 250px;
      min-height: 100px;
    }
    #cses-vertical-divider {
      flex: 0 0 8px;
      background: transparent;
      cursor: row-resize;
      position: relative;
      z-index: 10;
    }
    #cses-vertical-divider::after {
      content: '⋯';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(128,128,128,0.4);
      font-size: 18px;
      pointer-events: none;
      line-height: 1;
    }
    #cses-vertical-divider:hover::after {
      color: rgba(59, 130, 246, 0.8);
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
      overflow: hidden;
    }
    #cses-testcase-tabs {
      display: flex;
      border-bottom: 1px solid rgba(128,128,128,0.15);
      background: rgba(128,128,128,0.03);
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
    .cses-tab-content { 
      display: none; 
      padding: 12px; 
      flex: 1 1 0; 
      flex-direction: column;
      overflow-y: auto;
    }
    .cses-tab-content.active { display: flex; }
    #cses-sample-tabs-inner {
      display: flex;
      flex-shrink: 0;
      gap: 4px;
      margin-bottom: 8px;
    }
    .cses-sample-tab {
      background: rgba(128,128,128,0.08);
      border: 1px solid rgba(128,128,128,0.25);
      color: inherit;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 4px;
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
      flex: 1 1 0;
      min-height: 80px;
      font-family: monospace;
      font-size: 13px;
      background: rgba(128,128,128,0.05);
      border: 1px solid rgba(128,128,128,0.2);
      color: inherit;
      border-radius: 4px;
      padding: 8px;
      resize: none;
      box-sizing: border-box;
      outline: none;
    }
    #cses-editor-root.cses-theme-dark #cses-custom-input {
      background: rgba(128,128,128,0.1);
      border-color: rgba(128,128,128,0.3);
    }
    /* Action bar */
    #cses-console-body {
      flex: 1 1 0;
      font-family: monospace;
      font-size: 13px;
      min-height: 60px;
      overflow-y: auto;
      padding: 10px 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    /* Test Result inner elements */
    .cses-result-case-btn {
      background: transparent;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cses-result-case-btn.active {
      background: #e5e7eb;
    }
    #cses-editor-root.cses-theme-dark .cses-result-case-btn.active {
      background: #333333;
    }
    
    .cses-result-pre {
      background: rgba(128,128,128,0.04);
      border: 1px solid rgba(128,128,128,0.1);
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 13px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
    #cses-editor-root.cses-theme-dark .cses-result-pre {
      background: rgba(128,128,128,0.08);
    }
    
    .cses-delete-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(128,128,128,0.2);
      color: inherit;
      font-size: 10px;
      margin-left: 6px;
      transition: background 0.15s, color 0.15s;
    }
    .cses-delete-btn:hover {
      background: #ef4444;
      color: #fff;
    }

    /* Action bar */
    #cses-action-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 10px 12px;
      border-top: 1px solid rgba(128,128,128,0.15);
      background: rgba(128,128,128,0.03);
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
    /* Dark mode overrides */
    #cses-editor-root.cses-theme-dark #cses-lang-select option,
    #cses-editor-root.cses-theme-dark #cses-lang-select {
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
  editorPanel.appendChild(toolbar);

  // CodeMirror wrapper
  const cmWrapper = document.createElement('div');
  cmWrapper.id = 'cses-cm-wrapper';
  editorPanel.appendChild(cmWrapper);

  // ── Console Panel Tabs (Testcase / Test Result) ───────────────────────────
  const consoleTabsRow = document.createElement('div');
  consoleTabsRow.id = 'cses-testcase-tabs'; // reuse existing CSS id

  const testcaseTabBtn = document.createElement('button');
  testcaseTabBtn.className = 'cses-tab-btn active';
  testcaseTabBtn.innerHTML = '☑ Testcase';

  const resultTabBtn = document.createElement('button');
  resultTabBtn.className = 'cses-tab-btn';
  resultTabBtn.innerHTML = '>&nbsp; Test Result';
  
  const consoleStatus = document.createElement('span');
  consoleStatus.id = 'cses-console-status';
  consoleStatus.style.cssText = 'font-weight:400;font-size:11px;margin-left:auto;margin-right:12px;display:flex;align-items:center;';
  
  consoleTabsRow.appendChild(testcaseTabBtn);
  consoleTabsRow.appendChild(resultTabBtn);
  consoleTabsRow.appendChild(consoleStatus);
  consolePanel.appendChild(consoleTabsRow);

  // ── Testcase Content ──────────────────────────────────────────────────────
  const testcaseContent = document.createElement('div');
  testcaseContent.className = 'cses-tab-content active';
  testcaseContent.id = 'cses-testcase-area'; // reuse CSS

  // Maintain local state of testcases
  const samples = extractSamples();
  const testCasesState: SampleData[] = samples.length > 0 ? [...samples] : [{ input: '', expectedOutput: '' }];
  let activeCaseIdx = 0;

  const sampleTabsInner = document.createElement('div');
  sampleTabsInner.id = 'cses-sample-tabs-inner';

  const testcaseInputEl = document.createElement('textarea');
  testcaseInputEl.id = 'cses-custom-input'; // reuse CSS for textarea
  testcaseInputEl.spellcheck = false;

  const renderCaseTabs = () => {
    sampleTabsInner.innerHTML = '';
    testCasesState.forEach((inp, i) => {
      const st = document.createElement('button');
      st.className = 'cses-sample-tab' + (i === activeCaseIdx ? ' active' : '');
      st.textContent = `Case ${i + 1}`;
      st.onclick = () => {
        activeCaseIdx = i;
        testcaseInputEl.value = testCasesState[i].input;
        renderCaseTabs();
      };
      
      if (i >= samples.length || (samples.length === 0 && i > 0)) {
        const delBtn = document.createElement('span');
        delBtn.className = 'cses-delete-btn';
        delBtn.textContent = '×';
        delBtn.title = 'Delete testcase';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          testCasesState.splice(i, 1);
          if (activeCaseIdx >= testCasesState.length) {
            activeCaseIdx = Math.max(0, testCasesState.length - 1);
          }
          testcaseInputEl.value = testCasesState[activeCaseIdx]?.input ?? '';
          renderCaseTabs();
        };
        st.appendChild(delBtn);
      }
      
      sampleTabsInner.appendChild(st);
    });
    // Add '+' button for custom cases
    const addBtn = document.createElement('button');
    addBtn.className = 'cses-sample-tab';
    addBtn.textContent = '+';
    addBtn.style.fontWeight = 'bold';
    addBtn.onclick = () => {
      testCasesState.push({ input: '', expectedOutput: '' });
      activeCaseIdx = testCasesState.length - 1;
      testcaseInputEl.value = '';
      renderCaseTabs();
    };
    sampleTabsInner.appendChild(addBtn);
  };

  testcaseInputEl.addEventListener('input', () => {
    testCasesState[activeCaseIdx].input = testcaseInputEl.value;
  });

  // Initialize
  testcaseInputEl.value = testCasesState[activeCaseIdx]?.input ?? '';
  renderCaseTabs();

  testcaseContent.appendChild(sampleTabsInner);
  testcaseContent.appendChild(testcaseInputEl);
  consolePanel.appendChild(testcaseContent);

  // ── Test Result Content ───────────────────────────────────────────────────
  const resultContent = document.createElement('div');
  resultContent.className = 'cses-tab-content';
  resultContent.id = 'cses-console-area'; // reuse CSS wrapper

  const consoleBody = document.createElement('div');
  consoleBody.id = 'cses-console-body';
  consoleBody.textContent = 'Run your code to see the test result here.';
  consoleBody.style.color = 'rgba(128,128,128,0.6)';
  
  resultContent.appendChild(consoleBody);
  consolePanel.appendChild(resultContent);

  // Tab switching logic
  const switchToTestResult = () => {
    resultTabBtn.classList.add('active');
    testcaseTabBtn.classList.remove('active');
    resultContent.classList.add('active');
    testcaseContent.classList.remove('active');
  };

  testcaseTabBtn.addEventListener('click', () => {
    testcaseTabBtn.classList.add('active');
    resultTabBtn.classList.remove('active');
    testcaseContent.classList.add('active');
    resultContent.classList.remove('active');
  });

  resultTabBtn.addEventListener('click', switchToTestResult);


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
  consolePanel.appendChild(actionBar);
  consolePanel.appendChild(verdictBanner);
  const vDivider = document.createElement('div');
  vDivider.id = 'cses-vertical-divider';
  
  rightPane.appendChild(editorPanel);
  rightPane.appendChild(vDivider);
  rightPane.appendChild(consolePanel);


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

  const updateThemeClass = () => {
    if (isDark()) {
      root.classList.add('cses-theme-dark');
    } else {
      root.classList.remove('cses-theme-dark');
    }
  };
  updateThemeClass(); // initial call

  // ── Dark mode observer ────────────────────────────────────────────────────

  const handleThemeChange = () => {
    updateThemeClass();
    const code = cmView.state.doc.toString();
    cmView.destroy();
    cmView = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: buildExtensions(currentLang, isDark()),
      }),
      parent: cmWrapper,
    });
  };

  const darkObserver = new MutationObserver(handleThemeChange);
  darkObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['rel', 'disabled', 'href'],
  });

  // Also listen for CSES's native theme-changed event
  document.addEventListener('theme-changed', handleThemeChange);

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
      switchToTestResult();
      return;
    }

    switchToTestResult();

    setRunLoading(true);
    consoleBody.innerHTML = '<div style="padding:12px;color:rgba(128,128,128,0.7)">Running testcases... <span class="cses-spinner"></span></div>';
    
    const consoleStatus = document.getElementById('cses-console-status')!;
    consoleStatus.textContent = '';

    const results: Array<{
      stdout: string | null;
      stderr: string | null;
      error?: string | null;
      exitCode: number | null;
      passed: boolean;
      input: string;
      expected: string;
      index: number;
    }> = [];
    let overallStatus = 'Accepted';

    // Run all testcases that have input
    for (let i = 0; i < testCasesState.length; i++) {
      const tcase = testCasesState[i];
      if (!tcase.input.trim() && i === testCasesState.length - 1) continue; // skip trailing empty custom case

      const res = await runCode(currentLang, code, tcase.input);
      let passed = true;
      const outStr = (res.stdout ?? '').trim();
      const expStr = (tcase.expectedOutput ?? '').trim();

      if (res.exitCode !== 0 || res.error) {
         passed = false;
         if (overallStatus === 'Accepted') overallStatus = 'Runtime Error';
      } else if (expStr && outStr !== expStr) {
         passed = false;
         if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
      }

      results.push({ ...res, passed, input: tcase.input, expected: expStr, index: i });
    }

    setRunLoading(false);

    // Render LeetCode-style detailed results
    if (results.length === 0) {
       consoleBody.innerHTML = '<div style="padding:12px;color:rgba(128,128,128,0.7)">No testcases to run.</div>';
       return;
    }

    const isSuccess = overallStatus === 'Accepted';
    const statusColor = isSuccess ? '#22c55e' : '#ef4444';
    consoleStatus.textContent = overallStatus;
    consoleStatus.style.color = statusColor;
    
    // Clear consoleBody to inject detailed UI
    consoleBody.innerHTML = '';
    
    // Top banner
    const resultHeader = document.createElement('div');
    resultHeader.style.cssText = 'font-size:22px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:12px;';
    
    const statusText = document.createElement('span');
    statusText.textContent = overallStatus;
    statusText.style.color = statusColor;
    resultHeader.appendChild(statusText);
    
    consoleBody.appendChild(resultHeader);
    
    // Inner case tabs
    const caseTabsRow = document.createElement('div');
    caseTabsRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;';
    
    const caseContentArea = document.createElement('div');
    
    const renderResultCase = (idx: number) => {
      caseTabsRow.innerHTML = '';
      results.forEach((r, i) => {
        const btn = document.createElement('button');
        const isActive = i === idx;
        
        btn.className = 'cses-result-case-btn' + (isActive ? ' active' : '');
        
        const icon = r.passed ? '✓' : '✗';
        const iconColor = r.passed ? '#22c55e' : '#ef4444';
        btn.innerHTML = `<span style="color:${iconColor}; font-weight: bold;">${icon}</span> Case ${r.index + 1}`;
        btn.onclick = () => renderResultCase(i);
        caseTabsRow.appendChild(btn);
      });
      
      // Render details for active case
      const res = results[idx];
      caseContentArea.innerHTML = '';
      
      const createBlock = (title: string, content: string) => {
        const wrap = document.createElement('div');
        wrap.style.marginBottom = '16px';
        const h = document.createElement('div');
        h.textContent = title;
        h.style.cssText = 'font-size:12px;color:rgba(128,128,128,0.7);margin-bottom:8px;';
        const pre = document.createElement('pre');
        pre.className = 'cses-result-pre';
        if (res.error && title === 'Output') {
          pre.style.color = '#ef4444';
        }
        pre.textContent = content || '';
        wrap.appendChild(h);
        wrap.appendChild(pre);
        return wrap;
      };
      
      caseContentArea.appendChild(createBlock('Input', res.input));
      
      let outStr = '';
      if (res.error) outStr += `[${res.error}]\n`;
      if (res.stdout) outStr += res.stdout;
      if (res.stderr) outStr += (outStr ? '\n--- stderr ---\n' : '') + res.stderr;
      caseContentArea.appendChild(createBlock('Output', outStr.trim()));
      
      if (res.expected) {
        caseContentArea.appendChild(createBlock('Expected', res.expected));
      }
    };
    
    consoleBody.appendChild(caseTabsRow);
    consoleBody.appendChild(caseContentArea);
    
    // Initial render
    renderResultCase(0);
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
      switchToTestResult();
    } else {
      // Clear console if it was a CSES submission
      const consoleStatus = document.getElementById('cses-console-status')!;
      consoleStatus.textContent = 'Submit complete';
      consoleStatus.style.color = 'inherit';
    }

  });

  // ── Draggable dividers ────────────────────────────────────────────────────
  let draggingH = false;
  let startX = 0;
  let startLeftWidth = 0;

  divider.addEventListener('mousedown', (e) => {
    draggingH = true;
    startX = e.clientX;
    startLeftWidth = leftPane.getBoundingClientRect().width;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });
  
  let draggingV = false;
  let startY = 0;
  let startConsoleHeight = 0;
  
  const vDiv = document.getElementById('cses-vertical-divider');
  if (vDiv) {
    vDiv.addEventListener('mousedown', (e) => {
      draggingV = true;
      startY = e.clientY;
      startConsoleHeight = consolePanel.getBoundingClientRect().height;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
      e.preventDefault();
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (draggingH) {
      const delta = e.clientX - startX;
      const newWidth = Math.max(280, Math.min(startLeftWidth + delta, window.innerWidth - 400));
      leftPane.style.flex = `0 0 ${newWidth}px`;
    }
    if (draggingV) {
      const delta = startY - e.clientY; // drag up -> increase height
      const rootRect = document.getElementById('cses-editor-root')?.getBoundingClientRect();
      const maxH = rootRect ? rootRect.height - 150 : 800; // Leave space for code editor
      const newHeight = Math.max(100, Math.min(startConsoleHeight + delta, maxH));
      consolePanel.style.height = `${newHeight}px`;
      consolePanel.style.maxHeight = 'none'; // Ensure max-height from CSS is overridden if present
    }
  });

  document.addEventListener('mouseup', () => {
    if (draggingH || draggingV) {
      draggingH = false;
      draggingV = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  });

  // ── Remove FOUC Preventer ──────────────────────────────────────────────────
  const fouc = document.getElementById('cses-fouc-preventer');
  if (fouc) {
    fouc.remove();
  }
}

export function onExecute() {
  // Small delay to let other content scripts (copyBlocks) inject first
  setTimeout(run, 150);
}
