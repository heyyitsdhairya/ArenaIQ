@echo off
title ArenaIQ - Docker Big Data Infrastructure
echo ========================================================
echo   Spinning up MongoDB, Zookeeper, and Apache Kafka...
echo ========================================================
cd ..
docker compose up -d
echo.
echo Containers started! Current status:
docker compose ps
pause
