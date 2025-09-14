# Start Netlify Dev in a new minimized window and redirect logs to a file
# Usage: .\scripts\start-netlify-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logPath = Join-Path $root '..\netlify-dev.log'
$cmd = "npx netlify dev --port 8888"

Write-Host "Starting Netlify Dev in a new minimized window. Logs: $logPath"
# Use cmd /c with redirection inside the argument string to ensure proper quoting
Start-Process -FilePath cmd.exe -ArgumentList ('/c', "$cmd  > `"$logPath`" 2>&1") -WindowStyle Minimized
Write-Host "Netlify Dev started (detached). Use scripts\stop-netlify-dev.ps1 to stop it." 
