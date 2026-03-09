/**
 * Kaycha DocGen — Main Orchestrator
 * Runs locally: analyzes diffs, generates/updates canonical docs via Ollama.
 *
 * Usage:
 *   tsx docgen/index.ts [/path/to/repo]
 *   OLLAMA_URL=http://host:11434 tsx docgen/index.ts
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

import { ollamaChat } from './ollama-client.js';
import { DocWorkItem, DOC_META, DOC_MODEL, RunLogEntry } from './types.js';
import { analyzeChangedFiles, hasLockfileChanges } from './diff-analyzer.js';
import { buildPrompt, getSystemPrompt } from './prompts.js';
import { buildSourceContext } from './source-context.js';
import { updateDeps } from './deps-updater.js';
import { generateBootstrapWorkItems, buildBootstrapContext, ensureDocsDir } from './scanner.js';
import { configureGit, getChangedFiles, getDiffSummary, isFirstRun, commitAndPush } from './git-utils.js';

// ─── Configuration ────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ─── Derive repo info from local git ─────────────────────────
const repoRoot = process.argv[2] || process.cwd();

function gitQuery(cmd: string): string {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

const remoteUrl = gitQuery('git remote get-url origin');
const repoName = remoteUrl.replace(/\.git$/, '').split('/').pop() || repoRoot.split(/[\\/]/).pop() || 'unknown-repo';
const branch = gitQuery('git rev-parse --abbrev-ref HEAD') || 'main';
const commitSha = gitQuery('git rev-parse HEAD');
const commitMessage = gitQuery('git log -1 --format=%s');
const commitAuthor = gitQuery('git log -1 --format=%an');
const commitDate = new Date().toISOString();

// ─── Run tracking ──────────────────────────────────────────────
let totalInputTokens = 0;
let totalOutputTokens = 0;
const startTime = Date.now();

async function main(): Promise<void> {
  console.log(`\n═══ Kaycha DocGen ═══`);
  console.log(`Repo: ${repoName}`);
  console.log(`Path: ${repoRoot}`);
  console.log(`Branch: ${branch}`);
  console.log(`Commit: ${commitSha.slice(0, 8)} — ${commitMessage}`);
  console.log(`Author: ${commitAuthor}`);
  console.log(`Ollama: ${OLLAMA_URL}\n`);

  // 1. Configure git
  configureGit(repoRoot);

  // 2. Ensure docs directory exists
  ensureDocsDir(repoRoot);

  // 3. Determine work items
  let workItems: DocWorkItem[];
  let sourceContextOverride: string | undefined;
  let lockfilesChanged: boolean;

  if (isFirstRun(repoRoot)) {
    console.log('First run detected — bootstrapping all docs from scratch.\n');
    workItems = generateBootstrapWorkItems(repoName);
    sourceContextOverride = buildBootstrapContext(repoRoot);
    lockfilesChanged = true;
  } else {
    const changedFiles = getChangedFiles(repoRoot);
    console.log(`Changed files (${changedFiles.length}):`);
    changedFiles.forEach((f) => console.log(`  ${f}`));
    console.log();

    workItems = analyzeChangedFiles(changedFiles, repoName);
    lockfilesChanged = hasLockfileChanges(changedFiles);
  }

  if (workItems.length === 0 && !lockfilesChanged) {
    console.log('No docs need updating. Exiting.');
    return;
  }

  console.log(`Docs to generate/update (${workItems.length}):`);
  workItems.forEach((w) => console.log(`  ${DOC_META[w.docType].title} → ${w.outputPath}`));
  console.log();

  // 4. Get diff summary for prompts
  const diffSummary = getDiffSummary(repoRoot);

  // 5. Generate/update each doc (sequential)
  const writtenFiles: string[] = [];
  const docsGenerated: string[] = [];

  for (const workItem of workItems) {
    try {
      console.log(`Generating: ${DOC_META[workItem.docType].title}...`);

      // Read existing doc content
      const outputPath = join(repoRoot, workItem.outputPath);
      const existingContent = existsSync(outputPath) ? readFileSync(outputPath, 'utf-8') : '';

      // Build source context
      const sourceContext = sourceContextOverride || buildSourceContext(workItem, repoRoot);

      // Build prompt
      const prompt = buildPrompt({
        docType: workItem.docType,
        docTitle: DOC_META[workItem.docType].title,
        repoName,
        existingContent,
        changedFiles: workItem.triggerFiles,
        diffSummary,
        sourceContext,
        commitMessage,
        commitAuthor,
        commitDate,
      });

      // Call Ollama
      const model = DOC_MODEL[workItem.docType];
      const content = await generateDoc(prompt, model);

      // Write output
      writeFileSync(outputPath, content, 'utf-8');
      writtenFiles.push(workItem.outputPath);
      docsGenerated.push(DOC_META[workItem.docType].title);

      console.log(`  ✓ ${DOC_META[workItem.docType].title} (${content.length} chars)`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${DOC_META[workItem.docType].title}: ${errMsg}`);
      writeErrorDoc(workItem.outputPath, workItem.docType, errMsg);
    }
  }

  // 6. Update DEPS.yaml + CLAUDE.md if lockfiles changed
  if (lockfilesChanged) {
    console.log('\nUpdating DEPS.yaml + CLAUDE.md...');
    try {
      const depsFiles = updateDeps(repoRoot, repoName);
      writtenFiles.push(...depsFiles);
      console.log('  ✓ DEPS.yaml + CLAUDE.md updated');
    } catch (error) {
      console.error(`  ✗ DEPS update failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 7. Write run log
  writeRunLog(docsGenerated, lockfilesChanged);

  // 8. Commit and push
  if (writtenFiles.length > 0) {
    writtenFiles.push('docgen/.run-log.jsonl');

    console.log(`\nCommitting ${writtenFiles.length} files...`);
    commitAndPush(repoRoot, writtenFiles, commitMessage);
    console.log('\n✓ DocGen complete.');
  } else {
    console.log('\nNo files written. Nothing to commit.');
  }

  // Summary
  const duration = Date.now() - startTime;
  console.log(`\n═══ Summary ═══`);
  console.log(`Docs generated: ${docsGenerated.length}`);
  console.log(`Total input tokens: ${totalInputTokens}`);
  console.log(`Total output tokens: ${totalOutputTokens}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
}

async function generateDoc(prompt: string, model: string): Promise<string> {
  const response = await ollamaChat(OLLAMA_URL, {
    model,
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: prompt },
    ],
    stream: false,
    think: false,
    options: { temperature: 0.3, num_predict: 8192 },
  });

  // Track token usage
  totalInputTokens += response.prompt_eval_count || 0;
  totalOutputTokens += response.eval_count || 0;

  let content = response.message?.content || '';

  // Strip thinking blocks from qwen3.5 models
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  if (!content) {
    throw new Error('No text content in Ollama response (empty after stripping think blocks)');
  }

  return content;
}

function writeErrorDoc(outputPath: string, docType: string, error: string): void {
  const errorPath = join(repoRoot, 'docs', '.docgen-error.md');
  const content = `# DocGen Error

**Document:** ${docType}
**Target:** ${outputPath}
**Time:** ${new Date().toISOString()}
**Error:** ${error}

This error occurred during automatic doc generation. The target document was not updated.
`;
  writeFileSync(errorPath, content, 'utf-8');
}

function writeRunLog(docsGenerated: string[], depsUpdated: boolean): void {
  const logDir = join(repoRoot, 'docgen');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });

  const logPath = join(logDir, '.run-log.jsonl');
  const entry: RunLogEntry = {
    timestamp: new Date().toISOString(),
    repo: repoName,
    branch,
    commitSha,
    commitMessage,
    docsGenerated,
    depsUpdated,
    model: 'qwen3.5:35b-a3b',
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    durationMs: Date.now() - startTime,
  };

  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
}

// ─── Run ───────────────────────────────────────────────────────
main().catch((error) => {
  console.error('DocGen failed:', error);
  const errorPath = join(repoRoot, 'docs', '.docgen-error.md');
  ensureDocsDir(repoRoot);
  writeFileSync(
    errorPath,
    `# DocGen Error\n\n**Time:** ${new Date().toISOString()}\n**Error:** ${error instanceof Error ? error.message : String(error)}\n`,
    'utf-8',
  );
  process.exit(1);
});
