"""mobil/ klasorunu TEK bir .html dosyasina gomer.

Neden? Telefona gondermek icin. 7 dosyayi ayri ayri gondermek zahmetli;
bu betik yerler.js'i index.html'in icine gomup tek dosya uretir. O dosyayi
WhatsApp/e-posta ile gonderip telefonda acmak yeterlidir.

Calistirmak:  python tek_dosya_uret.py
Uretilen   :  ../Hava Durumu (telefon).html

NOT: Tek dosya surumunde servis calisani (cevrimdisi acilma) ve "ana ekrana
ekle" CALISMAZ; bunlar icin sitenin https ile yayinlanmasi gerekir.
"""

import os
import re

KLASOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mobil")
CIKTI = os.path.join(KLASOR, "..", "Hava Durumu (telefon).html")


def uret():
    with open(os.path.join(KLASOR, "index.html"), encoding="utf-8") as d:
        html = d.read()
    with open(os.path.join(KLASOR, "yerler.js"), encoding="utf-8") as d:
        yerler = d.read()

    # <script src="yerler.js"></script> -> dosyanin icerigini gom
    html = html.replace('<script src="yerler.js"></script>',
                        "<script>\n" + yerler + "\n</script>")

    # tek dosyada manifest / servis calisani anlamsiz -> cikar
    html = html.replace('<link rel="manifest" href="manifest.json">', "")
    html = html.replace('<link rel="apple-touch-icon" href="simge-192.png">', "")
    html = re.sub(r'if\("serviceWorker" in navigator\)\s*\n\s*navigator\.serviceWorker'
                  r'\.register\("sw\.js"\)\.catch\(\(\)=>\{\}\);',
                  "/* tek dosya surumu: servis calisani yok */", html)

    with open(CIKTI, "w", encoding="utf-8") as d:
        d.write(html)

    boyut = os.path.getsize(CIKTI) / 1024
    print(f"Uretildi: {os.path.basename(CIKTI)}  ({boyut:.0f} KB)")
    print("Bu TEK dosyayi telefona gonderip acabilirsiniz.")


if __name__ == "__main__":
    uret()
