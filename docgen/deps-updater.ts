/**
 * Kaycha DocGen — DEPS.yaml + CLAUDE.md Generator
 * Parses lockfiles and package manifests to produce machine-readable dependency maps.
 * No LLM required — deterministic parsing.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DepsYaml, DependencyEntry, IntegrationEntry } from './types.js';

const GENERATOR_VERSION = 'kaycha-docgen@1.0.0';

/**
 * Detect and parse dependencies, write DEPS.yaml and update CLAUDE.md.
 * Returns list of files written.
 */
export function updateDeps(repoRoot: string, repoName: string): string[] {
  const deps = buildDepsYaml(repoRoot, repoName);
  const written: string[] = [];

  // Write DEPS.yaml
  const depsPath = join(repoRoot, 'DEPS.yaml');
  writeFileSync(depsPath, serializeDepsYaml(deps), 'utf-8');
  written.push('DEPS.yaml');

  // Update CLAUDE.md with dependency section
  const claudePath = join(repoRoot, 'CLAUDE.md');
  updateClaudeMd(claudePath, deps, repoName);
  written.push('CLAUDE.md');

  return written;
}

function buildDepsYaml(repoRoot: string, repoName: string): DepsYaml {
  const deps: DepsYaml = {
    meta: {
      repo: repoName,
      generated_at: new Date().toISOString(),
      generator: GENERATOR_VERSION,
    },
    runtime: {
      package_manager: 'unknown',
    },
    dependencies: {
      production: [],
      development: [],
    },
    integrations: [],
    internal_dependencies: [],
  };

  // Detect Node.js project
  const pkgPath = join(repoRoot, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    // Detect package manager
    if (existsSync(join(repoRoot, 'pnpm-lock.yaml'))) {
      deps.runtime.package_manager = 'pnpm';
    } else if (existsSync(join(repoRoot, 'yarn.lock'))) {
      deps.runtime.package_manager = 'yarn';
    } else if (existsSync(join(repoRoot, 'bun.lockb'))) {
      deps.runtime.package_manager = 'bun';
    } else {
      deps.runtime.package_manager = 'npm';
    }

    // Detect Node version
    if (pkg.engines?.node) {
      deps.runtime.node = pkg.engines.node;
    } else {
      deps.runtime.node = '20.x';
    }

    // Parse production dependencies
    if (pkg.dependencies) {
      deps.dependencies.production = Object.entries(pkg.dependencies).map(
        ([name, version]) => ({
          name,
          version: version as string,
          purpose: inferPurpose(name),
          critical: isCritical(name),
        }),
      );
    }

    // Parse dev dependencies
    if (pkg.devDependencies) {
      deps.dependencies.development = Object.entries(pkg.devDependencies).map(
        ([name, version]) => ({
          name,
          version: version as string,
          purpose: inferPurpose(name),
          critical: false,
        }),
      );
    }
  }

  // Detect Python project
  const reqPath = join(repoRoot, 'requirements.txt');
  if (existsSync(reqPath)) {
    deps.runtime.python = '3.x';
    deps.runtime.package_manager = 'pip';
    const lines = readFileSync(reqPath, 'utf-8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    deps.dependencies.production = lines.map((line) => {
      const [name, version] = line.split(/[>=<~!]+/);
      return {
        name: name.trim(),
        version: version?.trim() || '*',
        purpose: inferPurpose(name.trim()),
        critical: isCritical(name.trim()),
      };
    });
  }

  // Detect Go project
  const goModPath = join(repoRoot, 'go.mod');
  if (existsSync(goModPath)) {
    deps.runtime.go = '1.x';
    deps.runtime.package_manager = 'go mod';
  }

  // Detect integrations
  deps.integrations = detectIntegrations(repoRoot);

  return deps;
}

function detectIntegrations(repoRoot: string): IntegrationEntry[] {
  const integrations: IntegrationEntry[] = [];

  // Supabase
  if (existsSync(join(repoRoot, 'supabase/config.toml')) || existsSync(join(repoRoot, 'supabase'))) {
    const entry: IntegrationEntry = { name: 'Supabase', type: 'database' };
    // Try to extract project ref from config
    const configPath = join(repoRoot, 'supabase/config.toml');
    if (existsSync(configPath)) {
      const config = readFileSync(configPath, 'utf-8');
      const match = config.match(/project_id\s*=\s*"([^"]+)"/);
      if (match) entry.project_ref = match[1];
    }
    integrations.push(entry);
  }

  // Cloudflare Workers
  if (existsSync(join(repoRoot, 'wrangler.toml')) || existsSync(join(repoRoot, 'wrangler.jsonc'))) {
    integrations.push({ name: 'Cloudflare Workers', type: 'edge-runtime' });
  }

  // Netlify
  if (existsSync(join(repoRoot, 'netlify.toml'))) {
    integrations.push({ name: 'Netlify', type: 'hosting' });
  }

  // Vercel
  if (existsSync(join(repoRoot, 'vercel.json'))) {
    integrations.push({ name: 'Vercel', type: 'hosting' });
  }

  // Docker
  if (existsSync(join(repoRoot, 'Dockerfile')) || existsSync(join(repoRoot, 'docker-compose.yml'))) {
    integrations.push({ name: 'Docker', type: 'containerization' });
  }

  return integrations;
}

/** Infer purpose from package name heuristics */
function inferPurpose(name: string): string {
  const purposes: [RegExp, string][] = [
    [/supabase/, 'Database client + auth'],
    [/react$/, 'UI framework'],
    [/react-dom/, 'React DOM rendering'],
    [/react-router/, 'Client-side routing'],
    [/tailwindcss/, 'Utility-first CSS'],
    [/vite$/, 'Build tool + dev server'],
    [/vitest/, 'Unit testing'],
    [/typescript/, 'Type checking'],
    [/eslint/, 'Code linting'],
    [/prettier/, 'Code formatting'],
    [/zod/, 'Schema validation'],
    [/tanstack.*query/, 'Data fetching + caching'],
    [/tanstack.*table/, 'Data table UI'],
    [/tanstack.*router/, 'Type-safe routing'],
    [/lucide/, 'Icon library'],
    [/shadcn|radix/, 'UI component library'],
    [/date-fns|dayjs|moment/, 'Date manipulation'],
    [/axios|ky$/, 'HTTP client'],
    [/zustand|jotai|recoil/, 'State management'],
    [/recharts|chart/, 'Data visualization'],
    [/anthropic/, 'Claude AI API client'],
    [/openai/, 'OpenAI API client'],
    [/stripe/, 'Payment processing'],
    [/resend|nodemailer/, 'Email sending'],
    [/puppeteer|playwright/, 'Browser automation'],
    [/prisma/, 'Database ORM'],
    [/drizzle/, 'Database ORM'],
  ];

  for (const [pattern, purpose] of purposes) {
    if (pattern.test(name)) return purpose;
  }
  return '';
}

/** Determine if a dependency is critical to the system */
function isCritical(name: string): boolean {
  const criticalPatterns = [
    /supabase/,
    /react$/,
    /next$/,
    /express$/,
    /fastify$/,
    /hono$/,
    /prisma/,
    /drizzle/,
    /stripe/,
    /anthropic/,
  ];
  return criticalPatterns.some((p) => p.test(name));
}

function serializeDepsYaml(deps: DepsYaml): string {
  const lines: string[] = [
    '# DEPS.yaml — Auto-generated by Kaycha DocGen. DO NOT EDIT MANUALLY.',
    `# Regenerated on every push that modifies lockfiles or package manifests.`,
    '',
    'meta:',
    `  repo: "${deps.meta.repo}"`,
    `  generated_at: "${deps.meta.generated_at}"`,
    `  generator: "${deps.meta.generator}"`,
    '',
    'runtime:',
  ];

  if (deps.runtime.node) lines.push(`  node: "${deps.runtime.node}"`);
  if (deps.runtime.python) lines.push(`  python: "${deps.runtime.python}"`);
  if (deps.runtime.go) lines.push(`  go: "${deps.runtime.go}"`);
  lines.push(`  package_manager: "${deps.runtime.package_manager}"`);

  lines.push('', 'dependencies:');

  // Production deps
  lines.push('  production:');
  if (deps.dependencies.production.length === 0) {
    lines.push('    []');
  } else {
    for (const dep of deps.dependencies.production) {
      lines.push(`    - name: "${dep.name}"`);
      lines.push(`      version: "${dep.version}"`);
      lines.push(`      purpose: "${dep.purpose}"`);
      lines.push(`      critical: ${dep.critical}`);
    }
  }

  // Dev deps
  lines.push('  development:');
  if (deps.dependencies.development.length === 0) {
    lines.push('    []');
  } else {
    for (const dep of deps.dependencies.development) {
      lines.push(`    - name: "${dep.name}"`);
      lines.push(`      version: "${dep.version}"`);
      lines.push(`      purpose: "${dep.purpose}"`);
      lines.push(`      critical: ${dep.critical}`);
    }
  }

  // Integrations
  lines.push('', 'integrations:');
  if (deps.integrations.length === 0) {
    lines.push('  []');
  } else {
    for (const int of deps.integrations) {
      lines.push(`  - name: "${int.name}"`);
      lines.push(`    type: "${int.type}"`);
      if (int.project_ref) lines.push(`    project_ref: "${int.project_ref}"`);
    }
  }

  // Internal deps
  lines.push('', 'internal_dependencies:');
  if (deps.internal_dependencies.length === 0) {
    lines.push('  []');
  } else {
    for (const dep of deps.internal_dependencies) {
      lines.push(`  - repo: "${dep.repo}"`);
      lines.push(`    reason: "${dep.reason}"`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function updateClaudeMd(claudePath: string, deps: DepsYaml, repoName: string): void {
  let existing = '';
  if (existsSync(claudePath)) {
    existing = readFileSync(claudePath, 'utf-8');
  }

  const depsSection = buildClaudeMdDepsSection(deps);

  if (existing) {
    // Replace existing deps section or append
    const marker = '## Current Dependencies';
    const markerIdx = existing.indexOf(marker);
    if (markerIdx !== -1) {
      // Find next ## or end of file
      const nextSection = existing.indexOf('\n## ', markerIdx + marker.length);
      if (nextSection !== -1) {
        existing = existing.slice(0, markerIdx) + depsSection + '\n' + existing.slice(nextSection);
      } else {
        existing = existing.slice(0, markerIdx) + depsSection;
      }
    } else {
      existing += '\n\n' + depsSection;
    }
    writeFileSync(claudePath, existing, 'utf-8');
  } else {
    // Create new CLAUDE.md
    const content = `# ${repoName}

This file provides context for AI agents working on this repository.

${depsSection}
`;
    writeFileSync(claudePath, content, 'utf-8');
  }
}

function buildClaudeMdDepsSection(deps: DepsYaml): string {
  const lines: string[] = ['## Current Dependencies', ''];

  if (deps.runtime.node) lines.push(`- **Runtime:** Node.js ${deps.runtime.node}`);
  if (deps.runtime.python) lines.push(`- **Runtime:** Python ${deps.runtime.python}`);
  if (deps.runtime.go) lines.push(`- **Runtime:** Go ${deps.runtime.go}`);
  lines.push(`- **Package Manager:** ${deps.runtime.package_manager}`);
  lines.push('');

  const critical = deps.dependencies.production.filter((d) => d.critical);
  if (critical.length > 0) {
    lines.push('### Critical Dependencies');
    for (const dep of critical) {
      lines.push(`- \`${dep.name}\` (${dep.version}) — ${dep.purpose}`);
    }
    lines.push('');
  }

  if (deps.integrations.length > 0) {
    lines.push('### Integrations');
    for (const int of deps.integrations) {
      lines.push(`- **${int.name}** (${int.type})${int.project_ref ? ` — ref: ${int.project_ref}` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
