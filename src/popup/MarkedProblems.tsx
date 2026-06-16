import React, { useMemo } from 'react';
import { Star, ExternalLink, Bookmark } from 'lucide-react';
import csesProblems from '../data/cses-problems.json';
import { toggleBookmark } from '../services/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarkedProblemsProps {
  bookmarks: Record<string, boolean>;
  solvedProblems: Record<string, boolean>;
}

interface ProblemEntry {
  id: string;
  title: string;
  category: string;
  solved: boolean;
}

interface CategoryGroup {
  category: string;
  problems: ProblemEntry[];
}

// ─── CSES official category order ─────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Introductory Problems',
  'Sorting and Searching',
  'Dynamic Programming',
  'Graph Algorithms',
  'Range Queries',
  'Tree Algorithms',
  'Mathematics',
  'String Algorithms',
  'Geometry',
  'Advanced Techniques',
  'Sliding Window Problems',
  'Interactive Problems',
  'Bitwise Operations',
  'Construction Problems',
  'Advanced Graph Problems',
  'Counting Problems',
  'Additional Problems I',
  'Additional Problems II',
];

// ─── Component ────────────────────────────────────────────────────────────────

const MarkedProblems: React.FC<MarkedProblemsProps> = ({ bookmarks, solvedProblems }) => {
  const grouped = useMemo<CategoryGroup[]>(() => {
    const bookmarkedIds = Object.keys(bookmarks).filter((id) => bookmarks[id]);

    if (bookmarkedIds.length === 0) return [];

    const problemMeta = csesProblems as Record<string, { title: string; category: string }>;

    // Build category → problem list
    const map: Record<string, ProblemEntry[]> = {};
    for (const id of bookmarkedIds) {
      const meta = problemMeta[id];
      if (!meta) continue;
      const cat = meta.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push({
        id,
        title: meta.title,
        category: cat,
        solved: solvedProblems[id] === true,
      });
    }

    // Sort problems alphabetically within each category
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => a.title.localeCompare(b.title));
    }

    // Sort categories in CSES order
    return CATEGORY_ORDER
      .filter((cat) => map[cat]?.length > 0)
      .map((cat) => ({ category: cat, problems: map[cat] }));
  }, [bookmarks, solvedProblems]);

  const handleRemoveBookmark = async (id: string) => {
    await toggleBookmark(id);
    // Storage change will trigger re-render via App.tsx listener
  };

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
          <Bookmark size={24} className="text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-400 mb-1">No bookmarks yet</h3>
        <p className="text-xs text-slate-600 max-w-[200px]">
          Visit a CSES problem page and click the ⭐ to bookmark it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-yellow-400" fill="#facc15" />
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Bookmarked Problems
          </h2>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {Object.values(bookmarks).filter(Boolean).length} saved
        </span>
      </div>

      {/* Category groups */}
      {grouped.map(({ category, problems }) => (
        <div key={category} className="glass-card overflow-hidden">
          {/* Category header */}
          <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700/40">
            <h3 className="text-[11px] font-semibold text-slate-300">{category}</h3>
          </div>

          {/* Problem list */}
          <div className="divide-y divide-slate-800/50">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/30 transition-colors group"
              >
                {/* Solved indicator */}
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    problem.solved ? 'bg-brand-500' : 'bg-slate-600'
                  }`}
                />

                {/* Problem name */}
                <span className="text-xs text-slate-300 flex-1 truncate">
                  {problem.title}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Open in browser */}
                  <a
                    href={`https://cses.fi/problemset/task/${problem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-700 transition-colors"
                    title="Open problem"
                  >
                    <ExternalLink size={10} className="text-slate-500" />
                  </a>

                  {/* Remove bookmark */}
                  <button
                    onClick={() => handleRemoveBookmark(problem.id)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-900/30 transition-colors"
                    title="Remove bookmark"
                  >
                    <Star size={10} className="text-yellow-500" fill="#eab308" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarkedProblems;
