@echo off
REM Run the full RapidRoute pipeline
REM Phase 1: Batching + Phase 2: Route Optimization

echo ========================================
echo   RapidRoute - Full Pipeline
echo ========================================
echo.

REM Check if in correct directory
if not exist "batch_orders.py" (
    echo ERROR: batch_orders.py not found
    echo Please run this script from the batching folder
    pause
    exit /b 1
)

echo Running full optimization pipeline...
echo.

python run_full_pipeline.py

echo.
echo ========================================
echo Pipeline execution completed
echo ========================================
pause
