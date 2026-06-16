// Background service worker — message hub for CSES Progress Dashboard.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CSES Dashboard] Extension installed/updated.');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, payload } = message as {
    type: string;
    payload: Record<string, unknown>;
  };

  switch (type) {
    case 'SET_USERNAME': {
      chrome.storage.local.set({ username: payload.username }, () => {
        console.log('[CSES Dashboard] Username set:', payload.username);
        sendResponse({ ok: true });
      });
      return true; // Keep message channel open for async response
    }

    case 'UPDATE_SOLVED': {
      const updates: Record<string, unknown> = {
        lastUpdated: Date.now(),
      };
      if (payload.solved) updates.solvedProblems = payload.solved;
      if (payload.heatmap) updates.heatmapData = payload.heatmap;

      chrome.storage.local.set(updates, () => {
        console.log('[CSES Dashboard] Solved problems updated.');
        sendResponse({ ok: true });
      });
      return true;
    }

    case 'BOOKMARK_CHANGED': {
      // Just relay to any open popup (storage.onChanged handles the rest)
      sendResponse({ ok: true });
      return false;
    }

    default:
      sendResponse({ ok: false, error: 'Unknown message type' });
      return false;
  }
});
