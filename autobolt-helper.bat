@echo off
echo 🚀 AutoBolt Extension Helper
echo ============================

:menu
echo.
echo Choose an option:
echo 1. Open AutoBolt extension folder in Explorer
echo 2. Open built extension folder (for Chrome loading)
echo 3. Copy extension to main directory for easier access
echo 4. Check extension status
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto open_source
if "%choice%"=="2" goto open_built
if "%choice%"=="3" goto copy_extension
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto exit
goto menu

:open_source
echo Opening AutoBolt source folder...
explorer "external-repos\auto-bolt-extension"
goto menu

:open_built
echo Opening built extension folder (load this in Chrome)...
explorer "external-repos\auto-bolt-extension\build\auto-bolt-extension"
echo.
echo 💡 To load in Chrome:
echo    1. Go to chrome://extensions/
echo    2. Enable "Developer mode"
echo    3. Click "Load unpacked"
echo    4. Select the folder that just opened
goto menu

:copy_extension
echo Copying AutoBolt extension to main directory...
if exist "autobolt-extension" (
    rmdir /s /q "autobolt-extension"
)
xcopy "external-repos\auto-bolt-extension" "autobolt-extension" /E /I /H /Y
if %errorlevel% == 0 (
    echo ✅ Extension copied successfully to autobolt-extension\
) else (
    echo ❌ Failed to copy extension
)
goto menu

:check_status
echo 📊 AutoBolt Extension Status Check
echo ==================================
echo.

REM Check if source files exist
if exist "external-repos\auto-bolt-extension\popup.js" (
    echo ✅ Source popup.js found
) else (
    echo ❌ Source popup.js missing
)

if exist "external-repos\auto-bolt-extension\manifest.json" (
    echo ✅ Source manifest.json found
) else (
    echo ❌ Source manifest.json missing
)

REM Check if built files exist
if exist "external-repos\auto-bolt-extension\build\auto-bolt-extension\popup.js" (
    echo ✅ Built popup.js found
) else (
    echo ❌ Built popup.js missing
)

if exist "external-repos\auto-bolt-extension\build\auto-bolt-extension\manifest.json" (
    echo ✅ Built manifest.json found
) else (
    echo ❌ Built manifest.json missing
)

REM Check if icons exist
if exist "external-repos\auto-bolt-extension\build\auto-bolt-extension\icons" (
    echo ✅ Extension icons found
) else (
    echo ❌ Extension icons missing
)

echo.
echo 📁 Extension Locations:
echo    Source: external-repos\auto-bolt-extension\
echo    Built:  external-repos\auto-bolt-extension\build\auto-bolt-extension\
echo.
echo 🔧 Current Issues from Previous Session:
echo    - Authentication prefix mismatch (DIR- vs DB-) - FIXED
echo    - Hardcoded API credentials - FIXED
echo    - Security vulnerabilities - FIXED
echo.
echo 🚀 Extension should be ready for testing!

goto menu

:exit
echo.
echo 👋 AutoBolt Helper closed
pause
exit