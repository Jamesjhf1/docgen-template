# Developer Guide

**Last Updated:** 2026-03-09

## Audience
Engineers, Contributors

## Prerequisites
- **Node.js:** v20 LTS or later
- **Package Manager:** npm (v9+) or pnpm (v8+)
- **Shell:** Bash (for bootstrap scripts)
- **Git:** v2.40+

## Getting Started

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd docgen-template
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Bootstrap Scripts**
   ```bash
   ./scripts/bootstrap-repo.sh
   ./scripts/bootstrap-all.sh
   ```

4. **Verify Setup**
   ```bash
   npm run check
   ```

## Environment Variables

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | Optional | URL for Ollama inference service | `http://localhost:11434` |
| `NODE_ENV` | Optional | Runtime environment | `development` |
| `DEBUG` | Optional | Enable verbose logging | `docgen:*` |

*Note: Create a `.env` file in the `docgen/` directory for local overrides.*

## Project Structure

```text
├── CLAUDE.md                 # AI context configuration
├── DEPS.yaml                 # External dependency definitions
├── docgen/                   # Core documentation generation engine
│   ├── index.ts            # Entry point
│   ├── scanner.ts          # Source file analysis
│   ├── ollama-client.ts    # LLM integration client
│   ├── diff-analyzer.ts    # Change detection logic
│   ├── prompts.ts          # Prompt templates
│   ├── tsconfig.json       # TypeScript configuration
│   ├── package.json        # Dependencies & scripts
│   └── package-lock.json   # Dependency lockfile
├── docs/                     # Generated documentation output
└── scripts/                  # Automation scripts
    ├── bootstrap-repo.sh   # Initial setup
    └── bootstrap-all.sh    # Full environment setup
```

## Development Workflow

- **Branching:** `main` (stable), `feature/*` (development)
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **PR Process:**
  1. Create feature branch from `main`
  2. Run `npm run lint` and `npm run test` locally
  3. Open Pull Request with description
  4. Await automated CI checks
  5. Review and merge

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Formatting:** Prettier (auto-formatted on commit)
- **Linting:** ESLint (configured in `docgen/`)
- **Naming:** PascalCase for classes, camelCase for functions/variables
- **File Organization:** Feature-based grouping within `docgen/`
- **Dependencies:** Pin versions in `package.json`; avoid dev-dependencies in production

## Testing

- **Test Command:**
  ```bash
  npm run test
  ```
- **Coverage:**
  ```bash
  npm run test:coverage
  ```
- **Strategy:** Unit tests for core logic (`scanner.ts`, `diff-analyzer.ts`), integration tests for `ollama-client.ts`.

## Build & Deploy

- **Build Command:**
  ```bash
  npm run build
  ```
- **Output:** Compiled JavaScript in `docgen/dist/`
- **Deployment:**
  1. Bump version in `docgen/package.json`
  2. Commit changes to `main`
  3. CI pipeline triggers build and deployment
- **Dev Server:**
  ```bash
  npm run dev
  ```

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| `node_modules` missing | Run `npm install` |
| TypeScript errors | Check `docgen/tsconfig.json` and run `npm run build` |
| Ollama connection failed | Verify `OLLAMA_BASE_URL` and service status |
| Bootstrap script fails | Ensure `bash` is available and scripts are executable (`chmod +x`) |
| Port conflicts | Kill existing processes or change port in config |