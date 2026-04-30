@echo off
echo Installing RapidRoute Driver App Dependencies...
echo.

cd mobile\rapidroute

echo [1/3] Installing NativeWind and Tailwind CSS...
call npm install nativewind tailwindcss

echo.
echo [2/3] Installing Supabase and dependencies...
call npm install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage

echo.
echo [3/3] Installing additional dependencies...
call npm install expo-sqlite expo-network expo-camera expo-location react-native-maps expo-notifications axios

echo.
echo ✅ All packages installed successfully!
echo.
echo Next steps:
echo 1. Run: npx tailwindcss init
echo 2. Configure tailwind.config.js
echo 3. Update app.json for pure black theme
echo.
pause
