@echo off
echo ===================================
echo Pokemon Card Price Checker - Development Server
echo ===================================
echo.

cd %~dp0

echo Checking dependencies...
call :check_dependencies
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Starting development server...
echo.
echo ===================================
echo Development server is starting...
echo The app will be available at http://localhost:3000
echo Press Ctrl+C to stop the server
echo ===================================
echo.

:: Check for processes using port 3000 more safely
echo Checking for processes using port 3000...
netstat -ano | findstr /C:":3000 " > port_check.tmp
if %ERRORLEVEL% EQU 0 (
    echo Port 3000 is in use. Attempting to free it...
    
    :: Extract PIDs to a temporary file and terminate them
    for /f "tokens=5" %%a in (port_check.tmp) do (
        if not "%%a"=="" (
            echo Attempting to terminate process with PID: %%a
            taskkill /F /PID %%a >nul 2>&1
            timeout /t 1 /nobreak >nul
        )
    )
    
    :: Wait a moment for ports to be released
    timeout /t 2 /nobreak >nul
    echo Port cleanup completed.
)
del port_check.tmp 2>nul

:: Set environment variables to force port 3000
set PORT=3000

:: Start the development server
pnpm dev
exit /b 0

:check_dependencies
:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is required but not found.
    echo Running setup script...
    call tools.bat setup
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the server.
        pause
        exit /b 1
    )
)

:: Check if pnpm is installed
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo pnpm is required but not found.
    echo Running setup script...
    call tools.bat setup
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the server.
        pause
        exit /b 1
    )
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not installed.
    echo Running setup script...
    call tools.bat setup
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the server.
        pause
        exit /b 1
    )
)

exit /b 0
