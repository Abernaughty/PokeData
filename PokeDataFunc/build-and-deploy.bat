@echo off
echo Building and deploying PokeData Azure Functions...
echo.

REM Build the TypeScript code
echo Building TypeScript code...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo Build failed with error code %ERRORLEVEL%.
  pause
  exit /b %ERRORLEVEL%
)

REM Copy function.json files
echo Copying function.json files...
node copy-function-json.js
if %ERRORLEVEL% NEQ 0 (
  echo Failed to copy function.json files with error code %ERRORLEVEL%.
  pause
  exit /b %ERRORLEVEL%
)

REM Create RefreshData directory if it doesn't exist
if not exist "RefreshData" (
  echo Creating RefreshData directory...
  mkdir RefreshData
)

REM Copy the RefreshData function.json to the output directory
echo Copying RefreshData function.json...
copy /Y "src\functions\RefreshData\function.json" "RefreshData\function.json"
if %ERRORLEVEL% NEQ 0 (
  echo Failed to copy RefreshData function.json with error code %ERRORLEVEL%.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Build and copy completed successfully.
echo.

REM Ask if user wants to deploy to Azure
set /p deploy=Do you want to deploy to Azure? (Y/N): 
if /i "%deploy%"=="Y" (
  echo.
  echo Deploying to Azure...
  call npm run deploy
  
  if %ERRORLEVEL% EQU 0 (
    echo.
    echo Deployment completed successfully.
  ) else (
    echo.
    echo Deployment failed with error code %ERRORLEVEL%.
  )
) else (
  echo.
  echo Deployment skipped.
)

echo.
echo Process completed.
pause
