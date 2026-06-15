@echo off
cd /d %~dp0
echo Starting Crypto Signal System...
echo.
echo Building frontend...
cd client
call npm run build >nul 2>&1
cd ..
echo.
echo Starting Server (port 3000)...
start "Crypto-Server" cmd /k "cd server && node index.js"
timeout /t 3 /nobreak >nul
echo Server started on http://0.0.0.0:3000
echo.
echo ========================================
echo URL: http://0.0.0.0:3000 (single port, LAN+public)
echo Test account: admin / crypto123
echo ========================================
echo.
echo Close this window to stop the service
pause
echo.
echo Close this window to stop all services
pause