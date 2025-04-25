@echo off
echo ===================================
echo Pokemon Card Price Checker - Setup
echo ===================================
echo.

echo Checking for Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found on this system.
    echo Please install Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [OK] Node.js found: 
node --version

echo.
echo Checking for pnpm installation...
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] pnpm not found, attempting to install it...
    call npm install -g pnpm@8.15.4
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install pnpm. Please try installing manually:
        echo npm install -g pnpm@8.15.4
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    echo [OK] pnpm installed successfully.
) else (
    echo [OK] pnpm found:
    pnpm --version
)

echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo [INFO] Installing project dependencies...
    call pnpm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    echo [OK] Dependencies installed successfully.
) else (
    echo [OK] Dependencies already installed.
)

echo.
echo ===================================
echo Setup complete!
echo You can run the app using:
echo - dev.bat    (for development)
echo - start.bat  (to start the app)
echo ===================================
echo.

:EXIT_NORMALLY
exit /b 0
