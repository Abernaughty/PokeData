@echo off
echo ========================================
echo Azure Functions Manual Deployment
echo ========================================
echo.

echo Step 1: Building TypeScript...
call pnpm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: TypeScript build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Installing production dependencies in dist...
cd dist
call npm install --production
if %ERRORLEVEL% neq 0 (
    echo ERROR: Production dependency installation failed
    cd ..
    pause
    exit /b 1
)

echo.
echo Step 3: Creating deployment package...
powershell -Command "Compress-Archive -Path * -DestinationPath ../deployment.zip -Force"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create deployment package
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo Step 4: Deploying to Azure Functions...
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
echo The functions should now be properly deployed with:
echo - Only compiled JavaScript files
echo - Production dependencies only
echo - Correct Azure Functions structure
echo.
pause
