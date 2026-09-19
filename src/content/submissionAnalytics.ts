export function initSubmissionAnalytics() {
  if (!window.location.pathname.match(/\/result\/\d+\/?$/)) return;

  const content = document.querySelector('.content');
  if (!content) return;

  // 1. Enhanced First-Failing-Test Visibility
  const tables = content.querySelectorAll('table');
  let firstFailedRow: HTMLTableRowElement | null = null;
  let firstFailedVerdict = '';
  let firstFailedTestName = '';

  for (const table of Array.from(tables)) {
    const rows = table.querySelectorAll('tr');
    
    // We only care about test details table.
    // The summary table usually has 2 columns (th, td).
    // Test details table has columns: test name, verdict, time, etc (3+ columns).
    for (const row of Array.from(rows)) {
      const text = row.textContent?.toUpperCase() || '';
      
      if (text.includes('WRONG ANSWER') || text.includes('TIME LIMIT EXCEEDED') || text.includes('RUNTIME ERROR')) {
        if (row.cells.length >= 3) {
           // It's a test case row!
           firstFailedRow = row;
           firstFailedTestName = row.cells[0]?.textContent?.trim() || 'A test';
           
           if (text.includes('WRONG ANSWER')) firstFailedVerdict = 'Wrong Answer';
           else if (text.includes('TIME LIMIT EXCEEDED')) firstFailedVerdict = 'Time Limit Exceeded';
           else if (text.includes('RUNTIME ERROR')) firstFailedVerdict = 'Runtime Error';
           break;
        }
      }
    }
    if (firstFailedRow) break;
  }

  if (firstFailedRow) {
    // Inject the banner!
    const banner = document.createElement('div');
    banner.style.cssText = `
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
    `;
    banner.innerHTML = `
      <i class="fas fa-exclamation-circle" style="font-size: 20px;"></i>
      <span>Failed on ${firstFailedTestName} (${firstFailedVerdict})</span>
      <button id="cses-scroll-to-test" style="
        margin-left: auto;
        background: transparent;
        border: 1px solid #ef4444;
        color: #ef4444;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      ">Scroll to Test</button>
    `;
    content.prepend(banner);

    const scrollBtn = document.getElementById('cses-scroll-to-test');
    if (scrollBtn) {
      scrollBtn.addEventListener('mouseenter', () => {
        scrollBtn.style.background = 'rgba(239, 68, 68, 0.1)';
      });
      scrollBtn.addEventListener('mouseleave', () => {
        scrollBtn.style.background = 'transparent';
      });
      scrollBtn.addEventListener('click', () => {
        firstFailedRow!.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // highlight briefly
        const oldBg = firstFailedRow!.style.backgroundColor;
        firstFailedRow!.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
        firstFailedRow!.style.transition = 'background 0.5s';
        setTimeout(() => {
          firstFailedRow!.style.backgroundColor = oldBg;
        }, 2000);
      });
    }
  }

  // 2. Runtime Percentile Feedback
  let isAccepted = false;
  let maxTime = -1;
  let resultRow: HTMLTableRowElement | null = null;
  
  const summaryTable = tables[0];
  if (summaryTable) {
    const text = summaryTable.textContent || '';
    if (text.includes('ACCEPTED')) {
      isAccepted = true;
      for (const row of Array.from(summaryTable.querySelectorAll('tr'))) {
        if (row.cells[0]?.textContent?.includes('Result')) {
          resultRow = row;
          break;
        }
      }
    }
  }

  // Extract max time from test cases table (tables[1] or tables[0])
  const testTable = tables.length > 1 ? tables[1] : tables[0];
  if (testTable && isAccepted) {
    for (const row of Array.from(testTable.querySelectorAll('tr'))) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        // time is usually the 3rd cell (index 2)
        const timeText = cells[2].textContent || '';
        if (timeText.includes('s')) {
          const t = parseFloat(timeText.replace('s', '').trim());
          if (!isNaN(t) && t > maxTime) maxTime = t;
        }
      }
    }
  }

  if (isAccepted && maxTime >= 0 && resultRow) {
    const timeVal = maxTime;
    // Find problem ID from the "Task:" row in the summary table
    let problemId = '';
    const taskLink = summaryTable.querySelector('a[href*="/task/"]') as HTMLAnchorElement | null;
    if (taskLink) {
      const match = taskLink.href.match(/\/task\/(\d+)/);
      if (match) problemId = match[1];
    }
    
    if (problemId) {
      // Fetch stats
      fetch(`/problemset/stats/${problemId}/`)
          .then(res => res.text())
          .then(html => {
            // Check for simple JS array patterns typically used in chart.js
            const dataMatch = html.match(/data:\s*\[([\d,\s]+)\]/);
            const labelsMatch = html.match(/labels:\s*\[([^\]]+)\]/);

            if (dataMatch && labelsMatch) {
              const dataArray = dataMatch[1].split(',').map(n => parseInt(n.trim()));
              const labelsArray = labelsMatch[1].split(',').map(s => parseFloat(s.replace(/["'s]/g, '').trim()));
              
              let totalSubmissions = 0;
              let slowerSubmissions = 0; // Submissions slower than user

              for (let i = 0; i < Math.min(dataArray.length, labelsArray.length); i++) {
                const count = dataArray[i];
                if (isNaN(count)) continue;
                totalSubmissions += count;
                if (labelsArray[i] > timeVal) {
                  slowerSubmissions += count;
                }
              }

              if (totalSubmissions > 0) {
                let percentile = Math.floor((slowerSubmissions / totalSubmissions) * 100);
                if (percentile === 0 && slowerSubmissions > 0) percentile = 1; // Don't demoralize too much!
                if (percentile > 99) percentile = 99; // Be humble
                
                // Inject the badge right next to the "ACCEPTED" text in the Result row
                if (resultRow && resultRow.cells[1]) {
                  const badge = document.createElement('span');
                  badge.style.cssText = `
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                  `;
                  badge.innerHTML = `<i class="fas fa-rocket"></i> Beats ${percentile}% (Max: ${timeVal}s)`;
                  resultRow.cells[1].appendChild(badge);
                }
              }
            }
          })
          .catch(e => console.error("Could not fetch CSES stats for percentile", e));
      }
  }
}

// Init on load
initSubmissionAnalytics();
