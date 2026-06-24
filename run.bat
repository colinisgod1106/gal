@echo off
echo [1/2] Parsing game script...
python parse_script.py
if %errorlevel% neq 0 (
    echo Error: Script parsing failed.
    pause
    exit /b %errorlevel%
)

echo [2/2] Starting HTTP server on http://localhost:8080 ...
start http://localhost:8080
python -m http.server 8080

pause
