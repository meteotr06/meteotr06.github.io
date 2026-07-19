@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

set GH="C:\Program Files\GitHub CLI\gh.exe"

echo ============================================
echo    UYGULAMAYI HERKESE ACMA
echo ============================================
echo.
echo Bu islem bittiginde elinizde su link olacak:
echo    https://KULLANICI-ADINIZ.github.io
echo.
echo Bu linki acan HERKES, HER YERDEN, HER ZAMAN
echo uygulamayi kullanabilir. Bilgisayariniz kapali olsa bile.
echo.
echo ONKOSUL: github.com'da ucretsiz hesabiniz olmali.
echo          (Yoksa once acin: https://github.com/signup)
echo.
pause
echo.

rem ---------- 1) hesap baglantisi ----------
%GH% auth status >nul 2>&1
if errorlevel 1 (
    echo [1/3] GitHub hesabiniza baglaniyoruz...
    echo.
    echo       Simdi ekranda 8 haneli bir KOD cikacak.
    echo       Tarayici acilacak, o kodu oraya yapistirin.
    echo.
    %GH% auth login --hostname github.com --git-protocol https --web
    if errorlevel 1 goto :hata_giris
) else (
    echo [1/3] GitHub hesabi zaten bagli.
)

rem kullanici adini al
for /f "delims=" %%u in ('%GH% api user --jq .login 2^>nul') do set KULLANICI=%%u
if "%KULLANICI%"=="" goto :hata_giris
rem depo adi "kullanici.github.io" olursa adres kisalir: https://kullanici.github.io
set DEPO=%KULLANICI%.github.io
echo       Hesap: %KULLANICI%
echo       Adres: https://%DEPO%
echo.

rem ---------- 2) depo olustur + dosyalari gonder ----------
echo [2/3] Dosyalar GitHub'a gonderiliyor...
rem mobil onbellek surumunu otomatik artir (yoksa kullanicilar eski surumde kalir)
python "kaynak\surum_artir.py" 2>nul
git add -A >nul 2>&1
git commit -q -m "guncelleme" >nul 2>&1
git branch -M main >nul 2>&1

%GH% repo view %KULLANICI%/%DEPO% >nul 2>&1
if errorlevel 1 (
    %GH% repo create %DEPO% --public --source=. --remote=origin --push
    if errorlevel 1 goto :hata_gonder
) else (
    echo       Depo zaten var, guncelleniyor...
    git remote remove origin >nul 2>&1
    git remote add origin https://github.com/%KULLANICI%/%DEPO%.git
    git push -u origin main
    if errorlevel 1 goto :hata_gonder
)
echo.

rem ---------- 3) web yayinini ac ----------
echo [3/3] Web yayini aciliyor...
%GH% api -X POST repos/%KULLANICI%/%DEPO%/pages -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 (
    %GH% api -X PUT repos/%KULLANICI%/%DEPO%/pages -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
)

echo.
echo ============================================
echo    YAYINDA!
echo ============================================
echo.
echo    https://%DEPO%
echo.
echo Ilk yayin 1-2 dakika surebilir.
echo Bu linki istediginiz kisiye gonderebilirsiniz.
echo Telefonda acip "Ana ekrana ekle" derseniz uygulama gibi durur.
echo.
echo Linki panoya kopyaliyorum...
echo https://%DEPO% | clip
echo (Kopyalandi - istediginiz yere yapistirabilirsiniz.)
echo.
pause
exit /b 0

:hata_giris
echo.
echo HATA: GitHub hesabina baglanilamadi.
echo   - github.com'da hesabiniz var mi?
echo   - Tarayicida kodu dogru yapistirdiniz mi?
echo.
pause
exit /b 1

:hata_gonder
echo.
echo HATA: Dosyalar gonderilemedi.
echo   - Internet baglantinizi kontrol edin.
echo   - Depo adi baskasinda olabilir; farkli bir ad deneyelim.
echo.
pause
exit /b 1
