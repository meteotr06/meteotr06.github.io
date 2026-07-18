"""Windows bildirimi (toast) gosterir.

Ekstra Python paketi GEREKMEZ. Windows'un kendi bildirim sistemini
(Windows.UI.Notifications) PowerShell uzerinden cagirir. Turkce karakterler
bozulmasin diye PowerShell betigi gecici bir UTF-8 dosyaya yazilir.

Kullanim:
    import bildirim
    bildirim.goster("Baslik", "Mesaj metni")
"""

import os
import subprocess
import tempfile
from xml.sax.saxutils import escape

# PowerShell/exe konsol penceresi acilmasin diye
_PENCERESIZ = 0x08000000  # subprocess.CREATE_NO_WINDOW

# Bildirim, Windows'ta "Windows PowerShell" uygulamasi adina gosterilir.
# Bu, Windows'ta zaten kayitli oldugu icin ek kurulum gerektirmez.
_APP_ID = r"{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe"

_BETIK = '''$ErrorActionPreference = "SilentlyContinue"
[void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime]
$AppId = "{app_id}"
$doc = New-Object Windows.Data.Xml.Dom.XmlDocument
$doc.LoadXml(@'
{xml}
'@)
$toast = New-Object Windows.UI.Notifications.ToastNotification $doc
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppId).Show($toast)
'''


def goster(baslik, metin):
    """Bir Windows bildirimi gosterir. Basarili olursa True doner.

    Hata olursa (ornegin cok eski Windows) sessizce False doner; uygulama
    bu yuzden cokmesin diye.
    """
    xml = (
        "<toast><visual>"
        '<binding template="ToastGeneric">'
        f"<text>{escape(baslik)}</text>"
        f"<text>{escape(metin)}</text>"
        "</binding></visual></toast>"
    )
    betik = _BETIK.format(app_id=_APP_ID, xml=xml)

    yol = None
    try:
        # UTF-8 BOM ile yaz: PowerShell 5.1 Turkce'yi boyle dogru okur
        with tempfile.NamedTemporaryFile(
                "w", suffix=".ps1", delete=False, encoding="utf-8-sig") as dosya:
            dosya.write(betik)
            yol = dosya.name

        subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
             "-WindowStyle", "Hidden", "-File", yol],
            creationflags=_PENCERESIZ, timeout=20,
            # DIKKAT: penceresiz (konsolsuz) exe'de stdin gecersizdir; acikca
            # DEVNULL vermezsek subprocess askida kalabilir.
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return True
    except Exception:
        return False
    finally:
        if yol:
            try:
                os.remove(yol)
            except OSError:
                pass


if __name__ == "__main__":
    # Dogrudan calistirinca ornek bildirim gosterir
    print("Ornek bildirim gonderiliyor...")
    ok = goster("Yarının hava durumu",
                "İstanbul: 23° / 30°C, açık. Rüzgâr en çok 20 km/s.")
    print("Sonuc:", "gonderildi" if ok else "gonderilemedi")
