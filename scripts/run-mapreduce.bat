@echo off
title ArenaIQ - Hadoop Streaming MapReduce Job
echo ========================================================
echo   Executing Hadoop Streaming MapReduce Pipeline...
echo ========================================================
cd ..
python hadoop\run_mapreduce.py
echo.
pause
