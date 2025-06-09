@echo off
echo ========================================
echo Azure Functions Manual Deployment
echo ========================================
echo.

echo Step 1: Creating clean deployment package...
call pnpm run build:clean
if %ERRORLEVEL% neq 0 (
    echo ERROR: Clean build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Creating deployment package...
cd dist
powershell -Command "Compress-Archive -Path * -DestinationPath ../deployment.zip -Force"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create deployment package
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Deploying to Azure Functions...
az functionapp deployment source config-zip --resource-group pokedata-rg --name pokedata-func --src deployment.zip
if %ERRORLEVEL% neq 0 (
    echo ERROR: Azure deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo The functions are now deployed with:
echo - Only compiled JavaScript files
echo - Production dependencies only
echo - Clean Azure Functions structure
echo - No development files or source code
echo.
pause
