# Stop Netlify Dev and any child Node processes started by it
Write-Host "Stopping Netlify Dev and Node processes (if any)..."
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*node*' } | ForEach-Object { Write-Host "Stopping PID: $($_.Id)"; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match 'netlify' } | ForEach-Object { Write-Host "Stopping PID: $($_.Id)"; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Write-Host "Stopped Netlify Dev processes. Check netlify-dev.log for logs." 
