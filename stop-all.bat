@echo off
title ArenaIQ - Stop All Services
echo ======================================================================
echo           ARENAIQ: STOPPING ALL PLATFORM SERVICES                    
echo ======================================================================
echo.

echo [1/3] Stopping React Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Stopping FastAPI Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Stopping Docker Containers (MongoDB, Zookeeper, Kafka)...
docker compose down >nul 2>&1

echo.
echo ======================================================================
echo   All ArenaIQ services have been stopped!
echo ======================================================================
pause
