# Codex Audit Kit

Drop this folder's contents into the **root of your repo**, commit, and run:

```powershell
# From your repo root on Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\codex-audit.ps1 -Path .
```

What it checks:
- Lockfile and package manager consistency
- Node version parity across `package.json` (`engines.node`), `.nvmrc`, and `netlify.toml`
- Netlify CLI availability for local parity
- Common Next.js issue: importing `{ Html }` from `next/document` outside of `pages/_document`
- Env vars referenced in code but missing in `.env*` files
- Basic dependency and scripts sanity
- Best-effort dry-run install to catch dependency tree breakage

Optional CI:
- `.github/workflows/codex-audit.yml` runs the same audit on PRs and pushes (Windows + Ubuntu).

Exit codes:
- `0` = no critical issues detected
- `2` = critical findings (fix and re-run)
