# docgen-template Operations & Runbooks

| Field | Value |
| :--- | :--- |
| **Document** | Operations & Runbooks |
| **Repository** | docgen-template |
| **Last Updated** | 2026-03-09 |
| **Audience** | Engineers, DevOps, SRE |

## Deployment

The system utilizes a GitOps-inspired CI/CD pipeline orchestrated via GitHub Actions. Deployment artifacts are containerized images pushed to the internal registry and deployed via `kubectl` or `helm`.

### CI/CD Pipeline Flow

1.  **Build & Test**: On push to `main` or `develop`, the pipeline builds the Docker image, runs unit/integration tests, and performs static analysis.
2.  **Push Artifact**: Successful builds push the image to the registry with a tag matching the commit SHA and semantic version.
3.  **Deploy**:
    *   **Staging**: Automatic deployment on merge to `develop`.
    *   **Production**: Manual approval required; triggered via GitHub Actions workflow dispatch or `make deploy-prod`.

### Manual Deployment Steps

For emergency hotfixes or local debugging:

```bash
# Build locally
make build

# Tag for registry
make tag IMAGE_TAG=latest

# Push to registry
make push

# Deploy to cluster (requires kubectl context configured)
make deploy TARGET=production
```

## Environments

| Environment | URL | Purpose | Branch |
| :--- | :--- | :--- | :--- |
| **Development** | `dev.docgen-template.internal` | Local feature development, CI previews | `feature/*` |
| **Staging** | `staging.docgen-template.internal` | QA, integration testing, pre-prod validation | `develop` |
| **Production** | `app.docgen-template.internal` | Live user traffic, critical services | `main` |

## Monitoring

### Dashboards

*   **Grafana**: Centralized dashboards available at `grafana.docgen-template.internal`.
    *   *System Health*: CPU, Memory, Disk I/O.
    *   *Application Metrics*: Request latency (p95, p99), error rates, throughput.
    *   *Database*: Connection pool usage, query latency.

### Health Checks

*   **Liveness Probe**: `/health/live` (HTTP 200 required for pod restart).
*   **Readiness Probe**: `/health/ready` (HTTP 200 required for traffic routing).
*   **Startup Probe**: `/health/startup` (Prevents premature liveness checks during initialization).

### Alerting

Alerts are routed to PagerDuty and Slack channels (`#ops-alerts`).

| Severity | Condition | Channel |
| :--- | :--- | :--- |
| **Critical** | Service down, >5% error rate, DB unresponsive | PagerDuty + Slack |
| **Warning** | High latency (>2s), Disk usage >80% | Slack |
| **Info** | Deployment success, scheduled maintenance | Slack |

## Runbooks

### Runbook: Deploy to Production

**Objective**: Safely deploy a new version to the production environment.

1.  Verify the target commit/tag is built and tested in Staging.
2.  Ensure the `main` branch is up to date and passing all CI checks.
3.  Notify the team via Slack `#deployments` that a deployment is starting.
4.  Execute the deployment command:
    ```bash
    make deploy-prod TAG=<commit-sha>
    ```
5.  Monitor the rollout progress via `kubectl rollout status deployment/<app-name>`.
6.  Verify health checks pass:
    ```bash
    kubectl get pods -l app=<app-name>
    curl -s https://app.docgen-template.internal/health/ready
    ```
7.  Confirm metrics in Grafana show stable latency and zero errors.
8.  Close the deployment notification in Slack.

### Runbook: Rollback a Deployment

**Objective**: Revert a failed production deployment immediately.

1.  Identify the last known good deployment revision:
    ```bash
    kubectl rollout history deployment/<app-name>
    ```
2.  Determine the revision number to revert to (e.g., revision `3`).
3.  Execute the rollback:
    ```bash
    kubectl rollout undo deployment/<app-name> --to-revision=3
    ```
4.  Monitor the rollback status:
    ```bash
    kubectl rollout status deployment/<app-name>
    ```
5.  Verify service health and metrics stability.
6.  Investigate the root cause of the failure in the failed revision.

### Runbook: Database Migration

**Objective**: Apply schema changes to the production database with zero downtime.

1.  **Preparation**:
    *   Backup the database (snapshot or logical dump).
    *   Verify migration scripts are idempotent and backward compatible.
2.  **Execution**:
    *   Notify the team of the maintenance window.
    *   Run the migration script:
        ```bash
        make db-migrate MIGRATION=<migration-name>
        ```
    *   Check migration logs for errors.
3.  **Verification**:
    *   Run schema validation queries.
    *   Perform smoke tests against the application.
4.  **Rollback (if needed)**:
    *   If migration fails, restore from backup or run the rollback script:
        ```bash
        make db-rollback MIGRATION=<migration-name>
        ```

### Runbook: Rotate Secrets

**Objective**: Rotate API keys, database passwords, or TLS certificates.

1.  **Preparation**:
    *   Generate new secrets in the secure vault (e.g., HashiCorp Vault, AWS Secrets Manager).
    *   Update the Kubernetes Secrets manifest or Helm values.
2.  **Deployment**:
    *   Apply the updated secrets:
        ```bash
        kubectl apply -f secrets/
        ```
    *   Trigger a rolling restart of the affected pods to pick up new environment variables:
        ```bash
        kubectl rollout restart deployment/<app-name>
        ```
3.  **Verification**:
    *   Confirm services can connect to external dependencies using new credentials.
    *   Check logs for authentication errors.
4.  **Cleanup**:
    *   Revoke old secrets in the vault after a 24-hour observation period.

## Incident Response

### Severity Levels

| Level | Description | Response Time |
| :--- | :--- | :--- |
| **SEV-1** | Critical: Production down, data loss, security breach. | Immediate (15 min) |
| **SEV-2** | High: Major feature degraded, significant performance impact. | 1 hour |
| **SEV-3** | Medium: Minor feature broken, non-critical bug. | 4 hours |
| **SEV-4** | Low: Cosmetic issues, feature requests. | Next sprint |

### Escalation

1.  **On-Call Engineer**: Initial triage and containment.
2.  **Engineering Manager**: If SEV-1/SEV-2 persists >30 mins or requires architectural decision.
3.  **CTO/VP Engineering**: If SEV-1 impacts business continuity >1 hour.

### Communication

*   **Internal**: Dedicated Slack channel `#incident-<id>`.
*   **External**: Status page updates for SEV-1/SEV-2.
*   **Post-Mortem**: Required for all SEV-1/SEV-2 incidents within 48 hours.

## Maintenance

### Scheduled Maintenance

*   **Frequency**: Sundays 02:00 UTC - 04:00 UTC.
*   **Notification**: Posted in `#ops-announcements` 24 hours in advance.
*   **Scope**: Database backups, dependency updates, certificate renewals.

### Upgrade Procedures

1.  Review changelog for breaking changes.
2.  Test upgrades in Staging environment.
3.  Update `DEPS.yaml` and run `make deps-update`.
4.  Execute upgrade during maintenance window.
5.  Verify system stability post-upgrade.

## Scripts

The following utility scripts are available in the `scripts/` directory:

| Script | Description | Usage |
| :--- | :--- | :--- |
| `bootstrap-all.sh` | Provisions all local dependencies and initializes the development environment. | `./scripts/bootstrap-all.sh` |
| `bootstrap-repo.sh` | Initializes the repository structure, installs dependencies, and runs initial linting. | `./scripts/bootstrap-repo.sh` |
| `deploy-prod.sh` | Wrapper script for deploying the latest build to production. | `./scripts/deploy-prod.sh` |
| `db-migrate.sh` | Executes database migrations against the connected cluster. | `./scripts/db-migrate.sh` |
| `rotate-secrets.sh` | Automates the rotation of specific secrets in the vault. | `./scripts/rotate-secrets.sh` |