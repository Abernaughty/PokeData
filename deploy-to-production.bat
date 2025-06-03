@echo off
echo.
echo ========================================
echo   POKEDATA PRODUCTION DEPLOYMENT
echo ========================================
echo.

REM Add GitHub CLI to PATH if not already there
set "PATH=%PATH%;C:\Program Files\GitHub CLI"

echo 🚀 Deploying to production via GitHub Actions...
gh workflow run "Deploy to Azure Functions Production" --field deploy_method=swap

if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment triggered successfully!
    echo.
    echo 📊 Monitoring deployment progress...
    gh run watch
    
    echo.
    echo 🧪 Running production verification tests...
    node test-production-verification.js
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo 🎉 PRODUCTION DEPLOYMENT COMPLETE! ✅
        echo ✨ All functions are working correctly in production.
    ) else (
        echo.
        echo ❌ Production verification failed!
        echo ⚠️  Please check the deployment manually.
    )
) else (
    echo ❌ Failed to trigger deployment!
    echo ⚠️  Please check your GitHub CLI authentication.
)

echo.
pause
