# Security & Compliance

**Audience:** Engineers, Security Team, Compliance
**Last Updated:** 2026-03-09

## Authentication

This template repository does not enforce a specific authentication provider. Projects utilizing this template should implement authentication via industry-standard protocols.

- **Recommended Providers:** Auth0, Okta, Firebase Auth, or Supabase Auth.
- **Flow:** OIDC (OpenID Connect) or OAuth 2.0.
- **Token Handling:** Access tokens stored in memory or secure HTTP-only cookies. Refresh tokens rotated on every use.
- **Session Management:** Stateless JWT validation preferred for API endpoints.

## Authorization (RBAC)

Role-Based Access Control (RBAC) is required for all application endpoints. Roles should be defined in the application layer and enforced via middleware.

| Role | Permissions | Access Level |
| :--- | :--- | :--- |
| `admin` | Full CRUD, User Management, System Config | System |
| `editor` | Create, Read, Update, Delete own resources | Resource |
| `viewer` | Read only | Read |
| `service` | API Access, Read-only DB | Backend |

## Row Level Security (RLS)

No Supabase migration files or RLS policies are included in this template repository. Consumers must define RLS policies in their respective database schemas.

- **Status:** Not Applicable (Template Only)
- **Recommendation:** Enable RLS on all sensitive tables immediately upon project initialization.
- **Policy Example:**
  ```sql
  -- Example for 'users' table
  CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
  ```

## API Security

All API endpoints must adhere to the following security standards:

- **Rate Limiting:** Enforced at the gateway or application layer (e.g., Redis-based token bucket). Default: 100 requests/minute per IP.
- **CORS:** Strict origin whitelisting. `Access-Control-Allow-Origin` must not be `*`.
- **Input Validation:** All inputs validated against strict schemas (e.g., Zod, Yup) before processing.
- **Headers:** Security headers enforced (HSTS, X-Content-Type-Options, CSP).

## Secrets Management

Secrets must never be committed to the repository. The `.gitignore` configuration explicitly excludes environment files and sensitive binaries.

| Secret | Storage | Rotation Policy |
| :--- | :--- | :--- |
| `DATABASE_URL` | Environment Variable / Vault | Quarterly |
| `API_KEYS` | Environment Variable / Vault | On Compromise |
| `JWT_SECRET` | Environment Variable | Quarterly |
| `ENCRYPTION_KEY` | Environment Variable / KMS | On Compromise |

## Data Protection

- **Encryption at Rest:** Database volumes encrypted via cloud provider native encryption (e.g., AWS KMS, Azure Disk Encryption).
- **Encryption in Transit:** TLS 1.2+ enforced for all data in transit.
- **PII Handling:** Personally Identifiable Information must be hashed or encrypted before storage. Logging of PII is strictly prohibited.
- **Backups:** Encrypted backups retained for 30 days, stored in separate regions.

## Compliance

This template supports compliance with the following standards (project-specific configuration required):

- **SOC 2:** Audit logging enabled for all state-changing operations.
- **HIPAA:** BAA required for cloud providers. PHI handling protocols must be implemented.
- **GDPR:** Data export and deletion endpoints required for user data.

## Security Checklist

Pre-deploy security review items:

- [ ] `.env` files verified in `.gitignore`
- [ ] Dependencies scanned for vulnerabilities (`npm audit` / `snyk`)
- [ ] API endpoints tested for Rate Limiting
- [ ] CORS policies verified against production domains
- [ ] RLS policies enabled on all database tables
- [ ] Secrets rotated and stored in secure vault
- [ ] TLS certificates valid and auto-renewal configured
- [ ] Audit logging enabled for authentication events
- [ ] Input validation implemented on all API routes
- [ ] Security headers configured in production