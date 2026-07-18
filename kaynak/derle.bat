@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   Turkiye Hava Durumu - exe derleyici
echo ============================================
echo.

rem Python'u bul: once bilinen kurulum yerleri, sonra PATH
set "PY="
for %%P in (
    "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    "%ProgramFiles%\Python313\python.exe"
    "%ProgramFiles%\Python312\python.exe"
) do (
    if not defined PY if exist %%P set "PY=%%~P"
)
if not defined PY set "PY=python"

echo Python : %PY%
"%PY%" --version || goto :yok_python
echo.

echo [1/4] Gerekli paketler kontrol ediliyor...
"%PY%" -c "import tkintermapview" 2>nul
if errorlevel 1 (
    echo       harita eklentisi kuruluyor...
    "%PY%" -m pip install --quiet tkintermapview || goto :hata
)
"%PY%" -c "import pystray" 2>nul
if errorlevel 1 (
    echo       tepsi eklentisi kuruluyor...
    "%PY%" -m pip install --quiet pystray || goto :hata
)
"%PY%" -m PyInstaller --version >nul 2>&1
if errorlevel 1 (
    echo       PyInstaller kuruluyor...
    "%PY%" -m pip install --quiet pyinstaller || goto :hata
)

echo [2/4] Simge (ikon) yenileniyor...
"%PY%" simge_olustur.py >nul 2>&1

echo [3/4] exe derleniyor... ^(harita eklentileri yuzunden birkac dakika surebilir^)
"%PY%" -m PyInstaller --onefile --windowed --clean --noconfirm ^
    --name "Hava Durumu" --icon hava_durumu.ico ^
    --collect-all tkintermapview ^
    --collect-all certifi ^
    --collect-all pystray ^
    --collect-all darkdetect ^
    hava_durumu.py >nul 2>&1
if errorlevel 1 goto :hata

echo [4/4] exe ana klasore tasiniyor ve gecici dosyalar siliniyor...
move /y "dist\Hava Durumu.exe" "..\Hava Durumu.exe" >nul || goto :hata
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q __pycache__ 2>nul
del /q "Hava Durumu.spec" 2>nul

echo.
echo TAMAM. "Hava Durumu.exe" guncellendi (ust klasorde).
echo.
pause
exit /b 0

:yok_python
echo.
echo HATA: Python bulunamadi.
echo Kurmak icin: winget install Python.Python.3.12
echo.
pause
exit /b 1

:hata
echo.
echo HATA: derleme basarisiz oldu.
echo Ayrinti gormek icin bu komutu elle calistirabilirsiniz:
echo   python -m PyInstaller --onefile --windowed --name "Hava Durumu" hava_durumu.py
echo.
pause
exit /b 1
