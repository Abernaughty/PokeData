@echo off
echo ===================================
echo Pokemon Card Price Checker - Build Tool
echo ===================================
echo.

cd %~dp0

:: Parse command line arguments
set BUILD_TYPE=full
if /i "%1"=="css" set BUILD_TYPE=css

echo Checking dependencies...
call :check_dependencies
if %ERRORLEVEL% NEQ 0 exit /b 1

if "%BUILD_TYPE%"=="css" (
    echo.
    echo Building CSS only...
    echo.
    
    echo Cleaning CSS build files...
    if exist public\build\bundle.css del public\build\bundle.css
    
    echo Running Rollup to rebuild CSS bundle...
    npx rollup -c rollup.config.cjs
) else (
    echo.
    echo Building full application...
    echo.
    
    echo Cleaning build directory...
    if exist public\build\bundle.css del public\build\bundle.css
    if exist public\build\main.js del public\build\main.js
    
    echo Running Rollup to build the application...
    npm run build
    
    echo Updating cache-busting parameters...
    powershell -Command "(Get-Content public\index.html) -replace 'global.css\?v=\d+', 'global.css?v=%date:~10,4%%date:~4,2%%date:~7,2%' -replace 'bundle.css\?v=\d+', 'bundle.css?v=%date:~10,4%%date:~4,2%%date:~7,2%' | Set-Content public\index.html"
)

echo.
echo Build complete!
echo.
echo To test the application:
echo - Run dev-server.bat for development testing
echo - Run prod-server.bat for production testing
echo.
exit /b 0

:check_dependencies
:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is required but not found.
    echo Running setup script...
    call tools.bat setup
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Cannot build the application.
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
        echo Setup failed. Cannot build the application.
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
        echo Setup failed. Cannot build the application.
        pause
        exit /b 1
    )
)

exit /b 0
