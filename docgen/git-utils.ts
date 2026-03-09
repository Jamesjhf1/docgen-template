/**
 * Kaycha DocGen — Git Utilities
 * Handles diffing, committing, and pushing generated docs.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const DOCGEN_BOT_NAME = 'Kaycha DocGen Bot';
const DOCGEN_BOT_EMAIL = 'docgen@kaychalabs.com';

/**
 * Configure git identity for the action runner.
 */
export function configureGit(): void {
  execSync(`git config user.name "${DOCGEN_BOT_NAME}"`, { stdio: 'pipe' });
  execSync(`git config user.email "${DOCGEN_BOT_EMAIL}"`, { stdio: 'pipe' });
}

/**
 * Get list of changed files between HEAD~1 and HEAD.
 * Falls back to listing all files if only one commit exists.
 */
export function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff HEAD~1 HEAD --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    // Single-commit repo or initial push — list all tracked files
    const output = execSync('git ls-files', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  }
}

/**
 * Get diff summary (--stat output) for prompt context.
 */
export function getDiffSummary(): string {
  try {
    return execSync('git diff HEAD~1 HEAD --stat', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '(initial commit — no diff available)';
  }
}

/**
 * Check if docs/ directory exists and has content.
 */
export function isFirstRun(repoRoot: string): boolean {
  const docsDir = `${repoRoot}/docs`;
  if (!existsSync(docsDir)) return true;
  try {
    const files = execSync(`ls "${docsDir}"/*.md 2>/dev/null || true`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return files.length === 0;
  } catch {
    return true;
  }
}

/**
 * Commit and push all generated/updated files.
 */
export function commitAndPush(files: string[], triggerCommitMessage: string): void {
  if (files.length === 0) return;

  // Stage all doc files
  for (const file of files) {
    execSync(`git add "${file}"`, { stdio: 'pipe' });
  }

  // Check if there are actually staged changes
  try {
    execSync('git diff --cached --quiet', { stdio: 'pipe' });
    // If the above succeeds, there are no staged changes
    console.log('No changes to commit.');
    return;
  } catch {
    // There ARE staged changes — proceed with commit
  }

  // Build doc title list for commit message
  const docNames = files
    .map((f) => f.replace('docs/', '').replace(/^[^_]+__/, ''))
    .join(', ');

  const commitMsg = `[docgen] Update docs: ${docNames} — triggered by: "${truncate(triggerCommitMessage, 72)}"`;

  execSync(`git commit -m "${escapeShell(commitMsg)}"`, { stdio: 'pipe' });

  // Push to same branch
  const branch = (process.env.GITHUB_REF || 'refs/heads/main').replace('refs/heads/', '');

  // Use token-authenticated remote if available
  const token = process.env.GITHUB_TOKEN || process.env.DOCGEN_GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (token && repo) {
    execSync(
      `git push https://x-access-token:${token}@github.com/${repo}.git HEAD:${branch}`,
      { stdio: 'pipe' },
    );
  } else {
    execSync(`git push origin HEAD:${branch}`, { stdio: 'pipe' });
  }

  console.log(`Pushed docgen commit to ${branch}`);
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 3) + '...' : s;
}

function escapeShell(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}
