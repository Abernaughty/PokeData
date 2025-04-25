@echo off
echo ===== Node.js Path Fix Tool =====
echo.
echo This script will help fix Path-related issues for Node.js.
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
echo ----- Creating local pnpm launch script -----
echo @echo off > use-node-path.bat
echo set PATH=%NODE_PATH%;%%PATH%% >> use-node-path.bat
echo pnpm %%* >> use-node-path.bat
echo Created use-node-path.bat - you can run "use-node-path dev" instead of "pnpm dev"

echo.
echo ----- Verifying Node.js -----
echo Current PATH:
echo %PATH%
echo.
echo Testing Node.js access:
"%NODE_PATH%\node.exe" -v

echo.
echo ===== Fix Complete =====
echo.
echo Please try the following:
echo 1. Close and reopen your command prompt
echo 2. Try running "pnpm dev" again
echo 3. If that doesn't work, try "use-node-path dev"
echo.
pause
