@echo off
chcp 65001 >nul
echo ========================================
echo HandymanRN Scalability Load Tests
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt -q

REM Check if backend is running
echo.
echo 🔍 Checking if backend is running on http://localhost:8000...
curl -s http://localhost:8000/api/services/ >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend not detected at http://localhost:8000
    echo.
    echo Please start your backend first:
    echo   1. Open a new terminal
    echo   2. Navigate to backend folder: cd backend
    echo   3. Start server: python manage.py runserver
    echo.
    echo Or if using Docker:
    echo   docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo ✅ Backend is running!
echo.
echo ========================================
echo Select Test Scenario:
echo ========================================
echo 1. Light Load Test (50 users, 5 min)
echo 2. Medium Load Test (200 users, 10 min)
echo 3. Heavy Load Test (1000 users, 15 min)
echo 4. Stress Test (5000 users, 30 min)
echo 5. Spike Test (2000 users, 10 min)
echo 6. Custom Test
echo 7. Exit
echo ========================================
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto light_load
if "%choice%"=="2" goto medium_load
if "%choice%"=="3" goto heavy_load
if "%choice%"=="4" goto stress_test
if "%choice%"=="5" goto spike_test
if "%choice%"=="6" goto custom
if "%choice%"=="7" goto end
goto end

:light_load
echo.
echo 🚀 Starting Light Load Test (50 users, 5 minutes)...
echo.
locust -f locustfile.py --headless -u 50 -r 5 --run-time 5m --host http://localhost:8000 --html report_light_load.html
goto end

:medium_load
echo.
echo 🚀 Starting Medium Load Test (200 users, 10 minutes)...
echo.
locust -f locustfile.py --headless -u 200 -r 10 --run-time 10m --host http://localhost:8000 --html report_medium_load.html
goto end

:heavy_load
echo.
echo 🚀 Starting Heavy Load Test (1000 users, 15 minutes)...
echo.
locust -f locustfile.py --headless -u 1000 -r 20 --run-time 15m --host http://localhost:8000 --html report_heavy_load.html
goto end

:stress_test
echo.
echo 🚀 Starting Stress Test (5000 users, 30 minutes)...
echo ⚠️  This will push your system to its limits!
echo.
pause
locust -f locustfile.py --headless -u 5000 -r 50 --run-time 30m --host http://localhost:8000 --html report_stress_test.html
goto end

:spike_test
echo.
echo 🚀 Starting Spike Test (2000 users, 10 minutes)...
echo.
locust -f locustfile.py --headless -u 2000 -r 100 --run-time 10m --host http://localhost:8000 --html report_spike_test.html
goto end

:custom
echo.
set /p users="Enter number of users: "
set /p spawn_rate="Enter spawn rate (users/second): "
set /p run_time="Enter run time (e.g., 10m, 1h): "
echo.
echo 🚀 Starting Custom Test (%users% users, %spawn_rate% spawn rate, %run_time%)...
echo.
locust -f locustfile.py --headless -u %users% -r %spawn_rate% --run-time %run_time% --host http://localhost:8000 --html report_custom.html
goto end

:end
echo.
echo ✅ Test completed! Check the HTML report for results.
pause