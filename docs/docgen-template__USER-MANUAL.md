# docgen-template__USER-MANUAL.md

**Audience:** End Users, Administrators
**Last Updated:** 2026-03-09

---

## 1. Getting Started

Welcome to the **docgen-template** system. This platform allows you to generate, manage, and version technical documentation for your software repositories automatically.

### Accessing the System
1. Navigate to the application URL provided by your administrator.
2. Log in using your corporate credentials or SSO provider.

### First-Time Setup
Upon your first login, you will be guided through a brief onboarding wizard:
1. **Repository Connection**: Link your Git repository (GitHub, GitLab, or Bitbucket).
2. **Scope Selection**: Choose which directories or files should be included in documentation generation.
3. **Profile Configuration**: Set your default output format (Markdown, PDF, or HTML).

Once configured, the system will perform an initial scan of your repository to establish a baseline.

---

## 2. User Roles

The system supports three primary roles to control access and capabilities.

| Role | Permissions |
| :--- | :--- |
| **Viewer** | Can view generated documentation, search content, and download static exports. Cannot modify settings or trigger generation. |
| **Editor** | Can trigger documentation generation, edit generated content manually, and manage repository links. |
| **Administrator** | Can manage user access, configure system-wide settings, view audit logs, and manage API keys. |

---

## 3. Features Guide

### Automated Documentation Generation
**What it does:** Automatically scans your codebase and generates up-to-date technical documentation based on code comments, configuration files, and commit history.

**How to use it:**
1. Navigate to the **Dashboard**.
2. Click the **Generate Docs** button in the top-right corner.
3. Select the target branch (e.g., `main`, `develop`).
4. Click **Start Generation**.
5. Monitor progress in the **Activity Log** panel.

**Tips and Best Practices:**
- Ensure your code contains clear comments for the best results.
- Run generation after major commits to keep documentation current.
- Use the **Preview** tab to review changes before publishing.

### Repository Management
**What it does:** Allows you to connect and disconnect Git repositories, and configure which branches are monitored.

**How to use it:**
1. Go to **Settings** > **Repositories**.
2. Click **Add Repository**.
3. Select your provider (GitHub/GitLab/Bitbucket) and authorize access.
4. Select the specific repository and branch to monitor.

**Tips and Best Practices:**
- Limit access to production branches for Administrators only.
- Regularly audit connected repositories to remove deprecated projects.

### Version History & Rollback
**What it does:** Maintains a history of all generated documentation versions, allowing you to revert to previous states if changes are incorrect.

**How to use it:**
1. Open a specific documentation page.
2. Click the **Version History** icon (clock symbol) in the toolbar.
3. Select a previous version from the list.
4. Click **Restore** to revert the current documentation to that state.

**Tips and Best Practices:**
- Always review the diff before restoring a version.
- Use version history to track how documentation evolves over time.

---

## 4. Common Tasks

| Task | Steps |
| :--- | :--- |
| **Download Documentation** | Open the documentation view > Click **Export** > Select format (PDF/Markdown) > Click **Download**. |
| **Invite a User** | Go to **Settings** > **Users** > Click **Invite** > Enter email address > Select Role > Send. |
| **Check System Status** | Click the **Status** indicator in the footer. Green indicates healthy; Red indicates an outage. |
| **Search Documentation** | Use the global search bar at the top of the page. Type keywords to filter results instantly. |

---

## 5. FAQ

**Q: How often is the documentation updated?**
A: The system updates automatically upon successful repository pushes. You can also trigger manual updates at any time.

**Q: Can I edit the generated text manually?**
A: Yes, Editors and Administrators can override specific sections. However, manual edits may be overwritten during the next automated generation cycle unless "locked".

**Q: Does this support private repositories?**
A: Yes, the system supports both public and private repositories. Ensure your Git provider permissions are correctly configured.

**Q: What formats are supported for export?**
A: The system supports Markdown (`.md`), PDF, and HTML exports.

---

## 6. Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Generation fails** | Repository connection lost or invalid credentials. | Go to **Settings** > **Repositories** and re-authorize the connection. |
| **Documentation looks outdated** | Generation was not triggered after recent code changes. | Manually trigger a **Generate Docs** action. |
| **Cannot see "Generate" button** | User lacks necessary permissions. | Contact an Administrator to verify your role. |
| **Export fails** | Large documentation size or network timeout. | Try exporting in smaller sections or check your internet connection. |

---

## 7. Support

If you encounter issues not covered in this manual:

1. **Internal Help Desk**: Submit a ticket via the **Support** link in the application footer.
2. **Documentation**: Visit the internal knowledge base for detailed guides.
3. **Emergency Contact**: For critical system outages, contact the DevOps team at `ops-support@kaychalabs.com`.