# PowerShell script to set Gemini API key safely

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$envPath = Join-Path $PSScriptRoot ".env"

Write-Host "🔧 Setting Gemini API key in .env file..." -ForegroundColor Cyan
Write-Host "📁 File path: $envPath" -ForegroundColor Gray

# Check if file exists
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Run: node copy-env.js first" -ForegroundColor Yellow
    exit 1
}

# Read the file
$content = Get-Content $envPath -Raw

# Replace the API key line
$newContent = $content -replace 'GEMINI_API_KEY=.*', "GEMINI_API_KEY=$ApiKey"

# Write back to file
try {
    # Make sure file is not read-only
    $file = Get-Item $envPath -Force
    $file.IsReadOnly = $false
    
    # Write the new content
    Set-Content -Path $envPath -Value $newContent -NoNewline -Force
    
    Write-Host "✅ Gemini API key set successfully!" -ForegroundColor Green
    
    # Verify the change
    Write-Host "`n🔍 Verifying..." -ForegroundColor Cyan
    $verify = Get-Content $envPath | Select-String "GEMINI_API_KEY"
    Write-Host "Current value: $verify" -ForegroundColor Gray
    
    Write-Host "`n✅ All done! You can now run: npm test" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error writing to file: $_" -ForegroundColor Red
    exit 1
}

