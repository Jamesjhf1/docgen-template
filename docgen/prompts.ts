/**
 * Kaycha DocGen — Prompt Templates
 * One prompt builder per canonical doc type. Claude generates pure Markdown output.
 */

import { DocType, PromptContext } from './types.js';

const TODAY = new Date().toISOString().split('T')[0];

const SYSTEM_PROMPT = `You are Kaycha DocGen, a technical documentation architect for Kaycha Labs.
You produce production-grade Markdown documentation for software repositories.

Rules:
- Output ONLY valid Markdown. No preamble, no meta-commentary, no code fences wrapping the entire doc.
- Preserve unchanged sections when updating — only modify what the diff directly affects.
- Always set **Last Updated:** to ${TODAY}.
- Tone: concise, technical, production-grade. No filler, no marketing language.
- Use tables, code blocks, and headers appropriately.
- If existing content is empty, generate the complete document from source context.`;

function baseContext(ctx: PromptContext): string {
  return `Repository: ${ctx.repoName}
Commit: ${ctx.commitMessage} (by ${ctx.commitAuthor} on ${ctx.commitDate})
Changed files: ${ctx.changedFiles.join(', ')}

Diff summary:
${ctx.diffSummary}

Source context (relevant files):
${ctx.sourceContext}`;
}

function existingSection(ctx: PromptContext): string {
  if (!ctx.existingContent) return '\nThis is a NEW document — generate the complete doc from scratch.\n';
  return `\nExisting document content (preserve unchanged sections, update only what changed):\n\`\`\`markdown\n${ctx.existingContent}\n\`\`\`\n`;
}

const promptBuilders: Record<DocType, (ctx: PromptContext) => string> = {
  readme: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **System Overview** document (${ctx.repoName}__README.md).

Structure:
1. **Audience:** Engineers, Architects, Technical Leads
2. **Last Updated:** ${TODAY}
3. ## Overview — What this system does, who it serves, key value proposition (2-3 sentences)
4. ## Quick Start — Clone, install, configure env, run dev server (numbered steps with code blocks)
5. ## Tech Stack — Table: Category | Technology | Purpose
6. ## Architecture Overview — High-level component diagram in text, key patterns used
7. ## Key Features — Bullet list of major capabilities
8. ## Project Structure — Tree of important directories with descriptions
9. ## Related Documentation — Links to other canonical docs (PRODUCT.md, ARCHITECTURE.md, etc.)

Derive all content from the source context. Be specific — use actual package names, actual env vars, actual commands.`,

  product: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **Product & Features** document (${ctx.repoName}__PRODUCT.md).

Structure:
1. **Audience:** Product Managers, Engineers, Stakeholders
2. **Last Updated:** ${TODAY}
3. ## Product Vision — What problem this solves, target users
4. ## User Roles — Table: Role | Description | Key Permissions
5. ## Core Features — Grouped by domain, each feature with:
   - Feature name and description
   - Sub-features as bullet list
   - Which user roles can access it
6. ## User Workflows — Key user journeys described step-by-step
7. ## Feature Status — Table: Feature | Status (Live/Beta/Planned) | Notes

Derive all features from actual page components, routes, and UI code in the source context.`,

  architecture: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **System Architecture** document (${ctx.repoName}__ARCHITECTURE.md).

Structure:
1. **Audience:** Engineers, Architects, DevOps
2. **Last Updated:** ${TODAY}
3. ## Tech Stack — Detailed table: Layer | Technology | Version | Purpose
4. ## Architecture Patterns — What patterns are used (MVC, event-driven, microservices, etc.)
5. ## System Components — Each major component with:
   - Name and responsibility
   - Technology used
   - Key interfaces
6. ## Component Relationships — How components communicate (text diagram or description)
7. ## Data Flow — How data moves through the system
8. ## Infrastructure — Hosting, CDN, databases, edge functions, cron jobs
9. ## Design Decisions — Key architectural trade-offs and their rationale

Use actual config files (wrangler.toml, netlify.toml, docker-compose, supabase/config) from source context.`,

  engineering: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **Developer Guide** document (${ctx.repoName}__ENGINEERING.md).

Structure:
1. **Audience:** Engineers, Contributors
2. **Last Updated:** ${TODAY}
3. ## Prerequisites — Required tools and versions (Node, pnpm, etc.)
4. ## Getting Started — Step-by-step dev setup with code blocks
5. ## Environment Variables — Table: Variable | Required | Description | Example
   (derive from .env.example or .env references in source)
6. ## Project Structure — Directory tree with descriptions
7. ## Development Workflow — Branch strategy, PR process, testing
8. ## Coding Standards — Naming, file organization, patterns used in this repo
9. ## Testing — How to run tests, testing strategy, coverage
10. ## Build & Deploy — Build commands, deployment process
11. ## Troubleshooting — Common issues and solutions

Use actual commands, actual env vars, actual directory structure from source context.`,

  security: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **Security & Compliance** document (${ctx.repoName}__SECURITY.md).

Structure:
1. **Audience:** Engineers, Security Team, Compliance
2. **Last Updated:** ${TODAY}
3. ## Authentication — Auth provider, flow, token handling
4. ## Authorization (RBAC) — Role hierarchy, permission model
   Table: Role | Permissions | Access Level
5. ## Row Level Security (RLS) — Which tables have RLS, policy descriptions
   (derive from Supabase migration files if present)
6. ## API Security — Rate limiting, CORS, input validation
7. ## Secrets Management — How secrets are stored, rotated, accessed
   Table: Secret | Storage | Rotation Policy
8. ## Data Protection — Encryption at rest/transit, PII handling
9. ## Compliance — Relevant regulations (SOC2, HIPAA, etc.)
10. ## Security Checklist — Pre-deploy security review items

If Supabase migrations contain RLS policies, list them with their SQL.`,

  api: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **API Reference** document (${ctx.repoName}__API.md).

Structure:
1. **Audience:** Engineers, API Consumers
2. **Last Updated:** ${TODAY}
3. ## Authentication — How to authenticate (Bearer token, API key, etc.)
4. ## Base URL — API endpoint base URL
5. ## Endpoints — For each Edge Function or API route:
   ### \`FUNCTION_NAME\`
   - **URL:** \`POST /function-name\`
   - **Auth:** Required/Public
   - **Description:** What it does
   - **Request Body:** JSON schema with types
   - **Response:** JSON schema with example
   - **Errors:** Common error codes
6. ## Rate Limits — If applicable
7. ## Webhooks — If applicable

Derive endpoints from supabase/functions/ directories and src/routes or src/api files.
Include actual request/response shapes from the source code.`,

  data: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **Data Model** document (${ctx.repoName}__DATA.md).

Structure:
1. **Audience:** Engineers, Data Architects
2. **Last Updated:** ${TODAY}
3. ## Overview — Database type, how schema is managed
4. ## Tables by Domain — Group related tables, for each table:
   ### \`table_name\`
   | Column | Type | Nullable | Default | Description |
   |--------|------|----------|---------|-------------|
   (derive from CREATE TABLE in migration files)
5. ## Relationships — Foreign key relationships
   Table: From Table | Column | To Table | Column | Type (1:M, M:M)
6. ## Indexes — Notable indexes and their purpose
7. ## Enums / Types — Custom PostgreSQL types if any
8. ## RLS Summary — Which tables have RLS enabled
9. ## Migration History — List of recent migrations with descriptions

Parse SQL migration files from source context. Be precise with column types.`,

  operations: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **Operations & Runbooks** document (${ctx.repoName}__OPERATIONS.md).

Structure:
1. **Audience:** Engineers, DevOps, SRE
2. **Last Updated:** ${TODAY}
3. ## Deployment — How the system is deployed (CI/CD, manual steps)
4. ## Environments — Table: Environment | URL | Purpose | Branch
5. ## Monitoring — Dashboards, health checks, alerting
6. ## Runbooks — Common operational procedures:
   ### Runbook: Deploy to Production
   ### Runbook: Rollback a Deployment
   ### Runbook: Database Migration
   ### Runbook: Rotate Secrets
   (each with numbered steps)
7. ## Incident Response — Severity levels, escalation, communication
8. ## Maintenance — Scheduled maintenance windows, upgrade procedures
9. ## Scripts — Utility scripts in the repo with descriptions

Derive from Dockerfiles, CI workflows, deployment configs, and scripts/ directory.`,

  releases: (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate or update the **Release Notes** document (${ctx.repoName}__RELEASES.md).

CRITICAL RULE: If existing content exists, PREPEND a new entry at the top. NEVER modify or remove existing entries.

Structure for a new entry:
## [${TODAY}] — ${ctx.commitMessage}
**Author:** ${ctx.commitAuthor}
**Branch:** ${(process.env.GITHUB_REF || 'main').replace('refs/heads/', '')}

### Changes
- (bullet list of what changed, derived from diff summary and changed files)

### Files Changed
- (list of changed files)

---

(existing entries below, unchanged)

If this is the first entry, add a header:
# Release Notes — ${ctx.repoName}
**Last Updated:** ${TODAY}

Then the entry.`,

  'user-manual': (ctx) => `${baseContext(ctx)}
${existingSection(ctx)}

Generate the **User Manual** document (${ctx.repoName}__USER-MANUAL.md).

Structure:
1. **Audience:** End Users, Administrators
2. **Last Updated:** ${TODAY}
3. ## Getting Started — How to access the system, first-time setup
4. ## User Roles — What each role can do (from a user perspective)
5. ## Features Guide — For each major feature:
   ### Feature Name
   - What it does (user perspective)
   - Step-by-step how to use it
   - Tips and best practices
6. ## Common Tasks — Quick reference for frequent actions
7. ## FAQ — Frequently asked questions
8. ## Troubleshooting — Common user-facing issues and solutions
9. ## Support — How to get help

Write from the END USER perspective. No technical jargon. Describe UI elements and workflows.
Derive from page components, route structure, and UI code in source context.`,
};

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildPrompt(ctx: PromptContext): string {
  const builder = promptBuilders[ctx.docType];
  if (!builder) throw new Error(`No prompt template for doc type: ${ctx.docType}`);
  return builder(ctx);
}
