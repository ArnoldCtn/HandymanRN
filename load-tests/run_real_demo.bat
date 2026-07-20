@echo off
chcp 65001 >nul
echo ========================================
echo HandymanRN - Real Load Test Demo
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    pause
    exit /b 1
)

REM Check if backend is running
echo 🔍 Checking if backend is running...
curl -s http://localhost:8000/services/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend not detected at http://localhost:8000
    echo.
    echo Please start your backend first in another terminal:
    echo   cd backend
    echo   python manage.py runserver
    echo.
    pause
    exit /b 1
)

echo ✅ Backend is running!
echo.
echo ========================================
echo Running Real Load Tests
echo ========================================
echo.
echo This will run actual load tests and capture REAL metrics.
echo Tests will run with increasing load: 10, 25, 50, 100, 200 users
echo.
echo Total time: ~10-15 minutes
echo.
pause

REM Create results directory
if not exist "results" mkdir results

REM Test 1: 10 users
echo.
echo ========================================
echo Test 1/5: 10 concurrent users (1 minute)
echo ========================================
python -m locust -f locustfile.py --headless -u 10 -r 2 --run-time 1m --host http://localhost:8000 --html results/report_10.html --csv results/results_10
echo.
echo Test 1 complete! Check results/report_10.html for details
timeout /t 3 /nobreak >nul

REM Test 2: 25 users
echo.
echo ========================================
echo Test 2/5: 25 concurrent users (1 minute)
echo ========================================
python -m locust -f locustfile.py --headless -u 25 -r 3 --run-time 1m --host http://localhost:8000 --html results/report_25.html --csv results/results_25
echo.
echo Test 2 complete! Check results/report_25.html for details
timeout /t 3 /nobreak >nul

REM Test 3: 50 users
echo.
echo ========================================
echo Test 3/5: 50 concurrent users (2 minutes)
echo ========================================
python -m locust -f locustfile.py --headless -u 50 -r 5 --run-time 2m --host http://localhost:8000 --html results/report_50.html --csv results/results_50
echo.
echo Test 3 complete! Check results/report_50.html for details
timeout /t 3 /nobreak >nul

REM Test 4: 100 users
echo.
echo ========================================
echo Test 4/5: 100 concurrent users (3 minutes)
echo ========================================
python -m locust -f locustfile.py --headless -u 100 -r 10 --run-time 3m --host http://localhost:8000 --html results/report_100.html --csv results/results_100
echo.
echo Test 4 complete! Check results/report_100.html for details
timeout /t 3 /nobreak >nul

REM Test 5: 200 users
echo.
echo ========================================
echo Test 5/5: 200 concurrent users (3 minutes)
echo ========================================
python -m locust -f locustfile.py --headless -u 200 -r 15 --run-time 3m --host http://localhost:8000 --html results/report_200.html --csv results/results_200
echo.
echo Test 5 complete! Check results/report_200.html for details

echo.
echo ========================================
echo All Tests Complete!
echo ========================================
echo.
echo Opening results folder...
start results
echo.
echo 📊 View the HTML reports to see actual metrics:
echo   - results/report_10.html
echo   - results/report_25.html
echo   - results/report_50.html
echo   - results/report_100.html
echo   - results/report_200.html
echo.
echo 📄 CSV files with raw data:
echo   - results/results_10_stats.csv
echo   - results/results_25_stats.csv
echo   - results/results_50_stats.csv
echo   - results/results_100_stats.csv
echo   - results/results_200_stats.csv
echo.
pause