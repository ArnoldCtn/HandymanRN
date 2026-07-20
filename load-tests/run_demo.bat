@echo off
chcp 65001 >nul
echo ========================================
echo HandymanRN - Load Limit Demo
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if backend is running
echo 🔍 Checking if backend is running...
curl -s http://localhost:8000/api/services/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend not detected at http://localhost:8000
    echo.
    echo Please start your backend first:
    echo   1. Open a new terminal
    echo   2. Navigate to backend folder: cd backend
    echo   3. Start server: python manage.py runserver
    echo.
    echo Then run this demo again.
    pause
    exit /b 1
)

echo ✅ Backend is running!
echo.
echo ========================================
echo Starting Load Limit Demo...
echo ========================================
echo.
echo This will test your app with increasing load:
echo   - 10 users (light)
echo   - 25 users (light)
echo   - 50 users (medium)
echo   - 100 users (medium)
echo   - 200 users (heavy)
echo   - 500 users (stress)
echo   - 1000 users (breaking point)
echo.
echo Total time: ~15-20 minutes
echo.
pause

REM Run the demo
python demo_load_limit.py

echo.
echo ========================================
echo Demo Complete!
echo ========================================
echo.
echo Check the results above to see your app's load limit.
echo.
pause