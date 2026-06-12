@echo off
echo Stopping Crypto Signal System...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
  echo Stopped backend (PID: %%a)
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
  echo Stopped frontend (PID: %%a)
)
echo Done.