/**
 * Kaycha DocGen — Source Context Builder
 * Reads relevant source files to provide context for doc generation prompts.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { DocWorkItem } from './types.js';

/** Max total chars of source context per doc generation */
const MAX_CONTEXT_CHARS = 80_000;

/** Max chars per individual file */
const MAX_FILE_CHARS = 5_000;

/** Max number of files to include */
const MAX_FILES = 50;

/** Directories to always skip */
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '.nuxt',
  '.git', '.cache', 'coverage', '__pycache__', 'docs',
  '.turbo', '.vercel', '.netlify', 'docgen',
]);

/** Map doc types to the directories most relevant for context */
const DOC_CONTEXT_DIRS: Record<string, string[]> = {
  readme:       ['.', 'src'],
  product:      ['src/pages', 'src/components', 'src/routes', 'src/views', 'src/contexts', 'app'],
  architecture: ['.', 'src', 'infra', 'supabase'],
  engineering:  ['.', 'src', 'scripts'],
  security:     ['supabase/migrations', 'src/auth', 'src/middleware', 'src/lib/auth'],
  api:          ['supabase/functions', 'src/routes', 'src/api', 'src/handlers', 'api'],
  data:         ['supabase/migrations', 'prisma', 'drizzle'],
  operations:   ['.', 'scripts', '.github/workflows', 'infra', 'deploy'],
  releases:     ['.'],
  'user-manual':['src/pages', 'src/components', 'src/routes', 'src/views', 'app'],
};

/** Config files always worth including */
const ALWAYS_INCLUDE = [
  'package.json',
  '.env.example',
  'wrangler.toml',
  'netlify.toml',
  'vercel.json',
  'tsconfig.json',
  'supabase/config.toml',
  'vite.config.ts',
  'vite.config.js',
];

/**
 * Build source context for a specific doc work item.
 * Reads the most relevant source files for the doc type.
 */
export function buildSourceContext(workItem: DocWorkItem, repoRoot: string): string {
  const sections: string[] = [];
  let totalChars = 0;
  let fileCount = 0;

  // 1. Always include the trigger files themselves
  for (const triggerFile of workItem.triggerFiles) {
    if (fileCount >= MAX_FILES || totalChars >= MAX_CONTEXT_CHARS) break;
    const content = safeRead(join(repoRoot, triggerFile));
    if (content) {
      const truncated = truncate(content, MAX_FILE_CHARS);
      sections.push(`### ${triggerFile}\n\`\`\`\n${truncated}\n\`\`\``);
      totalChars += truncated.length;
      fileCount++;
    }
  }

  // 2. Include config files relevant to this doc type
  for (const configFile of ALWAYS_INCLUDE) {
    if (fileCount >= MAX_FILES || totalChars >= MAX_CONTEXT_CHARS) break;
    if (workItem.triggerFiles.includes(configFile)) continue; // already included
    const content = safeRead(join(repoRoot, configFile));
    if (content) {
      const truncated = truncate(content, MAX_FILE_CHARS);
      sections.push(`### ${configFile}\n\`\`\`\n${truncated}\n\`\`\``);
      totalChars += truncated.length;
      fileCount++;
    }
  }

  // 3. Scan context directories relevant to the doc type
  const contextDirs = DOC_CONTEXT_DIRS[workItem.docType] || ['.'];
  for (const dir of contextDirs) {
    if (fileCount >= MAX_FILES || totalChars >= MAX_CONTEXT_CHARS) break;
    const fullDir = dir === '.' ? repoRoot : join(repoRoot, dir);
    if (!existsSync(fullDir)) continue;

    const files = collectFiles(fullDir, repoRoot);
    for (const file of files) {
      if (fileCount >= MAX_FILES || totalChars >= MAX_CONTEXT_CHARS) break;
      if (workItem.triggerFiles.includes(file)) continue; // already included

      const content = safeRead(join(repoRoot, file));
      if (content) {
        const truncated = truncate(content, MAX_FILE_CHARS);
        sections.push(`### ${file}\n\`\`\`\n${truncated}\n\`\`\``);
        totalChars += truncated.length;
        fileCount++;
      }
    }
  }

  return sections.join('\n\n');
}

/** Collect files from a directory (non-recursive for top-level, recursive for subdirs) */
function collectFiles(dir: string, rootDir: string, depth = 0): string[] {
  if (depth > 4) return [];
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;

      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...collectFiles(fullPath, rootDir, depth + 1));
      } else if (stat.isFile() && isSourceFile(entry)) {
        results.push(relative(rootDir, fullPath).replace(/\\/g, '/'));
      }
    }
  } catch {
    // Permission errors
  }

  return results;
}

/** Check if a file is a source file worth including */
function isSourceFile(filename: string): boolean {
  const sourceExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs',
    '.py', '.go', '.rs', '.rb',
    '.sql', '.toml', '.yaml', '.yml', '.json',
    '.css', '.scss', '.svelte', '.vue',
    '.sh', '.bash',
  ]);

  const ext = filename.slice(filename.lastIndexOf('.'));
  if (!sourceExtensions.has(ext)) return false;

  // Skip lockfiles and generated files
  if (/lock\.|\.\.min\.|\.\.d\.ts$|\.\.map$/.test(filename)) return false;

  return true;
}

function safeRead(path: string): string {
  try {
    if (!existsSync(path)) return '';
    const stat = statSync(path);
    if (stat.size > 500_000) return ''; // Skip very large files
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

function truncate(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + '\n... (truncated)';
}
