@echo off
cd %~dp0
echo Checking dependencies before starting development server...

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is required but not found.
    echo Running setup script...
    call setup.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the development server.
        pause
        exit /b 1
    )
)

:: Check if pnpm is installed
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo pnpm is required but not found.
    echo Running setup script...
    call setup.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the development server.
        pause
        exit /b 1
    )
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not installed.
    echo Running setup script...
    call setup.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot start the development server.
        pause
        exit /b 1
    )
)

echo Starting development server...
pnpm dev
