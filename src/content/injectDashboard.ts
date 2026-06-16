// Content script: Inject a "Dashboard" tab into the CSES navigation bar.
// Shows: pie chart + 365-day Codeforces-style heatmap + category table.

import csesProblems from '../data/cses-problems.json';
import { getUserStats } from '../services/storage';

// ─── Category order ───────────────────────────────────────────────────────────

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
  'Additional Problems',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getCategoryStats(solvedProblems: Record<string, boolean>) {
  const problems = csesProblems as Record<string, { title: string; category: string }>;
  const catMap: Record<string, string[]> = {};
  for (const [id, meta] of Object.entries(problems)) {
    if (!catMap[meta.category]) catMap[meta.category] = [];
    catMap[meta.category].push(id);
  }
  return CATEGORY_ORDER
    .filter((c) => catMap[c]?.length)
    .map((c) => {
      const ids = catMap[c]!;
      const solved = ids.filter((id) => solvedProblems[id]).length;
      return { name: c, solved, total: ids.length, pct: ids.length ? (solved / ids.length) * 100 : 0 };
    });
}

function isDarkMode(): boolean {
  // CSES sets rel="stylesheet" on the dark stylesheet when dark mode is active
  const darkSheet = document.getElementById('styles-dark') as HTMLLinkElement | null;
  return darkSheet?.rel === 'stylesheet';
}

// ─── SVG Donut Pie Chart ──────────────────────────────────────────────────────

function buildPieChart(solved: number, total: number, dark: boolean): string {
  const pct = total > 0 ? solved / total : 0;
  const unsolved = total - solved;
  const r = 52;
  const cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;
  const solvedLen = pct * circumference;
  const unsolvedLen = circumference - solvedLen;

  const textColor = dark ? '#e2e8f0' : '#111827';
  const mutedColor = dark ? '#94a3b8' : '#6b7280';
  const unsolvedColor = dark ? '#334155' : '#e5e7eb';

  // Pie wedge using stroke-dasharray trick on a circle
  const solvedArc = pct > 0 ? `
    <circle cx="${cx}" cy="${cy}" r="${r}"
      fill="none" stroke="#22c55e" stroke-width="22"
      stroke-dasharray="${solvedLen.toFixed(2)} ${unsolvedLen.toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"
      stroke-linecap="butt"/>` : '';

  const svg = `
  <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0;display:block;margin:0 auto">
    <!-- Track -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${unsolvedColor}" stroke-width="22"/>
    <!-- Solved arc -->
    ${solvedArc}
    <!-- Center text: percentage -->
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" dominant-baseline="middle"
      font-size="20" font-weight="700" fill="${textColor}" font-family="inherit">
      ${(pct * 100).toFixed(1)}%
    </text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" dominant-baseline="middle"
      font-size="11" fill="${mutedColor}" font-family="inherit">
      ${solved} / ${total}
    </text>
  </svg>`;

  return `
  <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
    ${svg}
    <div style="display:flex;gap:16px;font-size:12px;color:${textColor};font-weight:500">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
        Solved
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:${unsolvedColor};border:1px solid ${dark ? '#475569' : '#d1d5db'}"></div>
        <span style="color:${mutedColor}">Unsolved</span>
      </div>
    </div>
  </div>`;
}

// ─── 365-day Codeforces-style Heatmap (SVG) ───────────────────────────────────

function buildYearHeatmap(heatmapData: Record<string, number>, dark: boolean): string {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_LABELS = ['','M','','W','','F',''];

  // Color scales
  const colors = dark
    ? ['#1e293b', '#14532d', '#166534', '#16a34a', '#22c55e']
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  const textColor = dark ? '#94a3b8' : '#767676';

  // Build date range: align to the Sunday of the week containing (today − 364 days)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yearAgo = new Date(today.getTime() - 364 * 86400000);
  const startDow = yearAgo.getDay(); // 0 = Sunday
  const startDate = new Date(yearAgo.getTime() - startDow * 86400000);

  // Build week columns
  type Cell = { dateStr: string; count: number; inRange: boolean } | null;
  const weeks: Cell[][] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const inRange = cur >= yearAgo && cur <= today;
      const ds = toDateStr(cur);
      week.push({ dateStr: ds, count: heatmapData[ds] ?? 0, inRange });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Cell geometry
  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;
  const LEFT_PAD = 22; // day labels width
  const TOP_PAD = 18;  // month labels height

  const svgW = LEFT_PAD + weeks.length * STEP;
  const svgH = TOP_PAD + 7 * STEP;

  // Month label positions — label appears at the first week of each month
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstCell = weeks[w].find((c) => c !== null);
    if (!firstCell) continue;
    const d = new Date(firstCell.dateStr + 'T00:00:00');
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ x: LEFT_PAD + w * STEP, label: MONTHS[d.getMonth()] });
      lastMonth = d.getMonth();
    }
  }

  // Build SVG
  let cellsSVG = '';
  for (let w = 0; w < weeks.length; w++) {
    for (let d = 0; d < 7; d++) {
      const cell = weeks[w][d];
      if (!cell) continue;
      const x = LEFT_PAD + w * STEP;
      const y = TOP_PAD + d * STEP;
      let ci = 0;
      if (cell.inRange) {
        const cnt = cell.count;
        if (cnt === 0) ci = 0;
        else if (cnt === 1) ci = 1;
        else if (cnt <= 3) ci = 2;
        else if (cnt <= 6) ci = 3;
        else ci = 4;
      }
      const tooltip = cell.inRange
        ? `${cell.dateStr}: ${cell.count === 0 ? 'No activity' : `${cell.count} solved`}`
        : '';
      cellsSVG += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${colors[ci]}">${tooltip ? `<title>${tooltip}</title>` : ''}</rect>`;
    }
  }

  // Month labels SVG
  const monthSVG = monthLabels
    .map(({ x, label }) => `<text x="${x}" y="${TOP_PAD - 4}" font-size="10" fill="${textColor}" font-family="inherit">${label}</text>`)
    .join('');

  // Day labels (M, W, F only)
  const daySVG = DAY_LABELS.map((lbl, d) =>
    lbl ? `<text x="${LEFT_PAD - 4}" y="${TOP_PAD + d * STEP + CELL - 2}" font-size="9" fill="${textColor}" text-anchor="end" font-family="inherit">${lbl}</text>` : ''
  ).join('');

  // Legend
  const legendX = LEFT_PAD;
  const legendY = TOP_PAD + 7 * STEP + 10;
  const legendSVG = `
    <text x="${legendX}" y="${legendY + 10}" font-size="9" fill="${textColor}" font-family="inherit">Less</text>
    ${[0,1,2,3,4].map((i, idx) => `<rect x="${legendX + 28 + idx * (CELL + 2)}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2" fill="${colors[i]}"/>`).join('')}
    <text x="${legendX + 28 + 5 * (CELL + 2) + 2}" y="${legendY + 10}" font-size="9" fill="${textColor}" font-family="inherit">More</text>
  `;

  const totalSvgH = svgH + 28;
  return `
  <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <svg width="${svgW}" height="${totalSvgH}" viewBox="0 0 ${svgW} ${totalSvgH}" style="min-width:${svgW}px;display:block">
      ${monthSVG}
      ${daySVG}
      ${cellsSVG}
      ${legendSVG}
    </svg>
  </div>`;
}

// ─── Streak calc ──────────────────────────────────────────────────────────────

function calcStreaks(heatmap: Record<string, number>): { cur: number; best: number } {
  const dates = Object.keys(heatmap).filter((d) => (heatmap[d] ?? 0) > 0).sort();
  if (!dates.length) return { cur: 0, best: 0 };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);
  const yestStr = toDateStr(new Date(today.getTime() - 86400000));

  let cur = 0;
  if ((heatmap[todayStr] ?? 0) > 0 || (heatmap[yestStr] ?? 0) > 0) {
    let anchor = (heatmap[todayStr] ?? 0) > 0 ? today : new Date(today.getTime() - 86400000);
    cur = 1;
    for (;;) {
      const prev = new Date(anchor.getTime() - 86400000);
      if ((heatmap[toDateStr(prev)] ?? 0) > 0) { cur++; anchor = prev; } else break;
    }
  }

  let best = 0, tmp = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (diff === 1) tmp++; else { best = Math.max(best, tmp); tmp = 1; }
  }
  best = Math.max(best, tmp, cur);
  return { cur, best };
}

// ─── Render full dashboard HTML ───────────────────────────────────────────────

async function renderDashboard(): Promise<string> {
  const stats = await getUserStats();
  const { username, solvedProblems, heatmapData } = stats;
  const dark = isDarkMode();

  const total = Object.keys(csesProblems).length;
  const solved = Object.keys(solvedProblems).length;
  const pct = total > 0 ? (solved / total) * 100 : 0;
  const { cur: curStreak, best: bestStreak } = calcStreaks(heatmapData);

  const categoryStats = getCategoryStats(solvedProblems);

  // Colors matching CSES theme
  const bg       = dark ? '#1a1a2e' : '#ffffff';
  const cardBg   = dark ? '#16213e' : '#f8f9fa';
  const border   = dark ? '#2d3561' : '#dee2e6';
  const text     = dark ? '#e2e8f0' : '#222222';
  const muted    = dark ? '#94a3b8' : '#666666';
  const green    = '#00a000';

  // Category table rows
  const catRows = categoryStats.map(({ name, solved: s, total: t, pct: p }, i) => {
    const rowBg = i % 2 === 0 ? bg : cardBg;
    const color = p >= 100 ? green : p >= 50 ? '#2563eb' : '#94a3b8';
    return `
      <tr style="border-bottom:1px solid ${border}">
        <td style="padding:8px 14px;font-size:14px;color:${text}">${name}</td>
        <td style="padding:8px 14px;text-align:right;font-size:13px;color:${muted};white-space:nowrap">${s} / ${t}</td>
        <td style="padding:8px 14px;min-width:140px">
          <div style="background:${border};border-radius:999px;height:6px;overflow:hidden">
            <div style="width:${p.toFixed(1)}%;height:100%;background:${color};border-radius:999px"></div>
          </div>
        </td>
        <td style="padding:8px 14px;text-align:right;font-size:12px;font-weight:600;color:${color};white-space:nowrap;min-width:52px">${p.toFixed(1)}%</td>
      </tr>`;
  }).join('');

  return `
<div id="cses-dashboard-panel" style="font-family:inherit">
<style>
  #cses-dashboard-panel .cses-db-section {
    margin-bottom: 24px;
  }
  #cses-dashboard-panel .cses-db-section-title {
    font-size:13px;font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px
  }
  #cses-dashboard-panel .cses-db-table { width:100%;border-collapse:collapse;border:1px solid ${border};border-radius:8px;overflow:hidden }
  #cses-dashboard-panel .cses-db-table thead tr { border-bottom: 2px solid ${border} }
  #cses-dashboard-panel .cses-db-table thead th { padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:${muted};text-transform:uppercase;letter-spacing:.05em }
</style>

<!-- Title removed as it is now in the dropdown summary -->

<!-- Overall Progress (Pie chart + bar + streaks) -->
<div class="cses-db-section">
  <div class="cses-db-section-title">Overall Progress</div>
  <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">

    <!-- Donut pie chart -->
    ${buildPieChart(solved, total, dark)}

    <!-- Progress details + streaks -->
    <div style="flex:1;min-width:200px">
      <!-- Bar -->
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600;color:${text}">${solved} / ${total} problems</span>
          <span style="font-size:13px;font-weight:700;color:${green}">${pct.toFixed(1)}%</span>
        </div>
        <div style="background:${border};border-radius:999px;height:10px;overflow:hidden">
          <div style="width:${pct.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#15803d,#22c55e,#4ade80);border-radius:999px;transition:width 0.6s"></div>
        </div>
      </div>

      <!-- Streaks inline -->
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🔥</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#f97316;font-family:monospace;line-height:1">${curStreak}</div>
            <div style="font-size:10px;color:${muted}">day streak</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🏆</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#a855f7;font-family:monospace;line-height:1">${bestStreak}</div>
            <div style="font-size:10px;color:${muted}">best streak</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>



<!-- Category table -->
<table class="cses-db-table">
  <thead>
    <tr>
      <th>Category</th>
      <th style="text-align:right">Solved</th>
      <th>Progress</th>
      <th style="text-align:right">%</th>
    </tr>
  </thead>
  <tbody>${catRows}</tbody>
</table>

</div>`;
}

// ─── Inject dropdown ───────────────────────────────────────────────────────────

async function injectDashboardDropdown() {
  // Only inject on pages with content (like the tasks list)
  const content = document.querySelector<HTMLElement>('.content');
  if (!content || document.getElementById('cses-dashboard-wrapper')) return;

  // Only inject on the main task list page (e.g. /problemset/ or /problemset/list/)
  // Hide it on /stats/, /hacks/, /task/, etc.
  const path = window.location.pathname;
  if (!path.match(/\/(problemset|list)\/?$/)) return;

  const panelWrapper = document.createElement('div');
  panelWrapper.id = 'cses-dashboard-wrapper';
  panelWrapper.style.marginBottom = '24px';
  
  const dark = isDarkMode();
  const border = dark ? '#2d3561' : '#dee2e6';
  const bg = dark ? '#16213e' : '#f8f9fa';
  const text = dark ? '#e2e8f0' : '#222222';

  const summary = document.createElement('div');
  summary.style.cursor = 'pointer';
  summary.style.fontSize = '16px';
  summary.style.fontWeight = '600';
  summary.style.padding = '14px 18px';
  summary.style.backgroundColor = bg;
  summary.style.border = `1px solid ${border}`;
  summary.style.borderRadius = '8px';
  summary.style.color = text;
  summary.style.display = 'flex';
  summary.style.alignItems = 'center';
  summary.style.justifyContent = 'space-between';
  summary.style.transition = 'background-color 0.2s';
  summary.onmouseenter = () => summary.style.backgroundColor = dark ? '#1e293b' : '#e2e8f0';
  summary.onmouseleave = () => summary.style.backgroundColor = bg;
  
  // Custom arrow and text
  summary.innerHTML = `
    <span style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">📊</span> 
      <span>Progress Dashboard</span>
    </span>
    <span id="cses-db-arrow" style="font-size:12px;opacity:0.6;transition:transform 0.4s ease">▼</span>
  `;

  panelWrapper.appendChild(summary);

  // Use CSS grid transition for smooth height animation
  const dashboardContainer = document.createElement('div');
  dashboardContainer.style.display = 'grid';
  dashboardContainer.style.gridTemplateRows = '0fr';
  dashboardContainer.style.transition = 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  
  const innerContainer = document.createElement('div');
  innerContainer.style.overflow = 'hidden';

  const contentDiv = document.createElement('div');
  contentDiv.style.padding = '24px 0 8px 0';
  
  innerContainer.appendChild(contentDiv);
  dashboardContainer.appendChild(innerContainer);
  panelWrapper.appendChild(dashboardContainer);

  // Insert at the top of the content area
  content.insertBefore(panelWrapper, content.firstChild);

  let loaded = false;
  let isOpen = false;

  summary.addEventListener('click', async () => {
    isOpen = !isOpen;
    const arrow = document.getElementById('cses-db-arrow');
    
    if (isOpen) {
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      dashboardContainer.style.gridTemplateRows = '1fr';
      
      if (!loaded) {
        loaded = true;
        contentDiv.innerHTML = `
          <div style="padding:20px;text-align:center;color:#666;">
            Loading dashboard data...
          </div>`;
        const html = await renderDashboard();
        contentDiv.innerHTML = html;
      }
    } else {
      if (arrow) arrow.style.transform = 'rotate(0deg)';
      dashboardContainer.style.gridTemplateRows = '0fr';
    }
  });
}

export function onExecute() {
  injectDashboardDropdown();
}

