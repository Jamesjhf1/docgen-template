# Developer Guide — Engineering

**Repository:** `docgen-template`
**Last Updated:** 2026-03-09

## Audience
This document is intended for software engineers, contributors, and DevOps personnel responsible for building, testing, and deploying the `docgen-template` repository.

## Prerequisites
Before contributing, ensure the following tools are installed:

| Tool | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | 20.x LTS | Required for TypeScript execution |
| **pnpm** | 8.x+ | Package manager used for dependency management |
| **Git** | 2.x+ | Version control |
| **Ollama** | Latest | Required for local LLM inference (if running `docgen` locally) |

## Getting Started

### 1. Clone and Install
```bash
git clone https://github.com/kaycha-labs/docgen-template.git
cd docgen-template

# Install dependencies
pnpm install
```

### 2. Bootstrap Environment
Run the bootstrap script to initialize the repository structure and environment variables:
```bash
./scripts/bootstrap-repo.sh
```

### 3. Initialize LLM Client
Ensure Ollama is running locally to support the `docgen` tooling:
```bash
ollama pull llama3.2
```

## Environment Variables

The following environment variables are required for the `docgen` module to function correctly.

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `OLLAMA_HOST` | Yes | URL of the Ollama server | `http://localhost:11434` |
| `OLLAMA_MODEL` | Yes | Model name for generation | `llama3.2` |
| `NUM_PREDICT` | Yes | Max tokens to generate per call | `8192` |
| `THINKING_MODE` | No | Toggle verbose reasoning logs | `false` |
| `LOG_LEVEL` | No | Logging verbosity | `debug` |

*Note: Copy `.env.example` to `.env` and populate values before running the application.*

## Project Structure

The repository follows a modular architecture centered around the `docgen` CLI tool.

```text
├── CLAUDE.md                 # AI context configuration
├── DEPS.yaml                 # Dependency definitions
├── docgen/                   # Core documentation generation engine
│   ├── index.ts            # Entry point for CLI
│   ├── ollama-client.ts    # LLM client abstraction
│   ├── diff-analyzer.ts    # Git diff parsing logic
│   ├── scanner.ts          # Source code traversal
│   ├── source-context.ts   # Context aggregation
│   ├── prompts.ts          # System prompts for LLM
│   ├── types.ts            # TypeScript type definitions
│   ├── git-utils.ts        # Git interaction helpers
│   ├── package.json        # Dependencies & scripts
│   └── tsconfig.json       # Compiler configuration
├── docs/                     # Generated documentation output
├── scripts/                  # Utility scripts
│   ├── bootstrap-all.sh    # Full environment setup
│   └── bootstrap-repo.sh   # Repo initialization
└── .run-log.jsonl          # Execution logs for docgen runs
```

## Development Workflow

### Branch Strategy
- **`main`**: Production-ready code. Protected branch.
- **`develop`**: Integration branch for active development.
- **Feature Branches**: `feat/<description>` (e.g., `feat/add-diff-analyzer`)
- **Bugfix Branches**: `fix/<description>` (e.g., `fix/ollama-timeout`)

### Pull Request Process
1. Create a feature branch from `develop`.
2. Ensure all tests pass locally (`pnpm test`).
3. Run linting (`pnpm lint`).
4. Open a PR against `develop`.
5. Automated CI checks will run on push.
6. Require 1 approval and passing CI before merging.

## Coding Standards

### TypeScript & Naming
- **Strict Mode**: All code must be valid TypeScript with `strict: true`.
- **Naming**: 
  - Interfaces: PascalCase (`DocumentContext`, `OllamaResponse`)
  - Functions/Variables: camelCase (`getDiffSummary`, `numPredict`)
  - Constants: UPPER_SNAKE_CASE (`MAX_TOKENS`, `OLLAMA_HOST`)
- **File Organization**: 
  - One class/interface per file where possible.
  - Utility functions grouped in `utils/` or `*-utils.ts`.

### Patterns
- **Dependency Injection**: The `OllamaClient` is instantiated via DI to allow mocking in tests.
- **Functional Composition**: `scanner.ts` and `diff-analyzer.ts` use pure functions where possible.
- **Error Handling**: Explicit error handling using custom error classes (`DocGenError`).

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- docgen/ollama-client.test.ts
```

### Test Strategy
- **Unit Tests**: High coverage for `diff-analyzer.ts`, `scanner.ts`, and `ollama-client.ts`.
- **Integration Tests**: Verify end-to-end flow of `index.ts` with mocked LLM responses.
- **Mocking**: `ollama-client` is mocked in all unit tests to prevent external API calls.

## Build & Deploy

### Build Commands
```bash
# Build TypeScript
pnpm build

# Create distribution bundle
pnpm pack
```

### Deployment
The `docgen` tool is a CLI utility and does not require a traditional deployment pipeline. However, to update the global installation:

```bash
# Install globally from local build
pnpm link --global

# Or publish to npm registry
pnpm publish --access public
```

For automated updates to the `docs/` directory, the `bootstrap-all.sh` script triggers the generation pipeline on CI.

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Ollama connection refused** | Ensure Ollama is running: `ollama serve`. Check `OLLAMA_HOST` env var. |
| **Token limit errors** | Increase `NUM_PREDICT` in `.env` (currently set to 8192). |
| **TypeScript compilation errors** | Run `pnpm build` to check for type mismatches. Ensure `tsconfig.json` matches project structure. |
| **Missing dependencies** | Run `pnpm install` and verify `DEPS.yaml` matches `package.json`. |
| **Empty documentation output** | Check `docgen/.run-log.jsonl` for execution errors. Verify source files are present in the scan path. |