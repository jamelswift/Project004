#!/bin/bash
# Start both backend and frontend

echo "🚀 Starting IoT Sensor Management..."
echo ""

# Check if ports are available
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port $1 is already in use"
    return 1
  fi
  return 0
}

# Start Backend
echo "📦 Starting Backend (port 5000)..."
cd backend
npm start &
BACKEND_PID=$!
sleep 2

# Check if backend started
if ! check_port 5000; then
  echo "❌ Failed to start backend"
  exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Start Frontend
echo "🎨 Starting Frontend (port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 3

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "========================================="
echo "🎉 Development servers running!"
echo "========================================="
echo ""
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:5000"
echo "Health:    http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
