@echo off
echo Installing DirectoryBolt Worker Dependencies...
cd worker
call npm install
echo.
echo Running Comprehensive Validation Test...
node comprehensive-validation-test.js
echo.
echo Validation test completed!
pause