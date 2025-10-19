# Run Submission Monitor
# ----------------------
# Executes the monitor workflow using the embedded Python environment,
# writes logs per run, and is Task Scheduler friendly.

param(
    [string]$TargetsCsv = "$(Join-Path $PSScriptRoot 'schemas/example_targets.csv')",
    [string]$OutDir = "$(Join-Path $PSScriptRoot 'out')",
    [ValidateSet('CRITICAL','ERROR','WARNING','INFO','DEBUG')]
    [string]$LogLevel = 'INFO'
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$pythonExe = Join-Path $repoRoot '.python-embed/python.exe'
$scriptPath = Join-Path $PSScriptRoot 'submission_mapper_monitor.py'

if (-not (Test-Path $pythonExe)) {
    Write-Error "Python runtime not found at $pythonExe. Install prerequisites before scheduling."
    exit 1
}

if (-not (Test-Path $TargetsCsv)) {
    Write-Error "Targets CSV not found at $TargetsCsv."
    exit 1
}

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$logFile = Join-Path $logDir "monitor_$timestamp.log"

$arguments = @(
    "`"$scriptPath`"",
    'monitor',
    '--targets', "`"$TargetsCsv`"",
    '--out-dir', "`"$OutDir`"",
    '--log-level', $LogLevel
)

Push-Location $repoRoot
try {
    & $pythonExe @arguments *>&1 | Tee-Object -FilePath $logFile
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $exitCode
