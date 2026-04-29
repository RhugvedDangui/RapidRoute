@echo off
REM Load realistic Goa orders for testing batching
REM All orders are in North Goa region (10-15 km radius)

echo ========================================
echo   Loading Goa Sample Orders
echo ========================================
echo.
echo This will send 12 orders from different locations in North Goa
echo Time windows: Morning (3), Afternoon (5), Evening (4)
echo.

set BASE_URL=http://localhost:3000
set ENDPOINT=/webhook/order

REM Morning orders (8:30 - 10:30)
echo [1/12] Assagao - Morning
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20001, \"total\": \"499.00\", \"date_created\": \"2026-04-29T08:30:00\", \"shipping\": {\"first_name\": \"Rahul\", \"last_name\": \"Sharma\", \"address_1\": \"Agnel Institute of Technology\", \"address_2\": \"Assagao\", \"city\": \"Bardez\", \"state\": \"Goa\", \"postcode\": \"403507\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [2/12] Mapusa - Morning
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20002, \"total\": \"850.00\", \"date_created\": \"2026-04-29T09:15:00\", \"shipping\": {\"first_name\": \"Priya\", \"last_name\": \"Desai\", \"address_1\": \"Mapusa Market\", \"address_2\": \"Near Bus Stand\", \"city\": \"Mapusa\", \"state\": \"Goa\", \"postcode\": \"403507\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [3/12] Anjuna - Morning
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20003, \"total\": \"1200.00\", \"date_created\": \"2026-04-29T10:00:00\", \"shipping\": {\"first_name\": \"Amit\", \"last_name\": \"Patel\", \"address_1\": \"Anjuna Beach Road\", \"address_2\": \"Near Flea Market\", \"city\": \"Anjuna\", \"state\": \"Goa\", \"postcode\": \"403509\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [4/12] Vagator - Morning
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20010, \"total\": \"890.00\", \"date_created\": \"2026-04-29T09:45:00\", \"shipping\": {\"first_name\": \"Meera\", \"last_name\": \"Iyer\", \"address_1\": \"Vagator Beach Road\", \"address_2\": \"Near Chapora Fort\", \"city\": \"Vagator\", \"state\": \"Goa\", \"postcode\": \"403509\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [5/12] Morjim - Morning
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20011, \"total\": \"1050.00\", \"date_created\": \"2026-04-29T10:30:00\", \"shipping\": {\"first_name\": \"Sanjay\", \"last_name\": \"Kumar\", \"address_1\": \"Morjim Beach Road\", \"address_2\": \"Near Turtle Beach\", \"city\": \"Morjim\", \"state\": \"Goa\", \"postcode\": \"403512\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

REM Afternoon orders (14:20 - 15:30)
echo [6/12] Calangute - Afternoon
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20004, \"total\": \"675.00\", \"date_created\": \"2026-04-29T14:20:00\", \"shipping\": {\"first_name\": \"Sneha\", \"last_name\": \"Reddy\", \"address_1\": \"Calangute Beach Road\", \"address_2\": \"Near Infantaria\", \"city\": \"Calangute\", \"state\": \"Goa\", \"postcode\": \"403516\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [7/12] Baga - Afternoon
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20005, \"total\": \"920.00\", \"date_created\": \"2026-04-29T14:45:00\", \"shipping\": {\"first_name\": \"Vikram\", \"last_name\": \"Singh\", \"address_1\": \"Baga Beach Road\", \"address_2\": \"Near Tito's Lane\", \"city\": \"Baga\", \"state\": \"Goa\", \"postcode\": \"403516\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [8/12] Candolim - Afternoon
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20006, \"total\": \"550.00\", \"date_created\": \"2026-04-29T15:30:00\", \"shipping\": {\"first_name\": \"Neha\", \"last_name\": \"Gupta\", \"address_1\": \"Candolim Beach Road\", \"address_2\": \"Near Fort Aguada\", \"city\": \"Candolim\", \"state\": \"Goa\", \"postcode\": \"403515\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [9/12] Sinquerim - Afternoon
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20012, \"total\": \"720.00\", \"date_created\": \"2026-04-29T15:00:00\", \"shipping\": {\"first_name\": \"Anjali\", \"last_name\": \"Rao\", \"address_1\": \"Sinquerim Beach\", \"address_2\": \"Near Taj Hotel\", \"city\": \"Sinquerim\", \"state\": \"Goa\", \"postcode\": \"403515\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

REM Evening orders (18:00 - 19:00)
echo [10/12] Porvorim - Evening
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20007, \"total\": \"1100.00\", \"date_created\": \"2026-04-29T18:00:00\", \"shipping\": {\"first_name\": \"Arjun\", \"last_name\": \"Mehta\", \"address_1\": \"Porvorim Industrial Estate\", \"address_2\": \"Near Goa University\", \"city\": \"Porvorim\", \"state\": \"Goa\", \"postcode\": \"403521\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [11/12] Panaji - Evening
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20008, \"total\": \"780.00\", \"date_created\": \"2026-04-29T18:30:00\", \"shipping\": {\"first_name\": \"Kavita\", \"last_name\": \"Nair\", \"address_1\": \"Panjim Church Square\", \"address_2\": \"Near Municipal Garden\", \"city\": \"Panaji\", \"state\": \"Goa\", \"postcode\": \"403001\", \"country\": \"India\"}}" > nul
timeout /t 2 /nobreak >nul

echo [12/12] Siolim - Evening
curl -s -X POST "%BASE_URL%%ENDPOINT%" -H "Content-Type: application/json" -d "{\"id\": 20009, \"total\": \"640.00\", \"date_created\": \"2026-04-29T19:00:00\", \"shipping\": {\"first_name\": \"Rohan\", \"last_name\": \"Joshi\", \"address_1\": \"Siolim Village\", \"address_2\": \"Near Chapel\", \"city\": \"Siolim\", \"state\": \"Goa\", \"postcode\": \"403517\", \"country\": \"India\"}}" > nul

echo.
echo ========================================
echo ✅ All 12 orders loaded successfully!
echo ========================================
echo.
echo Summary:
echo - Morning orders: 5 (Assagao, Mapusa, Anjuna, Vagator, Morjim)
echo - Afternoon orders: 4 (Calangute, Baga, Candolim, Sinquerim)
echo - Evening orders: 3 (Porvorim, Panaji, Siolim)
echo.
echo Next step: Run batching
echo   cd ..\batching
echo   python batch_orders_simple.py
echo.
pause
