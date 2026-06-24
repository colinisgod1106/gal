@echo off
setlocal enabledelayedexpansion

set "PYTHON_EXE="

:: 1. Check if a working python is in PATH (excluding the Microsoft WindowsApps stub)
for /f "tokens=*" %%i in ('where python 2^>nul') do (
    echo %%i | findstr /i "WindowsApps" >nul
    if errorlevel 1 (
        "%%i" --version >nul 2>&1
        if !errorlevel! equ 0 (
            set "PYTHON_EXE=%%i"
            goto :found
        )
    )
)

:: 2. Check Thonny Python
if exist "%LOCALAPPDATA%\Programs\Thonny\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Thonny\python.exe"
    goto :found
)

:: 3. Check typical Local AppData Python installations
for /d %%d in ("%LOCALAPPDATA%\Programs\Python\Python*") do (
    if exist "%%d\python.exe" (
        set "PYTHON_EXE=%%d\python.exe"
        goto :found
    )
)

:: 4. Check Program Files
for /d %%d in ("%ProgramFiles%\Python*") do (
    if exist "%%d\python.exe" (
        set "PYTHON_EXE=%%d\python.exe"
        goto :found
    )
)

:: 5. Check Program Files (x86)
for /d %%d in ("%ProgramFiles(x86)%\Python*") do (
    if exist "%%d\python.exe" (
        set "PYTHON_EXE=%%d\python.exe"
        goto :found
    )
)

:: 6. Fallback to just "python" and let the system handle it
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_EXE=python"
    goto :found
)

echo Error: python.exe could not be found.
echo Please install Python (https://www.python.org/) or add it to your environment variables (PATH).
pause
exit /b 1

:found
echo Using Python: "%PYTHON_EXE%"
echo [1/2] Parsing game script...
"%PYTHON_EXE%" parse_script.py
if %errorlevel% neq 0 (
    echo Error: Script parsing failed.
    pause
    exit /b %errorlevel%
)

echo [2/2] Starting HTTP server on http://localhost:8080 ...
start http://localhost:8080
"%PYTHON_EXE%" -m http.server 8080

pause
