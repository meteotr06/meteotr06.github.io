"""Mobil surumun onbellek numarasini otomatik gunceller.

NEDEN GEREKLI?
Telefona "ana ekrana ekle" yapan kullanicilarda servis calisani (sw.js)
uygulamayi ONBELLEGE alir. Numara degismezse kullanici, sitede yeni surum
olsa bile ESKI surumu gormeye devam eder.

Bu betik her yayinda numarayi tarih-saate cevirir; boylece tarayici
"yeni surum var" der ve gunceller. YAYINLA.bat bunu otomatik cagirir.
"""

import datetime
import pathlib
import re

SW = pathlib.Path(__file__).resolve().parent.parent / "mobil" / "sw.js"


def artir():
    metin = SW.read_text(encoding="utf-8")
    yeni = "hava-durumu-" + datetime.datetime.now().strftime("%Y%m%d-%H%M")
    yeni_metin, adet = re.subn(r'const ONBELLEK = "[^"]*"',
                               f'const ONBELLEK = "{yeni}"', metin)
    if adet == 0:
        print("UYARI: sw.js icinde ONBELLEK satiri bulunamadi!")
        return False
    SW.write_text(yeni_metin, encoding="utf-8")
    print(f"Onbellek surumu guncellendi -> {yeni}")
    return True


if __name__ == "__main__":
    artir()
