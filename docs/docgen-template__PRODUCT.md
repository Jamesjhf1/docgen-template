# Product & Features — docgen-template

| Metadata | Value |
| :--- | :--- |
| **Document** | docgen-template__PRODUCT.md |
| **Last Updated** | 2026-03-09 |
| **Version** | 1.0.0 (Initial Release) |
| **Status** | Active Development |

## Product Vision

**docgen-template** is an automated technical documentation generation engine designed to maintain production-grade Markdown documentation in sync with codebase changes. It solves the problem of documentation drift and maintenance overhead by automating the extraction of architectural, engineering, and operational context from the repository structure and source code.

**Target Users:**
- **Product Managers:** To understand feature scope and status without deep technical diving.
- **Engineers:** To access up-to-date architecture and operational runbooks.
- **Stakeholders:** To review security posture and product roadmap.

## User Roles

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Maintainer** | Primary owner of the documentation pipeline. | Full access to `docgen/` scripts, trigger generation, edit source prompts. |
| **Contributor** | Developer with write access to the repository. | Read access to generated docs, trigger generation on commit (via bot). |
| **Viewer** | External stakeholders or auditors. | Read-only access to `docs/` directory. |

## Core Features

### Automated Documentation Generation
The core engine scans the repository and generates structured Markdown files based on source code analysis.
- **Diff Analysis:** Detects changes in code, routes, and components to update relevant documentation sections.
- **Context Extraction:** Parses `CLAUDE.md`, `DEPS.yaml`, and source files to extract architectural context.
- **Prompt-Based Generation:** Utilizes LLM prompts (via Ollama) to synthesize technical narratives from code structure.
- **Roles:** Maintainer, Contributor.

### Multi-Domain Documentation
Generates distinct documentation artifacts covering different aspects of the software lifecycle.
- **Architecture:** System design, component interactions, data flow.
- **Engineering:** Build processes, dependencies, CI/CD pipelines.
- **Operations:** Deployment strategies, monitoring, scaling.
- **Security:** Threat models, access controls, compliance.
- **Roles:** Maintainer, Contributor, Viewer.

### Version Control Integration
Seamlessly integrates with Git workflows to keep documentation synchronized with code.
- **Commit Hooks:** Triggers generation upon specific commit patterns (e.g., `fix:`, `feat:`).
- **Bot Automation:** Dedicated bot (`Kaycha DocGen Bot`) handles documentation commits.
- **Roles:** Maintainer, Viewer.

### Local & CLI Execution
Supports local development and CI environments for documentation generation.
- **Bootstrap Scripts:** `bootstrap-all.sh` and `bootstrap-repo.sh` for environment setup.
- **TypeScript CLI:** `docgen/index.ts` entry point for programmatic execution.
- **Roles:** Maintainer, Contributor.

## User Workflows

### Workflow: Initial Repository Setup
1. User clones the repository.
2. User executes `./scripts/bootstrap-repo.sh`.
3. System installs dependencies (`DEPS.yaml`) and initializes the `docgen/` environment.
4. User runs `npm run docgen` (or equivalent CLI command).
5. System scans source context and generates initial `docs/` files.

### Workflow: Documentation Update on Commit
1. User pushes a commit (e.g., `fix: disable thinking mode`).
2. CI pipeline detects the commit.
3. `Kaycha DocGen Bot` triggers the generation process.
4. `docgen/index.ts` analyzes the diff.
5. Relevant `docs/` files are updated and committed by the bot.

### Workflow: Manual Documentation Refresh
1. Maintainer accesses the repository.
2. Maintainer runs `npm run docgen -- --force`.
3. System re-scans all source files and prompts.
4. All documentation files are regenerated and saved.

## Feature Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Automated Generation** | Live | Core engine functional via `docgen/index.ts`. |
| **Diff Analysis** | Live | Detects changes in `docgen/` and `docs/`. |
| **Ollama Integration** | Live | Connected to local LLM for prompt synthesis. |
| **Bootstrap Scripts** | Live | `bootstrap-all.sh` and `bootstrap-repo.sh` active. |
| **Security Docs** | Live | Auto-generated security posture documentation. |
| **Architecture Docs** | Live | Auto-generated system design documentation. |
| **Operations Docs** | Live | Auto-generated operational runbooks. |
| **Engineering Docs** | Live | Auto-generated build and dependency docs. |
| **Bot Automation** | Live | `Kaycha DocGen Bot` handles commits. |
| **CLI Execution** | Live | `docgen` CLI available for manual runs. |
| **Prompt Engineering** | Beta | `prompts.ts` configurable for custom outputs. |
| **Source Context Parsing** | Live | Parses `CLAUDE.md`, `DEPS.yaml`, and TS files. |