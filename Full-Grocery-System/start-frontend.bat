@echo off
title FreshMart Frontend Server (Port 8000)
echo ==================================================
echo   Starting FreshMart Frontend on http://localhost:8000
echo   Press Ctrl+C to stop the server
echo ==================================================
cd /d "%~dp0frontend"
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python -m http.server 8000
) else (
    py -m http.server 8000
)
pause
