// Content script: Convert CSES code blocks into Codeforces-style copyable boxes.

function run() {
  const url = window.location.href;
  // Run on task pages
  if (!url.includes('/task/')) return;

  const content = document.querySelector('.content');
  if (!content) return;

  // Find all <pre> elements (usually contain code or input/output data)
  const pres = content.querySelectorAll('pre');
  if (pres.length === 0) return;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .cses-cf-box {
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 4px;
      margin-bottom: 1em;
      overflow: hidden;
      background-color: rgba(128, 128, 128, 0.05);
      color: inherit;
    }
    .cses-cf-title {
      background-color: rgba(128, 128, 128, 0.15);
      border-bottom: 1px solid rgba(128, 128, 128, 0.3);
      padding: 4px 12px;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      color: inherit;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cses-cf-copy {
      cursor: pointer;
      color: #3b82f6; /* Blue that works well in both light and dark modes */
      font-weight: normal;
    }
    .cses-cf-copy:hover {
      text-decoration: underline;
    }
    .cses-cf-box pre {
      margin: 0 !important;
      padding: 12px !important;
      border: none !important;
      background: transparent !important;
      color: inherit !important;
    }
  `;
  document.head.appendChild(style);

  pres.forEach(pre => {
    // Check if the previous element is a <p> saying "Input:" or "Output:"
    let label = 'Code';
    let prev = pre.previousElementSibling as HTMLElement | null;
    if (prev && prev.tagName === 'P') {
      const text = prev.textContent?.trim() || '';
      if (text.toLowerCase().startsWith('input')) {
        label = 'Input';
        prev.style.display = 'none'; // hide the original label
      } else if (text.toLowerCase().startsWith('output')) {
        label = 'Output';
        prev.style.display = 'none'; // hide the original label
      }
    }

    // Wrap the pre inside a Codeforces-style box
    const box = document.createElement('div');
    box.className = 'cses-cf-box';

    const titleBar = document.createElement('div');
    titleBar.className = 'cses-cf-title';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;

    const copyBtn = document.createElement('span');
    copyBtn.className = 'cses-cf-copy';
    copyBtn.textContent = 'Copy';
    
    copyBtn.addEventListener('click', () => {
      const code = (pre.textContent || '').trimEnd();
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(err => {
        console.error('Failed to copy', err);
      });
    });

    titleBar.appendChild(labelSpan);
    titleBar.appendChild(copyBtn);

    box.appendChild(titleBar);
    
    // Insert box before pre, then move pre inside box
    pre.parentNode?.insertBefore(box, pre);
    box.appendChild(pre);
  });
}

export function onExecute() {
  run();
}
