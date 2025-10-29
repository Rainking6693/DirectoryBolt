# Check Supabase Database Schema
$apiKey = "sbp_e1f969166264902b43ef361aac1b9e6deec8a1ad"
$baseUrl = "https://pzqxtvscjrcwvyunqrps.supabase.co/rest/v1"

$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "=== Checking Supabase Database Schema ===" -ForegroundColor Cyan
Write-Host ""

# Check customers table structure
Write-Host "1. Checking CUSTOMERS table..." -ForegroundColor Yellow
try {
    $customersUrl = "$baseUrl/customers?select=*" + "&" + "limit=1"
    $customers = Invoke-RestMethod -Uri $customersUrl -Headers $headers -Method Get
    if ($customers.Count -gt 0) {
        Write-Host "   ✓ Customers table exists" -ForegroundColor Green
        Write-Host "   Columns found:" -ForegroundColor White
        $customers[0].PSObject.Properties.Name | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ✓ Customers table exists (empty)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check jobs table structure
Write-Host "2. Checking JOBS table..." -ForegroundColor Yellow
try {
    $jobsUrl = "$baseUrl/jobs?select=*" + "&" + "limit=1"
    $jobs = Invoke-RestMethod -Uri $jobsUrl -Headers $headers -Method Get
    if ($jobs.Count -gt 0) {
        Write-Host "   ✓ Jobs table exists" -ForegroundColor Green
        Write-Host "   Columns found:" -ForegroundColor White
        $jobs[0].PSObject.Properties.Name | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ✓ Jobs table exists (empty)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check directory_submissions table
Write-Host "3. Checking DIRECTORY_SUBMISSIONS table..." -ForegroundColor Yellow
try {
    $submissionsUrl = "$baseUrl/directory_submissions?select=*" + "&" + "limit=1"
    $submissions = Invoke-RestMethod -Uri $submissionsUrl -Headers $headers -Method Get
    if ($submissions.Count -gt 0) {
        Write-Host "   ✓ Directory_submissions table exists" -ForegroundColor Green
        Write-Host "   Columns found:" -ForegroundColor White
        $submissions[0].PSObject.Properties.Name | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ✓ Directory_submissions table exists (empty)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check directories table
Write-Host "4. Checking DIRECTORIES table..." -ForegroundColor Yellow
try {
    $directoriesUrl = "$baseUrl/directories?select=id,name,active" + "&" + "limit=5"
    $directories = Invoke-RestMethod -Uri $directoriesUrl -Headers $headers -Method Get
    Write-Host "   ✓ Directories table exists" -ForegroundColor Green
    Write-Host "   Found $($directories.Count) directories (showing first 5)" -ForegroundColor White
    $directories | ForEach-Object { 
        $status = if ($_.active) { "ACTIVE" } else { "INACTIVE" }
        Write-Host "     - $($_.name) [$status]" -ForegroundColor Gray 
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check autobolt_submission_logs table
Write-Host "5. Checking AUTOBOLT_SUBMISSION_LOGS table..." -ForegroundColor Yellow
try {
    $logsUrl = "$baseUrl/autobolt_submission_logs?select=*" + "&" + "limit=1"
    $logs = Invoke-RestMethod -Uri $logsUrl -Headers $headers -Method Get
    if ($logs.Count -gt 0) {
        Write-Host "   ✓ Autobolt_submission_logs table exists" -ForegroundColor Green
        Write-Host "   Columns found:" -ForegroundColor White
        $logs[0].PSObject.Properties.Name | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ✓ Autobolt_submission_logs table exists (empty)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Count active directories
Write-Host "6. Counting ACTIVE directories..." -ForegroundColor Yellow
try {
    $activeUrl = "$baseUrl/directories?select=id" + "&" + "active=eq.true"
    $activeCount = Invoke-RestMethod -Uri $activeUrl -Headers $headers -Method Get
    Write-Host "   ✓ Found $($activeCount.Count) active directories" -ForegroundColor Green
    if ($activeCount.Count -eq 0) {
        Write-Host "   ⚠ WARNING: No active directories! Poller will fail." -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Schema Check Complete ===" -ForegroundColor Cyan
