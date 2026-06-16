// Content script: Inject ⭐ bookmark button on CSES task pages.
// @crxjs requires content scripts to export an `onExecute` function.

import { extractProblemIdFromUrl } from '../services/parser';
import { getBookmarks, toggleBookmark, getUsername } from '../services/storage';

async function run() {
  const username = await getUsername();
  if (!username) return;

  const url = window.location.href;
  if (!url.includes('/problemset/task/')) return;

  const problemId = extractProblemIdFromUrl(url);
  if (!problemId) return;

  if (document.getElementById('cses-bookmark-btn')) return;

  const titleEl =
    document.querySelector<HTMLElement>('.title-block h1') ??
    document.querySelector<HTMLElement>('h1');
  if (!titleEl) return;

  const bookmarks = await getBookmarks();
  const btn = document.createElement('button');
  btn.id = 'cses-bookmark-btn';

  const STAR_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" 
      fill="var(--star-fill, none)" stroke="var(--star-stroke, currentColor)" 
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;

  btn.innerHTML = STAR_SVG;

  const applyState = (bookmarked: boolean) => {
    btn.title = bookmarked ? 'Remove bookmark' : 'Bookmark (CSES Dashboard)';
    if (bookmarked) {
      btn.style.setProperty('--star-fill', '#eab308'); // gold
      btn.style.setProperty('--star-stroke', '#eab308');
    } else {
      btn.style.setProperty('--star-fill', 'none');
      btn.style.setProperty('--star-stroke', '#94a3b8'); // slate-400
    }
  };

  Object.assign(btn.style, {
    background: 'transparent', border: 'none', cursor: 'pointer',
    boxShadow: 'none', outline: 'none',
    lineHeight: '1', verticalAlign: 'middle',
    margin: '0 0 0 12px', padding: '0',
    transition: 'transform 0.15s ease', display: 'inline-flex', alignItems: 'center',
  });

  applyState(bookmarks[problemId] === true);

  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.08)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const nowBookmarked = await toggleBookmark(problemId);
    applyState(nowBookmarked);
    try { chrome.runtime.sendMessage({ type: 'BOOKMARK_CHANGED', payload: { problemId, bookmarked: nowBookmarked } }); } catch { /* ok */ }
  });

  titleEl.appendChild(btn);
}

export function onExecute() {
  run();
}
