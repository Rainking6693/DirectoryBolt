# DirectoryBolt Local Development Fix
# Updates .env.local to use production Supabase for development

Write-Host "🔧 Fixing DirectoryBolt Local Development Setup" -ForegroundColor Green
Write-Host "=============================================="

# Backup current .env.local
Copy-Item .env.local .env.local.backup
Write-Host "✅ Backed up .env.local to .env.local.backup" -ForegroundColor Green

# Read current content
$content = Get-Content .env.local

# Replace local Supabase with placeholder (you'll need to fill in your actual values)
$updatedContent = $content | ForEach-Object {
    if ($_ -match "^SUPABASE_URL=http://localhost:54321") {
        "SUPABASE_URL=https://your-project.supabase.co"
    }
    elseif ($_ -match "^NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321") {
        "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    }
    elseif ($_ -match "^SUPABASE_SERVICE_ROLE_KEY=service-role-test-key") {
        "SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key"
    }
    elseif ($_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-test-key") {
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key"
    }
    else {
        $_
    }
}

# Write updated content
$updatedContent | Set-Content .env.local

Write-Host "🔄 Updated .env.local with production Supabase placeholders" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to update these values in .env.local:" -ForegroundColor Red
Write-Host "   - SUPABASE_URL (your actual Supabase project URL)"
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL (same as above)"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)"
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)"
Write-Host ""
Write-Host "🔍 After updating, restart your dev server:" -ForegroundColor Green
Write-Host "   npm run dev"
Write-Host ""
Write-Host "🌐 Your staff dashboard should then work at:" -ForegroundColor Green
Write-Host "   http://localhost:3000/staff-dashboard"