@echo off
echo Rebuilding CSS bundle for PokeData...

echo Cleaning build directory...
if exist public\build\bundle.css del public\build\bundle.css

echo Running Rollup to rebuild CSS bundle...
npx rollup -c rollup.config.cjs

echo Build complete!
echo.
echo Please test the application by clearing your cache and reloading the page.
