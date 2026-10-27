@echo off
title ArenaIQ - FastAPI Backend Service
echo ========================================================
echo   Starting ArenaIQ Backend Service (Port 8000)...
echo ========================================================
cd ..\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
