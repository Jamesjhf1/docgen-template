# Operations & Runbooks

**Last Updated:** 2026-03-09

## Deployment

The `docgen-template` repository serves as a bootstrap environment for the Kaycha DocGen tooling. The repository does not track `node_modules`; dependencies are installed during the bootstrap process.

### CI/CD Pipeline
1.  **Trigger:** Push to `main` or `develop` branches.
2.  **Build:**
    *   Run `scripts/bootstrap-all.sh` to initialize dependencies.
    *   Execute `npm install` within `docgen/`.
    *   Run TypeScript compilation via `tsc` (configured in `docgen/tsconfig.json`).
3.  **Test:** Run unit tests defined in `package.json` scripts.
4.  **Deploy:**
    *   **CLI Tool:** Publish to internal registry or distribute via package manager.
    *   **Service:** Containerize using `Dockerfile` (if applicable) or deploy binary artifacts to target infrastructure.

### Manual Deployment Steps
1.  Clone repository.
2.  Run `./scripts/bootstrap-repo.sh`.
3.  Verify `docgen/` dependencies are installed.
4.  Execute `npm run build` (or equivalent entry point in `docgen/index.ts`).
5.  Deploy artifacts to target environment.

## Environments

| Environment | URL | Purpose | Branch |
| :--- | :--- | :--- | :--- |
| Development | `dev-docgen.kaycha.local` | Local testing, feature integration | `develop` |
| Staging | `staging-docgen.kaycha.io` | QA validation, integration tests | `release/*` |
| Production | `docs.kaycha.io` | Live documentation generation | `main` |

## Monitoring

### Dashboards
*   **Generation Pipeline:** Tracks success/failure rates of doc generation jobs.
*   **System Health:** CPU, Memory, and Disk usage of the DocGen service.
*   **Dependency Health:** Status of `deps-updater.ts` automation.

### Health Checks
*   **Endpoint:** `/health` (if deployed as service).
*   **CLI Exit Codes:** Non-zero exit codes indicate failure in generation logic.
*   **Logs:** Centralized logging via `docgen/` output streams.

### Alerting
*   **Critical:** Generation pipeline failure rate > 5% over 15 minutes.
*   **Warning:** Dependency update failures or disk usage > 80%.
*   **Notification Channel:** Slack `#ops-docgen` and PagerDuty.

## Runbooks

### Runbook: Deploy to Production
1.  Ensure all changes are merged to `main` branch.
2.  Verify CI pipeline status is green.
3.  Run `scripts/bootstrap-all.sh` on the deployment host to ensure environment consistency.
4.  Pull latest artifacts from the build registry.
5.  Execute deployment script (e.g., `kubectl apply -f k8s/` or `docker-compose up -d`).
6.  Verify health check endpoint returns 200 OK.
7.  Announce deployment completion to `#ops-docgen`.

### Runbook: Rollback a Deployment
1.  Identify the last known good commit hash.
2.  Checkout the commit: `git checkout <commit-hash>`.
3.  Run `scripts/bootstrap-all.sh` to restore dependency state.
4.  Redeploy the artifacts from the checked-out version.
5.  Verify service stability.
6.  If automated rollback is configured, trigger via CI/CD dashboard.

### Runbook: Database Migration
*Note: Applicable only if DocGen state is persisted.*
1.  Backup the current database state.
2.  Review migration scripts in `docgen/migrations/`.
3.  Run migration script: `npm run migrate`.
4.  Verify schema integrity.
5.  Monitor logs for migration errors.
6.  If failure occurs, restore backup and investigate.

### Runbook: Rotate Secrets
1.  Identify secrets in use (API keys, DB credentials, CI tokens).
2.  Generate new secret values.
3.  Update secrets in the CI/CD provider (e.g., GitHub Secrets, Vault).
4.  Update environment variables on deployment hosts.
5.  Restart affected services.
6.  Invalidate cached credentials if applicable.
7.  Revoke old secrets immediately after verification.

## Incident Response

### Severity Levels
| Severity | Description | Response Time |
| :--- | :--- | :--- |
| **P0** | Production down, data loss, security breach | Immediate |
| **P1** | Major feature broken, high error rate | 15 Minutes |
| **P2** | Minor feature broken, degraded performance | 1 Hour |
| **P3** | Cosmetic issues, feature requests | 24 Hours |

### Escalation
1.  **P0/P1:** Page on-call engineer immediately.
2.  **P2:** Create ticket in Jira/Issue Tracker.
3.  **P3:** Add to backlog.

### Communication
*   **Internal:** Slack `#ops-docgen`.
*   **External:** Status page update if service is public.
*   **Post-Mortem:** Required for all P0/P1 incidents within 48 hours.

## Maintenance

### Scheduled Maintenance
*   **Frequency:** Monthly on Sundays 02:00 UTC.
*   **Duration:** Max 30 minutes.
*   **Notification:** Announced 24 hours in advance.

### Upgrade Procedures
1.  Review `deps-updater.ts` logs for dependency changes.
2.  Update `package.json` and `package-lock.json`.
3.  Run `npm audit` to check for vulnerabilities.
4.  Update `tsconfig.json` if language features change.
5.  Run full test suite before merging.
6.  Deploy to Staging for validation.

## Scripts

| Script | Description | Usage |
| :--- | :--- | :--- |
| `scripts/bootstrap-all.sh` | Initializes the full environment, installs dependencies, and prepares the workspace. | `./scripts/bootstrap-all.sh` |
| `scripts/bootstrap-repo.sh` | Performs repository-specific setup tasks, such as git hooks or initial configuration. | `./scripts/bootstrap-repo.sh` |
| `docgen/deps-updater.ts` | Automated script to update dependencies and lock files. | `npx tsx docgen/deps-updater.ts` |
| `docgen/index.ts` | Main entry point for the DocGen tooling logic. | `npx tsx docgen/index.ts` |