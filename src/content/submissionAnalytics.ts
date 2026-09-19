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

}

// Init on load
initSubmissionAnalytics();
