@echo off
echo ===================================
echo Pokemon Card Price Checker - Server
echo ===================================
echo.

cd %~dp0

:: Parse command line arguments
set MODE=%1
if "%MODE%"=="" set MODE=dev

:: Validate mode
if /i not "%MODE%"=="dev" if /i not "%MODE%"=="prod" if /i not "%MODE%"=="production" (
    echo Invalid mode: %MODE%
    echo.
    echo Usage: server.bat [mode]
    echo   mode: dev (default) or prod/production
    echo.
    echo Examples:
    echo   server.bat         - Start development server
    echo   server.bat dev     - Start development server
    echo   server.bat prod    - Start production server
    echo.
    exit /b 1
)

:: Normalize production mode
if /i "%MODE%"=="production" set MODE=prod

echo Checking dependencies...
call :check_dependencies
if %ERRORLEVEL% NEQ 0 exit /b 1

:: Display mode-specific information
if /i "%MODE%"=="dev" (
    echo.
    echo Starting DEVELOPMENT server...
    echo.
    echo ===================================
    echo Development server is starting...
    echo The app will be available at http://localhost:3000
    echo Hot reloading is enabled - changes will auto-refresh
    echo Press Ctrl+C to stop the server
    echo ===================================
) else (
    echo.
    echo Starting PRODUCTION server...
    echo.
    echo ===================================
    echo Production server is starting...
    echo The app will be available at http://localhost:3000
    echo Serving optimized production build
    echo Press Ctrl+C to stop the server
    echo ===================================
)
echo.

:: Check for processes using port 3000 - simplified approach
echo Checking for processes using port 3000...
netstat -ano > temp_netstat.txt 2>nul
findstr /C:":3000 " temp_netstat.txt >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Port 3000 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('findstr /C:":3000 " temp_netstat.txt') do (
        if not "%%a"=="" (
            echo Attempting to terminate process with PID: %%a
            taskkill /F /PID %%a >nul 2>&1
            timeout /t 1 /nobreak >nul
        )
    )
)
del temp_netstat.txt >nul 2>&1

:: Wait a moment for ports to be released if any were terminated
timeout /t 2 /nobreak >nul

:: Set environment variables to force port 3000
set PORT=3000

:: Start the appropriate server
if /i "%MODE%"=="dev" (
    npm run dev
) else (
    :: Check if build exists for production mode
    if not exist "public\build\main.js" (
        echo.
        echo [WARNING] No production build found!
        echo Building the application first...
        echo.
        call npm run build
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Build failed. Cannot start production server.
            pause
            exit /b 1
        )
        echo Build completed successfully.
        echo.
    )
    npm start
)
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

:: Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo npm is required but not found.
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
