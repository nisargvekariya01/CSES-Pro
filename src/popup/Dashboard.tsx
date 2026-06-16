import React, { useState } from 'react';
import { RefreshCw, User, Code2, Flame, Trophy, Star, BarChart3, Scan, AlertCircle } from 'lucide-react';
import { UserStats } from '../services/storage';
import csesProblems from '../data/cses-problems.json';
import SolvedPieChart from './PieChart';
import HeatmapSection from './Heatmap';
import TopicProgress from './TopicProgress';
import MarkedProblems from './MarkedProblems';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  stats: UserStats;
  currentStreak: number;
  longestStreak: number;
  onRefresh: () => void;
  onScan: () => void;
  scanning: boolean;
  scanStatus: string;
}

type Tab = 'overview' | 'topics' | 'bookmarks';

interface TabDef {
  key: Tab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const TOTAL_PROBLEMS = Object.keys(csesProblems).length;

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  currentStreak,
  longestStreak,
  onRefresh,
  onScan,
  scanning,
  scanStatus,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const solvedCount = Object.keys(stats.solvedProblems).length;
  const totalCount = TOTAL_PROBLEMS;
  const unsolvedCount = totalCount - solvedCount;
  const percentage = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;
  const bookmarkCount = Object.keys(stats.bookmarks).filter((k) => stats.bookmarks[k]).length;

  const tabs: TabDef[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'topics', label: 'Topics', icon: Code2 },
    { key: 'bookmarks', label: 'Bookmarks', icon: Star, badge: bookmarkCount },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const isEmpty = solvedCount === 0 && !stats.username;

  return (
    <div className="flex flex-col bg-[#0f172a] min-h-full animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-4 pb-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Code2 size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">CSES Dashboard</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">Progress Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {stats.username && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
                <User size={11} className="text-brand-400" />
                <span className="text-xs font-semibold text-slate-200">{stats.username}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700 transition-colors"
              title="Reload from storage"
            >
              <RefreshCw size={12} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Scan banner (shown when no data or always as primary action) ─ */}
        <div
          className={`mb-3 rounded-xl border transition-all duration-300 overflow-hidden ${
            isEmpty
              ? 'border-brand-600/60 bg-brand-900/30'
              : 'border-slate-700/40 bg-slate-800/40'
          }`}
        >
          <button
            onClick={onScan}
            disabled={scanning}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isEmpty ? 'bg-brand-500/20 border border-brand-500/40' : 'bg-slate-700/60 border border-slate-600/40'
            }`}>
              <Scan size={13} className={scanning ? 'animate-pulse text-brand-400' : isEmpty ? 'text-brand-400' : 'text-slate-400'} />
            </div>
            <div className="flex-1 text-left">
              {scanStatus ? (
                <p className={`text-xs font-medium ${scanStatus.startsWith('⚠') || scanStatus.startsWith('No') ? 'text-amber-400' : 'text-brand-400'}`}>
                  {scanStatus}
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-200">
                    {scanning ? 'Scanning page...' : isEmpty ? 'Scan CSES page now' : 'Scan for updates'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isEmpty ? 'Open cses.fi/problemset/list then click here' : 'Click while on cses.fi/problemset/list'}
                  </p>
                </>
              )}
            </div>
            {isEmpty && !scanning && (
              <div className="flex-shrink-0 px-2 py-1 rounded-lg bg-brand-500 text-white text-[10px] font-bold">
                START
              </div>
            )}
          </button>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-bold font-mono text-brand-400 leading-none">
              {solvedCount}
              <span className="text-sm text-slate-500">/{totalCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Solved</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-bold font-mono text-amber-400 leading-none">
              {percentage.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Complete</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-bold font-mono text-yellow-400 leading-none">{bookmarkCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Bookmarked</div>
          </div>
        </div>

        {/* ── Streak Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="glass-card px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <Flame size={14} className="text-orange-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{currentStreak} days</div>
              <div className="text-[10px] text-slate-500">Current Streak</div>
            </div>
          </div>
          <div className="glass-card px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Trophy size={14} className="text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{longestStreak} days</div>
              <div className="text-[10px] text-slate-500">Best Streak</div>
            </div>
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <div className="mt-3">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-800/60 px-4">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={12} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-slide-up">
        {activeTab === 'overview' && (
          <>
            <SolvedPieChart solved={solvedCount} unsolved={unsolvedCount} total={totalCount} />
            <div className="section-divider" />
            <HeatmapSection heatmapData={stats.heatmapData} />
          </>
        )}
        {activeTab === 'topics' && <TopicProgress solvedProblems={stats.solvedProblems} />}
        {activeTab === 'bookmarks' && (
          <MarkedProblems bookmarks={stats.bookmarks} solvedProblems={stats.solvedProblems} />
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {stats.lastUpdated > 0 && (
        <div className="px-4 pb-3 text-center">
          <p className="text-[9px] text-slate-600">
            Last scanned {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
