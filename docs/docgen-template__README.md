# docgen-template

**System Overview**

**Audience:** Engineers, Architects, Technical Leads
**Last Updated:** 2026-03-09

## Overview

`docgen-template` is a TypeScript-based documentation generation engine designed to analyze code diffs and produce technical documentation using local LLM inference. It serves development teams by automating the creation of up-to-date system documentation directly from version control changes. The system leverages Ollama for local model execution, esbuild for bundling, and a modular scanner architecture to ensure high-fidelity output without external API dependencies.

## Quick Start

1.  **Clone Repository**
    ```bash
    git clone https://github.com/kaycha-labs/docgen-template.git
    cd docgen-template
    ```

2.  **Install Dependencies**
    ```bash
    cd docgen
    npm install
    ```

3.  **Configure Environment**
    Ensure `OLLAMA_HOST` is set to your local Ollama instance (default: `http://localhost:11434`).
    ```bash
    export OLLAMA_HOST=http://localhost:11434
    ```

4.  **Run Application**
    ```bash
    npx tsx docgen/index.ts
    ```

5.  **Bootstrap Scripts**
    For full environment setup, execute the repository bootstrap script:
    ```bash
    ./scripts/bootstrap-repo.sh
    ```

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | TypeScript | Core logic and type safety |
| **Runtime** | tsx | TypeScript execution without pre-compilation |
| **Build** | esbuild | Fast bundling and compilation |
| **LLM Client** | Ollama | Local model inference for text generation |
| **HTTP Client** | undici-types | Type-safe HTTP request handling |
| **Config** | DEPS.yaml | Dependency version management |

## Architecture Overview

The system follows a pipeline architecture where input data flows through specialized processing modules before generating output.

```text
[Git Repo] 
    │
    ▼
[Scanner] ──► [Diff Analyzer] ──► [Ollama Client] ──► [Documentation Output]
    │              │                    │
    │              ▼                    ▼
    │        [TypeScript Libs]    [Local Model Context]
    ▼
[Output Directory]
```

**Key Patterns:**
*   **Pipeline:** Sequential processing of scan data through analysis and generation stages.
*   **Dependency Injection:** `ollama-client.ts` and `diff-analyzer.ts` are modular components allowing for swapping implementations.
*   **Type Safety:** Strict TypeScript configuration (`tsconfig.json`) ensures runtime reliability.

## Key Features

*   **Automated Diff Analysis:** Parses git diffs to identify changed modules and functions.
*   **Local LLM Integration:** Connects to Ollama for context-aware documentation generation.
*   **Bootstrap Automation:** Shell scripts (`bootstrap-all.sh`, `bootstrap-repo.sh`) handle environment initialization.
*   **Dependency Management:** Centralized dependency tracking via `DEPS.yaml`.
*   **Production-Grade Tooling:** Uses `esbuild` for optimized bundling and `tsx` for rapid development iteration.

## Project Structure

```text
├── CLAUDE.md              # AI context and operational rules
├── DEPS.yaml              # Dependency definitions
├── docgen/                # Core application logic
│   ├── index.ts         # Entry point
│   ├── scanner.ts       # Repository scanning logic
│   ├── diff-analyzer.ts # Diff parsing and analysis
│   ├── ollama-client.ts # LLM interaction layer
│   ├── package.json     # Node.js dependencies
│   └── tsconfig.json    # TypeScript configuration
├── docs/                  # Generated documentation output
└── scripts/               # Automation scripts
    ├── bootstrap-all.sh
    └── bootstrap-repo.sh
```

## Related Documentation

*   **[CLAUDE.md](./CLAUDE.md)** - AI operational guidelines and context.
*   **[DEPS.yaml](./DEPS.yaml)** - Dependency version specifications.
*   **[docs/](./docs/)** - Generated system documentation.
*   **[scripts/bootstrap-repo.sh](./scripts/bootstrap-repo.sh)** - Environment setup automation.