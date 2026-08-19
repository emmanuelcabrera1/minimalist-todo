# GITHUB_DOC_MANAGER v1.0
> **World-Class Meta Prompt for Secure GitHub Documentation Management**  
> Last Updated: 2026-01-10 | Security Level: Enterprise

---

## 🎯 Purpose

This meta prompt provides a comprehensive, secure framework for managing GitHub documentation with:
- **PULL** - Fetch documentation from repositories
- **EDIT** - Modify documentation with validation
- **DEPLOY** - Push changes via PR workflow
- **AUDIT** - Review history and track changes

---

## 🐳 Infrastructure

> [!IMPORTANT]
> All Git CLI commands must run inside the Docker container per [AGENT_RULES.md](./AGENT_RULES.md).

| Component | Value |
|-----------|-------|
| **Container** | `agent_sandbox_v1` |
| **Workspace** | `/app` → `HTML_Apps_Workspace` |
| **Credential Helper** | `store` |
| **Token Location** | `~/.git-credentials` |

### Direct Git Command Syntax

```bash
docker exec agent_sandbox_v1 bash -c 'git <command>'
```

### Git Credentials Setup

If credentials expire or need refresh:

```bash
# 1. Generate new PAT at https://github.com/settings/tokens
# 2. Store in container:
docker exec agent_sandbox_v1 bash -c 'echo "https://<username>:<token>@github.com" > ~/.git-credentials'
```

---

## 🔐 Security Protocols

### Protocol 1: Repository Access Control

```yaml
ALLOWED_REPOSITORIES:
  - owner: "emmanuelcabrera1"
    repos:
      - minimalist-todo
      - experiments-app
    permissions: READ_WRITE

  - owner: "emmanuelcabrera1"
    repos:
      - InfographicAi
      - memento-mori
    permissions: READ_ONLY
    
  # Add more repositories as needed:
  # - owner: "organization-name"
  #   repos: ["repo-1", "repo-2"]
  #   permissions: READ_ONLY | READ_WRITE

DEFAULT_PERMISSION: DENY
```

**Validation Rule**: Before any operation, verify:
```
✓ Owner/repo exists in ALLOWED_REPOSITORIES
✓ Operation matches permission level (READ for pull, WRITE for edit/deploy)
✓ If not found → DENY with security log entry
```

---

### Protocol 2: Input Validation

| Check | Pattern | Action if Failed |
|-------|---------|------------------|
| **Path Traversal** | Contains `../` or `..\\` | BLOCK + Log |
| **Repo Format** | `^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$` | BLOCK |
| **File Extension** | `.md`, `.txt`, `.json`, `.yml`, `.yaml` | WARN (confirm) |
| **Content Size** | > 1MB | BLOCK |
| **Binary Detection** | Non-UTF8 content | BLOCK |

---

### Protocol 3: Sensitive Data Detection

**SCAN BEFORE ANY DEPLOY OPERATION:**

```regex
# API Keys & Tokens
(api[_-]?key|apikey|token|secret|password|auth)['":\s]*[=:]['"]?[a-zA-Z0-9_\-]{16,}

# AWS Credentials
AKIA[0-9A-Z]{16}
aws[_-]?(secret|access)[_-]?key

# Private Keys
-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----

# Connection Strings
(postgres|mysql|mongodb|redis)://[^\s]+

# GitHub Tokens
gh[pousr]_[A-Za-z0-9_]{36,}
```

**Action**: If detected → BLOCK operation + Alert user

---

### Protocol 4: Branch Protection

```yaml
PROTECTED_BRANCHES:
  - main
  - master
  - production
  - release/*

ENFORCEMENT:
  direct_push: FORBIDDEN
  require_pr: MANDATORY
  require_review: RECOMMENDED
```

**Rule**: All changes to protected branches MUST go through Pull Request workflow.

---

### Protocol 5: Rate Limiting

```yaml
RATE_LIMITS:
  pull_operations: 30/hour
  edit_operations: 10/hour
  deploy_operations: 5/hour
  
COOLDOWN:
  after_deploy: 5 minutes
  after_error: 1 minute
```

---

## 📖 Operations

### OPERATION: PULL_DOCS

**Purpose**: Fetch documentation from a GitHub repository.

**Syntax**:
```
PULL_DOCS <owner>/<repo> <path> [branch]
```

**Execution Steps**:

1. **Validate Access**
   ```
   □ Check repository in ALLOWED_REPOSITORIES
   □ Verify READ permission
   □ Validate path format (no traversal)
   ```

2. **Execute Fetch**
   ```
   Tool: mcp_github-n8n_get_file_contents
   Parameters:
     - owner: <owner>
     - repo: <repo>
     - path: <path>
     - branch: <branch> (default: main)
   ```

3. **Process Response**
   ```
   □ Decode base64 content
   □ Return formatted markdown
   □ Log operation to audit trail
   ```

**Example**:
```
PULL_DOCS emmanuelcabrera1/minimalist-todo README.md
PULL_DOCS emmanuelcabrera1/minimalist-todo docs/guide.md feature-branch
```

---

### OPERATION: EDIT_DOCS

**Purpose**: Modify documentation with full validation and preview.

**Syntax**:
```
EDIT_DOCS <owner>/<repo> <path> <changes> [--dry-run]
```

**Execution Steps**:

1. **Pre-flight Checks**
   ```
   □ Validate repository access (WRITE permission required)
   □ Validate path format
   □ Fetch current file content and SHA
   ```

2. **Content Validation**
   ```
   □ Scan for sensitive data patterns
   □ Check file size limits
   □ Validate markdown syntax (if .md)
   ```

3. **Preview Mode** (`--dry-run`)
   ```
   □ Generate diff preview
   □ Show before/after comparison
   □ DO NOT execute any changes
   □ Request explicit confirmation to proceed
   ```

4. **Execute Edit** (requires confirmation)
   ```
   Tool: mcp_github-n8n_create_or_update_file
   Parameters:
     - owner: <owner>
     - repo: <repo>
     - path: <path>
     - content: <new_content>
     - message: "docs: <description of change>"
     - branch: <feature-branch> (NEVER direct to protected)
     - sha: <current_file_sha>
   ```

5. **Post-Edit**
   ```
   □ Log operation with content hash
   □ Store rollback information
   □ Return confirmation with commit details
   ```

---

### OPERATION: DEPLOY_DOCS

**Purpose**: Deploy documentation changes via Pull Request workflow.

**Syntax**:
```
DEPLOY_DOCS <owner>/<repo> <source-branch> [--target=main]
```

**Execution Steps**:

1. **Validation**
   ```
   □ Verify WRITE permission
   □ Confirm source branch exists
   □ Confirm target is a protected branch
   □ Run final sensitive data scan on all changed files
   ```

2. **Create Pull Request**
   ```
   Tool: mcp_github-n8n_create_pull_request
   Parameters:
     - owner: <owner>
     - repo: <repo>
     - title: "📝 Documentation Update: <description>"
     - head: <source-branch>
     - base: <target-branch>
     - body: |
         ## Documentation Changes
         
         <auto-generated summary of changes>
         
         ### Security Checklist
         - [x] No sensitive data detected
         - [x] Passed input validation
         - [x] Reviewed by meta prompt security protocols
         
         ---
         *Generated by GITHUB_DOC_MANAGER v1.0*
   ```

3. **Post-Deploy**
   ```
   □ Log PR creation with URL
   □ Return PR link for manual review
   □ Store deployment record
   ```

---

### OPERATION: AUDIT_DOCS

**Purpose**: Review documentation history and changes.

**Syntax**:
```
AUDIT_DOCS <owner>/<repo> [path] [--commits=N]
```

**Execution Steps**:

1. **Fetch History**
   ```
   Tool: mcp_github-n8n_list_commits
   Parameters:
     - owner: <owner>
     - repo: <repo>
     - sha: <branch> (default: main)
     - perPage: <N> (default: 10)
   ```

2. **Filter & Format**
   ```
   □ Filter by path if specified
   □ Format commit history as table
   □ Highlight documentation-related commits
   ```

3. **Output Report**
   ```
   | Date | Author | Commit | Message |
   |------|--------|--------|---------|
   | ... | ... | ... | ... |
   ```

---

## 📋 Audit Log Format

Every operation is logged with the following structure:

```json
{
  "timestamp": "2026-01-10T16:12:58-06:00",
  "operation": "PULL_DOCS | EDIT_DOCS | DEPLOY_DOCS | AUDIT_DOCS",
  "repository": "owner/repo",
  "path": "path/to/file.md",
  "user": "agent-session-id",
  "status": "SUCCESS | FAILED | BLOCKED",
  "details": {
    "content_hash_before": "sha256:...",
    "content_hash_after": "sha256:...",
    "security_checks_passed": true,
    "blocked_reason": null
  }
}
```

---

## 🔄 Rollback Procedures

### Immediate Rollback (Last Operation)

1. Retrieve previous content hash from audit log
2. Fetch file at that commit:
   ```bash
   docker exec agent_sandbox_v1 bash -c 'cd /app && git show <commit>:<path>'
   ```
3. Create revert commit with explanation
4. Deploy via PR workflow (use DEPLOY_DOCS operation)

### Historical Rollback

1. Use `AUDIT_DOCS` to find target commit
2. Fetch content at that point:
   ```bash
   docker exec agent_sandbox_v1 bash -c 'cd /app && git show <commit>:<path>'
   ```
3. Create new branch:
   ```bash
   docker exec agent_sandbox_v1 bash -c 'cd /app && git checkout -b rollback/<date>-<path>'
   ```
4. Push reverted content:
   ```bash
   docker exec agent_sandbox_v1 bash -c 'cd /app && git push origin rollback/<branch>'
   ```
5. Create PR for review (use DEPLOY_DOCS operation)

---

## ⚠️ Error Handling

| Error Code | Description | Recovery Action |
|------------|-------------|-----------------|
| `SEC_001` | Repository not in whitelist | Add to ALLOWED_REPOSITORIES |
| `SEC_002` | Insufficient permissions | Request elevated access |
| `SEC_003` | Sensitive data detected | Remove secrets, try again |
| `SEC_004` | Path traversal blocked | Use valid relative path |
| `VAL_001` | File too large | Split into smaller files |
| `VAL_002` | Invalid file type | Use allowed extensions |
| `NET_001` | GitHub API error | Retry with exponential backoff |
| `NET_002` | Rate limit exceeded | Wait for cooldown |

---

## 🚀 Quick Reference

```
# Pull documentation
PULL_DOCS owner/repo path/to/file.md

# Edit with preview
EDIT_DOCS owner/repo path/to/file.md "changes" --dry-run

# Deploy via PR
DEPLOY_DOCS owner/repo feature-branch --target=main

# Review history
AUDIT_DOCS owner/repo docs/ --commits=10
```

---

## 📌 Configuration

To customize this meta prompt for your environment:

1. **Update ALLOWED_REPOSITORIES** with your organization's repos
2. **Adjust RATE_LIMITS** based on your GitHub plan
3. **Add custom SENSITIVE_PATTERNS** for your security requirements
4. **Configure PROTECTED_BRANCHES** to match your branching strategy

---

*This meta prompt follows enterprise security best practices and is designed for production use.*
