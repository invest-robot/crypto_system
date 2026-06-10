@echo off
echo Stopping Crypto Signal System...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
echo All services stopped.