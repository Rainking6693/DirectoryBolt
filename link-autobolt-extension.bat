@echo off
echo Creating symbolic link for AutoBolt Extension...

REM Remove existing autobolt-extension directory if it exists
if exist "autobolt-extension" (
    echo Removing existing autobolt-extension directory...
    rmdir /s /q "autobolt-extension"
)

REM Create symbolic link to the external repo
echo Creating symbolic link...
mklink /D "autobolt-extension" "external-repos\auto-bolt-extension"

if %errorlevel% == 0 (
    echo ✅ Successfully created symbolic link!
    echo You can now access AutoBolt extension files at: autobolt-extension\
    echo.
    echo Main extension files:
    echo   autobolt-extension\build\auto-bolt-extension\  (Built extension)
    echo   autobolt-extension\popup.js                   (Source popup)
    echo   autobolt-extension\manifest.json              (Source manifest)
    echo.
) else (
    echo ❌ Failed to create symbolic link.
    echo You may need to run this as Administrator.
    echo.
    echo Alternative: Run this command as Administrator:
    echo mklink /D "autobolt-extension" "external-repos\auto-bolt-extension"
)

pause