import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieChartProps {
  solved: number;
  unsolved: number;
  total: number;
}

// ─── Custom Label ────────────────────────────────────────────────────────────

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: LabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={name === 'Solved' ? '#22c55e' : '#9ca3af'}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
      fontFamily="Inter, sans-serif"
      fontWeight={500}
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <div className="font-semibold text-white mb-0.5">{name}</div>
      <div className="text-slate-400">
        {value} problems ({(data.percent * 100).toFixed(1)}%)
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const COLORS = {
  solved: '#22c55e',
  unsolved: '#374151',
};

const SolvedPieChart: React.FC<PieChartProps> = ({ solved, unsolved, total }) => {
  const percentage = total > 0 ? (solved / total) * 100 : 0;

  const data = [
    { name: 'Solved', value: solved, percent: solved / (total || 1) },
    { name: 'Unsolved', value: unsolved, percent: unsolved / (total || 1) },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Completion Overview
        </h2>
        <span className="stat-badge px-2 py-0.5 text-xs">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            <Cell key="solved" fill={COLORS.solved} strokeWidth={0} />
            <Cell key="unsolved" fill={COLORS.unsolved} strokeWidth={0} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center stats */}
      <div className="flex justify-center gap-6 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span className="text-xs text-slate-400">
            Solved <span className="text-white font-mono font-semibold">{solved}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#374151]" />
          <span className="text-xs text-slate-400">
            Unsolved <span className="text-white font-mono font-semibold">{unsolved}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SolvedPieChart;
