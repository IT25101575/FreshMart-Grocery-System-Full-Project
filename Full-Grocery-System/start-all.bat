@echo off
title FreshMart Grocery System - Master Launcher
echo ==========================================================
echo   FreshMart Full Grocery System (Port 8080 + Port 8000)
echo ==========================================================
echo.
cd /d "%~dp0"

REM Step 1: Ensure Docker Database Container is running (if Docker installed)
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Starting Docker SQL Database container freshmart-sql...
    docker start freshmart-sql >nul 2>nul
)

REM Step 2: Launch Backend Server in a new window
echo [2/3] Launching Java Backend Server on port 8080...
start "FreshMart Backend Server" "%~dp0start-backend.bat"

REM Safe delay
ping -n 3 127.0.0.1 >nul

REM Step 3: Launch Frontend Server in a new window
echo [3/3] Launching Frontend Web Server on port 8000...
start "FreshMart Frontend Server" "%~dp0start-frontend.bat"

REM Safe delay
ping -n 3 127.0.0.1 >nul

echo.
echo ==========================================================
echo   FreshMart System is Ready!
echo   Customer Store: http://localhost:8000/index.html
echo   Admin Panel:    http://localhost:8000/admin.html
echo   Backend API:    http://localhost:8080/api/health
echo ==========================================================
echo.
echo Opening Customer Store in your default browser...
start "" "http://localhost:8000/index.html"
echo.
echo FreshMart is now live! The servers are running in their separate windows.
pause
