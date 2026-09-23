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
    echo [1/4] Checking Docker Database Container (freshmart-sql)...
    docker start freshmart-sql >nul 2>nul
)

REM Step 2: Ensure bin directory exists and compile Java sources
echo [2/4] Checking and Compiling Java Backend sources...
if not exist "backend\bin" mkdir "backend\bin"
javac -cp "backend/lib/mssql-jdbc.jar" -sourcepath backend/src -d backend/bin backend/src/com/grocery/FreshMartServer.java backend/src/com/grocery/model/*.java backend/src/com/grocery/repository/*.java backend/src/com/grocery/service/*.java
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java compilation failed! Please make sure JDK is installed and in PATH.
    pause
    exit /b %ERRORLEVEL%
)

REM Step 3: Launch Java Backend Server
echo [3/4] Launching Java Backend Server (Port 8080)...
start "FreshMart Backend Server" cmd /k "cd /d "%~dp0" && java -cp "backend/bin;backend/lib/mssql-jdbc.jar" com.grocery.FreshMartServer"

timeout /t 3 >nul

REM Step 4: Launch Frontend Server
echo [4/4] Launching Frontend Web Server (Port 8000)...
start "FreshMart Frontend Server" cmd /k "cd /d "%~dp0" && start-frontend.bat"

timeout /t 2 >nul

echo.
echo ==========================================================
echo   FreshMart System is Ready!
echo   Customer Store: http://localhost:8000/index.html
echo   Admin Panel:    http://localhost:8000/admin.html
echo   Backend API:    http://localhost:8080/api/health
echo ==========================================================
echo Opening Customer Store in your default browser...
start http://localhost:8000/index.html
