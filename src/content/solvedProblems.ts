// Content script: Scrape solved problems from CSES pages.
// @crxjs requires content scripts to export an `onExecute` function.

import {
  extractSolvedProblems,
  extractProblemIdFromUrl,
  isCurrentProblemSolved,
  getTodayDateString,
} from '../services/parser';
import {
  getSolvedProblems,
  setSolvedProblems,
  getHeatmapData,
  setHeatmapData,
  getBookmarks,
} from '../services/storage';

async function run() {
  const url = window.location.href;
  const today = getTodayDateString();

  const isListPage =
    /cses\.fi\/problemset\/?(\?.*)?$/.test(url) ||
    /cses\.fi\/problemset\/list/.test(url);

  if (isListPage) {
    const freshSolved = extractSolvedProblems(document);
    const freshCount = Object.keys(freshSolved).length;
    if (freshCount === 0) return;

    const storedSolved = await getSolvedProblems();
    const mergedSolved = { ...storedSolved, ...freshSolved };
    await setSolvedProblems(mergedSolved);

    const newlySolved = Object.keys(freshSolved).filter((id) => !storedSolved[id]).length;
    if (newlySolved > 0) {
      const heatmap = await getHeatmapData();
      heatmap[today] = (heatmap[today] ?? 0) + newlySolved;
      await setHeatmapData(heatmap);
      try { chrome.runtime.sendMessage({ type: 'UPDATE_SOLVED', payload: { solved: mergedSolved, heatmap } }); } catch { /* ok */ }
    } else {
      try { chrome.runtime.sendMessage({ type: 'UPDATE_SOLVED', payload: { solved: mergedSolved } }); } catch { /* ok */ }
    }

    // ─── Highlight Bookmarked Tasks ───
    const bookmarks = await getBookmarks();
    let styleEl = document.getElementById('cses-bookmark-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'cses-bookmark-styles';
      styleEl.textContent = `
        li.task.cses-bookmarked {
          background-color: rgba(234, 179, 8, 0.15) !important;
          border-left: 3px solid #eab308 !important;
        }
        li.task.cses-bookmarked:hover {
          background-color: rgba(234, 179, 8, 0.25) !important;
        }
        /* Dark mode compatibility */
        html.dark li.task.cses-bookmarked, body.dark li.task.cses-bookmarked {
          background-color: rgba(234, 179, 8, 0.1) !important;
        }
        html.dark li.task.cses-bookmarked:hover, body.dark li.task.cses-bookmarked:hover {
          background-color: rgba(234, 179, 8, 0.2) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const taskItems = document.querySelectorAll<HTMLElement>('li.task');
    taskItems.forEach((li) => {
      const link = li.querySelector<HTMLAnchorElement>('a[href*="/task/"]');
      if (link && link.getAttribute('href')?.match(/\/task\/(\d+)/)) {
        li.classList.add('cses-problem'); // Mark actual problems (not General links)
        const idMatch = link.getAttribute('href')?.match(/\/task\/(\d+)/);
        if (idMatch?.[1] && bookmarks[idMatch[1]]) {
          li.classList.add('cses-bookmarked');
        }
      }
    });

    // ─── Filter Toggle ───
    let filterWrapper = document.getElementById('cses-filter-wrapper');
    if (!filterWrapper) {
      filterWrapper = document.createElement('div');
      filterWrapper.id = 'cses-filter-wrapper';
      filterWrapper.style.margin = '20px 0 16px 0';
      filterWrapper.style.display = 'flex';
      filterWrapper.style.alignItems = 'center';
      filterWrapper.style.gap = '8px';
      
      const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      filterWrapper.style.color = dark ? '#e2e8f0' : '#222';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'cses-filter-bookmarks';
      checkbox.style.cursor = 'pointer';
      checkbox.style.width = '16px';
      checkbox.style.height = '16px';
      
      const label = document.createElement('label');
      label.htmlFor = 'cses-filter-bookmarks';
      label.textContent = 'Show only marked problems';
      label.style.cursor = 'pointer';
      label.style.fontSize = '14px';
      label.style.fontWeight = '600';
      
      const sortCheckbox = document.createElement('input');
      sortCheckbox.type = 'checkbox';
      sortCheckbox.id = 'cses-sort-popularity';
      sortCheckbox.style.cursor = 'pointer';
      sortCheckbox.style.width = '16px';
      sortCheckbox.style.height = '16px';
      sortCheckbox.style.marginLeft = '16px'; // spacing from previous
      
      // Load saved state
      const savedFilter = localStorage.getItem('cses-filter-bookmarks') === 'true';
      const savedSort = localStorage.getItem('cses-sort-popularity') === 'true';
      
      checkbox.checked = savedFilter;
      sortCheckbox.checked = savedSort;
      
      const sortLabel = document.createElement('label');
      sortLabel.htmlFor = 'cses-sort-popularity';
      sortLabel.textContent = 'Sort by most solved';
      sortLabel.style.cursor = 'pointer';
      sortLabel.style.fontSize = '14px';
      sortLabel.style.fontWeight = '600';

      filterWrapper.appendChild(checkbox);
      filterWrapper.appendChild(label);
      filterWrapper.appendChild(sortCheckbox);
      filterWrapper.appendChild(sortLabel);
      
      const content = document.querySelector('.content');
      if (content) {
         // Insert before the Introductory Problems header (or the second h2)
         const introHeader = Array.from(content.querySelectorAll('h2')).find(h => h.textContent?.includes('Introductory Problems'));
         if (introHeader) {
            content.insertBefore(filterWrapper, introHeader);
         } else {
            const h2s = content.querySelectorAll('h2');
            if (h2s.length > 1) content.insertBefore(filterWrapper, h2s[1]);
         }
      }

      const filterStyles = document.createElement('style');
      filterStyles.textContent = `
        /* Hidden state for unmarked problems */
        body.cses-filter-active li.task.cses-problem:not(.cses-bookmarked) {
          display: none !important;
        }
        
        /* Hidden state for empty categories */
        .cses-hidden-category {
          display: none !important;
        }
      `;
      document.head.appendChild(filterStyles);

      // Tag all category headers for easier styling
      document.querySelectorAll('h2').forEach(h2 => h2.classList.add('cses-cat-header'));

      checkbox.addEventListener('change', (e) => {
        const active = (e.target as HTMLInputElement).checked;
        localStorage.setItem('cses-filter-bookmarks', active.toString());
        
        if (active) {
          document.body.classList.add('cses-filter-active');
        } else {
          document.body.classList.remove('cses-filter-active');
        }
        
        // Hide/show empty categories by adding a class instead of display:none to allow transitions
        const uls = document.querySelectorAll<HTMLElement>('ul.task-list');
        uls.forEach(ul => {
           // Skip General section (which has no .cses-problem)
           if (!ul.querySelector('li.task.cses-problem')) return;
           
           const hasMarked = ul.querySelector('li.task.cses-bookmarked') !== null;
           const header = ul.previousElementSibling as HTMLElement | null;
           
           if (active && !hasMarked) {
              ul.classList.add('cses-hidden-category');
              if (header && header.tagName === 'H2') header.classList.add('cses-hidden-category');
           } else {
              ul.classList.remove('cses-hidden-category');
              if (header && header.tagName === 'H2') header.classList.remove('cses-hidden-category');
           }
        });
      });

      // Handle Sorting
      sortCheckbox.addEventListener('change', (e) => {
        const active = (e.target as HTMLInputElement).checked;
        localStorage.setItem('cses-sort-popularity', active.toString());
        
        const uls = document.querySelectorAll<HTMLElement>('ul.task-list');
        uls.forEach(ul => {
           // Skip General section
           if (!ul.querySelector('li.task.cses-problem')) return;
           
           const items = Array.from(ul.querySelectorAll('li.task'));
           if (active) {
              if (!ul.hasAttribute('data-original-order')) {
                 ul.setAttribute('data-original-order', 'true');
                 items.forEach((item, idx) => {
                    item.setAttribute('data-orig-idx', idx.toString());
                 });
              }
              items.sort((a, b) => {
                 const getCount = (li: Element) => {
                    const text = li.querySelector('.detail')?.textContent || '';
                    const m = text.replace(/,/g, '').match(/(\d+)/);
                    return m ? parseInt(m[1], 10) : 0;
                 };
                 return getCount(b) - getCount(a);
              });
           } else {
              items.sort((a, b) => {
                 const idxA = parseInt(a.getAttribute('data-orig-idx') || '0', 10);
                 const idxB = parseInt(b.getAttribute('data-orig-idx') || '0', 10);
                 return idxA - idxB;
              });
           }
           // Re-append in new order
           items.forEach(item => ul.appendChild(item));
        });
      });

      // Apply initial state if needed
      if (savedFilter) checkbox.dispatchEvent(new Event('change'));
      if (savedSort) sortCheckbox.dispatchEvent(new Event('change'));
    }

    return;
  }

  if (url.includes('/task/')) {
    const problemId = extractProblemIdFromUrl(url);
    if (!problemId) return;
    const isSolved = isCurrentProblemSolved(document);
    if (!isSolved) return;
    const storedSolved = await getSolvedProblems();
    if (storedSolved[problemId]) return;
    storedSolved[problemId] = true;
    await setSolvedProblems(storedSolved);
    const heatmap = await getHeatmapData();
    heatmap[today] = (heatmap[today] ?? 0) + 1;
    await setHeatmapData(heatmap);
    try { chrome.runtime.sendMessage({ type: 'UPDATE_SOLVED', payload: { solved: storedSolved, heatmap } }); } catch { /* ok */ }
  }
}

export function onExecute() {
  run();
}

