// Content script: Add Codeforces-style code pasting to CSES submit page.

function run() {
  const url = window.location.href;
  if (!url.includes('/submit')) return;

  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="file"]');
  const form = document.querySelector<HTMLFormElement>('form[enctype="multipart/form-data"]');
  if (!fileInput || !form) return;

  const codeDiv = fileInput.parentElement;
  if (!codeDiv) return;

  // Dynamically set class to fix native dropdown options
  const updateColorScheme = () => {
    const darkSheet = document.getElementById('styles-dark') as HTMLLinkElement | null;
    const isDark = darkSheet && darkSheet.rel === 'stylesheet';
    if (isDark) {
      document.body.classList.add('cses-is-dark');
    } else {
      document.body.classList.remove('cses-is-dark');
    }
  };
  updateColorScheme();

  const observer = new MutationObserver(updateColorScheme);
  observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['rel', 'disabled'] });

  // Inject adaptive styles for native form controls
  const style = document.createElement('style');
  style.textContent = `
    select[name="lang"], 
    input[type="file"]::file-selector-button, 
    input[type="submit"] {
      background-color: rgba(128, 128, 128, 0.08) !important;
      color: inherit !important;
      border: 1px solid rgba(128, 128, 128, 0.3) !important;
      padding: 6px 12px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-family: inherit !important;
      outline: none !important;
      transition: background-color 0.2s, transform 0.1s;
    }
    select[name="lang"]:hover, 
    input[type="file"]::file-selector-button:hover, 
    input[type="submit"]:hover {
      background-color: rgba(128, 128, 128, 0.15) !important;
    }
    select[name="lang"]:active, 
    input[type="file"]::file-selector-button:active, 
    input[type="submit"]:active {
      transform: scale(0.97);
    }
    body.cses-is-dark select[name="lang"] option {
      background-color: #1e293b;
      color: #e2e8f0;
    }
    body:not(.cses-is-dark) select[name="lang"] option {
      background-color: #ffffff;
      color: #222222;
    }
  `;
  document.head.appendChild(style);

  const toggleWrapper = document.createElement('div');
  toggleWrapper.style.display = 'flex';
  toggleWrapper.style.gap = '16px';
  toggleWrapper.style.marginTop = '16px';
  toggleWrapper.style.marginBottom = '8px';

  const radioPaste = document.createElement('input');
  radioPaste.type = 'radio';
  radioPaste.name = 'cses_submit_mode';
  radioPaste.id = 'mode_paste';
  radioPaste.checked = true;
  radioPaste.style.cursor = 'pointer';

  const labelPaste = document.createElement('label');
  labelPaste.htmlFor = 'mode_paste';
  labelPaste.textContent = 'Paste code';
  labelPaste.style.cursor = 'pointer';
  labelPaste.style.fontWeight = 'bold';

  const radioUpload = document.createElement('input');
  radioUpload.type = 'radio';
  radioUpload.name = 'cses_submit_mode';
  radioUpload.id = 'mode_upload';
  radioUpload.style.cursor = 'pointer';

  const labelUpload = document.createElement('label');
  labelUpload.htmlFor = 'mode_upload';
  labelUpload.textContent = 'Upload file';
  labelUpload.style.cursor = 'pointer';

  const wrapRadio = (radio: HTMLInputElement, label: HTMLLabelElement) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '4px';
    div.appendChild(radio);
    div.appendChild(label);
    return div;
  };

  toggleWrapper.appendChild(wrapRadio(radioPaste, labelPaste));
  toggleWrapper.appendChild(wrapRadio(radioUpload, labelUpload));

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Paste your code here...';
  textarea.style.width = '100%';
  textarea.style.maxWidth = '800px';
  textarea.style.minHeight = '300px';
  textarea.style.fontFamily = 'monospace';
  textarea.style.fontSize = '14px';
  textarea.style.padding = '12px';
  textarea.style.border = '1px solid rgba(128, 128, 128, 0.3)';
  textarea.style.borderRadius = '4px';
  textarea.style.resize = 'vertical';
  textarea.style.backgroundColor = 'rgba(128, 128, 128, 0.05)';
  textarea.style.color = 'inherit';

  const textareaWrapper = document.createElement('div');
  textareaWrapper.style.marginTop = '16px';
  textareaWrapper.style.marginBottom = '16px';
  textareaWrapper.appendChild(textarea);

  // Insert toggle before Code div
  codeDiv.parentElement?.insertBefore(toggleWrapper, codeDiv);

  // Move Language div before Code div
  const langSelect = document.querySelector<HTMLSelectElement>('select[name="lang"]');
  const langDiv = langSelect?.parentElement;
  if (langDiv) {
    codeDiv.parentElement?.insertBefore(langDiv, codeDiv);
  }

  // Insert textarea after Code div
  codeDiv.parentElement?.insertBefore(textareaWrapper, codeDiv.nextSibling);

  // Hide file input initially
  fileInput.style.display = 'none';

  // Handle toggling
  const updateVisibility = () => {
    if (radioPaste.checked) {
      textareaWrapper.style.display = 'block';
      fileInput.style.display = 'none';
      labelPaste.style.fontWeight = 'bold';
      labelUpload.style.fontWeight = 'normal';
    } else {
      textareaWrapper.style.display = 'none';
      fileInput.style.display = 'inline-block';
      labelPaste.style.fontWeight = 'normal';
      labelUpload.style.fontWeight = 'bold';
    }
  };

  radioPaste.addEventListener('change', updateVisibility);
  radioUpload.addEventListener('change', updateVisibility);

  // Inject the pasted code into the file input on form submit
  form.addEventListener('submit', (e) => {
    if (radioPaste.checked) {
      const code = textarea.value.trim();
      if (!code) {
        e.preventDefault();
        alert('Please paste some code before submitting!');
        return;
      }
      
      const langSelect = document.querySelector<HTMLSelectElement>('select[name="lang"]');
      const lang = langSelect?.value.toLowerCase() || '';
      let ext = 'txt';
      if (lang.includes('c++')) ext = 'cpp';
      else if (lang.includes('java')) ext = 'java';
      else if (lang.includes('python')) ext = 'py';
      else if (lang.includes('rust')) ext = 'rs';

      const file = new File([code], `solution.${ext}`, { type: 'text/plain' });
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    }
  });
}

export function onExecute() {
  run();
}
