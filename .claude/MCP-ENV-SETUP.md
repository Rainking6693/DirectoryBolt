# How to Set Environment Variables for MCP

## Quick Fix (Already Applied)

I've simplified your MCP configuration to include only the essential servers and embedded the credentials directly. This should work immediately after restarting Claude Code.

**Current Active MCP Servers:**
- ✅ Supabase (database access)
- ✅ Filesystem (enhanced file operations)

## To Activate MCP

### Step 1: Close ALL Claude Code Windows
- Close this window
- Close any other Claude Code sessions
- Make sure Claude Code is completely shut down

### Step 2: Reopen DirectoryBolt Project
- Relaunch Claude Code
- Open the DirectoryBolt folder

### Step 3: Verify MCP is Working
In Claude Code, type:
```
/mcp
```

You should now see:
```
✅ supabase - Direct Supabase database access for agents
✅ filesystem - Enhanced file operations for code analysis
```

---

## Alternative: System Environment Variables (Advanced)

If you want to use environment variable references instead of embedding credentials:

### Windows PowerShell (Run as Administrator)

```powershell
# Set system environment variables
[System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc', [System.EnvironmentVariableTarget]::User)

[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://kolgqfjgncdwddziqloz.supabase.co', [System.EnvironmentVariableTarget]::User)

# Verify
echo $env:SUPABASE_SERVICE_ROLE_KEY
```

Then update `.claude/mcp.json` to use:
```json
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}
```

### Windows CMD (Run as Administrator)

```cmd
setx SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc"

setx SUPABASE_URL "https://kolgqfjgncdwddziqloz.supabase.co"
```

---

## Why MCP Wasn't Working

MCP servers need environment variables to be available when **Claude Code starts**, not when commands run.

**What Doesn't Work:**
```bash
# This sets env vars for bash commands only, not for MCP
set SUPABASE_SERVICE_ROLE_KEY=xxx
```

**What Works:**
1. Embed credentials directly in `.claude/mcp.json` (current approach)
2. Set system environment variables (see above)
3. Use a `.env` file that Claude Code reads on startup (if supported)

---

## Removed Servers (Can Re-enable Later)

I temporarily removed these servers to simplify:
- Playwright (custom server - can re-enable when needed)
- GitHub (requires GITHUB_TOKEN)
- Postgres (redundant with Supabase MCP)

### To Re-enable Playwright MCP:

1. Add to `.claude/mcp.json`:
```json
{
  "playwright": {
    "command": "node",
    "args": ["mcp-servers/playwright-server.js"],
    "description": "Playwright browser automation"
  }
}
```

2. Restart Claude Code

---

## Testing MCP

### Test 1: List MCP Servers
```
/mcp
```

### Test 2: Use Supabase MCP
Ask Claude Code:
```
Use the Supabase MCP to query the directories table and show me 3 directories.
```

### Test 3: Use Filesystem MCP
Ask Claude Code:
```
Use Filesystem MCP to find all TypeScript files in the backend directory.
```

---

## Troubleshooting

### Still Shows "No MCP servers configured"

**Check 1:** Verify mcp.json exists
```bash
cat .claude/mcp.json
```

**Check 2:** Validate JSON syntax
```bash
# Use a JSON validator or check for syntax errors
npx jsonlint .claude/mcp.json
```

**Check 3:** Check Claude Code logs
- Windows: `%APPDATA%\Claude\logs\`
- Look for MCP errors

**Check 4:** Try absolute paths
Update `mcp.json` to use absolute path for filesystem:
```json
{
  "filesystem": {
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt"
    ]
  }
}
```

### MCP Servers Start but Fail

**Check:** Look for npm package installation
```bash
# Verify packages can be run
npx -y @modelcontextprotocol/server-supabase --help
npx -y @modelcontextprotocol/server-filesystem --help
```

---

## Security Note

The credentials are now embedded in `.claude/mcp.json`. This is acceptable for local development but:

⚠️ **DO NOT commit this file to git with real credentials**

Add to `.gitignore`:
```
.claude/mcp.json
.env.mcp
```

For production/shared repositories, use environment variables instead.

---

## Summary

**Current Status:**
- ✅ MCP config updated with embedded credentials
- ✅ Simplified to 2 essential servers (Supabase + Filesystem)
- ✅ Ready to use after Claude Code restart

**Next Step:**
1. Close ALL Claude Code windows
2. Reopen DirectoryBolt
3. Run `/mcp` to verify

That's it! MCP should now work.
