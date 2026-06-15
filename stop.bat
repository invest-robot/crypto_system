@echo off
echo Stopping Crypto Signal System...
for %%p in (5000 3000 3001) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Stopped process on port %%p (PID: %%a)
  )
)
echo Done.