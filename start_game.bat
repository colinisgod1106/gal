@echo off
cd /d "%~dp0"
title White Heron Academy - Game Launcher

echo ===================================================
echo     White Heron Academy - Hiyori Shiina Route
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found!
    echo Please install Node.js ^(LTS version^) from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 1. Compile the latest script from markdown
echo [1/3] Building script (parse_script.js)...
node parse_script.js
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Script compilation failed. Attempting to continue...
)
echo.

:: 2. Start the local web server in this window so errors stay visible
echo [2/3] Checking port 8080...
powershell -NoProfile -Command "$c = New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 8080); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] A server is already running on port 8080.
    echo [3/3] Opening browser...
    start "" "http://127.0.0.1:8080/"
    echo.
    echo [DONE] Browser opened. If the page is not this game, close the other server and run this again.
    pause
    exit /b
)

echo [2/3] Starting local web server on port 8080...
echo [INFO] Keep this window open while playing.
echo [INFO] Press Ctrl+C in this window to stop the server.
echo.

:: 3. Launch default web browser after a short delay
echo [3/3] Opening browser...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:8080/'"
echo.
echo [DONE] Server output follows:
echo.
node serve.js

echo.
echo [ERROR] Server stopped or failed to start.
pause
