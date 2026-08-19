# ⚠️ AGENT SECURITY CONSTITUTION (MANDATORY)

## 1. INFRASTRUCTURE
- **CONTAINER:** `agent_sandbox_v1`
- **HOST:** Windows (RESTRICTED)
- **WORKSPACE:** `/app` (Mapped to Windows `HTML_Apps_Workspace`)

## 2. EXECUTION PROTOCOL (CRITICAL)
You are prohibited from running shell commands directly on the Host OS.
**ALL** terminal commands must be targeted to the container.

### ✅ CORRECT SYNTAX (Use this):
- `docker exec agent_sandbox_v1 bash -c 'ls -la'`
- `docker exec agent_sandbox_v1 bash -c 'npm install'`
- `docker exec agent_sandbox_v1 bash -c 'mkdir -p .agent/workflows'`

### ❌ PROHIBITED SYNTAX (Never use):
- `mkdir .agent\workflows` (Windows Syntax)
- `npm install` (Host Execution)
- `2>$null` (PowerShell Redirection)

## 3. FILE OPERATIONS
- You may edit text files directly using your internal editor tools.
- **BUT** any action that requires a *runtime* (Node, Python, Git) must go through the `docker exec` protocol.

## 4. GITHUB OPERATIONS (CRITICAL)

> [!CAUTION]
> GitHub operations MUST stay within the Docker security boundary. External MCP services are prohibited.

### ✅ ALLOWED (Inside Docker Boundary):

**Option A: Git CLI in Container**
```bash
docker exec agent_sandbox_v1 bash -c 'cd /app/... && git push origin main'
docker exec agent_sandbox_v1 bash -c 'cd /app/... && git pull --rebase'
```

**Option B: Docker MCP Toolkit - GitHub Official**
The "GitHub Official" MCP server running inside Docker Desktop's MCP Toolkit is permitted.
Credentials are managed within Docker's security boundary.

### ❌ PROHIBITED (External MCP Services):
```
mcp_github-n8n_create_pull_request(...)   # NEVER USE - External to Docker
mcp_github-n8n_push_files(...)            # NEVER USE - External to Docker
mcp_github-n8n_create_issue(...)          # NEVER USE - External to Docker
```

### Security Boundary Summary:

| Service | Location | Status |
|---------|----------|--------|
| `git` CLI via `docker exec` | Inside container | ✅ Allowed |
| Docker MCP Toolkit (GitHub Official) | Inside Docker | ✅ Allowed |
| External `n8n` MCP | Outside Docker | ❌ Prohibited |

### Rationale:
- Git credentials are stored **inside** the Docker container (`~/.git-credentials`)
- Docker MCP Toolkit runs **inside** Docker Desktop's security boundary
- External `n8n` MCP has its own credential store **outside** Docker = credential sprawl
- All GitHub operations must remain within the controlled, isolated Docker environment