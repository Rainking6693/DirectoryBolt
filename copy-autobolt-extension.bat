@echo off
echo Copying AutoBolt Extension files...

REM Remove existing autobolt-extension directory if it exists
if exist "autobolt-extension" (
    echo Removing existing autobolt-extension directory...
    rmdir /s /q "autobolt-extension"
)

REM Copy the entire auto-bolt-extension directory
echo Copying files...
xcopy "external-repos\auto-bolt-extension" "autobolt-extension" /E /I /H /Y

if %errorlevel% == 0 (
    echo ✅ Successfully copied AutoBolt extension files!
    echo.
    echo Extension files are now available at:
    echo   autobolt-extension\build\auto-bolt-extension\  (Built extension)
    echo   autobolt-extension\popup.js                   (Source popup)
    echo   autobolt-extension\manifest.json              (Source manifest)
    echo.
    echo Note: This is a copy - changes here won't affect the original files
    echo in external-repos\auto-bolt-extension\
    echo.
) else (
    echo ❌ Failed to copy files.
)

pause