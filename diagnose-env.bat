@echo off
echo ===== Environment Diagnostic Tool =====
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
echo ----- pnpm Check -----
where pnpm 2>nul
if %errorlevel% equ 0 (
  echo pnpm found in PATH
  echo Version:
  pnpm -v
) else (
  echo pnpm NOT found in PATH
)
echo.
echo ----- Recent Changes Check -----
echo Last 10 files modified in this directory:
dir /o-d /b /a:-d | findstr /v "diagnose-env.bat" | findstr /v ".log" | more /e /p /c:10
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
echo ===== Diagnostic Complete =====
echo Results saved to env-diagnostic.log
echo.
pause
