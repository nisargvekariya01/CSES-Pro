/**
 * Scraper functions injected into the CSES page via chrome.scripting.executeScript.
 * These functions run in the context of the CSES tab — no imports, self-contained.
 */

/** Extract username from CSES page */
export function scrapeUsername(): string | null {
  const accountLink = document.querySelector<HTMLAnchorElement>('a.account');
  if (!accountLink) return null;
  const href = accountLink.getAttribute('href') ?? '';
  const text = accountLink.textContent?.trim() ?? '';
  if (href.includes('/user/')) {
    const m = href.match(/\/user\/([^/?#]+)/);
    if (m?.[1]) return decodeURIComponent(m[1]);
  }
  if (text && text.toLowerCase() !== 'login') return text;
  return null;
}

/** Extract solved problem IDs from CSES problemset page */
export function scrapeSolvedProblems(): Record<string, boolean> {
  const solved: Record<string, boolean> = {};
  document.querySelectorAll<HTMLElement>('li.task').forEach((li) => {
    const score = li.querySelector('.task-score');
    if (!score?.classList.contains('full')) return;
    const link = li.querySelector<HTMLAnchorElement>('a[href*="/task/"]');
    const m = link?.getAttribute('href')?.match(/\/task\/(\d+)/);
    if (m?.[1]) solved[m[1]] = true;
  });
  return solved;
}

/** Scan the active CSES tab from the popup using chrome.scripting */
export async function scanActiveTab(): Promise<{
  username: string | null;
  solved: Record<string, boolean>;
  isListPage: boolean;
  url: string;
}> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes('cses.fi')) {
    return { username: null, solved: {}, isListPage: false, url: tab?.url ?? '' };
  }

  const url = tab.url;

  // Run username scraper
  const usernameResults = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeUsername,
  });
  const username = usernameResults[0]?.result ?? null;

  // Run solved problems scraper (only on list pages)
  const isListPage = /cses\.fi\/problemset\/?(\?.*)?$/.test(url) || /cses\.fi\/problemset\/list/.test(url);
  let solved: Record<string, boolean> = {};

  if (isListPage) {
    const solvedResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeSolvedProblems,
    });
    solved = solvedResults[0]?.result ?? {};
  }

  return { username, solved, isListPage, url };
}
