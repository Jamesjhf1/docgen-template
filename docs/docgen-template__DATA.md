| Field | Value |
| :--- | :--- |
| **Audience** | Engineers, Data Architects |
| **Last Updated** | 2026-03-09 |

## Overview

This repository (`docgen-template`) is a documentation generation tool built with TypeScript/Node.js. It does not maintain a persistent database schema or SQL migrations within the current context. The application logic resides in the `docgen/` directory, utilizing file system scanning and LLM-based generation for documentation output.

**Database Type:** N/A  
**Schema Management:** N/A (No database dependency)

## Tables by Domain

No database tables are defined in this repository. The application operates as a stateless or file-based tool.

## Relationships

No foreign key relationships exist as there is no relational database layer.

## Indexes

No database indexes are defined.

## Enums / Types

No custom PostgreSQL types or database enums are defined.

## RLS Summary

Row Level Security (RLS) is not applicable as there is no database layer.

## Migration History

No SQL migration files (e.g., `migrations/*.sql`) are present in the repository context.

| Version | Date | Description |
| :--- | :--- | :--- |
| `bootstrap` | 2026-03-09 | Initial repository setup. Documentation generation tool scaffolding. No database schema. |