@echo off
echo ========================================
echo RapidRoute Driver App - Fresh Start
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Clearing cache...
call npx expo start -c --no-dev

echo.
echo [2/4] Checking if node_modules exists...
if exist "node_modules\" (
    echo Node modules found. Skipping install.
) else (
    echo Node modules not found. Installing...
    call npm install
)

echo.
echo [3/4] Verifying critical files...
if not exist "babel.config.js" (
    echo ERROR: babel.config.js missing!
    echo Please run install-packages.bat first.
    pause
    exit /b 1
)

if not exist "global.css" (
    echo ERROR: global.css missing!
    pause
    exit /b 1
)

if not exist "utils\supabase.ts" (
    echo ERROR: utils\supabase.ts missing!
    pause
    exit /b 1
)

echo All critical files present ✓

echo.
echo [4/4] Starting Expo development server...
echo.
echo ========================================
echo Ready! Choose your platform:
echo   - Press 'a' for Android
echo   - Press 'i' for iOS
echo   - Scan QR code for physical device
echo ========================================
echo.

call npx expo start

pause
