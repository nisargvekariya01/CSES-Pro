// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserStats {
  username: string | null;
  solvedProblems: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  heatmapData: Record<string, number>;
  lastUpdated: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function storageGet<T>(keys: string | string[]): Promise<T> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Storage error:', chrome.runtime.lastError);
          resolve({} as T);
        } else {
          resolve(result as T);
        }
      });
    } catch (e: any) {
      if (e.message && e.message.includes('Extension context invalidated')) {
        console.warn('Extension context invalidated. Please refresh the page.');
      }
      resolve({} as T);
    }
  });
}

function storageSet(data: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.warn('Storage error:', chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (e: any) {
      if (e.message && e.message.includes('Extension context invalidated')) {
        console.warn('Extension context invalidated. Please refresh the page.');
      }
      resolve();
    }
  });
}

function getPrefix(user: string | null): string | null {
  return user ? `${user}_` : null;
}

// ─── Username ─────────────────────────────────────────────────────────────────

export async function getUsername(): Promise<string | null> {
  const result = await storageGet<{ username?: string | null }>('username');
  return result.username ?? null;
}

export async function setUsername(username: string | null): Promise<void> {
  await storageSet({ username });
}

// ─── Migration Helper ─────────────────────────────────────────────────────────

async function migrateLegacyData<T>(legacyKey: string, newKey: string, user: string | null): Promise<T | undefined> {
  // Only migrate if we have a logged-in user
  if (!user) return undefined;
  
  const result = await storageGet<any>([legacyKey, newKey]);
  if (result[newKey] !== undefined) {
    return result[newKey]; // Already migrated or fresh user
  }

  if (result[legacyKey] !== undefined) {
    // Perform migration
    await storageSet({ [newKey]: result[legacyKey] });
    return result[legacyKey];
  }

  return undefined;
}

// ─── Solved Problems ─────────────────────────────────────────────────────────

export async function getSolvedProblems(): Promise<Record<string, boolean>> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return {};

  const key = `${prefix}solvedProblems`;
  const migrated = await migrateLegacyData<Record<string, boolean>>('solvedProblems', key, user);
  if (migrated) return migrated;

  const result = await storageGet<any>(key);
  return result[key] ?? {};
}

export async function setSolvedProblems(data: Record<string, boolean>): Promise<void> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return;

  const key = `${prefix}solvedProblems`;
  await storageSet({ [key]: data });
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<Record<string, boolean>> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return {};

  const key = `${prefix}bookmarks`;
  const migrated = await migrateLegacyData<Record<string, boolean>>('bookmarks', key, user);
  if (migrated) return migrated;

  const result = await storageGet<any>(key);
  return result[key] ?? {};
}

export async function setBookmark(problemId: string): Promise<void> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return;

  const current = await getBookmarks();
  current[problemId] = true;
  await storageSet({ [`${prefix}bookmarks`]: current });
}

export async function removeBookmark(problemId: string): Promise<void> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return;

  const current = await getBookmarks();
  delete current[problemId];
  await storageSet({ [`${prefix}bookmarks`]: current });
}

export async function toggleBookmark(problemId: string): Promise<boolean> {
  const user = await getUsername();
  if (!user) return false;

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
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return {};

  const key = `${prefix}heatmapData`;
  const migrated = await migrateLegacyData<Record<string, number>>('heatmapData', key, user);
  if (migrated) return migrated;

  const result = await storageGet<any>(key);
  return result[key] ?? {};
}

export async function setHeatmapData(data: Record<string, number>): Promise<void> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return;

  await storageSet({ [`${prefix}heatmapData`]: data });
}

// ─── Aggregated Stats ─────────────────────────────────────────────────────────

export async function getUserStats(): Promise<UserStats> {
  const user = await getUsername();
  const prefix = getPrefix(user);

  // Use getters so migration runs if needed
  const solvedProblems = await getSolvedProblems();
  const bookmarks = await getBookmarks();
  const heatmapData = await getHeatmapData();

  if (!prefix) {
    return {
      username: null,
      solvedProblems: {},
      bookmarks: {},
      heatmapData: {},
      lastUpdated: 0,
    };
  }

  const lastUpdatedKey = `${prefix}lastUpdated`;
  const result = await storageGet<any>(lastUpdatedKey);

  let lastUpdated = result[lastUpdatedKey];
  if (lastUpdated === undefined) {
     const legacyResult = await storageGet<any>('lastUpdated');
     if (legacyResult['lastUpdated'] !== undefined) {
       lastUpdated = legacyResult['lastUpdated'];
       await storageSet({ [lastUpdatedKey]: lastUpdated });
     }
  }

  return {
    username: user,
    solvedProblems,
    bookmarks,
    heatmapData,
    lastUpdated: lastUpdated ?? 0,
  };
}

export async function setLastUpdated(): Promise<void> {
  const user = await getUsername();
  const prefix = getPrefix(user);
  if (!prefix) return;
  await storageSet({ [`${prefix}lastUpdated`]: Date.now() });
}
