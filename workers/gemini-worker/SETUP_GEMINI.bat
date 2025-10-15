@echo off
echo.
echo ========================================
echo   GEMINI WORKER SETUP
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Install dependencies...
call npm install
echo.

echo Step 2: Set up API key...
node set-api-key.js
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Run: npm test
echo   2. Run: npm start
echo.
pause

