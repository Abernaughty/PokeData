@echo off
echo ===================================
echo Pokemon Card Price Checker - Launcher
echo ===================================
echo.

cd %~dp0

echo Checking environment and dependencies...

:: Run setup tool to ensure all dependencies are installed
echo Running setup tool...
call tools.bat setup
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Setup failed. Cannot start the application.
    pause
    exit /b 1
)

echo.
echo [OK] All dependencies are installed.
echo.
echo Starting Pokemon Card Price Checker...
echo.
echo ===================================
echo Application is starting...
echo The app will be available at http://localhost:3000
echo Press Ctrl+C to stop the application
echo ===================================
echo.

:: Start the application using the production server script
call prod-server.bat
