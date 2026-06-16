// ─── Parser Utilities ────────────────────────────────────────────────────────
// Real CSES HTML structure (verified from live page):
//
// Header:
//   <div class="header">
//     <div class="controls">
//       <a class="account" href="/login">Login</a>        ← logged out
//       <a class="account" href="/user/NISARG_07">NISARG_07</a>  ← logged in
//     </div>
//   </div>
//
// Problem list (cses.fi/problemset or cses.fi/problemset/list):
//   <ul class="task-list">
//     <li class="task">
//       <a href="/problemset/task/1068">Weird Algorithm</a>
//       <span class="detail">167450 / 175050</span>
//       <span class="task-score icon full"></span>   ← solved (has "full" class)
//       <span class="task-score icon "></span>        ← unsolved (no "full")
//     </li>
//   </ul>

/**
 * Extract the logged-in username from the CSES header.
 * When logged in: <a class="account" href="/user/USERNAME">USERNAME</a>
 * When logged out: <a class="account" href="/login">Login</a>
 */
export function extractUsername(doc: Document): string | null {
  // Primary: .account link that does NOT point to /login
  const accountLink = doc.querySelector<HTMLAnchorElement>('a.account');
  if (accountLink) {
    const href = accountLink.getAttribute('href') ?? '';
    const text = accountLink.textContent?.trim() ?? '';

    // Logged-in state: href is /user/<username> or just username text ≠ "Login"
    if (href.includes('/user/') || (text.length > 0 && text.toLowerCase() !== 'login')) {
      // Extract from href if possible (most reliable)
      const hrefMatch = href.match(/\/user\/([^/?#]+)/);
      if (hrefMatch) return decodeURIComponent(hrefMatch[1]);
      // Fall back to text content
      if (text && text.toLowerCase() !== 'login') return text;
    }
  }

  // Fallback: any link with /user/ path in the header
  const userLinks = doc.querySelectorAll<HTMLAnchorElement>('.header a[href*="/user/"], .controls a[href*="/user/"]');
  for (const link of userLinks) {
    const href = link.getAttribute('href') ?? '';
    const match = href.match(/\/user\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Extract all solved problem IDs from a CSES problemset page.
 *
 * CSES marks solved tasks with:
 *   <span class="task-score icon full"></span>
 *
 * The structure of each task row:
 *   <li class="task">
 *     <a href="/problemset/task/1068">Weird Algorithm</a>
 *     <span class="detail">...</span>
 *     <span class="task-score icon full"></span>   ← solved
 *   </li>
 */
export function extractSolvedProblems(doc: Document): Record<string, boolean> {
  const solved: Record<string, boolean> = {};

  // Find all task list items
  const taskItems = doc.querySelectorAll<HTMLElement>('li.task');
  taskItems.forEach((li) => {
    // Check if the task-score span has the "full" class
    const scoreSpan = li.querySelector<HTMLElement>('.task-score');
    if (!scoreSpan || !scoreSpan.classList.contains('full')) return;

    // Extract problem ID from the task link
    const link = li.querySelector<HTMLAnchorElement>('a[href*="/task/"]');
    if (!link) return;

    const idMatch = link.getAttribute('href')?.match(/\/task\/(\d+)/);
    if (idMatch?.[1]) {
      solved[idMatch[1]] = true;
    }
  });

  return solved;
}

/**
 * Extract the current problem ID from a task page URL or document.
 * e.g. https://cses.fi/problemset/task/1635 → "1635"
 */
export function extractProblemIdFromUrl(url: string): string | null {
  const match = url.match(/\/task\/(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Check if the current problem page has been solved.
 * On a task page, CSES shows a green checkmark via:
 *   <span class="task-score icon full"></span>  in the page header area
 * OR via accepted verdict in submission list.
 */
export function isCurrentProblemSolved(doc: Document): boolean {
  // Most reliable: task-score with full class anywhere on page
  const scoreEl = doc.querySelector('.task-score.full');
  if (scoreEl) return true;

  // Check for accepted verdict text in submission results
  const verdicts = doc.querySelectorAll<HTMLElement>('.verdict');
  for (const v of verdicts) {
    if (v.classList.contains('verdict-accepted') || v.textContent?.includes('ACCEPTED')) {
      return true;
    }
  }

  return false;
}

/**
 * Get today's date string in YYYY-MM-DD format (local time).
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a date object to YYYY-MM-DD string (local time).
 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
