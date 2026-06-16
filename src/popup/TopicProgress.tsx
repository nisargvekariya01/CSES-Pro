import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import csesProblems from '../data/cses-problems.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicProgressProps {
  solvedProblems: Record<string, boolean>;
}

interface CategoryStat {
  name: string;
  solved: number;
  total: number;
  percentage: number;
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

// ─── Color mapping ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Introductory Problems': '#22c55e',
  'Sorting and Searching': '#3b82f6',
  'Dynamic Programming': '#a855f7',
  'Graph Algorithms': '#f97316',
  'Range Queries': '#06b6d4',
  'Tree Algorithms': '#84cc16',
  'Mathematics': '#eab308',
  'String Algorithms': '#ec4899',
  'Geometry': '#14b8a6',
  'Advanced Techniques': '#f43f5e',
  'Sliding Window Problems': '#6366f1',
  'Interactive Problems': '#8b5cf6',
  'Bitwise Operations': '#d946ef',
  'Construction Problems': '#10b981',
  'Advanced Graph Problems': '#ea580c',
  'Counting Problems': '#0ea5e9',
  'Additional Problems I': '#64748b',
  'Additional Problems II': '#475569',
};

// ─── Component ────────────────────────────────────────────────────────────────

const TopicProgress: React.FC<TopicProgressProps> = ({ solvedProblems }) => {
  const categoryStats = useMemo<CategoryStat[]>(() => {
    // Build category → problem IDs map
    const categoryMap: Record<string, string[]> = {};
    for (const [id, meta] of Object.entries(csesProblems as Record<string, { title: string; category: string }>)) {
      const cat = meta.category;
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(id);
    }

    return CATEGORY_ORDER
      .filter((cat) => categoryMap[cat]?.length > 0)
      .map((cat) => {
        const problems = categoryMap[cat] ?? [];
        const solved = problems.filter((id) => solvedProblems[id]).length;
        const total = problems.length;
        return {
          name: cat,
          solved,
          total,
          percentage: total > 0 ? (solved / total) * 100 : 0,
        };
      });
  }, [solvedProblems]);

  const totalSolved = categoryStats.reduce((sum, c) => sum + c.solved, 0);
  const totalProblems = categoryStats.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-brand-400" />
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Topic Progress
          </h2>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {totalSolved}/{totalProblems} total
        </span>
      </div>

      {/* Category cards */}
      <div className="space-y-2">
        {categoryStats.map((cat) => {
          const color = CATEGORY_COLORS[cat.name] ?? '#64748b';
          return (
            <div key={cat.name} className="glass-card p-3 hover:border-slate-600/60 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-200 truncate flex-1">
                  {cat.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {cat.solved}/{cat.total}
                  </span>
                  <span
                    className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color,
                      backgroundColor: `${color}18`,
                    }}
                  >
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${cat.percentage}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicProgress;
