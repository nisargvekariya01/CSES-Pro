// ─── CSES Direct Submit Service ──────────────────────────────────────────────
// Submits code directly to CSES without navigating away from the problem page.
// Uses the user's active browser session (cookies) automatically via fetch.

export type VerdictStatus =
  | 'ACCEPTED'
  | 'WRONG ANSWER'
  | 'TIME LIMIT EXCEEDED'
  | 'RUNTIME ERROR'
  | 'COMPILE ERROR'
  | 'MEMORY LIMIT EXCEEDED'
  | 'PENDING'
  | 'UNKNOWN';

export interface SubmitResult {
  success: boolean;
  verdict?: VerdictStatus;
  verdictRaw?: string;
  submissionUrl?: string;
  error?: string;
  compilerOutput?: string;
}

/** Language options fetched directly from CSES's submit form */
export interface CsesLangOption {
  value: string; // The exact form value CSES expects (e.g. "C++17")
  text: string;  // The display text (e.g. "C++17")
}

export interface SubmitPageData {
  csrf: string;
  langs: CsesLangOption[];
  hiddenFields: Record<string, string>;
  actionUrl: string;
}

const FILE_EXTENSIONS: Record<string, string> = {
  'c++': 'cpp',
  'cpp': 'cpp',
  'c':   'c',
  'java': 'java',
  'python': 'py',
  'py':   'py',
  'rust': 'rs',
  'javascript': 'js',
  'js':   'js',
  'ruby': 'rb',
};

/** Get file extension for a given CSES language value */
function getExtension(langValue: string): string {
  const lower = langValue.toLowerCase();
  if (lower.includes('c++') || lower.includes('cpp')) return 'cpp';
  if (lower.includes('java') && !lower.includes('javascript')) return 'java';
  if (lower.includes('python') || lower.includes('py')) return 'py';
  if (lower.includes('rust')) return 'rs';
  if (lower.includes('javascript') || lower.includes('js')) return 'js';
  if (lower.includes('ruby') || lower.includes('rb')) return 'rb';
  if (lower === 'c' || lower.startsWith('c ') || lower.startsWith('c,')) return 'c';
  return 'txt';
}

// ─── Verdict parsing ──────────────────────────────────────────────────────────
// CSES uses class names like "verdict-accepted" on span elements.
// We parse the DOM and ONLY look inside the main .content area, 
// completely ignoring the sidebar (which lists past submissions and causes false positives).

interface ParsedVerdict {
  status: VerdictStatus;
  compilerOutput?: string;
}

function parseVerdictFromHtml(html: string): ParsedVerdict {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const content = doc.querySelector('.content');
  if (!content) return { status: 'UNKNOWN' };

  // 1. Look for compiler output block if it's a compile error
  let compilerOutput: string | undefined;
  const compilerOutputHeaders = Array.from(content.querySelectorAll('h3, h4')).filter(h => h.textContent?.toLowerCase().includes('compiler output'));
  if (compilerOutputHeaders.length > 0) {
    const pre = compilerOutputHeaders[0].nextElementSibling;
    if (pre && pre.tagName.toLowerCase() === 'pre') {
      compilerOutput = pre.textContent || '';
    }
  }

  // 2. Class-based check inside main content only
  const contentHtml = content.innerHTML;
  if (/verdict-accepted/i.test(contentHtml))          return { status: 'ACCEPTED', compilerOutput };
  if (/verdict-wrong-answer/i.test(contentHtml))      return { status: 'WRONG ANSWER', compilerOutput };
  if (/verdict-time-limit/i.test(contentHtml))        return { status: 'TIME LIMIT EXCEEDED', compilerOutput };
  if (/verdict-runtime-error/i.test(contentHtml))     return { status: 'RUNTIME ERROR', compilerOutput };
  if (/verdict-compile-error/i.test(contentHtml))     return { status: 'COMPILE ERROR', compilerOutput };
  if (/verdict-memory-limit/i.test(contentHtml))      return { status: 'MEMORY LIMIT EXCEEDED', compilerOutput };

  // 3. Status/Result row check for PENDING states
  // Sometimes CSES says "Status: TESTING" or "READY"
  const text = content.textContent?.toUpperCase() || '';
  if (text.includes('STATUS: TESTING') || text.includes('STATUS: IN QUEUE') || text.includes('PENDING') || text.includes('RUNNING')) {
    return { status: 'PENDING', compilerOutput };
  }
  
  if (/\bACCEPTED\b/.test(text))                        return { status: 'ACCEPTED', compilerOutput };
  if (/WRONG\s+ANSWER/.test(text))                      return { status: 'WRONG ANSWER', compilerOutput };
  if (/TIME\s+LIMIT/.test(text))                        return { status: 'TIME LIMIT EXCEEDED', compilerOutput };
  if (/RUNTIME\s+ERROR/.test(text))                     return { status: 'RUNTIME ERROR', compilerOutput };
  if (/COMPILE\s+ERROR|COMPILATION\s+ERROR/.test(text)) return { status: 'COMPILE ERROR', compilerOutput };
  if (/MEMORY\s+LIMIT/.test(text))                      return { status: 'MEMORY LIMIT EXCEEDED', compilerOutput };

  return { status: 'UNKNOWN', compilerOutput };
}

// ─── Fetch submit page data (CSRF + language options) ─────────────────────────
// Uses DOMParser to reliably extract both in a single request.

export async function fetchSubmitPageData(problemId: string): Promise<SubmitPageData | null> {
  try {
    const resp = await fetch(`https://cses.fi/problemset/submit/${problemId}`, {
      credentials: 'include',
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Extract CSRF token via DOM (handles any attribute order)
    const csrfInput = doc.querySelector<HTMLInputElement>('input[name="csrf_token"]');
    const csrf = csrfInput?.value ?? '';

    // Extract language options from the actual CSES form
    const selectEl = doc.querySelector<HTMLSelectElement>('select[name="lang"]');
    const langs: CsesLangOption[] = Array.from(selectEl?.options ?? [])
      .map(opt => ({ value: opt.value, text: opt.text.trim() || opt.value }))
      .filter(l => l.value.length > 0);

    // Extract all hidden inputs (like 'type', 'taskId', etc.)
    const hiddenFields: Record<string, string> = {};
    const formEl = doc.querySelector('form[enctype="multipart/form-data"]');
    let actionUrl = '';
    if (formEl) {
      actionUrl = formEl.getAttribute('action') ?? '';
      const inputs = formEl.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
      inputs.forEach(inp => {
        if (inp.name && inp.name !== 'csrf_token') { // we handle csrf separately
          hiddenFields[inp.name] = inp.value;
        }
      });
    }

    if (!csrf) return null; // Not logged in or page structure changed

    return { csrf, langs, hiddenFields, actionUrl };
  } catch {
    return null;
  }
}

// ─── Poll for verdict ─────────────────────────────────────────────────────────

async function pollForVerdict(
  resultUrl: string,
  maxAttempts = 15,
  intervalMs = 2000,
): Promise<ParsedVerdict> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const resp = await fetch(resultUrl, {
        credentials: 'include',
        headers: { 'Accept': 'text/html' },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const verdict = parseVerdictFromHtml(html);
      if (verdict.status !== 'PENDING' && verdict.status !== 'UNKNOWN') return verdict;
    } catch {
      // Network glitch — keep polling
    }
  }
  return { status: 'PENDING' };
}

// ─── Main submit function ─────────────────────────────────────────────────────

export async function submitToCSES(
  problemId: string,
  code: string,
  langValue: string,                 // The exact CSES form option value (e.g. "C++17")
  cachedData?: SubmitPageData | null // Optional: supply pre-fetched submit page data
): Promise<SubmitResult> {

  // ── Step 1: Get submit page data (CSRF + hidden fields) ───────────────────
  let submitData = cachedData;
  if (!submitData) {
    submitData = await fetchSubmitPageData(problemId);
  }

  if (!submitData || !submitData.csrf) {
    return {
      success: false,
      error: 'Could not read CSRF token — are you logged in to CSES?',
    };
  }

  // ── Step 2: Build form data ─────────────────────────────────────────────────
  const ext      = getExtension(langValue);
  const codeFile = new File([code], `solution.${ext}`, { type: 'text/plain' });

  const formData = new FormData();
  formData.append('csrf_token', submitData.csrf);
  
  // Append any hidden fields CSES expects (like type="FILE")
  if (submitData.hiddenFields) {
    for (const [name, val] of Object.entries(submitData.hiddenFields)) {
      formData.append(name, val);
    }
  }
  
  formData.append('lang', langValue);
  formData.append('file', codeFile, `solution.${ext}`);

  // ── Step 3: POST submission ─────────────────────────────────────────────────
  let finalUrl = '';
  let responseHtml = '';

  // Use the form's exact action url if present, fallback to standard
  let postUrl = submitData.actionUrl;
  if (!postUrl) {
    postUrl = `/problemset/submit/${problemId}/`; // note the trailing slash!
  }
  // Make absolute if relative
  if (postUrl.startsWith('/')) {
    postUrl = `https://cses.fi${postUrl}`;
  }

  try {
    const resp = await fetch(postUrl, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      redirect: 'follow',
    });

    finalUrl = resp.url;
    responseHtml = await resp.text();

    // CSES on success redirects to /problemset/result/{sub_id}/ or /problemset/task/{id}/
    // If we land exactly on the submit page without an ID (or just back to it), it's rejected.
    // Also if we hit login, it means session expired.
    if (finalUrl.includes('/login')) {
      return {
        success: false,
        error: 'You are not logged in to CSES. Please log in and try again.'
      };
    }
    
    // Check if the response contains the form again (which indicates validation error)
    if (responseHtml.includes('name="csrf_token"') && !finalUrl.includes('/result/')) {
      return {
        success: false,
        error: `Submission rejected by CSES. Make sure language "${langValue}" is valid.`
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error during submit: ${msg}` };
  }

  // ── Step 4: Parse verdict from the result page ──────────────────────────────
  const immediateVerdict = parseVerdictFromHtml(responseHtml);

  if (immediateVerdict.status !== 'PENDING' && immediateVerdict.status !== 'UNKNOWN') {
    return {
      success: true,
      verdict: immediateVerdict.status,
      verdictRaw: immediateVerdict.status,
      submissionUrl: finalUrl,
      compilerOutput: immediateVerdict.compilerOutput,
    };
  }

  // ── Step 5: Poll if still pending ──────────────────────────────────────────
  const isResultPage = /\/result\/\d+/.test(finalUrl) || /\/problemset\//.test(finalUrl);
  if (isResultPage && finalUrl) {
    const polledVerdict = await pollForVerdict(finalUrl);
    return {
      success: true,
      verdict: polledVerdict.status,
      verdictRaw: polledVerdict.status,
      submissionUrl: finalUrl,
      compilerOutput: polledVerdict.compilerOutput,
    };
  }

  return {
    success: true,
    verdict: 'PENDING',
    submissionUrl: finalUrl,
  };
}
