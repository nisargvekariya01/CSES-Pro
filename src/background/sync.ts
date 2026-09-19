import { setUsername, setSolvedProblems, setHeatmapData, setLastUpdated } from '../services/storage';

// Background service worker — message hub for CSES Progress Dashboard.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CSES Dashboard] Extension installed/updated.');
  
  // Set up a session keep-alive ping every 20 minutes
  chrome.alarms.create('cses-keep-alive', {
    periodInMinutes: 20
  });
});

// Fire the keep-alive fetch
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cses-keep-alive') {
    fetch('https://cses.fi/', { credentials: 'include' })
      .then(r => r.text())
      .then(() => console.log('[CSES Dashboard] Sent session keep-alive ping'))
      .catch(e => console.error('[CSES Dashboard] Keep-alive ping failed', e));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, payload } = message as {
    type: string;
    payload: Record<string, unknown>;
  };

  switch (type) {
    case 'SET_USERNAME': {
      setUsername(payload.username as string | null).then(() => {
        console.log('[CSES Dashboard] Username set:', payload.username);
        sendResponse({ ok: true });
      });
      return true; // Keep message channel open for async response
    }

    case 'UPDATE_SOLVED': {
      (async () => {
        if (payload.solved) await setSolvedProblems(payload.solved as Record<string, boolean>);
        if (payload.heatmap) await setHeatmapData(payload.heatmap as Record<string, number>);
        await setLastUpdated();
        console.log('[CSES Dashboard] Solved problems updated.');
        sendResponse({ ok: true });
      })();
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
