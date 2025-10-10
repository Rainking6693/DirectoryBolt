@echo off
echo ========================================
echo ALEX - CRITICAL FIXES FOR DIRECTORYBOLT
echo ========================================
echo.
echo URGENT: 2 critical issues blocking Cora and Hudson audit
echo.
echo Running automated fix script...
echo.
cd worker
echo Installing dependencies...
call npm install
echo.
echo Running diagnostic script...
node alex-quick-fix.js
echo.
echo ========================================
echo NEXT STEPS FOR ALEX:
echo ========================================
echo 1. Update Supabase key in worker/.env if needed
echo 2. Run: node comprehensive-validation-test.js
echo 3. Ensure all 15 tests pass
echo 4. Notify Emily when complete
echo.
echo Supabase Dashboard: https://supabase.com/dashboard
echo.
pause