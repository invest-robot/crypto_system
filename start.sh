#!/bin/bash
echo "Starting Crypto Signal System..."
cd "$(dirname "$0")"

# Start backend
echo "Starting Backend (port 5000)..."
gnome-terminal -- bash -c "cd server && node index.js; read -p 'Press enter to exit'" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/server && node index.js"' 2>/dev/null || \
node server/index.js &
BACKEND_PID=$!

sleep 3

# Start frontend
echo "Starting Frontend (port 3001)..."
cd client && npm start

echo "Backend PID: $BACKEND_PID"
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5000"