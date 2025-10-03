#!/usr/bin/env pwsh
#Requires -Version 5.1

<#
.SYNOPSIS
  Light-weight repository sanitizer (Windows-safe) for Next.js dev.

.DESCRIPTION
  Removes ghost/illegal filenames that can crash Watchpack/Next on Windows and
  strips BOM from key config files. Does NOT delete node_modules or build artifacts.

.PARAMETER Force
  Skip confirmation prompts.
#>

[CmdletBinding()]
param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Log {
  param(
    [string]$Message,
    [ValidateSet('INFO','WARN','ERROR','SUCCESS')]
    [string]$Level = 'INFO'
  )
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $color = switch ($Level) {
    'INFO' { 'White' }
    'WARN' { 'Yellow' }
    'ERROR' { 'Red' }
    'SUCCESS' { 'Green' }
  }
  Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Remove-GhostFiles {
  Write-Log 'Scanning for ghost/illegal Windows filenames at repo root...' 'INFO'
  $root = Get-Location
  $removed = @()

  $reserved = @('CON','PRN','AUX','NUL','COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9','LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9')
  foreach ($name in $reserved) {
    $p = Join-Path $root $name
    if (Test-Path -LiteralPath $p) {
      try { Remove-Item -LiteralPath $p -Force; $removed += $p; Write-Log ("Removed reserved name: {0}" -f $p) 'SUCCESS' } catch { Write-Log ("Failed to remove {0}: {1}" -f $p, $_.Exception.Message) 'WARN' }
    }
  }

  Get-ChildItem -LiteralPath $root -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '--*' } | ForEach-Object {
    try { Remove-Item -LiteralPath $_.FullName -Force; $removed += $_.FullName; Write-Log ("Removed double-dash file: {0}" -f $_.FullName) 'SUCCESS' } catch { Write-Log ("Failed to remove {0}: {1}" -f $_.FullName, $_.Exception.Message) 'WARN' }
  }

  # Remove accidental file named 'npm' or similar root junk
  foreach ($junk in @('npm')) {
    $p = Join-Path $root $junk
    if (Test-Path -LiteralPath $p -PathType Leaf) { try { Remove-Item -LiteralPath $p -Force; $removed += $p; Write-Log ("Removed junk file: {0}" -f $p) 'SUCCESS' } catch { Write-Log ("Failed to remove {0}: {1}" -f $p, $_.Exception.Message) 'WARN' } }
  }

  return $removed
}

function Remove-BOM {
  param([string[]]$Files)
  foreach ($file in $Files) {
    if (Test-Path -LiteralPath $file) {
      try {
        $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
          $outBytes = $bytes[3..($bytes.Length-1)]
          [System.IO.File]::WriteAllBytes((Resolve-Path $file), $outBytes)
          Write-Log "Removed BOM from: $file" 'SUCCESS'
        }
      } catch { Write-Log ("BOM check failed for {0}: {1}" -f $file, $_.Exception.Message) 'WARN' }
    }
  }
}

if (-not $Force) {
  Write-Log 'This will remove ghost/illegal files at repo root. Proceed? (y/N)' 'INFO'
  $resp = Read-Host
  if ($resp -notmatch '^[Yy]') { Write-Log 'Cancelled by user' 'WARN'; exit 0 }
}

if (-not (Test-Path -LiteralPath 'package.json')) { Write-Log 'package.json not found. Run from repo root.' 'ERROR'; exit 1 }

$removed = Remove-GhostFiles
Remove-BOM -Files @('next.config.js','package.json')

Write-Log ("Sanitize (light) complete. Removed {0} ghost files." -f ($removed.Count)) 'SUCCESS'
