@echo off
title PokeData Azure Functions Deployment
color 07

REM Load function keys from .env file with improved parsing
set ENV_FILE=%~dp0.env
if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        if "%%a"=="AZURE_FUNCTION_KEY_STAGING" set STAGING_KEY=%%b
        if "%%a"=="PRODUCTION_FUNCTION_KEY" set PRODUCTION_KEY=%%b
    )
)

REM Debug output to verify keys loaded
echo.
echo Checking function keys...
if defined STAGING_KEY (
    echo [OK] Staging key loaded from .env
    REM Show first 10 chars for verification (masked for security)
    set KEY_PREFIX=%STAGING_KEY:~0,10%
    echo     Key starts with: %KEY_PREFIX%...
) else (
    echo [ERROR] AZURE_FUNCTION_KEY_STAGING not found in .env file
    echo         Please ensure AZURE_FUNCTION_KEY_STAGING=your_key is in PokeDataFunc/.env
    echo         Deployment cannot continue without authentication keys.
    pause
    goto end
)

if defined PRODUCTION_KEY (
    echo [OK] Production key loaded from .env
) else (
    echo [WARNING] PRODUCTION_FUNCTION_KEY not found in .env file
    echo           Production tests will fail without this key.
)

:start
echo.
echo ========================================
echo  PokeData Azure Functions Deployment
echo  [CI/CD] Safe Deployment Pipeline
echo ========================================
echo.

echo Select deployment method:
echo.
echo 1. Safe Deploy (Staging -^> Test -^> Production)
echo    - Deploy to staging slot
echo    - Run health checks
echo    - Optional swap to production
echo.
echo 2. Emergency Direct to Production
echo    - Bypass staging (use with caution)
echo    - Direct deployment to production
echo.
echo 3. Swap Staging to Production
echo    - Swap existing staging deployment
echo    - Use if already tested staging
echo.
echo 4. Exit
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" goto safe_deploy
if "%choice%"=="2" goto emergency_deploy
if "%choice%"=="3" goto swap_only
if "%choice%"=="4" goto exit
echo Invalid choice. Please try again.
goto start

:safe_deploy
echo.
echo ========================================
echo  Safe Deployment Pipeline
echo ========================================
echo.

echo Step 1: Building TypeScript...
cd /d "%~dp0"
call pnpm run build
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Build failed with error code %ERRORLEVEL%.
    goto error_end
)

echo Step 2: Verifying build output...
if not exist "dist\index.js" (
    color 0C
    echo [ERROR] dist\index.js not found. Build may have failed.
    goto error_end
)

echo.
echo Step 3: Deploying to STAGING slot...
echo ----------------------------------------
call func azure functionapp publish pokedata-func --slot staging --javascript --cwd dist

if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Staging deployment failed with error code %ERRORLEVEL%.
    goto error_end
)

echo.
echo ========================================
echo  Staging Deployment Complete!
echo ========================================
echo.
echo Step 4: Waiting for staging slot to warm up...
echo ----------------------------------------
set retry_count=0
set max_retries=3

:retry_health_check
set /a retry_count+=1
echo.
echo Warm-up attempt %retry_count% of %max_retries%...
echo Waiting 30 seconds for staging to stabilize...
timeout /t 30 /nobreak >nul

echo Testing health endpoint...
echo [DEBUG] Testing URL: https://pokedata-func-staging.azurewebsites.net/api/sets?code=%STAGING_KEY:~0,10%...
curl -f -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func-staging.azurewebsites.net/api/sets?code=%STAGING_KEY%"
if %ERRORLEVEL% equ 0 (
    echo [OK] Staging is responding!
    goto test_endpoints
)

if %retry_count% lss %max_retries% (
    echo [RETRY] Staging needs more time to warm up...
    goto retry_health_check
)

color 0E
echo [WARNING] Staging may still be warming up after %max_retries% attempts.
echo You can proceed with manual testing if needed.
color 07

:test_endpoints
echo.
echo Step 5: Running automated endpoint tests on STAGING...
echo ========================================
echo.
echo 1. Testing GetSetList endpoint...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func-staging.azurewebsites.net/api/sets?code=%STAGING_KEY%"
echo.

echo 2. Testing GetCardsBySet endpoint (setId: 557)...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func-staging.azurewebsites.net/api/sets/557/cards?code=%STAGING_KEY%"
echo.

echo 3. Testing GetCardInfo endpoint (setId: 557, cardId: 73121)...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func-staging.azurewebsites.net/api/sets/557/cards/73121?code=%STAGING_KEY%"

echo.
echo ========================================
echo  Staging Environment Ready!
echo ========================================
echo.
echo Staging URL: https://pokedata-func-staging.azurewebsites.net
echo.
echo Manual test endpoints (with auth):
echo - https://pokedata-func-staging.azurewebsites.net/api/sets?code=%STAGING_KEY%
echo - https://pokedata-func-staging.azurewebsites.net/api/sets/557/cards?code=%STAGING_KEY%
echo - https://pokedata-func-staging.azurewebsites.net/api/sets/557/cards/73121?code=%STAGING_KEY%
echo.
echo ----------------------------------------
echo.

:staging_decision
set /p test_choice=Would you like to (T)est manually, (S)wap to production now, or (L)eave in staging? [T/S/L]: 

if /i "%test_choice%"=="T" goto manual_test
if /i "%test_choice%"=="S" goto perform_swap
if /i "%test_choice%"=="L" goto staging_complete
echo Invalid choice. Please enter T, S, or L.
goto staging_decision

:manual_test
echo.
echo Opening staging site in browser...
start "https://pokedata-func-staging.azurewebsites.net/api/sets?code=%STAGING_KEY%"
echo.
echo Please test the staging deployment in your browser.
echo.
set /p ready=Once testing is complete, swap to production? [Y/N]: 
if /i "%ready%"=="Y" goto perform_swap
if /i "%ready%"=="N" goto staging_complete
echo Invalid choice. Please enter Y or N.
goto manual_test

:perform_swap
echo.
echo Step 6: Swapping staging to production...
echo ----------------------------------------
call az functionapp deployment slot swap --name pokedata-func --resource-group pokedata-rg --slot staging --target-slot production

if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Slot swap failed with error code %ERRORLEVEL%.
    echo Your code remains in staging. You can retry the swap using option 3.
    goto error_end
)

echo.
echo Waiting for swap to complete (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Step 7: Verifying production deployment...
echo ========================================
echo.
echo Running automated endpoint tests on PRODUCTION...
echo.
echo 1. Testing GetSetList endpoint...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets?code=%PRODUCTION_KEY%"
echo.

echo 2. Testing GetCardsBySet endpoint (setId: 557)...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets/557/cards?code=%PRODUCTION_KEY%"
echo.

echo 3. Testing GetCardInfo endpoint (setId: 557, cardId: 73121)...
echo ----------------------------------------
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets/557/cards/73121?code=%PRODUCTION_KEY%"

color 0A
echo.
echo ========================================
echo  Production Deployment Complete!
echo ========================================
echo.
echo [SUCCESS] Your code is now live in production!
echo Production URL: https://pokedata-func.azurewebsites.net
echo.
echo The previous production version is now in the staging slot.
echo If you need to rollback, use option 3 to swap back.
echo.
goto success_end

:staging_complete
color 0A
echo.
echo ========================================
echo  Staging Deployment Complete!
echo ========================================
echo.
echo [OK] Your code remains in the staging slot for further testing.
echo Staging URL: https://pokedata-func-staging.azurewebsites.net
echo.
echo When ready, run this script again and choose option 3 to swap to production.
echo.
goto success_end

:emergency_deploy
echo.
echo ========================================
echo  EMERGENCY Direct Production Deploy
echo ========================================
echo.
color 0E
echo [WARNING] This will deploy directly to production without staging!
echo [WARNING] This bypasses all safety checks and testing phases!
echo.
set /p confirm=Are you sure you want to continue? [YES/NO]: 
if /i not "%confirm%"=="YES" (
    echo Deployment cancelled.
    goto start
)

color 07
echo.
echo Step 1: Building TypeScript...
cd /d "%~dp0"
call pnpm run build
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Build failed with error code %ERRORLEVEL%.
    goto error_end
)

echo Step 2: Deploying directly to PRODUCTION...
call func azure functionapp publish pokedata-func --javascript --cwd dist

if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Production deployment failed with error code %ERRORLEVEL%.
    goto error_end
)

color 0A
echo.
echo ========================================
echo  Emergency Deployment Complete!
echo ========================================
echo.
echo [OK] Direct production deployment completed.
echo [WARNING] No staging or testing was performed!
echo.
goto success_end

:swap_only
echo.
echo ========================================
echo  Swap Staging to Production
echo ========================================
echo.

echo Checking current staging slot...
echo Staging URL: https://pokedata-func-staging.azurewebsites.net
echo.
set /p confirm_swap=Swap staging to production now? [Y/N]: 
if /i not "%confirm_swap%"=="Y" (
    echo Swap cancelled.
    goto start
)

echo.
echo Performing slot swap...
call az functionapp deployment slot swap --name pokedata-func --resource-group pokedata-rg --slot staging --target-slot production

if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Slot swap failed with error code %ERRORLEVEL%.
    goto error_end
)

echo.
echo Waiting for swap to complete (15 seconds)...
timeout /t 15 /nobreak >nul

echo Verifying production...
echo.
echo 1. Testing GetSetList endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets?code=%PRODUCTION_KEY%"
echo.
echo 2. Testing GetCardsBySet endpoint (setId: 557)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets/557/cards?code=%PRODUCTION_KEY%"
echo.
echo 3. Testing GetCardInfo endpoint (setId: 557, cardId: 73121)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "https://pokedata-func.azurewebsites.net/api/sets/557/cards/73121?code=%PRODUCTION_KEY%"

color 0A
echo.
echo ========================================
echo  Swap Complete!
echo ========================================
echo.
echo [SUCCESS] Staging has been swapped to production!
echo The previous production version is now in staging.
echo.
goto success_end

:exit
echo Exiting...
goto end

:success_end
echo.
pause
color 07
goto cleanup

:error_end
echo.
pause
color 07
goto cleanup

:end
echo.
pause
color 07
goto cleanup

:cleanup
exit /b
