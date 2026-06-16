import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { Calendar } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeatmapProps {
  heatmapData: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRangeEnd(): Date {
  return new Date();
}

function getDateRangeStart(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

function getClassForValue(value: { date: string; count?: number } | null): string {
  if (!value || !value.count || value.count === 0) return 'color-empty';
  if (value.count === 1) return 'color-scale-1';
  if (value.count <= 3) return 'color-scale-2';
  if (value.count <= 6) return 'color-scale-3';
  return 'color-scale-4';
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTooltipAttrs(value: { date: string; count?: number } | null): Record<string, string> {
  if (!value || !value.date) {
    return { 'data-tooltip-id': 'heatmap-tip', 'data-tooltip-content': '' };
  }
  const count = value.count ?? 0;
  return {
    'data-tooltip-id': 'heatmap-tip',
    'data-tooltip-content':
      count > 0
        ? `${formatTooltipDate(value.date)} — ${count} problem${count !== 1 ? 's' : ''} solved`
        : `${formatTooltipDate(value.date)} — No activity`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const HeatmapSection: React.FC<HeatmapProps> = ({ heatmapData }) => {
  const endDate = getDateRangeEnd();
  const startDate = getDateRangeStart();

  // Convert heatmap data to the format react-calendar-heatmap expects
  const values = Object.entries(heatmapData)
    .filter(([, count]) => count > 0)
    .map(([date, count]) => ({ date, count }));

  // Calculate total activity in last 365 days
  const totalActivity = values.reduce((sum, v) => sum + (v.count ?? 0), 0);
  const activeDays = values.length;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-brand-400" />
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Activity Heatmap
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">
            {activeDays} active days · {totalActivity} solved
          </span>
        </div>
      </div>

      <div className="overflow-hidden">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          classForValue={getClassForValue}
          tooltipDataAttrs={getTooltipAttrs}
          showWeekdayLabels={false}
          gutterSize={2}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[10px] text-slate-600 mr-1">Less</span>
        {(['color-empty', 'color-scale-1', 'color-scale-2', 'color-scale-3', 'color-scale-4'] as const).map(
          (cls) => (
            <svg key={cls} width="10" height="10" viewBox="0 0 10 10">
              <rect
                width="10"
                height="10"
                rx="2"
                className={cls}
              />
            </svg>
          )
        )}
        <span className="text-[10px] text-slate-600 ml-1">More</span>
      </div>

      <Tooltip
        id="heatmap-tip"
        place="top"
        className="heatmap-tooltip"
      />
    </div>
  );
};

export default HeatmapSection;
