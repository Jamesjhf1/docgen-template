# Product & Features

**Audience:** Product Managers, Engineers, Stakeholders  
**Last Updated:** 2026-03-09

## Product Vision

**Kaycha DocGen** is an automated documentation generation system designed to maintain up-to-date technical documentation for software repositories. It bridges the gap between code changes and documentation by analyzing repository diffs, leveraging local LLMs (via Ollama), and updating documentation files automatically.

**Target Users:**
- Software Engineers maintaining documentation-heavy projects.
- DevOps teams requiring automated compliance documentation.
- Product Managers tracking feature documentation status.

**Problem Solved:**
- Prevents documentation drift from codebase changes.
- Reduces manual overhead in writing and updating technical docs.
- Ensures consistency across repository documentation using standardized prompts and AI generation.

## User Roles

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Maintainer** | Primary user responsible for running the docgen tool and reviewing outputs. | Execute scans, approve generated docs, update prompts, manage dependencies. |
| **Reviewer** | Stakeholder or peer reviewing generated documentation for accuracy. | Read-only access to generated docs, comment on changes. |
| **CI/CD Bot** | Automated system running the tool in pipelines. | Read repository, write to documentation branch, trigger scans on push. |

## Core Features

### Repository Scanning
Automated discovery of repository structure and relevant files for documentation.
- **Sub-features:**
  - Recursive directory traversal.
  - File type filtering (`.md`, `.ts`, `.js`).
  - Exclusion patterns (`.gitignore` compliance).
- **Access:** Maintainer, CI/CD Bot

### Diff Analysis
Intelligent detection of code changes to determine documentation impact.
- **Sub-features:**
  - Line-by-line change detection.
  - Contextual relevance scoring.
  - Dependency impact mapping.
- **Access:** Maintainer, CI/CD Bot

### AI Documentation Generation
Local LLM integration for generating and updating documentation content.
- **Sub-features:**
  - Ollama client integration.
  - Prompt templating (`prompts.ts`).
  - Context injection from source files.
- **Access:** Maintainer, CI/CD Bot

### Dependency Management
Synchronization of tool dependencies and versioning.
- **Sub-features:**
  - `package.json` validation.
  - Lockfile consistency checks.
  - Automated dependency updates (`deps-updater.ts`).
- **Access:** Maintainer

### Git Integration
Version control operations for documentation updates.
- **Sub-features:**
  - Branch creation and checkout.
  - Commit history tracking.
  - Push/Pull automation.
- **Access:** Maintainer, CI/CD Bot

## User Workflows

### Workflow 1: Initial Bootstrap
1. Clone repository.
2. Run `scripts/bootstrap-repo.sh`.
3. Install dependencies (`npm install`).
4. Configure Ollama client endpoint.
5. Verify `.gitignore` excludes `node_modules`.

### Workflow 2: Generate Documentation
1. Maintainer triggers scan (`npm run scan`).
2. System analyzes current `HEAD` vs previous commit.
3. Diff analyzer identifies changed modules.
4. Ollama client generates updated documentation based on prompts.
5. Generated files staged for review.

### Workflow 3: Review & Commit
1. Maintainer reviews generated markdown files.
2. Confirms accuracy against code changes.
3. Commits changes to documentation branch.
4. CI/CD Bot validates formatting and links.

## Feature Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Repository Scanning** | Active | Core logic in `scanner.ts`. |
| **Diff Analysis** | Active | Core logic in `diff-analyzer.ts`. |
| **AI Generation** | Active | Ollama client integrated in `ollama-client.ts`. |
| **Dependency Management** | Active | `deps-updater.ts` handles sync. |
| **Git Integration** | Active | `git-utils.ts` handles version control. |
| **CLI Interface** | Active | Entry point in `index.ts`. |
| **UI Dashboard** | Planned | No frontend components in current scope. |
| **Multi-Repo Support** | Planned | Currently single-repo focused. |