import React, { useEffect, useState, useCallback } from 'react';
import { getUserStats, UserStats, setUsername, setSolvedProblems, setLastUpdated, getHeatmapData, setHeatmapData } from '../services/storage';
import { scanActiveTab } from '../services/scanner';
import { extractUsername, extractSolvedProblems } from '../services/parser';
import Dashboard from './Dashboard';

// ─── Streak Calculator ────────────────────────────────────────────────────────

function calculateStreaks(heatmapData: Record<string, number>): {
  currentStreak: number;
  longestStreak: number;
} {
  const dates = Object.keys(heatmapData)
    .filter((d) => (heatmapData[d] ?? 0) > 0)
    .sort();

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  // Current streak
  let currentStreak = 0;
  const hasToday = (heatmapData[todayStr] ?? 0) > 0;
  const hasYesterday = (heatmapData[yesterdayStr] ?? 0) > 0;
  if (hasToday || hasYesterday) {
    let anchor = hasToday ? now : new Date(now.getTime() - 86400000);
    let streak = 1;
    for (;;) {
      const prev = new Date(anchor.getTime() - 86400000);
      const prevStr = prev.toISOString().split('T')[0];
      if ((heatmapData[prevStr] ?? 0) > 0) { streak++; anchor = prev; } else break;
    }
    currentStreak = streak;
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { tempStreak++; }
    else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');

  const loadStats = useCallback(async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error('[CSES Dashboard] Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const handler = () => loadStats();
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [loadStats]);

  // ── Sync with CSES Server ──────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    setScanning(true);
    setScanStatus('Syncing from CSES...');
    try {
      const res = await fetch('https://cses.fi/problemset/list/');
      if (!res.ok) {
        setScanStatus('⚠ Failed to fetch data');
        return;
      }
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const username = extractUsername(doc);
      let changed = false;

      if (username) {
        await setUsername(username);
        changed = true;
      }

      const freshSolved = extractSolvedProblems(doc);
      if (Object.keys(freshSolved).length > 0) {
        const stored = stats?.solvedProblems ?? {};
        const merged = { ...stored, ...freshSolved };
        const storedCount = Object.keys(stored).length;
        const newCount = Object.keys(freshSolved).filter((id) => !stored[id]).length;
        await setSolvedProblems(merged);

        if (newCount > 0 && storedCount > 0) {
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const heatmap = await getHeatmapData();
          heatmap[dateStr] = (heatmap[dateStr] ?? 0) + newCount;
          await setHeatmapData(heatmap);
        }

        setScanStatus(`✓ Synced ${Object.keys(freshSolved).length} problems`);
        changed = true;
      } else {
        setScanStatus('⚠ No solved problems (Not logged in?)');
      }

      if (changed) {
        await setLastUpdated();
        await loadStats();
        if (!scanStatus.startsWith('⚠')) setScanStatus('✓ Dashboard synced!');
      }
    } catch (err) {
      console.error('[CSES Dashboard] Sync failed:', err);
      setScanStatus('Error — check permissions');
    } finally {
      setScanning(false);
      setTimeout(() => setScanStatus(''), 4000);
    }
  }, [stats, loadStats, scanStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-48 bg-[#0f172a]">
        <p className="text-slate-500 text-sm">Failed to load data</p>
      </div>
    );
  }

  const { currentStreak, longestStreak } = calculateStreaks(stats.heatmapData);

  return (
    <Dashboard
      stats={stats}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      onRefresh={loadStats}
      onScan={handleScan}
      scanning={scanning}
      scanStatus={scanStatus}
    />
  );
};

export default App;
