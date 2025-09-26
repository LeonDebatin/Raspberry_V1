@echo off
REM Startup script for Raspberry Pi Scent Controller (Windows version)

setlocal enabledelayedexpansion

REM Script configuration
set "SCRIPT_DIR=%~dp0"
set "APP_NAME=Scent Controller"
set "LOG_FILE=%SCRIPT_DIR%scent_controller.log"

REM Check if Python 3 is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Python found: 
python --version

REM Install dependencies if requirements.txt exists
if exist "%SCRIPT_DIR%requirements.txt" (
    echo Installing Python dependencies...
    python -m pip install -r "%SCRIPT_DIR%requirements.txt"
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully
)

REM Start the application
echo Starting %APP_NAME%...
cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo   Raspberry Pi Scent Controller
echo ========================================
echo.
echo Starting Flask application...
echo Access the application at:
echo   Local: http://localhost:5000
echo   Network: http://YOUR_IP:5000
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the Flask application
python app.py

echo.
echo Application stopped.
pause