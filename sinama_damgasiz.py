# -*- coding: utf-8 -*-
"""yayin_denetle.damgasiz() alet sinamasi.

NEDEN VAR (30.08.2026): Nobetci Hesap Araclari icin 62 dosyaya
"YAYIN KLASORUNE KOPYALANMAMIS" diyordu. 60'i yalnizca ?v=85 -> ?v=86
farkiydi. Ama o 60 sahte satirin ARASINDA gercek bir tane vardi:
emlak vergisi 2026 yasal tavani gelistirmede bitmis, yayina hic
gitmemisti -- para etkileyen bir eksik, gunlerdir gorulmuyordu.

Gurultu uyariyi susturmaz, GOMER.

Damgayi eleyen kod eklendi. Ama o kodun kendi tehlikesi var: damganin
YANINDAKI gercek degisikligi de yutabilir. Yutarsa para etkileyen bir
duzeltme "yalniz surum damgasi" diye sessiz sinifa duser -- gomulen
tavanin aynisi, bu kez bizim elimizle.

Bu dosya tam onu sinar. Kosum:  python sinama_damgasiz.py
"""
import sys
import importlib.util

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
_sp = importlib.util.spec_from_file_location("nobetci", "yayin_denetle.py")
_m = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(_m)

TEMEL = b'<link href="stil.css?v=85" />\nconst ORAN = 0.001;\n'

DURUMLAR = [
    ("yalniz damga",
     b'<link href="stil.css?v=86" />\nconst ORAN = 0.001;\n', True),
    # ASIL SINAMA: damga da degismis, ORAN da. Yutulursa alet kullanilmaz.
    ("damga + GERCEK degisim",
     b'<link href="stil.css?v=86" />\nconst ORAN = 0.002;\n', False),
    ("yalniz gercek degisim",
     b'<link href="stil.css?v=85" />\nconst ORAN = 0.002;\n', False),
    ("satir sonu farki",
     b'<link href="stil.css?v=85" />\r\nconst ORAN = 0.001;\r\n', True),
    ("sw.js SURUM etiketi",
     b'const SURUM = "hesap-v86";\n', None),   # asagida ayrica kurulur
]


def kos():
    tamam = True
    for ad, karsi, beklenen in DURUMLAR:
        if beklenen is None:
            a = b'const SURUM = "hesap-v85";\n'
            ayni = _m.damgasiz(a, "sw.js") == _m.damgasiz(karsi, "sw.js")
            beklenen = True
        else:
            ayni = _m.damgasiz(TEMEL, "x.js") == _m.damgasiz(karsi, "x.js")
        ok = (ayni == beklenen)
        tamam &= ok
        print("  %-24s ayni=%-5s beklenen=%-5s  %s"
              % (ad, ayni, beklenen, "tamam" if ok else ">>> ALET BOZUK <<<"))
    print()
    print("SONUC:", "alet guvenilir" if tamam else "ALET KULLANILMAZ")
    return 0 if tamam else 1


if __name__ == "__main__":
    sys.exit(kos())
