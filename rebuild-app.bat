@echo off
echo Rebuilding PokeData application with CSS fixes...

echo Step 1: Cleaning build directory...
if exist public\build\bundle.css del public\build\bundle.css
if exist public\build\main.js del public\build\main.js

echo Step 2: Running Rollup to rebuild the application...
call npx rollup -c rollup.config.cjs

echo Step 3: Updating cache-busting parameters...
powershell -Command "(Get-Content public\index.html) -replace 'global.css\?v=\d+', 'global.css?v=%date:~10,4%%date:~4,2%%date:~7,2%' -replace 'bundle.css\?v=\d+', 'bundle.css?v=%date:~10,4%%date:~4,2%%date:~7,2%' | Set-Content public\index.html"

echo Build complete!
echo.
echo Please test the application by clearing your cache and reloading the page.
echo If you're still experiencing issues, try running the following commands:
echo.
echo   1. pnpm dev     (to start the development server)
echo   2. Open http://localhost:3000 in your browser
echo.
echo The CSS loading issue should now be fixed, and the application should load properly.
