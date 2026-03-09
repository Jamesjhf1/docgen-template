# docgen-template__DATA.md

**Last Updated:** 2026-03-09

## 1. Overview

This document defines the data model for the `docgen-template` repository. The system utilizes **PostgreSQL** as the primary relational database. Schema management is handled via **SQL migrations** stored in the `migrations/` directory, executed through the `db-migrate` CLI tool.

The data model is designed to support the generation pipeline, storing configuration, generation jobs, and output artifacts.

## 2. Tables by Domain

### `migrations`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | NO | `nextval(...)` | Primary Key |
| `name` | `VARCHAR(255)` | NO | | Migration filename (e.g., `001_init.sql`) |
| `run_on` | `TIMESTAMP WITH TIME ZONE` | NO | `CURRENT_TIMESTAMP` | Timestamp when migration was applied |
| `version` | `VARCHAR(50)` | NO | | Semantic version string derived from filename |

### `generation_jobs`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | NO | `nextval(...)` | Primary Key |
| `repo_id` | `UUID` | NO | | Reference to the repository being documented |
| `status` | `VARCHAR(20)` | NO | `'pending'` | Current state: `pending`, `running`, `completed`, `failed` |
| `started_at` | `TIMESTAMP WITH TIME ZONE` | YES | `NULL` | When execution began |
| `completed_at` | `TIMESTAMP WITH TIME ZONE` | YES | `NULL` | When execution finished |
| `error_message` | `TEXT` | YES | `NULL` | Stack trace or error log on failure |
| `config_hash` | `VARCHAR(64)` | YES | `NULL` | SHA256 hash of the generation config used |

### `generated_docs`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | NO | `nextval(...)` | Primary Key |
| `job_id` | `INTEGER` | NO | | Foreign Key to `generation_jobs` |
| `file_path` | `VARCHAR(512)` | NO | | Relative path within the repository (e.g., `docs/README.md`) |
| `content` | `TEXT` | NO | | Full markdown content of the generated file |
| `status` | `VARCHAR(20)` | NO | `'draft'` | `draft`, `published`, `archived` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NO | `CURRENT_TIMESTAMP` | Creation timestamp |

### `repository_configs`

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | NO | `nextval(...)` | Primary Key |
| `repo_id` | `UUID` | NO | | Unique identifier for the repository |
| `name` | `VARCHAR(255)` | NO | | Human-readable repository name |
| `branch` | `VARCHAR(255)` | NO | `'main'` | Target branch for generation |
| `template_path` | `VARCHAR(255)` | YES | `NULL` | Path to custom generation template |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NO | `CURRENT_TIMESTAMP` | Last update timestamp |

## 3. Relationships

| Table: From Table | Column | To Table | Column | Type |
| :--- | :--- | :--- | :--- | :--- |
| `generation_jobs` | `repo_id` | `repository_configs` | `id` | 1:M |
| `generated_docs` | `job_id` | `generation_jobs` | `id` | 1:M |
| `repository_configs` | `id` | `generation_jobs` | `repo_id` | 1:M |

## 4. Indexes

| Table | Index Name | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `generation_jobs` | `idx_jobs_status` | `status` | Fast filtering for active/pending jobs |
| `generation_jobs` | `idx_jobs_repo` | `repo_id` | Optimizing lookups by repository |
| `generated_docs` | `idx_docs_job` | `job_id` | Retrieving all artifacts for a specific job |
| `generated_docs` | `idx_docs_path` | `file_path` | Deduplication checks and path lookups |
| `repository_configs` | `idx_configs_repo` | `repo_id` | Unique constraint enforcement and lookup |

## 5. Enums / Types

No custom PostgreSQL types or Enums are currently defined in the schema. Standard `VARCHAR` and `TEXT` types are used for state representation.

## 6. RLS Summary

Row Level Security (RLS) is **not enabled** on any tables in the current schema version. Access control is handled at the application layer via API authentication and database user permissions.

## 7. Migration History

| Version | Filename | Description |
| :--- | :--- | :--- |
| `001` | `001_init.sql` | Initial schema: `migrations`, `repository_configs`, `generation_jobs`, `generated_docs` |
| `002` | `002_add_indexes.sql` | Added performance indexes on `generation_jobs` and `generated_docs` |
| `003` | `003_add_config_hash.sql` | Added `config_hash` column to `generation_jobs` for caching logic |