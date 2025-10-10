@echo off
echo DirectoryBolt Worker Connection Test
echo ====================================
echo.
cd worker
echo Running quick connection test...
node quick-connection-test.js
echo.
echo Test completed!
pause