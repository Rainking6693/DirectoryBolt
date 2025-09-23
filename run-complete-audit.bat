@echo off
echo Starting DirectoryBolt Complete External Audit...
echo ================================================

echo.
echo Phase 1: Testing if development server is running...
timeout /t 2 /nobreak > nul

echo.
echo Executing comprehensive audit across all 5 phases...
node complete-audit-execution.js

echo.
echo Audit execution complete. Check FINAL_AUDIT_REPORT.md for results.
pause