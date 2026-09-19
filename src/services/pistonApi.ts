// ─── Wandbox Code Runner ──────────────────────────────────────────────────────
// Uses Wandbox (https://wandbox.org) — a free, no-auth, no-key online compiler.
// API docs: https://github.com/melpon/wandbox/blob/master/kennel2/API.rst
// Endpoint: POST https://wandbox.org/api/compile.json
//
// Replaced Piston API which shut down its public endpoint on 2025-02-15.

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

// ─── Wandbox compiler config per CSES language ────────────────────────────────
// Wandbox compiler names: https://wandbox.org/api/list.json
interface WandboxConfig {
  compiler: string;
  options?: string;          // named Wandbox options (e.g. "warning")
  compilerOptionRaw?: string; // raw CLI flags (e.g. "-std=c++17 -O2")
}

const WANDBOX_CONFIGS: Record<string, WandboxConfig> = {
  'Assembly': {
    compiler: 'nasm-head',
  },
  'C++17': {
    compiler: 'gcc-head',
    compilerOptionRaw: '-std=c++17 -O2 -Wall',
  },
  'C++20': {
    compiler: 'gcc-head',
    compilerOptionRaw: '-std=c++20 -O2 -Wall',
  },
  'C11': {
    compiler: 'gcc-head',
    compilerOptionRaw: '-std=c11 -O2 -Wall',
  },
  'Haskell': {
    compiler: 'ghc-head',
  },
  'Python3': {
    compiler: 'cpython-3.12.0',
  },
  'Python2': {
    compiler: 'cpython-2.7-head',
  },
  'Java': {
    compiler: 'openjdk-head',
  },
  'Rust': {
    compiler: 'rust-head',
  },
  'JavaScript': {
    compiler: 'nodejs-head',
  },
  'Pascal': {
    compiler: 'fpc-head',
  },
  'Ruby': {
    compiler: 'ruby-head',
  },
  'Scala': {
    compiler: 'scala-head',
  },
};

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

// ─── Response shape from Wandbox ─────────────────────────────────────────────
interface WandboxResponse {
  status?: string;            // exit code as string e.g. "0"
  signal?: string;
  compiler_output?: string;   // stdout from compiler (gcc warnings etc.)
  compiler_error?: string;    // stderr from compiler (errors)
  compiler_message?: string;  // combined compiler output
  program_output?: string;    // stdout from the running program
  program_error?: string;     // stderr from the running program
  program_message?: string;   // combined program output
  permlink?: string;
  url?: string;
}

// ─── Fuzzy config lookup ──────────────────────────────────────────────────────
// CSES language option values can be "C++", "C++ (GCC 9.2)", "C++17", "Python3",
// "Python 3", etc. — we match fuzzily so any variant maps to the right compiler.

function findWandboxConfig(lang: string): WandboxConfig | null {
  // 1. Exact key match first
  if (WANDBOX_CONFIGS[lang]) return WANDBOX_CONFIGS[lang];

  // 2. Fuzzy match by language family
  const l = lang.toLowerCase().trim();
  if (l.includes('assembly') || l.includes('asm'))                       return WANDBOX_CONFIGS['Assembly'];
  if (l.includes('haskell'))                                             return WANDBOX_CONFIGS['Haskell'];
  if (l.includes('pascal'))                                              return WANDBOX_CONFIGS['Pascal'];
  if (l.includes('scala'))                                               return WANDBOX_CONFIGS['Scala'];
  if (l.includes('python') || l.startsWith('py'))                        return WANDBOX_CONFIGS['Python3'];
  if ((l.includes('java') && !l.includes('javascript')))                 return WANDBOX_CONFIGS['Java'];
  if (l.includes('rust'))                                                return WANDBOX_CONFIGS['Rust'];
  if (l.includes('javascript') || l.includes('node') || l === 'js')      return WANDBOX_CONFIGS['JavaScript'];
  if (l.includes('ruby') || l === 'rb')                                  return WANDBOX_CONFIGS['Ruby'];
  if (l.includes('c++20') || l.includes('cpp20') || l.includes('c++ 20')) return WANDBOX_CONFIGS['C++20'];
  // Generic C++ (no version specified) → default to C++17
  if (l.includes('c++') || l.includes('cpp') || l === 'c++')            return WANDBOX_CONFIGS['C++17'];
  // Plain C
  if (l === 'c' || l.startsWith('c ') || l.startsWith('c,') ||
      (l.includes('gcc') && !l.includes('c++')))                         return WANDBOX_CONFIGS['C11'];

  return null;
}

// ─── Main runCode function ────────────────────────────────────────────────────

export async function runCode(
  csesLanguage: string,
  code: string,
  stdin: string = '',
): Promise<RunResult> {
  const config = findWandboxConfig(csesLanguage);

  if (!config) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 1,
      error: `Language "${csesLanguage}" is not supported for online execution.`,
    };
  }

  const body: Record<string, string> = {
    compiler: config.compiler,
    code: code,
    stdin: stdin,
  };

  if (config.options) {
    body['options'] = config.options;
  }

  if (config.compilerOptionRaw) {
    body['compiler_option_raw'] = config.compilerOptionRaw;
  }

  try {
    const response = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        stdout: '',
        stderr: errText,
        exitCode: 1,
        error: `Wandbox API error: HTTP ${response.status}`,
      };
    }

    const data = await response.json() as WandboxResponse;

    // Parse exit code — Wandbox returns it as a string
    const exitCode = parseInt(data.status ?? '0', 10);

    // Collect compiler output (warnings/errors)
    const compilerOut = [data.compiler_output, data.compiler_error]
      .filter(Boolean)
      .join('\n')
      .trim();

    // Collect program stdout/stderr
    const programStdout = data.program_output ?? '';
    const programStderr = data.program_error ?? '';

    // If compilation failed (non-zero exit and no program output)
    if (exitCode !== 0 && !programStdout && compilerOut) {
      return {
        stdout: '',
        stderr: compilerOut,
        exitCode,
        error: 'Compilation Error',
      };
    }

    // Build stderr: combine compiler warnings + program stderr
    let combinedStderr = '';
    if (compilerOut) combinedStderr += compilerOut;
    if (programStderr) combinedStderr += (combinedStderr ? '\n' : '') + programStderr;

    return {
      stdout: programStdout,
      stderr: combinedStderr,
      exitCode,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      stdout: '',
      stderr: '',
      exitCode: 1,
      error: `Network error: ${msg}`,
    };
  }
}

export function getSupportedLanguages(): string[] {
  return Object.keys(WANDBOX_CONFIGS);
}
