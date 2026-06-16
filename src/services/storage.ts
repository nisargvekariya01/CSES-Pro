// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserStats {
  username: string | null;
  solvedProblems: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  heatmapData: Record<string, number>;
  lastUpdated: number;
}

export interface StorageData {
  username?: string;
  solvedProblems?: Record<string, boolean>;
  bookmarks?: Record<string, boolean>;
  heatmapData?: Record<string, number>;
  lastUpdated?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function storageGet<T>(keys: string | string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result as T);
      }
    });
  });
}

function storageSet(data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// ─── Username ─────────────────────────────────────────────────────────────────

export async function getUsername(): Promise<string | null> {
  const result = await storageGet<{ username?: string }>('username');
  return result.username ?? null;
}

export async function setUsername(username: string): Promise<void> {
  await storageSet({ username });
}

// ─── Solved Problems ─────────────────────────────────────────────────────────

export async function getSolvedProblems(): Promise<Record<string, boolean>> {
  const result = await storageGet<{ solvedProblems?: Record<string, boolean> }>('solvedProblems');
  return result.solvedProblems ?? {};
}

export async function setSolvedProblems(data: Record<string, boolean>): Promise<void> {
  await storageSet({ solvedProblems: data });
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<Record<string, boolean>> {
  const result = await storageGet<{ bookmarks?: Record<string, boolean> }>('bookmarks');
  return result.bookmarks ?? {};
}

export async function setBookmark(problemId: string): Promise<void> {
  const current = await getBookmarks();
  current[problemId] = true;
  await storageSet({ bookmarks: current });
}

export async function removeBookmark(problemId: string): Promise<void> {
  const current = await getBookmarks();
  delete current[problemId];
  await storageSet({ bookmarks: current });
}

export async function toggleBookmark(problemId: string): Promise<boolean> {
  const current = await getBookmarks();
  if (current[problemId]) {
    await removeBookmark(problemId);
    return false;
  } else {
    await setBookmark(problemId);
    return true;
  }
}

// ─── Heatmap Data ────────────────────────────────────────────────────────────

export async function getHeatmapData(): Promise<Record<string, number>> {
  const result = await storageGet<{ heatmapData?: Record<string, number> }>('heatmapData');
  return result.heatmapData ?? {};
}

export async function setHeatmapData(data: Record<string, number>): Promise<void> {
  await storageSet({ heatmapData: data });
}

export async function incrementHeatmapDate(
  dateStr: string,
  count: number = 1
): Promise<void> {
  const current = await getHeatmapData();
  current[dateStr] = (current[dateStr] ?? 0) + count;
  await storageSet({ heatmapData: current });
}

// ─── Aggregated Stats ─────────────────────────────────────────────────────────

export async function getUserStats(): Promise<UserStats> {
  const result = await storageGet<StorageData>([
    'username',
    'solvedProblems',
    'bookmarks',
    'heatmapData',
    'lastUpdated',
  ]);
  return {
    username: result.username ?? null,
    solvedProblems: result.solvedProblems ?? {},
    bookmarks: result.bookmarks ?? {},
    heatmapData: result.heatmapData ?? {},
    lastUpdated: result.lastUpdated ?? 0,
  };
}

export async function setLastUpdated(): Promise<void> {
  await storageSet({ lastUpdated: Date.now() });
}
