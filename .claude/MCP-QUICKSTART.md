# MCP Quick Start for DirectoryBolt

Get MCP up and running in 5 minutes.

## What You'll Get

After setup, your agents will be able to:
- ✅ Query Supabase directly
- ✅ Control Playwright browsers
- ✅ Search codebase efficiently
- ✅ Manage GitHub operations
- ✅ Run SQL directly on PostgreSQL

## Step 1: Verify Configuration (30 seconds)

```bash
# Check MCP config exists
cat .claude/mcp.json

# Should show 5 configured servers:
# - supabase
# - playwright
# - filesystem
# - github
# - postgres
```

✅ **Done!** Config file is already created.

## Step 2: Set Environment Variables (1 minute)

Add these to your environment (or `.env` file):

```bash
# Required
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional (for GitHub MCP)
export GITHUB_TOKEN="ghp_..."
```

**Windows PowerShell:**
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Windows CMD:**
```cmd
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Install MCP Servers (2 minutes)

```bash
# Global install (recommended)
npm install -g @modelcontextprotocol/server-supabase
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-postgres

# Or let Claude Code install them automatically (nothing to do)
```

✅ **Custom Playwright server** is already installed in `mcp-servers/`

## Step 4: Restart Claude Code (30 seconds)

1. Close all Claude Code windows
2. Reopen DirectoryBolt project
3. MCP servers will auto-start

## Step 5: Verify MCP is Working (1 minute)

In Claude Code, run:
```
/mcp
```

**Expected Output:**
```
MCP Servers:
✅ supabase - Direct Supabase database access
✅ playwright - Browser automation for selector discovery
✅ filesystem - Enhanced file operations
✅ github - GitHub API access
✅ postgres - Direct PostgreSQL access
```

If you see errors, check [Troubleshooting](#troubleshooting) below.

## Step 6: Test with an Agent

Try this prompt:
```
Use Supabase MCP to query the directories table and show me the first 3 directories with submission URLs.
```

**Expected Result:** Agent queries database directly and returns results.

---

## Quick Usage Examples

### Example 1: Query Database
```
Use Supabase MCP to find all directories with more than 5 failed submissions.
```

### Example 2: Discover Selectors
```
Use Playwright MCP to:
1. Launch browser
2. Navigate to https://www.example.com/signup
3. Discover all form fields
4. Close browser
```

### Example 3: Search Codebase
```
Use Filesystem MCP to find all files that import 'AutoSelectorDiscovery'.
```

### Example 4: Run SQL
```
Use Postgres MCP to create an index on jobs(status, created_at) if it doesn't exist.
```

---

## Troubleshooting

### Issue: "No MCP servers configured"

**Check 1:** Verify config file exists
```bash
cat .claude/mcp.json
```

**Check 2:** Restart Claude Code completely

**Check 3:** Check Claude Code logs
```bash
# Windows
%APPDATA%\Claude\logs\

# Mac
~/Library/Logs/Claude/

# Linux
~/.config/Claude/logs/
```

---

### Issue: "Supabase MCP connection failed"

**Check 1:** Verify environment variable
```bash
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Check 2:** Test Supabase connection
```bash
npx @modelcontextprotocol/server-supabase
```

**Check 3:** Verify correct URL in `.claude/mcp.json`
```json
{
  "env": {
    "SUPABASE_URL": "https://kolgqfjgncdwddziqloz.supabase.co"
  }
}
```

---

### Issue: "Playwright MCP not starting"

**Check 1:** Verify server file exists
```bash
ls mcp-servers/playwright-server.js
```

**Check 2:** Test manually
```bash
cd mcp-servers
node playwright-server.js
```

**Check 3:** Check dependencies
```bash
cd mcp-servers
npm install
```

---

### Issue: "GitHub MCP authentication failed"

**Solution:** GitHub MCP is optional. If not using, remove from `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": { ... },
    "playwright": { ... },
    "filesystem": { ... }
    // Remove "github" and "postgres" if not needed
  }
}
```

---

## What Each MCP Server Does

### Supabase MCP
**What:** Direct database access
**When to use:** Querying jobs, directories, submissions
**Example:** "Find all failed directories"

### Playwright MCP
**What:** Browser automation
**When to use:** Selector discovery, testing forms
**Example:** "Discover fields on Yelp signup page"

### Filesystem MCP
**What:** Enhanced file operations
**When to use:** Code search, file analysis
**Example:** "Find all TypeScript files with 'supabase'"

### GitHub MCP
**What:** GitHub operations
**When to use:** Creating PRs, managing issues
**Example:** "Create PR for selector discovery"

### Postgres MCP
**What:** Direct SQL access
**When to use:** Schema migrations, indexes, raw queries
**Example:** "Create index on jobs table"

---

## Agent Usage

Agents automatically use MCP when available. You don't need to do anything special.

**Example Agent Workflow:**

You: "Use Shane to add a migration for selector discovery fields"

Behind the scenes:
1. Shane agent detects Postgres MCP is available
2. Shane uses `mcp.postgres.execute()` to create migration
3. Shane uses `mcp.supabase.query()` to verify migration worked
4. Shane reports back with results

---

## Security Notes

### ⚠️ Important

1. **Never commit `.env` files** with credentials
2. **Use environment variables** for all secrets
3. **Limit MCP access** to only what's needed
4. **Review MCP operations** in logs

### Best Practices

```bash
# ✅ GOOD: Use environment variables
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}

# ❌ BAD: Hardcode credentials
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "actual-key-here"
  }
}
```

---

## Next Steps

1. ✅ MCP is configured
2. ⏳ Test with simple query
3. ⏳ Use agents with MCP access
4. ⏳ Build custom workflows
5. ⏳ Create your own MCP servers

---

## Advanced: Custom MCP Servers

You can create custom MCP servers for DirectoryBolt-specific operations.

**Example:** Job Orchestrator MCP Server

```javascript
// mcp-servers/orchestrator-server.js
class OrchestratorMCPServer {
  async getNextJob() {
    // Custom logic to fetch next job
  }

  async updateJobStatus(jobId, status) {
    // Custom logic to update job
  }
}
```

Then add to `.claude/mcp.json`:
```json
{
  "orchestrator": {
    "command": "node",
    "args": ["mcp-servers/orchestrator-server.js"]
  }
}
```

---

## Support

- **MCP Issues:** Check [MCP Documentation](https://modelcontextprotocol.io)
- **DirectoryBolt Issues:** See `.claude/MCP-SETUP.md` for detailed guide
- **Agent Questions:** Agents automatically use MCP, no config needed

---

**You're all set!** MCP is configured and ready to supercharge your agents.

Run `/mcp` in Claude Code to verify everything is working.
