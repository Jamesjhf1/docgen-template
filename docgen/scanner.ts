/**
 * Kaycha DocGen — First-Run Scanner
 * Scans a repo for bootstrap context when docs/ doesn't exist yet.
 * Generates all 10 docs from scratch.
 */

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { DocWorkItem, DOC_META, DOC_TYPES } from './types.js';

/** Max files to include in source context for first-run */
const MAX_CONTEXT_FILES = 50;

/** File patterns to scan for bootstrap context */
const BOOTSTRAP_FILES = [
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'README.md',
  'wrangler.toml',
  'wrangler.jsonc',
  'netlify.toml',
  'vercel.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'tsconfig.json',
  '.env.example',
  '.env.local.example',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Makefile',
  'justfile',
  'supabase/config.toml',
];

/** Directories to scan for source files */
const SOURCE_DIRS = [
  'src',
  'app',
  'pages',
  'lib',
  'supabase/functions',
  'supabase/migrations',
  'api',
  'server',
  'scripts',
];

/** File extensions to include in source scanning */
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs',
  '.py', '.go', '.rs',
  '.sql', '.toml', '.yaml', '.yml', '.json',
  '.css', '.scss',
]);

/** Directories to always skip */
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '.nuxt',
  '.git', '.cache', 'coverage', '__pycache__',
  '.turbo', '.vercel', '.netlify',
]);

/**
 * Generate DocWorkItems for ALL canonical docs (first-run bootstrap).
 */
export function generateBootstrapWorkItems(repoName: string): DocWorkItem[] {
  return DOC_TYPES.map((docType) => ({
    docType,
    outputPath: `docs/${repoName}__${DOC_META[docType].filename}`,
    triggerFiles: ['(bootstrap — first run)'],
  }));
}

/**
 * Build comprehensive source context by scanning the repo.
 * Used when generating docs from scratch.
 */
export function buildBootstrapContext(repoRoot: string): string {
  const sections: string[] = [];

  // 1. Collect bootstrap config files
  for (const file of BOOTSTRAP_FILES) {
    const fullPath = join(repoRoot, file);
    if (existsSync(fullPath)) {
      const content = safeRead(fullPath);
      if (content) {
        sections.push(`### ${file}\n\`\`\`\n${truncateContent(content, 3000)}\n\`\`\``);
      }
    }
  }

  // 2. Scan source directories
  let fileCount = 0;
  for (const dir of SOURCE_DIRS) {
    const fullDir = join(repoRoot, dir);
    if (!existsSync(fullDir)) continue;

    const files = walkDir(fullDir, repoRoot).slice(0, MAX_CONTEXT_FILES - fileCount);
    for (const file of files) {
      if (fileCount >= MAX_CONTEXT_FILES) break;
      const content = safeRead(join(repoRoot, file));
      if (content) {
        sections.push(`### ${file}\n\`\`\`\n${truncateContent(content, 2000)}\n\`\`\``);
        fileCount++;
      }
    }
  }

  // 3. Directory listing
  sections.push(`### Directory Structure\n\`\`\`\n${getDirectoryTree(repoRoot, 3)}\n\`\`\``);

  // 4. Supabase migrations (last 10)
  const migrationsDir = join(repoRoot, 'supabase/migrations');
  if (existsSync(migrationsDir)) {
    const migrations = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .slice(-10);

    for (const migration of migrations) {
      const content = safeRead(join(migrationsDir, migration));
      if (content) {
        sections.push(`### supabase/migrations/${migration}\n\`\`\`sql\n${truncateContent(content, 3000)}\n\`\`\``);
      }
    }
  }

  // 5. Supabase functions listing
  const functionsDir = join(repoRoot, 'supabase/functions');
  if (existsSync(functionsDir)) {
    const functions = readdirSync(functionsDir).filter(
      (f) => statSync(join(functionsDir, f)).isDirectory() && !f.startsWith('_'),
    );
    if (functions.length > 0) {
      sections.push(`### Edge Functions\n${functions.map((f) => `- ${f}`).join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Ensure docs/ directory exists.
 */
export function ensureDocsDir(repoRoot: string): void {
  const docsDir = join(repoRoot, 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
}

/** Walk a directory recursively, returning relative paths */
function walkDir(dir: string, rootDir: string, depth = 0): string[] {
  if (depth > 5) return [];
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath, rootDir, depth + 1));
      } else if (stat.isFile()) {
        const ext = entry.slice(entry.lastIndexOf('.'));
        if (SOURCE_EXTENSIONS.has(ext)) {
          results.push(relative(rootDir, fullPath).replace(/\\/g, '/'));
        }
      }
    }
  } catch {
    // Permission errors, etc.
  }

  return results;
}

/** Build a simple directory tree string */
function getDirectoryTree(dir: string, maxDepth: number, depth = 0, prefix = ''): string {
  if (depth >= maxDepth) return '';
  const lines: string[] = [];

  try {
    const entries = readdirSync(dir).filter((e) => !SKIP_DIRS.has(e) && !e.startsWith('.'));
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      lines.push(`${prefix}${connector}${entry}${stat.isDirectory() ? '/' : ''}`);

      if (stat.isDirectory()) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        const subtree = getDirectoryTree(fullPath, maxDepth, depth + 1, childPrefix);
        if (subtree) lines.push(subtree);
      }
    }
  } catch {
    // Permission errors
  }

  return lines.join('\n');
}

/** Read file safely, return empty string on error */
function safeRead(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

/** Truncate content to max chars */
function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + '\n... (truncated)';
}
