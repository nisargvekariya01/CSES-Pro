declare module 'react-calendar-heatmap' {
  import React from 'react';

  export interface CalendarHeatmapValue {
    date: string;
    count?: number;
    [key: string]: unknown;
  }

  export interface ReactCalendarHeatmapProps {
    startDate: Date | string;
    endDate: Date | string;
    values: CalendarHeatmapValue[];
    classForValue?: (value: CalendarHeatmapValue | null) => string;
    tooltipDataAttrs?: (value: CalendarHeatmapValue | null) => Record<string, string>;
    showWeekdayLabels?: boolean;
    showMonthLabels?: boolean;
    gutterSize?: number;
    horizontal?: boolean;
    numDays?: number;
    onClick?: (value: CalendarHeatmapValue) => void;
  }

  const CalendarHeatmap: React.FC<ReactCalendarHeatmapProps>;
  export default CalendarHeatmap;
}
