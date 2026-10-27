@echo off
title ArenaIQ - Complete BDA Platform Launcher
echo ======================================================================
echo           ARENAIQ: BIG DATA SPORTS VENUE PLATFORM                     
echo ======================================================================
echo.

echo [1/3] Starting Docker Infrastructure (MongoDB, Zookeeper, Kafka)...
docker compose up -d

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "ArenaIQ Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting React Frontend on http://localhost:5173 ...
start "ArenaIQ Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
echo.
echo Opening ArenaIQ in your default browser...
start http://localhost:5173

echo ======================================================================
echo   ArenaIQ is now live!
echo   - Web Application:     http://localhost:5173
echo   - Backend REST API:    http://localhost:8000/docs
echo   - MongoDB Web UI:      http://localhost:8081
echo   - Realtime Telemetry:  http://localhost:8000/api/analytics/realtime
echo ======================================================================
pause
