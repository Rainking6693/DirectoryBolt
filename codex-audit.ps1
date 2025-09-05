param(
  [string]$Path = "."
)

$ErrorActionPreference = "Stop"

Write-Host "▶ Codex Audit — PowerShell wrapper" -ForegroundColor Cyan
Write-Host "Repository: $Path" -ForegroundColor Yellow

# Ensure Node is available
try {
  $nodeVersion = (node -v) 2>$null
  if (-not $nodeVersion) { throw "Node.js not found in PATH." }
  Write-Host "Node: $nodeVersion"
} catch {
  Write-Error "Node.js is required. Install from https://nodejs.org and re-run."
  exit 1
}

# Run the Node-based audit script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "codex-audit.mjs"

if (-not (Test-Path $nodeScript)) {
  Write-Error "codex-audit.mjs not found next to this script."
  exit 1
}

# Normalize path (handle relative)
$fullPath = Resolve-Path $Path
Write-Host "Scanning $fullPath ..." -ForegroundColor Cyan

# Execute
node $nodeScript "$fullPath"
$LASTEXITCODE = $global:LASTEXITCODE
if ($LASTEXITCODE -ne 0) {
  Write-Host "Audit finished with findings. See report above." -ForegroundColor Red
  exit $LASTEXITCODE
} else {
  Write-Host "Audit passed with no critical issues." -ForegroundColor Green
}
