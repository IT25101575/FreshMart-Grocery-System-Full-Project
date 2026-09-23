@echo off
title Stop FreshMart System
echo ==========================================================
echo   Stopping FreshMart Servers (Port 8080 & 8000)
echo ==========================================================

REM Kill processes using port 8080 (Java Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Stopping Java Backend on port 8080 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

REM Kill processes using port 8000 (Python Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping Frontend on port 8000 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo All FreshMart servers have been stopped successfully.
pause
