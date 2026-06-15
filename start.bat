@echo off
cd /d %~dp0
echo Starting Crypto Signal System...
echo.
echo Starting Backend Server (port 5000)...
start "Crypto-API" cmd /k "cd server && node index.js"
timeout /t 3 /nobreak >nul
echo Backend started on http://localhost:5000
echo.
echo Starting Frontend (0.0.0.0:3000)...
start "Crypto-Client" cmd /k "cd client && npm start"
timeout /t 5 /nobreak >nul
echo.
echo ========================================
echo Frontend: http://0.0.0.0:3000 (LAN accessible)
echo Backend:  http://localhost:5000
echo Test account: admin / crypto123
echo ========================================
echo.
echo Close this window to stop all services
pause