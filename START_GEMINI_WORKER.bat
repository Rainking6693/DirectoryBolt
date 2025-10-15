@echo off
echo.
echo ========================================
echo  DirectoryBolt - Gemini Worker Starter
echo ========================================
echo.

cd workers\gemini-worker

echo Pulling latest code...
git pull origin main

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting Gemini Worker with PM2...
call pm2 delete gemini-worker 2>nul
call pm2 start gemini-job-processor.js --name gemini-worker

echo.
echo ========================================
echo  Worker Started!
echo ========================================
echo.
echo View logs: pm2 logs gemini-worker
echo Stop worker: pm2 stop gemini-worker
echo Restart worker: pm2 restart gemini-worker
echo.

pause

