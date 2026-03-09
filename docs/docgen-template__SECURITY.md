# Security & Compliance

| Metadata | Value |
| :--- | :--- |
| **Last Updated** | 2026-03-09 |
| **Version** | 1.0.0 |
| **Audience** | Engineers, Security Team, Compliance Officers |

## Authentication

The system utilizes **Supabase Auth** (based on GoTrue) as the primary identity provider.

- **Provider**: Supabase Auth (JWT-based).
- **Flow**:
  1. User initiates login via the client application.
  2. Credentials are exchanged for an Access Token (JWT) and Refresh Token.
  3. Access Token is stored in memory or `httpOnly` cookies (depending on client implementation).
  4. All API requests include the `Authorization: Bearer <token>` header.
- **Token Handling**:
  - **Access Token**: Short-lived (1 hour), signed by Supabase.
  - **Refresh Token**: Long-lived, stored securely, used to rotate access tokens.
  - **Session Management**: Sessions are stored in the `auth.sessions` table. Automatic revocation occurs on logout or password change.

## Authorization (RBAC)

Access control is enforced via Row Level Security (RLS) policies and database roles. The application layer enforces additional business logic constraints.

| Role | Permissions | Access Level |
| :--- | :--- | :--- |
| **Admin** | Full CRUD on all tables, manage users, view audit logs. | System-wide |
| **Editor** | CRUD on `documents`, `projects`. Read-only on `users`. | Project-scoped |
| **Viewer** | Read-only on assigned `documents` and `projects`. | Project-scoped |
| **Service** | Read-only access to read-only tables, write access to `audit_logs`. | System-only |

## Row Level Security (RLS)

RLS is enabled on all user-facing tables. Policies are derived from the Supabase schema to ensure data isolation.

### Policy Descriptions

1.  **`documents`**: Users can only access documents where `created_by` matches their `user_id` or where they are listed in the `shared_with` array.
2.  **`projects`**: Users can access projects where `owner_id` matches their `user_id` or where they have a membership record in `project_members`.
3.  **`audit_logs`**: Read access restricted to `Admin` role via custom claims.

### SQL Policies

```sql
-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents they own or are shared with
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
USING (
  auth.uid() = created_by 
  OR created_by IN (
    SELECT user_id FROM project_members WHERE project_id = documents.project_id
  )
);

-- Policy: Users can update documents they own
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);
```

## API Security

- **Rate Limiting**: Enforced at the API Gateway level.
  - **Limit**: 100 requests/minute per IP for unauthenticated, 1000/minute for authenticated users.
  - **Action**: Returns `429 Too Many Requests`.
- **CORS**: Strictly configured.
  - **Allowed Origins**: Production frontend domain and internal service mesh endpoints.
  - **Methods**: `GET`, `POST`, `PUT`, `DELETE`.
  - **Credentials**: `include`.
- **Input Validation**:
  - All inputs are validated against strict JSON schemas using `Zod`.
  - SQL injection prevention via parameterized queries (Supabase client).
  - XSS prevention via output encoding in the frontend.

## Secrets Management

Secrets are never stored in the repository or environment variables on the client side.

| Secret | Storage | Rotation Policy |
| :--- | :--- | :--- |
| **Database URL** | Supabase Project Settings (Environment) | Automatic on project restore |
| **JWT Secret** | Supabase Project Settings (Environment) | Automatic on project restore |
| **API Keys** | HashiCorp Vault / AWS Secrets Manager | Quarterly or on personnel change |
| **Encryption Keys** | AWS KMS | Annual rotation |

## Data Protection

- **Encryption at Rest**:
  - Database volumes encrypted using AES-256 via cloud provider (AWS RDS).
  - Backups encrypted with separate KMS keys.
- **Encryption in Transit**:
  - All traffic enforced over TLS 1.2+.
  - Internal service-to-service communication uses mTLS.
- **PII Handling**:
  - PII fields (e.g., `email`, `name`) are masked in logs.
  - Sensitive data is encrypted at the application layer before storage if required by compliance.
  - Data retention policies automatically purge PII after 90 days of inactivity.

## Compliance

The system adheres to the following standards:

- **SOC 2 Type II**: Infrastructure and access controls aligned with Trust Services Criteria.
- **GDPR**: Right to erasure and data portability implemented via API endpoints.
- **HIPAA**: (Applicable if health data is processed) BAA signed, audit logs retained for 6 years.

## Security Checklist

Pre-deploy security review items:

- [ ] **Dependency Scan**: No critical/high severity vulnerabilities in `package-lock.json`.
- [ ] **Secrets Scan**: No hardcoded secrets in source code or commit history.
- [ ] **RLS Verification**: All tables have RLS policies enabled and tested.
- [ ] **CORS Configuration**: Origins restricted to production domains only.
- [ ] **Rate Limiting**: Thresholds verified against current traffic patterns.
- [ ] **Audit Logging**: Critical actions (login, data export, permission change) are logged.
- [ ] **Input Sanitization**: All user inputs validated against schema.
- [ ] **TLS Configuration**: Certificate valid and not expired.