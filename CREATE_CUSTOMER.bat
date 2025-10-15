@echo off
echo.
echo ========================================
echo  Creating Test Customer and Job
echo ========================================
echo.

node test-customer-job-creation.js

echo.
echo ========================================
echo  Customer Created!
echo ========================================
echo.
echo The Gemini worker will pick this up automatically
echo Check logs: pm2 logs gemini-worker
echo.

pause

