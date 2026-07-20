  @echo off
chcp 65001 >nul
echo ========================================
echo HandymanRN - Load Test Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment exists
)

echo.
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 📥 Installing dependencies...
pip install -r requirements.txt -q

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo ✅ All dependencies installed
echo ✅ Virtual environment ready
echo.
echo Next steps:
echo   1. Start backend: cd backend ^& python manage.py runserver
echo   2. Run demo: Double-click run_real_demo.bat
echo.
pause