#!/bin/bash
echo "Stopping Crypto Signal System..."

# Kill processes on port 5000 (backend)
PIDS_5000=$(lsof -ti:5000 2>/dev/null)
if [ -n "$PIDS_5000" ]; then
  kill -9 $PIDS_5000
  echo "Stopped backend on port 5000"
fi

# Kill processes on port 3001 (frontend)
PIDS_3001=$(lsof -ti:3001 2>/dev/null)
if [ -n "$PIDS_3001" ]; then
  kill -9 $PIDS_3001
  echo "Stopped frontend on port 3001"
fi

echo "Done."