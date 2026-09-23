@echo off
title FreshMart Backend Server (Port 8080)
echo ==================================================
echo   Starting FreshMart Backend on http://localhost:8080
echo   Press Ctrl+C to stop the server
echo ==================================================
cd /d "%~dp0"

REM Ensure bin directory exists
if not exist "backend\bin" mkdir "backend\bin"

REM Compile backend sources
echo [1/2] Compiling Java source files...
javac -cp "backend/lib/mssql-jdbc.jar" -sourcepath backend/src -d backend/bin backend/src/com/grocery/FreshMartServer.java backend/src/com/grocery/model/*.java backend/src/com/grocery/repository/*.java backend/src/com/grocery/service/*.java
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java compilation failed! Please check your JDK installation.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/2] Starting FreshMart Java Server...
java -cp "backend/bin;backend/lib/mssql-jdbc.jar" com.grocery.FreshMartServer
pause
