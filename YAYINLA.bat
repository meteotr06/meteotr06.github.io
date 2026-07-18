@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   Turkiye Hava Durumu - GitHub'a yayinla
echo ============================================
echo.
echo ONCE sunlari yapmis olmalisiniz:
echo   1) github.com'da ucretsiz hesap actiniz
echo   2) BOS bir depo (repository) olusturdunuz
echo      - "Add a README" kutusunu ISARETLEMEYIN
echo.

set /p KULLANICI="GitHub kullanici adiniz: "
if "%KULLANICI%"=="" goto :iptal
set /p DEPO="Depo adi (ornek: hava-durumu): "
if "%DEPO%"=="" goto :iptal

echo.
echo Gonderilecek: https://github.com/%KULLANICI%/%DEPO%
set /p ONAY="Devam edilsin mi? (E/H): "
if /i not "%ONAY%"=="E" goto :iptal

echo.
echo [1/3] Degisiklikler kaydediliyor...
git add -A >nul 2>&1
git commit -q -m "guncelleme" >nul 2>&1

echo [2/3] GitHub adresi ayarlaniyor...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%KULLANICI%/%DEPO%.git
git branch -M main

echo [3/3] Gonderiliyor... (ilk seferde GitHub sifresi/token isteyebilir)
git push -u origin main
if errorlevel 1 goto :hata

echo.
echo ============================================
echo   GONDERILDI!
echo ============================================
echo.
echo SON ADIM (bir kez yapilir):
echo   1) https://github.com/%KULLANICI%/%DEPO%/settings/pages adresini acin
echo   2) "Source" bolumunde: Deploy from a branch
echo   3) Branch: main  /  klasor: / (root)  -^> Save
echo   4) 1-2 dakika bekleyin
echo.
echo Sonra siteniz burada yayinda olacak:
echo   https://%KULLANICI%.github.io/%DEPO%/
echo.
echo Bu linki telefonunuzda acip "Ana ekrana ekle" diyebilirsiniz.
echo Istediginiz kisiye de gonderebilirsiniz.
echo.
pause
exit /b 0

:hata
echo.
echo HATA: Gonderilemedi.
echo   - Depo adini dogru yazdiniz mi?
echo   - Depoyu BOS olusturdunuz mu?
echo   - GitHub kullanici adi/token dogru mu?
echo.
pause
exit /b 1

:iptal
echo.
echo Iptal edildi.
pause
exit /b 1
