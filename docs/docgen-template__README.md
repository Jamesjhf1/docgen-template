# docgen-template System Overview

| Attribute | Value |
| :--- | :--- |
| **Audience** | Engineers, Architects, Technical Leads |
| **Last Updated** | 2026-03-09 |

## Overview

`docgen-template` is a production-grade automated documentation generation system designed for Kaycha Labs repositories. It leverages local LLM inference via Ollama to analyze source code and commit history, automatically generating and maintaining comprehensive technical documentation. The system serves engineering teams by ensuring documentation accuracy, reducing manual maintenance overhead, and enforcing consistent documentation standards across the codebase.

## Quick Start

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd docgen-template
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure environment**
    Ensure the following environment variables are set in `.env` or your shell:
    *   `OLLAMA_HOST`: URL of the Ollama instance (e.g., `http://localhost:11434`)
    *   `MODEL_NAME`: The specific model to use (e.g., `llama3.2`)

4.  **Run the documentation generator**
    ```bash
    npm run docgen
    ```

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js / TypeScript | Core application logic and type safety |
| **LLM Inference** | Ollama | Local execution of language models for code analysis |
| **Package Manager** | npm | Dependency management and script execution |
| **Version Control** | Git | Source control and diff analysis |
| **Configuration** | DEPS.yaml | Dependency version pinning and management |

## Architecture Overview

The system operates on a pipeline architecture where source code and git history are ingested, analyzed by a local LLM, and synthesized into Markdown documentation.

**Component Flow:**
1.  **Scanner**: Ingests repository files and git diffs.
2.  **Diff Analyzer**: Extracts relevant changes and context.
3.  **Ollama Client**: Interfaces with the local LLM to generate content based on prompts.
4.  **Generator**: Assembles generated content into structured Markdown files.

**Key Patterns:**
*   **Pipeline**: Sequential processing of source context through analysis and generation stages.
*   **Dependency Injection**: Modular configuration of prompts and client behaviors.
*   **Stateless Execution**: Each run is independent, relying on current repository state.

## Key Features

*   **Automated Documentation Generation**: Produces comprehensive docs (README, Architecture, Security, etc.) from source code.
*   **Git-Aware Analysis**: Specifically analyzes commit diffs to identify changes requiring documentation updates.
*   **Local LLM Integration**: Uses Ollama for secure, offline code analysis without external API dependencies.
*   **Prompt Engineering**: Configurable prompt templates for consistent output quality.
*   **Type-Safe Execution**: Full TypeScript coverage for robust error handling and type safety.

## Project Structure

```text
├── docgen/
│   ├── index.ts              # Entry point for the documentation generation pipeline
│   ├── ollama-client.ts      # Wrapper for Ollama API interactions
│   ├── scanner.ts            # Repository file and git diff scanning logic
│   ├── diff-analyzer.ts      # Logic to interpret git diffs and extract context
│   ├── prompts.ts            # LLM prompt templates for documentation sections
│   ├── source-context.ts     # Context assembly for LLM consumption
│   ├── types.ts              # TypeScript type definitions
│   └── package.json          # Project dependencies and scripts
├── docs/                     # Generated documentation output directory
├── scripts/
│   ├── bootstrap-repo.sh     # Repository initialization script
│   └── bootstrap-all.sh      # Full environment setup script
├── DEPS.yaml                 # Dependency definitions
└── CLAUDE.md                 # AI assistant configuration
```

## Related Documentation

*   [Product Overview](./docgen-template__PRODUCT.md) - Business goals and user requirements.
*   [Architecture Deep Dive](./docgen-template__ARCHITECTURE.md) - Detailed component diagrams and data flow.
*   [Engineering Standards](./docgen-template__ENGINEERING.md) - Coding standards, CI/CD, and testing protocols.
*   [Operations Guide](./docgen-template__OPERATIONS.md) - Deployment, monitoring, and maintenance procedures.
*   [Security Policy](./docgen-template__SECURITY.md) - Security practices and compliance requirements.