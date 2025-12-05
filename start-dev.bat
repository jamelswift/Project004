@echo off
REM Start both backend and frontend on Windows

echo 🚀 Starting IoT Sensor Management...
echo.

REM Start Backend
echo 📦 Starting Backend (port 5000)...
start "Backend - port 5000" cmd /k "cd backend && npm start"
timeout /t 2 /nobreak

REM Start Frontend  
echo 🎨 Starting Frontend (port 3000)...
start "Frontend - port 3000" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak

echo.
echo =========================================
echo 🎉 Development servers running!
echo =========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo Health:    http://localhost:5000/health
echo.
echo Close these windows to stop services
echo.
pause
