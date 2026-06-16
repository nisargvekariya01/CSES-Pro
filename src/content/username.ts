// Content script: Auto-detect the logged-in CSES username.
// @crxjs requires content scripts to export an `onExecute` function.

import { extractUsername } from '../services/parser';
import { getUsername, setUsername } from '../services/storage';

async function run() {
  const detected = extractUsername(document);
  if (!detected) return;

  const stored = await getUsername();
  if (stored !== detected) {
    await setUsername(detected);
    try {
      chrome.runtime.sendMessage({ type: 'SET_USERNAME', payload: { username: detected } });
    } catch { /* popup not open */ }
  }
}

// @crxjs loader pattern
export function onExecute() {
  run();
}

// Also run immediately for non-crxjs environments
