# MCP (Model Context Protocol) Setup Guide for DirectoryBolt

## What is MCP?

**MCP (Model Context Protocol)** is a protocol that allows AI agents to access external tools and data sources beyond Claude Code's built-in capabilities. Think of it as "plugins" for AI agents.

### Why Use MCP?

For DirectoryBolt, MCP enables:
- **Direct Database Access**: Agents can query Supabase directly without going through REST APIs
- **Browser Automation**: Playwright integration for selector discovery
- **Enhanced File Operations**: Better codebase analysis
- **GitHub Integration**: PR management, issue tracking
- **Real-time Data**: Live database queries during agent execution

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Claude Code + Agents (Cora, Hudson, etc.)           │
├─────────────────────────────────────────────────────┤
│ MCP Client (built into Claude Code)                 │
└─────────────────┬───────────────────────────────────┘
                  │ Model Context Protocol
        ┌─────────┴─────────┬─────────────┬───────────┐
        │                   │             │           │
   ┌────▼────┐         ┌────▼────┐   ┌───▼───┐   ┌───▼────┐
   │Supabase │         │Playwright│   │GitHub │   │Postgres│
   │  MCP    │         │   MCP    │   │  MCP  │   │  MCP   │
   │ Server  │         │  Server  │   │Server │   │ Server │
   └────┬────┘         └────┬─────┘   └───┬───┘   └───┬────┘
        │                   │              │           │
   ┌────▼────┐         ┌────▼─────┐   ┌───▼───┐   ┌───▼────┐
   │Supabase │         │Chromium  │   │GitHub │   │Database│
   │   API   │         │ Browser  │   │  API  │   │        │
   └─────────┘         └──────────┘   └───────┘   └────────┘
```

## Installation Steps

### Step 1: Create MCP Configuration

The MCP configuration file is at `.claude/mcp.json` (already created).

### Step 2: Set Environment Variables

Add these to your `.env` file or system environment:

```bash
# Required for Supabase MCP
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional for GitHub MCP
GITHUB_TOKEN=ghp_your_github_token_here
```

### Step 3: Install MCP Servers

MCP servers are installed automatically when Claude Code starts, but you can pre-install them:

```bash
# Install Supabase MCP server
npm install -g @modelcontextprotocol/server-supabase

# Install Filesystem MCP server
npm install -g @modelcontextprotocol/server-filesystem

# Install GitHub MCP server (optional)
npm install -g @modelcontextprotocol/server-github

# Install Postgres MCP server
npm install -g @modelcontextprotocol/server-postgres
```

### Step 4: Create Custom Playwright MCP Server

For selector discovery, we need a custom Playwright MCP server:

```bash
mkdir -p mcp-servers
```

Then create the server file (provided below).

### Step 5: Test MCP Connection

```bash
# Check MCP servers are configured
cat .claude/mcp.json

# Verify environment variables
echo $SUPABASE_SERVICE_ROLE_KEY

# Test Supabase connection (optional)
npx @modelcontextprotocol/server-supabase --help
```

### Step 6: Restart Claude Code

After configuring MCP, restart Claude Code to load the servers:

1. Close all Claude Code sessions
2. Reopen the project
3. Run `/mcp` command to verify servers are loaded

## MCP Servers for DirectoryBolt

### 1. Supabase MCP Server

**Purpose**: Direct database access for agents

**Capabilities**:
- Query `directories`, `jobs`, `submissions` tables
- Update selector discovery results
- Check job statuses
- Analyze submission success rates

**Example Agent Usage**:
```typescript
// Agent can now query database directly
const failedDirectories = await mcp.supabase.query(`
  SELECT d.id, d.name, COUNT(s.id) as failure_count
  FROM directories d
  LEFT JOIN submissions s ON s.directory_id = d.id
  WHERE s.status = 'failed'
  GROUP BY d.id, d.name
  HAVING COUNT(s.id) > 5
  ORDER BY failure_count DESC
  LIMIT 10
`);
```

**Configuration**:
```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-supabase"],
    "env": {
      "SUPABASE_URL": "https://kolgqfjgncdwddziqloz.supabase.co",
      "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
    }
  }
}
```

---

### 2. Playwright MCP Server (Custom)

**Purpose**: Browser automation for selector discovery

**Capabilities**:
- Navigate to directory URLs
- Discover form fields
- Validate selectors
- Take screenshots for debugging

**Example Agent Usage**:
```typescript
// Agent can control browser
const fields = await mcp.playwright.discoverFields(
  'https://www.yelp.com/signup'
);
```

**Configuration**:
```json
{
  "playwright": {
    "command": "node",
    "args": ["mcp-servers/playwright-server.js"]
  }
}
```

---

### 3. Filesystem MCP Server

**Purpose**: Enhanced file operations

**Capabilities**:
- Search across codebase
- Read multiple files efficiently
- Track file changes
- Navigate directory structures

**Example Agent Usage**:
```typescript
// Agent can search codebase efficiently
const workerFiles = await mcp.filesystem.search({
  pattern: "submitToDirectory",
  fileTypes: ["ts", "js"]
});
```

**Configuration**:
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt"
    ]
  }
}
```

---

### 4. GitHub MCP Server (Optional)

**Purpose**: GitHub operations

**Capabilities**:
- Create pull requests
- Manage issues
- Review code
- Track changes

**Example Agent Usage**:
```typescript
// Agent can create PRs automatically
await mcp.github.createPullRequest({
  title: "Add selector discovery system",
  body: "Implements automated selector discovery...",
  base: "main",
  head: "feature/selector-discovery"
});
```

**Configuration**:
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

---

### 5. Postgres MCP Server

**Purpose**: Direct PostgreSQL access

**Capabilities**:
- Run raw SQL queries
- Create indexes
- Analyze query performance
- Manage schema migrations

**Example Agent Usage**:
```typescript
// Agent can run SQL directly
await mcp.postgres.execute(`
  CREATE INDEX IF NOT EXISTS idx_jobs_status_created
  ON jobs(status, created_at DESC)
`);
```

**Configuration**:
```json
{
  "postgres": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres",
      "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.kolgqfjgncdwddziqloz.supabase.co:5432/postgres"
    ]
  }
}
```

---

## Agent-Specific MCP Usage

### Cora (Agent Orchestrator)
**Uses**: Supabase, Filesystem
- Queries database for context
- Searches codebase for patterns
- Coordinates other agents

### Hudson (Code Reviewer)
**Uses**: Filesystem, GitHub
- Analyzes code quality
- Creates review comments
- Suggests improvements

### Shane (Backend Developer)
**Uses**: Supabase, Postgres, Filesystem
- Implements database features
- Writes migrations
- Tests queries

### Worker Scaler
**Uses**: Playwright, Supabase
- Tests browser automation
- Monitors job queues
- Scales workers

### Supabase Guardian
**Uses**: Supabase, Postgres
- Validates schema
- Ensures data integrity
- Monitors database health

---

## How Agents Access MCP

When you launch an agent with the Task tool, the agent automatically has access to configured MCP servers:

```typescript
// You call agent
await Task({
  subagent_type: "Shane",
  prompt: "Add migration for selector discovery fields"
});

// Shane agent can now use MCP
// Behind the scenes, Shane does:
await mcp.postgres.execute(`
  ALTER TABLE directories
  ADD COLUMN field_selectors JSONB DEFAULT '{}'
`);
```

**No additional configuration needed** - agents automatically detect and use available MCP servers.

---

## Testing MCP Setup

### Test 1: Verify MCP Configuration

```bash
# Run in Claude Code
/mcp
```

Expected output:
```
✅ supabase - Direct Supabase database access
✅ playwright - Browser automation
✅ filesystem - Enhanced file operations
✅ github - GitHub API access
✅ postgres - Direct PostgreSQL access
```

### Test 2: Test Supabase Connection

Ask Claude Code:
> "Use the Supabase MCP to query the directories table and show me the first 3 directories"

Expected: Agent queries database and returns results

### Test 3: Test Filesystem MCP

Ask Claude Code:
> "Use filesystem MCP to find all files containing 'AutoSelectorDiscovery'"

Expected: Agent searches codebase efficiently

---

## Troubleshooting

### Issue: "No MCP servers configured"

**Solution**:
```bash
# Verify .claude/mcp.json exists
cat .claude/mcp.json

# Restart Claude Code
# Close all sessions and reopen
```

---

### Issue: "Supabase MCP connection failed"

**Solution**:
```bash
# Verify environment variable
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection manually
npx @modelcontextprotocol/server-supabase
```

---

### Issue: "Playwright MCP not starting"

**Solution**:
```bash
# Check playwright server exists
ls mcp-servers/playwright-server.js

# Test manually
node mcp-servers/playwright-server.js
```

---

### Issue: "Permission denied for MCP server"

**Solution**:
```bash
# For Windows, ensure paths use forward slashes or escaped backslashes
# Update .claude/mcp.json with proper path format
```

---

## Security Best Practices

### 1. Environment Variables

**Never commit credentials to `.claude/mcp.json`**:

```json
// ❌ WRONG
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// ✅ CORRECT
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}
```

### 2. MCP Server Access Control

Limit what MCP servers can do:

```json
{
  "supabase": {
    "permissions": {
      "read": ["directories", "jobs"],
      "write": ["field_selectors"]
    }
  }
}
```

### 3. Audit MCP Operations

Enable logging for MCP operations:

```bash
# Set in environment
export MCP_LOG_LEVEL=debug
export MCP_LOG_FILE=/var/log/mcp-operations.log
```

---

## Advanced: Custom MCP Servers

You can create custom MCP servers for DirectoryBolt-specific operations.

### Example: Selector Discovery MCP Server

This server exposes selector discovery as an MCP tool that agents can call.

**Benefits**:
- Agents can trigger selector discovery directly
- Better integration with other tools
- Unified API for all operations

**Implementation**: See `mcp-servers/playwright-server.js` (provided below)

---

## Next Steps

1. ✅ Create `.claude/mcp.json` configuration
2. ⏳ Set environment variables
3. ⏳ Create custom Playwright MCP server
4. ⏳ Test MCP connections with `/mcp` command
5. ⏳ Use MCP in agent workflows

---

## Resources

- **MCP Documentation**: https://modelcontextprotocol.io
- **Claude Code MCP Guide**: https://docs.claude.com/en/docs/claude-code/mcp
- **Available MCP Servers**: https://github.com/modelcontextprotocol/servers
- **Custom MCP Development**: https://modelcontextprotocol.io/docs/building-servers

---

## DirectoryBolt-Specific MCP Workflows

### Workflow 1: Automated Selector Discovery

```typescript
// Agent workflow using MCP
1. Agent queries Supabase MCP for failed directories
2. Agent uses Playwright MCP to discover selectors
3. Agent validates selectors with Playwright MCP
4. Agent saves results to database via Supabase MCP
5. Agent creates PR via GitHub MCP
```

### Workflow 2: Performance Analysis

```typescript
// Agent workflow for optimization
1. Agent queries Postgres MCP for slow queries
2. Agent analyzes table indexes
3. Agent creates migration with new indexes
4. Agent tests performance impact
5. Agent reports improvements
```

### Workflow 3: Quality Assurance

```typescript
// Hudson agent reviewing code
1. Agent uses Filesystem MCP to read all TS files
2. Agent checks for type safety issues
3. Agent uses Supabase MCP to verify schema alignment
4. Agent uses GitHub MCP to create review comments
5. Agent suggests improvements
```

---

**MCP transforms agents from code assistants into full development partners with direct access to your infrastructure.**
