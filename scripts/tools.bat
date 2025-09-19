@echo off
echo ===================================
echo Pokemon Card Price Checker - Tools
echo ===================================
echo.

cd %~dp0

:: Parse command line arguments
set TOOL=%1

if "%TOOL%"=="" goto show_menu
if /i "%TOOL%"=="setup" goto run_setup
if /i "%TOOL%"=="diagnose" goto run_diagnose
if /i "%TOOL%"=="fix-path" goto run_fix_path
goto invalid_tool

:show_menu
echo Please select a tool:
echo.
echo 1. Setup - Install dependencies
echo 2. Diagnose - Check environment
echo 3. Fix Path - Fix Node.js path issues
echo.
set /p CHOICE="Enter choice (1-3): "

if "%CHOICE%"=="1" goto run_setup
if "%CHOICE%"=="2" goto run_diagnose
if "%CHOICE%"=="3" goto run_fix_path
goto invalid_choice

:invalid_choice
echo Invalid choice. Please try again.
pause
goto show_menu

:invalid_tool
echo Invalid tool specified: %TOOL%
echo Valid options: setup, diagnose, fix-path
exit /b 1

:run_setup
echo.
echo Running setup tool...
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
echo Checking for npm installation...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. npm should be installed with Node.js.
    echo Please reinstall Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo [OK] npm found:
    npm --version
)

echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo [INFO] Installing project dependencies...
    call npm install
    
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
echo Setup complete!
exit /b 0

:run_diagnose
echo.
echo Running environment diagnostic tool...
echo.

echo ----- System Information -----
echo Date and Time: %date% %time%
echo Computer Name: %computername%
echo Username: %username%
echo.
echo ----- PATH Variable -----
echo %PATH%
echo.
echo ----- Node.js Check -----
echo Searching for node in PATH...
where node 2>nul
if %errorlevel% equ 0 (
  echo Node.js found in PATH
  echo Version:
  node -v
) else (
  echo Node.js NOT found in PATH
)
echo.
echo ----- npm Check -----
where npm 2>nul
if %errorlevel% equ 0 (
  echo npm found in PATH
  echo Version:
  npm -v
) else (
  echo npm NOT found in PATH
)
echo.
echo ----- npm Check (Additional) -----
where npm 2>nul
if %errorlevel% equ 0 (
  echo npm found in PATH (confirmed)
  echo Version:
  npm -v
) else (
  echo npm NOT found in PATH (this should not happen)
)
echo.
echo ----- Recent Changes Check -----
echo Last 10 files modified in this directory:
dir /o-d /b /a:-d | findstr /v "tools.bat" | findstr /v ".log" | more /e /p /c:10
echo.
echo ----- Common Node Installation Paths -----
if exist "C:\Program Files\nodejs\node.exe" echo Found: C:\Program Files\nodejs\node.exe
if exist "C:\Program Files (x86)\nodejs\node.exe" echo Found: C:\Program Files (x86)\nodejs\node.exe
if exist "%APPDATA%\npm\node.exe" echo Found: %APPDATA%\npm\node.exe
if exist "%USERPROFILE%\AppData\Roaming\nvm\*\node.exe" echo Found in NVM directory
echo.
echo ----- Environment Variables -----
echo User Path: 
reg query "HKCU\Environment" /v Path 2>nul
echo.
echo System Path:
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2>nul
echo.
echo Diagnostic complete!
pause
exit /b 0

:run_fix_path
echo.
echo Running Node.js path fix tool...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARNING] This script is not running as Administrator.
  echo Some system-wide changes may not be possible.
  echo.
  pause
)

echo ----- Looking for Node.js installations -----
set FOUND_NODE=0

REM Check common installation locations
if exist "C:\Program Files\nodejs\node.exe" (
  set NODE_PATH=C:\Program Files\nodejs
  set FOUND_NODE=1
  echo Found Node.js at: C:\Program Files\nodejs
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
  set NODE_PATH=C:\Program Files (x86)\nodejs
  set FOUND_NODE=1
  echo Found Node.js at: C:\Program Files (x86)\nodejs
)

REM Check for NVM installations
for /d %%i in ("%APPDATA%\nvm\*") do (
  if exist "%%i\node.exe" (
    set NODE_PATH=%%i
    set FOUND_NODE=1
    echo Found Node.js at: %%i
  )
)

if %FOUND_NODE% equ 0 (
  echo No Node.js installation found in common locations.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo.
echo ----- Updating User PATH -----

REM Get current user PATH
for /f "tokens=2*" %%a in ('reg query HKCU\Environment /v Path 2^>nul ^| findstr /i "Path"') do set "CURRENT_PATH=%%b"

REM Check if Node path is already in PATH
echo %CURRENT_PATH% | findstr /C:"%NODE_PATH%" >nul
if %errorlevel% equ 0 (
  echo Node.js path is already in your user PATH.
) else (
  echo Adding Node.js to your user PATH...
  setx PATH "%CURRENT_PATH%;%NODE_PATH%" >nul
  echo Done!
)

echo.
echo ----- Verifying Node.js -----
echo Current PATH:
echo %PATH%
echo.
echo Testing Node.js access:
"%NODE_PATH%\node.exe" -v

echo.
echo Path fix complete!
pause
exit /b 0
