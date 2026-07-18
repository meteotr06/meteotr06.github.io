"""Turkiye Hava Durumu - Windows masaustu arayuzu (tkinter + harita).

Bu dosya pencereyi ve haritayi cizer, tuslari/olaylari veriye baglar.
Hava verisini kendisi hesaplamaz; onu hava_cekirdek.py'den ister. Il
koordinatlarini da sehirler.py'den alir. Boylece is bolumu net:

    sehirler.py      -> hangi il nerede (adres defteri)
    hava_cekirdek.py -> internetten veri (motor)
    hava_durumu.py   -> pencere + harita (bu dosya)

Kullanim:
  - Sol ustten il sec ya da HARITADA bir yere tikla.
  - Ust kart "su an"i, alttaki liste "saat saat" tahmini gosterir.

Gerekli paket: tkintermapview  (pip install tkintermapview)
"""

import datetime
import json
import math
import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import ttk

from tkintermapview import TkinterMapView
from PIL import Image as _Image

# tkintermapview'in radar OVERLAY kodu eski "Image.ANTIALIAS" sabitini kullanir;
# bu sabit Pillow 10+ ile kaldirildi. Uyumluluk icin geri tanimliyoruz — yoksa
# radar acilinca butun harita dosemeleri hata verip harita bembeyaz olur.
if not hasattr(_Image, "ANTIALIAS"):
    _Image.ANTIALIAS = _Image.Resampling.LANCZOS

import bildirim
import sehirler
from hava_cekirdek import (gun_mesaji, gun_ozeti, hava_al, hava_kalitesi_al,
                           model_karsilastir, radar_url, siddetli_hava,
                           sonraki_yagis, yer_ara, yarin_mesaji, yarin_ozeti)

# ---------- renkler (tema) ----------
# Iki tema var. Kod her yerde ARKA, PANEL... isimli GLOBAL degiskenleri kullanir;
# tema_uygula() bunlari secilen palete gore doldurur. Boylece TEK fonksiyon butun
# uygulamanin rengini degistirir.
_KOYU = {
    "arka": "#0f1620", "panel": "#1c2733", "ickart": "#0e1620",
    "cizgi": "#243444", "secili": "#12324f",
    "yazi": "#ffffff", "yazi2": "#9fb0c0", "yazi3": "#5a6b7d",
    "vurgu": "#1f8fff", "btn2": "#2f4256", "hata": "#ff8a8a",
    "nem": "#4aa3ff", "ruzgar": "#7fd4ff", "yagis": "#54c6ff",
    "gunes": "#ffd23b", "bulut": "#cdd8e4", "bulut_k": "#9fb0c0",
    "damla": "#4aa3ff", "kar": "#eaf4ff",
}
_ACIK = {
    "arka": "#eef1f5", "panel": "#ffffff", "ickart": "#e9eef4",
    "cizgi": "#d3dae3", "secili": "#d6e8ff",
    "yazi": "#17212b", "yazi2": "#48586a", "yazi3": "#8393a3",
    "vurgu": "#1f8fff", "btn2": "#dbe3ec", "hata": "#d64545",
    "nem": "#1f7fe0", "ruzgar": "#2a94cc", "yagis": "#1f86d0",
    "gunes": "#f4b400", "bulut": "#a7b4c3", "bulut_k": "#7c8c9e",
    "damla": "#2a86e0", "kar": "#bcd7ee",
}

BEYAZ = "#ffffff"        # vurgu (mavi) butonlarda yazi hep beyaz
YAZI_TIPI = "Segoe UI"

# tema_uygula() bu global degiskenleri doldurur (varsayilan koyu)
ARKA = PANEL = ICKART = CIZGI = SECILI = ""
YAZI = YAZI2 = YAZI3 = VURGU = BTN2 = HATA_R = ""
NEM_R = RUZGAR_R = YAGIS_R = ""
GUNES_R = BULUT_R = BULUT_K = DAMLA_R = KAR_R = ""


def tema_uygula(koyu=True):
    """Secilen temanin renklerini global degiskenlere yazar."""
    p = _KOYU if koyu else _ACIK
    global ARKA, PANEL, ICKART, CIZGI, SECILI, YAZI, YAZI2, YAZI3, VURGU
    global BTN2, HATA_R, NEM_R, RUZGAR_R, YAGIS_R
    global GUNES_R, BULUT_R, BULUT_K, DAMLA_R, KAR_R
    ARKA, PANEL, ICKART = p["arka"], p["panel"], p["ickart"]
    CIZGI, SECILI = p["cizgi"], p["secili"]
    YAZI, YAZI2, YAZI3, VURGU = p["yazi"], p["yazi2"], p["yazi3"], p["vurgu"]
    BTN2, HATA_R = p["btn2"], p["hata"]
    NEM_R, RUZGAR_R, YAGIS_R = p["nem"], p["ruzgar"], p["yagis"]
    GUNES_R, BULUT_R = p["gunes"], p["bulut"]
    BULUT_K, DAMLA_R, KAR_R = p["bulut_k"], p["damla"], p["kar"]


tema_uygula(True)   # import aninda koyu; __init__ sisteme/tercihe gore gunceller

# ---------- havaya gore ust kart zemini ----------
# Arka plani tamamen degistirmiyoruz; kartin zeminini havaya gore "tint"
# ediyoruz. Boylece yazi/zemin karsitligi (okunabilirlik) hep korunur.
HERO_KOYU = {
    "gunes": "#14344f", "gunes_gece": "#111f38", "gunes_bulut": "#1a3348",
    "bulut": "#202c38", "yagmur": "#16262f", "kar": "#1d2c3a",
    "firtina": "#251f3a", "sis": "#252c33",
}
HERO_ACIK = {
    "gunes": "#d7ecff", "gunes_gece": "#dfe5ee", "gunes_bulut": "#e0eefb",
    "bulut": "#e4eaf1", "yagmur": "#dde6ee", "kar": "#e6f1fa",
    "firtina": "#e2ddee", "sis": "#e6eaee",
}

VARSAYILAN_IL = "İzmir"   # acilista gosterilen yer (favorilerin ilki kullanilir)

# ust sagdaki ipucu yazisi (tek yerde dursun ki her yerde ayni olsun)
IPUCU = "İl/ilçe seçin veya haritaya tıklayın"

# harita doseme (tile) sunuculari
HARITA_NORMAL = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
HARITA_UYDU = ("https://server.arcgisonline.com/ArcGIS/rest/services/"
               "World_Imagery/MapServer/tile/{z}/{y}/{x}")

AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
         "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma",
          "Cumartesi", "Pazar"]


# ======================================================================
#  Hava durumu resmi cizen fonksiyon
#  Ayni fonksiyon hem buyuk (ust kart) hem kucuk (saatlik) ikonu cizer;
#  fark sadece yaricap r'de. Boylece tek yerde tanimli, her yerde ayni.
# ======================================================================

def hava_ikonu(tuval, cx, cy, r, kategori):
    """(cx, cy) merkezli, r "yaricapli" bir hava resmi cizer."""
    if kategori == "gunes":
        _gunes(tuval, cx, cy, r)
    elif kategori == "gunes_bulut":
        _gunes(tuval, cx - r * 0.35, cy - r * 0.35, r * 0.6)
        _bulut(tuval, cx + r * 0.15, cy + r * 0.2, r * 0.85, BULUT_R)
    elif kategori == "bulut":
        _bulut(tuval, cx, cy, r, BULUT_R)
    elif kategori == "sis":
        _bulut(tuval, cx, cy - r * 0.15, r, BULUT_K)
        for i in range(3):
            y = cy + r * (0.5 + i * 0.28)
            tuval.create_line(cx - r * 0.8, y, cx + r * 0.8, y,
                              fill=BULUT_K, width=max(2, int(r * 0.12)),
                              capstyle="round")
    elif kategori == "yagmur":
        _bulut(tuval, cx, cy - r * 0.2, r, BULUT_R)
        _damlalar(tuval, cx, cy + r * 0.55, r, DAMLA_R)
    elif kategori == "kar":
        _bulut(tuval, cx, cy - r * 0.2, r, BULUT_R)
        _kar(tuval, cx, cy + r * 0.6, r)
    elif kategori == "firtina":
        _bulut(tuval, cx, cy - r * 0.2, r, BULUT_K)
        _simsek(tuval, cx, cy + r * 0.5, r)
    else:
        _bulut(tuval, cx, cy, r, BULUT_R)


def _gunes(tuval, cx, cy, r):
    kalinlik = max(2, int(r * 0.16))
    for aci in range(0, 360, 45):
        rad = math.radians(aci)
        tuval.create_line(cx + math.cos(rad) * r * 1.25,
                          cy + math.sin(rad) * r * 1.25,
                          cx + math.cos(rad) * r * 1.7,
                          cy + math.sin(rad) * r * 1.7,
                          fill=GUNES_R, width=kalinlik, capstyle="round")
    tuval.create_oval(cx - r, cy - r, cx + r, cy + r, fill=GUNES_R, outline="")


def _bulut(tuval, cx, cy, r, renk):
    # uc yumak + duz taban -> bulut sekli
    def yumak(px, py, pr):
        tuval.create_oval(px - pr, py - pr, px + pr, py + pr,
                          fill=renk, outline="")
    yumak(cx - r * 0.5, cy + r * 0.12, r * 0.5)
    yumak(cx, cy - r * 0.28, r * 0.62)
    yumak(cx + r * 0.5, cy + r * 0.12, r * 0.52)
    tuval.create_rectangle(cx - r * 0.95, cy + r * 0.1,
                          cx + r * 0.95, cy + r * 0.62,
                          fill=renk, outline="")


def _damlalar(tuval, cx, cy, r, renk):
    kalinlik = max(2, int(r * 0.13))
    for dx in (-0.5, 0.0, 0.5):
        x = cx + dx * r
        tuval.create_line(x + r * 0.12, cy, x - r * 0.12, cy + r * 0.55,
                          fill=renk, width=kalinlik, capstyle="round")


def _kar(tuval, cx, cy, r):
    for dx in (-0.5, 0.0, 0.5):
        x = cx + dx * r
        tuval.create_oval(x - r * 0.1, cy + r * 0.15,
                          x + r * 0.1, cy + r * 0.35,
                          fill=KAR_R, outline="")


def _simsek(tuval, cx, cy, r):
    tuval.create_polygon(
        cx + r * 0.1, cy,
        cx - r * 0.35, cy + r * 0.5,
        cx - r * 0.02, cy + r * 0.5,
        cx - r * 0.2, cy + r * 0.95,
        cx + r * 0.4, cy + r * 0.35,
        cx + r * 0.05, cy + r * 0.35,
        fill=GUNES_R, outline="")


# ======================================================================
#  Ayarlar ve "her sabah" gorevi (pencereden bagimsiz)
# ======================================================================
#
#  Sabah bildirimi su mantikla calisir:
#   1) Kullanici bir il secip "Her sabah bildir"e basar.
#   2) Secili il bir ayar dosyasina yazilir (ayar_yaz).
#   3) Windows Gorev Zamanlayici'ya gunluk gorev eklenir; bu gorev exe'yi
#      "--sabah" ile calistirir (gorev_kur).
#   4) Her sabah exe "--sabah" ile acilir, PENCERE ACMADAN ayar dosyasindaki
#      ilin yarinki havasini cekip bildirim gosterir (sabah_modu).

GOREV_ADI = "HavaDurumuSabahBildirimi"
_PENCERESIZ = 0x08000000  # subprocess.CREATE_NO_WINDOW (konsol acilmasin)


def _ayar_yolu():
    taban = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    klasor = os.path.join(taban, "HavaDurumu")
    os.makedirs(klasor, exist_ok=True)
    return os.path.join(klasor, "ayarlar.json")


def ayar_yaz(veri):
    with open(_ayar_yolu(), "w", encoding="utf-8") as dosya:
        json.dump(veri, dosya, ensure_ascii=False)


def ayar_oku():
    try:
        with open(_ayar_yolu(), encoding="utf-8") as dosya:
            return json.load(dosya)
    except Exception:
        return None


def _gorev_komutu(bayrak):
    """Bir gorevin calistiracagi komut satiri ('--sabah' ya da '--kontrol')."""
    if getattr(sys, "frozen", False):        # exe olarak calisiyorsa
        return f'"{sys.executable}" {bayrak}'
    # gelistirme modunda: pythonw (konsolsuz) ile bu dosyayi calistir
    pyw = sys.executable.replace("python.exe", "pythonw.exe")
    return f'"{pyw}" "{os.path.abspath(__file__)}" {bayrak}'


def _gorev_ayarlarini_duzelt(ad):
    """Windows'un varsayilan gorev ayarlari bizim isimize uymuyor:

      - DisallowStartIfOnBatteries: dizustu PILDE iken gorev HIC calismaz
      - StartWhenAvailable=False  : bilgisayar kapaliyken kacirilan calisma
                                    sonradan telafi edilmez

    Bildirimin guvenilir olmasi icin ikisini de duzeltiyoruz. schtasks bu
    ayarlari destekmedigi icin PowerShell ile yapiliyor.
    """
    ps = (f"$t=Get-ScheduledTask -TaskName '{ad}';"
          "$t.Settings.DisallowStartIfOnBatteries=$false;"
          "$t.Settings.StopIfGoingOnBatteries=$false;"
          "$t.Settings.StartWhenAvailable=$true;"
          f"Set-ScheduledTask -TaskName '{ad}' -Settings $t.Settings")
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                       capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=30,
                       creationflags=_PENCERESIZ)
    except Exception:
        pass  # duzeltilemezse gorev yine calisir, sadece pilde calismayabilir


def gorev_kur(saat):
    """Her gun 'saat'te calisan sabah gorevini kurar.

    NOT: "cihaz acilinca da calis" istegi bilerek GOREVE tetik olarak
    eklenmedi; Windows oturum-acilisi tetigi icin YONETICI izni istiyor.
    Bunun yerine uygulama acilista kendisi kontrol ediyor
    (bkz. HavaDurumu._acilista_sabah_kontrolu). Uygulama zaten Windows
    acilisinda otomatik basladigi icin sonuc ayni, izin gerekmiyor.
    """
    ok = subprocess.run(
        ["schtasks", "/Create", "/TN", GOREV_ADI, "/TR", _gorev_komutu("--sabah"),
         "/SC", "DAILY", "/ST", saat, "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0
    if ok:
        _gorev_ayarlarini_duzelt(GOREV_ADI)
    return ok


def gorev_kaldir():
    return subprocess.run(
        ["schtasks", "/Delete", "/TN", GOREV_ADI, "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0


def gorev_var_mi():
    return subprocess.run(
        ["schtasks", "/Query", "/TN", GOREV_ADI],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0


# ---- aksam gorevi: yarinin havasi ----
GOREV_AKSAM = "HavaDurumuAksamBildirimi"


def aksam_gorev_kur(saat):
    """Her aksam 'saat'te yarinin havasini bildiren gorevi kurar."""
    ok = subprocess.run(
        ["schtasks", "/Create", "/TN", GOREV_AKSAM,
         "/TR", _gorev_komutu("--aksam"), "/SC", "DAILY", "/ST", saat, "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL,
        creationflags=_PENCERESIZ).returncode == 0
    if ok:
        _gorev_ayarlarini_duzelt(GOREV_AKSAM)
    return ok


def aksam_gorev_kaldir():
    return subprocess.run(
        ["schtasks", "/Delete", "/TN", GOREV_AKSAM, "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL,
        creationflags=_PENCERESIZ).returncode == 0


def aksam_gorev_var_mi():
    return subprocess.run(
        ["schtasks", "/Query", "/TN", GOREV_AKSAM],
        capture_output=True, text=True, stdin=subprocess.DEVNULL,
        creationflags=_PENCERESIZ).returncode == 0


# periyodik uyari kontrolu (yagmur baslangic + siddetli hava) -- 30 dk'da bir
GOREV_KONTROL = "HavaDurumuUyariKontrol"


def kontrol_gorev_kur():
    """Her 30 dakikada bir yagmur/siddetli hava kontrolu yapan gorevi kurar."""
    ok = subprocess.run(
        ["schtasks", "/Create", "/TN", GOREV_KONTROL,
         "/TR", _gorev_komutu("--kontrol"),
         "/SC", "MINUTE", "/MO", "30", "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0
    if ok:
        _gorev_ayarlarini_duzelt(GOREV_KONTROL)
    return ok


def kontrol_gorev_kaldir():
    return subprocess.run(
        ["schtasks", "/Delete", "/TN", GOREV_KONTROL, "/F"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0


def kontrol_gorev_var_mi():
    return subprocess.run(
        ["schtasks", "/Query", "/TN", GOREV_KONTROL],
        capture_output=True, text=True, stdin=subprocess.DEVNULL, creationflags=_PENCERESIZ).returncode == 0


def _durum_yolu():
    return os.path.join(os.path.dirname(_ayar_yolu()), "durum.json")


def durum_oku():
    try:
        with open(_durum_yolu(), encoding="utf-8") as dosya:
            return json.load(dosya)
    except Exception:
        return {}


def durum_yaz(veri):
    with open(_durum_yolu(), "w", encoding="utf-8") as dosya:
        json.dump(veri, dosya, ensure_ascii=False)


# ---------- kullanici tercihleri (favoriler, tema, birim...) ----------

def _tercih_yolu():
    return os.path.join(os.path.dirname(_ayar_yolu()), "tercihler.json")


def tercih_oku():
    try:
        with open(_tercih_yolu(), encoding="utf-8") as dosya:
            return json.load(dosya)
    except Exception:
        return {}


def tercih_yaz(veri):
    with open(_tercih_yolu(), "w", encoding="utf-8") as dosya:
        json.dump(veri, dosya, ensure_ascii=False)


def _sistem_koyu_mu():
    """Windows koyu temada mi? Bilinemezse (None) koyu kabul eder."""
    try:
        import darkdetect
        return darkdetect.isDark() is not False
    except Exception:
        return True


# ---------- Windows baslangicinda otomatik acilma (registry) ----------

_BASLANGIC_ANAHTAR = r"Software\Microsoft\Windows\CurrentVersion\Run"
_BASLANGIC_AD = "TurkiyeHavaDurumu"


def _baslangic_komutu():
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}"'
    pyw = sys.executable.replace("python.exe", "pythonw.exe")
    return f'"{pyw}" "{os.path.abspath(__file__)}"'


def baslangic_ayarla(acik):
    """Uygulamayi Windows acilisina ekler (acik=True) ya da cikarir."""
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, _BASLANGIC_ANAHTAR, 0,
                            winreg.KEY_SET_VALUE) as k:
            if acik:
                winreg.SetValueEx(k, _BASLANGIC_AD, 0, winreg.REG_SZ,
                                  _baslangic_komutu())
            else:
                try:
                    winreg.DeleteValue(k, _BASLANGIC_AD)
                except FileNotFoundError:
                    pass
        return True
    except Exception:
        return False


def baslangic_acik_mi():
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, _BASLANGIC_ANAHTAR, 0,
                            winreg.KEY_READ) as k:
            winreg.QueryValueEx(k, _BASLANGIC_AD)
        return True
    except Exception:
        return False


def _gun_bildirimi(sira, anahtar, baslik, en_erken):
    """Pencere ACMADAN calisir: favori bolgenin gunluk ozetini bildirir.

    sira=0 bugun, sira=1 yarin. 'anahtar' durum.json'da tarih tutar; boylece
    hem zamanlanmis gorev hem cihaz acilisi tetiklese de GUNDE BIR KEZ gider.
    'en_erken' saatinden once sessiz kalir (gece rahatsiz etmemek icin).
    """
    ayar = ayar_oku()
    if not ayar:
        return
    simdi = datetime.datetime.now()
    if simdi.hour < en_erken:
        return
    durum = durum_oku()
    bugun = simdi.date().isoformat()
    if durum.get(anahtar) == bugun:
        return
    try:
        veri = hava_al(ayar["enlem"], ayar["boylam"])
        ozet = gun_ozeti(veri, sira)
        if ozet:
            bildirim.goster(baslik, gun_mesaji(ozet, ayar["isim"]))
            durum[anahtar] = bugun
            durum_yaz(durum)
    except Exception:
        pass  # sessizce basarisiz ol, kullaniciyi hata ile ugrastirma


def sabah_modu():
    """SABAH: bugun nasil gececek?"""
    _gun_bildirimi(0, "son_sabah", "Bugünün hava durumu", en_erken=6)


def aksam_modu():
    """AKSAM: yarin nasil olacak?

    Erken sinir, kullanicinin sectigi aksam saatidir. Boylece 21:00 secildiyse
    uygulama ogleden sonra acilsa bile yarinin havasini erkenden bildirmez.
    """
    ayar = ayar_oku() or {}
    try:
        en_erken = int(ayar.get("aksam_saat", "21:00").split(":")[0])
    except Exception:
        en_erken = 21
    _gun_bildirimi(1, "son_aksam", "Yarının hava durumu", en_erken=en_erken)


def kontrol_modu():
    """Pencere ACMADAN calisir (30 dk'da bir). Yagmur baslangici ve siddetli
    hava uyarilarini kontrol eder; ayni uyariyi tekrar tekrar gostermez."""
    ayar = ayar_oku()
    if not ayar:
        return
    try:
        veri = hava_al(ayar["enlem"], ayar["boylam"])
    except Exception:
        return
    durum = durum_oku()
    degisti = False

    if ayar.get("uyari_yagmur"):
        sy = sonraki_yagis(veri, saat_siniri=1)     # onumuzdeki 1 saat
        if sy:
            anahtar = veri["guncel"]["zaman"][:13] + "-" + sy["saat"]
            if durum.get("son_yagmur") != anahtar:
                bildirim.goster(
                    "Yağmur uyarısı",
                    f"{ayar['isim']}: ~{sy['saat']} civarı yağış başlıyor.")
                durum["son_yagmur"] = anahtar
                degisti = True

    if ayar.get("uyari_siddetli"):
        uyari = siddetli_hava(veri)
        if uyari and durum.get("son_siddetli") != uyari["anahtar"]:
            bildirim.goster("Şiddetli hava uyarısı",
                            f"{ayar['isim']}: {uyari['mesaj']}")
            durum["son_siddetli"] = uyari["anahtar"]
            degisti = True

    if degisti:
        durum_yaz(durum)


# ======================================================================
#  Ana pencere
# ======================================================================

class HavaDurumu(tk.Tk):
    def __init__(self):
        super().__init__()
        # temayi HER SEYDEN once belirle: tercih varsa onu, yoksa sisteme gore.
        # Renkler widget olusturulurken okunuyor; bu yuzden en basta uygulanmali.
        self.tercih = tercih_oku()
        secim = self.tercih.get("tema", "auto")
        self._koyu = (secim == "koyu") or (secim == "auto" and _sistem_koyu_mu())
        tema_uygula(self._koyu)

        self.title("Türkiye Hava Durumu")
        self.configure(bg=ARKA)
        # yuksekligi ekrana gore ayarla ki kucuk ekranlarda tasmasin
        yukseklik = min(900, self.winfo_screenheight() - 70)
        self.geometry(f"1180x{yukseklik}")
        self.minsize(1040, 680)

        # ayni anda birden fazla istek olursa yalnizca en sonuncu ekrani
        # gunceller diye her isteğe sira numarasi veriyoruz
        self._istek_no = 0
        self.isaretci = None       # haritadaki tek isaretci
        self._satir_ikonlari = []  # saatlik ikon tuvallerini canli tutar
        self.kuyruk = queue.Queue()  # arka plandan gelen sonuclar burada bekler
        self._kapaniyor = False
        self.secili = None         # {enlem, boylam, isim} - o an secili yer
        self.son_veri = None       # en son cekilen tam veri (yarin ozeti icin)
        self._gorev_acik = False   # "her sabah" gorevi kurulu mu
        self.favoriler = self.tercih.get("favoriler") or [VARSAYILAN_IL]
        self.tepsi = None          # sistem tepsisi simgesi (pystray)

        self._stilleri_kur()
        self._arayuzu_kur()

        # "her sabah" gorevi daha once kurulmus mu? butonu ona gore ayarla
        self._gorev_acik = gorev_var_mi()
        kayit = ayar_oku()
        if kayit and kayit.get("saat"):
            self.saat_kutu.set(kayit["saat"])
        if kayit:
            self.uyari_yagmur.set(bool(kayit.get("uyari_yagmur")))
            self.uyari_siddetli.set(bool(kayit.get("uyari_siddetli")))
        self._uyari_arayuz_guncelle()
        self._sabah_arayuz_guncelle()

        # pencere capraz ile kapatilirsa duzgun kapan
        self.protocol("WM_DELETE_WINDOW", self._kapat)
        # kuyrugu duzenli araliklarla kontrol et (ana is dongusu icinde)
        self.after(120, self._kuyrugu_yokla)
        # acilista ilk favori ili goster
        ilk = self.favoriler[0] if self.favoriler else VARSAYILAN_IL
        self.after(200, lambda: self.sec_il(ilk))
        # tepsi tercihi aciksa sistem tepsisini baslat
        if self.tercih.get("tepsi"):
            self.after(300, self._tepsi_baslat)
        # cihaz sabah kapaliysa kacan sabah bildirimini burada telafi et
        self.after(4000, self._acilista_sabah_kontrolu)
        # ILK acilista: takip edilecek il + ilceyi sectir
        if not self.tercih.get("kurulum_tamam"):
            self.after(700, self._kurulum_penceresi)

    def _kapat(self):
        # tepsi acikken capraz tusu pencereyi TEPSI'ye gizler; uygulama kapanmaz
        if self.tepsi is not None:
            self.withdraw()
        else:
            self._tam_kapat()

    def _tam_kapat(self):
        self._kapaniyor = True
        self._tepsi_durdur()
        self.destroy()

    def _tercih_kaydet(self, **kv):
        self.tercih.update(kv)
        tercih_yaz(self.tercih)

    def _acilista_sabah_kontrolu(self):
        """Cihaz kapaliyken kacan bildirimleri acilista telafi eder.

        Uygulama Windows acilisinda otomatik basladigi icin, acilista hem
        SABAH (bugun) hem AKSAM (yarin) bildirimi gonderilmis mi diye bakar.
        Ikisinin de GUNDE BIR KEZ kilidi ve saat siniri var; bu yuzden
        zamanlanmis gorev de calissa tekrar bildirim gitmez, gece de susar.
        """
        if not self._gorev_acik:
            return          # kullanici bildirimleri acmamis -> karisma

        def isle():
            sabah_modu()    # saat >= 06 ve bugun gonderilmediyse
            aksam_modu()    # saat >= 16 ve bugun gonderilmediyse

        # ag islemi: arka planda (pencere acilisini yavaslatmasin)
        threading.Thread(target=isle, daemon=True).start()

    # ------------------------------------------------------------------
    #  Arayuz kurulumu
    # ------------------------------------------------------------------

    def _stilleri_kur(self):
        stil = ttk.Style(self)
        stil.theme_use("clam")
        # il secme kutusu (Combobox) koyu tema
        stil.configure("TCombobox",
                       fieldbackground=ICKART, background=PANEL,
                       foreground=YAZI, arrowcolor=YAZI2,
                       bordercolor=CIZGI, lightcolor=CIZGI, darkcolor=CIZGI,
                       borderwidth=0, padding=8)
        stil.map("TCombobox", fieldbackground=[("readonly", ICKART)])
        # acilan listenin rengi
        self.option_add("*TCombobox*Listbox.background", ICKART)
        self.option_add("*TCombobox*Listbox.foreground", YAZI)
        self.option_add("*TCombobox*Listbox.selectBackground", VURGU)
        self.option_add("*TCombobox*Listbox.font", (YAZI_TIPI, 11))
        # kaydirma cubugu
        stil.configure("Dikey.Vertical.TScrollbar",
                       background=PANEL, troughcolor=ARKA,
                       bordercolor=ARKA, arrowcolor=YAZI2)

    def _arayuzu_kur(self):
        # --- ust baslik seridi ---
        ust = tk.Frame(self, bg=ARKA)
        ust.pack(fill="x", padx=16, pady=(14, 8))
        baslik_tuval = tk.Canvas(ust, width=34, height=34, bg=ARKA,
                                 highlightthickness=0)
        baslik_tuval.pack(side="left")
        hava_ikonu(baslik_tuval, 17, 18, 8, "gunes_bulut")
        tk.Label(ust, text="  Türkiye Hava Durumu", bg=ARKA, fg=YAZI,
                 font=(YAZI_TIPI, 17, "bold")).pack(side="left")
        self.ipucu_lbl = tk.Label(
            ust, text=IPUCU, bg=ARKA, fg=YAZI3,
            font=(YAZI_TIPI, 10))
        self.ipucu_lbl.pack(side="right", pady=6)

        # --- alt: 7 gunluk serit (tam genislik, en altta) ---
        self._gunluk_serit_kur()

        # --- govde: sol panel + harita ---
        govde = tk.Frame(self, bg=ARKA)
        govde.pack(fill="both", expand=True, padx=16, pady=(0, 14))
        govde.columnconfigure(0, minsize=430, weight=0)
        govde.columnconfigure(1, weight=1)
        govde.rowconfigure(0, weight=1)

        sol = tk.Frame(govde, bg=ARKA)
        sol.grid(row=0, column=0, sticky="nsew", padx=(0, 14))
        self._sol_paneli_kur(sol)

        # harita (sag taraf): ustte katman kontrolu + harita
        harita_cerceve = tk.Frame(govde, bg=CIZGI)
        harita_cerceve.grid(row=0, column=1, sticky="nsew")
        self._harita_kontrol_kur(harita_cerceve)

        self._temel_url = HARITA_NORMAL   # normal/uydu temel harita
        self._radar_acik = False
        self._radar_url = None
        self.harita = TkinterMapView(harita_cerceve, corner_radius=0)
        self.harita.pack(fill="both", expand=True, padx=1, pady=(0, 1))
        self.harita.set_tile_server(self._temel_url, max_zoom=19)
        self.harita.set_position(39.2, 35.2)   # Turkiye'nin ortasi
        self.harita.set_zoom(6)
        self.harita.add_left_click_map_command(self._haritaya_tiklandi)

    # ---------- harita katman kontrolu (Normal/Uydu + radar) ----------

    def _harita_kontrol_kur(self, parent):
        cubuk = tk.Frame(parent, bg=ARKA)
        cubuk.pack(fill="x", padx=1, pady=(1, 0))
        tk.Label(cubuk, text="Harita:", bg=ARKA, fg=YAZI3,
                 font=(YAZI_TIPI, 10)).pack(side="left", padx=(8, 6), pady=6)
        self.btn_normal = self._dugme(cubuk, "Normal",
                                      lambda: self._harita_turu(False), VURGU)
        self._dugme_stil(self.btn_normal, True)
        self.btn_normal.pack(side="left", padx=(0, 4), pady=6)
        self.btn_uydu = self._dugme(cubuk, "Uydu",
                                    lambda: self._harita_turu(True), BTN2)
        self._dugme_stil(self.btn_uydu, False)
        self.btn_uydu.pack(side="left", pady=6)
        self.btn_radar = self._dugme(cubuk, "Yağış radarı: Kapalı",
                                     self._radar_toggle, BTN2)
        self._dugme_stil(self.btn_radar, False)
        self.btn_radar.pack(side="left", padx=(16, 0), pady=6)
        self.radar_durum_lbl = tk.Label(cubuk, text="", bg=ARKA, fg=YAZI3,
                                        font=(YAZI_TIPI, 9))
        self.radar_durum_lbl.pack(side="left", padx=(10, 0))

    def _harita_turu(self, uydu):
        self._temel_url = HARITA_UYDU if uydu else HARITA_NORMAL
        self._dugme_stil(self.btn_normal, not uydu)
        self._dugme_stil(self.btn_uydu, uydu)
        self._harita_ciz()

    def _radar_toggle(self):
        if self._radar_acik:
            self._radar_acik = False
            self.btn_radar.config(text="Yağış radarı: Kapalı")
            self._dugme_stil(self.btn_radar, False)
            self.radar_durum_lbl.config(text="")
            self._harita_ciz()
        else:
            # radar karesini arka planda getir (agi bloklamasin)
            self.radar_durum_lbl.config(text="Radar yükleniyor…", fg=YAZI2)

            def isle():
                try:
                    url = radar_url()
                except Exception:
                    url = None
                self.kuyruk.put(("radar", 0, "", url))

            threading.Thread(target=isle, daemon=True).start()

    def _radar_sonucu(self, url):
        if not url:
            self.radar_durum_lbl.config(text="Radar alınamadı", fg=HATA_R)
            return
        self._radar_url = url
        self._radar_acik = True
        self.btn_radar.config(text="Yağış radarı: Açık")
        self._dugme_stil(self.btn_radar, True)
        self.radar_durum_lbl.config(text="mavi→yeşil→kırmızı = artan yağış",
                                    fg=YAZI3)
        self._harita_ciz()

    def _harita_ciz(self):
        """Overlay'i (radar) ayarlar, sonra temel haritayi yeniden cizer."""
        self.harita.set_overlay_tile_server(
            self._radar_url if self._radar_acik else None)
        self.harita.set_tile_server(self._temel_url, max_zoom=19)

    def _sol_paneli_kur(self, sol):
        # Sol panel TEK PARCA kaydirilir. Icerik cogaldikca (saatlik liste +
        # ileride eklenecek bolumler) pencereye sigmayabilir; bu yuzden her sey
        # bir Canvas'in icine konur ve birlikte kaydirilir.
        self.sol_tuval = tk.Canvas(sol, bg=ARKA, highlightthickness=0)
        kaydir = ttk.Scrollbar(sol, orient="vertical",
                               style="Dikey.Vertical.TScrollbar",
                               command=self.sol_tuval.yview)
        self.sol_tuval.configure(yscrollcommand=kaydir.set)
        kaydir.pack(side="right", fill="y")
        self.sol_tuval.pack(side="left", fill="both", expand=True)

        panel = tk.Frame(self.sol_tuval, bg=ARKA)
        self._sol_pencere = self.sol_tuval.create_window(
            (0, 0), window=panel, anchor="nw")
        panel.bind("<Configure>", lambda e: self.sol_tuval.configure(
            scrollregion=self.sol_tuval.bbox("all")))
        self.sol_tuval.bind("<Configure>", lambda e: self.sol_tuval.itemconfig(
            self._sol_pencere, width=e.width))
        self.sol_tuval.bind("<Enter>", self._tekerlek_bagla)
        self.sol_tuval.bind("<Leave>", self._tekerlek_coz)

        # 1) il secme kutusu + favori yildizi
        secim = tk.Frame(panel, bg=ARKA)
        secim.pack(fill="x")
        tk.Label(secim, text="Yer:", bg=ARKA, fg=YAZI2,
                 font=(YAZI_TIPI, 12)).pack(side="left", padx=(0, 8))
        self.il_kutu = ttk.Combobox(secim, values=sehirler.isimler(),
                                    font=(YAZI_TIPI, 12), state="normal")
        self.il_kutu.pack(side="left", fill="x", expand=True)
        self.il_kutu.bind("<<ComboboxSelected>>", self._kutudan_secildi)
        self.il_kutu.bind("<Return>", self._kutudan_secildi)
        self.il_kutu.bind("<KeyRelease>", self._kutuda_ara)
        self.yildiz_btn = tk.Button(
            secim, text="☆", command=self._favori_toggle, bg=ARKA, fg=YAZI2,
            activebackground=ARKA, activeforeground=GUNES_R, relief="flat", bd=0,
            font=(YAZI_TIPI, 16), cursor="hand2", takefocus=0)
        self.yildiz_btn.pack(side="left", padx=(6, 0))

        # favori iller seridi
        self.favori_serit = tk.Frame(panel, bg=ARKA)
        self.favori_serit.pack(fill="x", pady=(8, 0))
        self._favori_serit_yenile()

        # 2) "su an" kartı
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=18, pady=16)

        self.il_ad_lbl = tk.Label(ic, text="—", bg=PANEL, fg=YAZI,
                                  font=(YAZI_TIPI, 18, "bold"), anchor="w")
        self.il_ad_lbl.pack(fill="x")
        self.tarih_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAZI3,
                                  font=(YAZI_TIPI, 10), anchor="w")
        self.tarih_lbl.pack(fill="x", pady=(0, 10))

        orta = tk.Frame(ic, bg=PANEL)
        orta.pack(fill="x")
        self.ikon_tuval = tk.Canvas(orta, width=96, height=96, bg=PANEL,
                                    highlightthickness=0)
        self.ikon_tuval.pack(side="left")
        sag = tk.Frame(orta, bg=PANEL)
        sag.pack(side="left", padx=(14, 0), fill="x", expand=True)
        self.sicaklik_lbl = tk.Label(sag, text="—", bg=PANEL, fg=YAZI,
                                     font=(YAZI_TIPI, 44, "bold"), anchor="w")
        self.sicaklik_lbl.pack(fill="x")
        self.aciklama_lbl = tk.Label(sag, text="", bg=PANEL, fg=YAZI2,
                                     font=(YAZI_TIPI, 13), anchor="w")
        self.aciklama_lbl.pack(fill="x")
        self.hissedilen_lbl = tk.Label(sag, text="", bg=PANEL, fg=YAZI3,
                                       font=(YAZI_TIPI, 10), anchor="w")
        self.hissedilen_lbl.pack(fill="x")

        # gun dogumu / batimi / UV satiri
        self.gunes_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAZI3,
                                  font=(YAZI_TIPI, 10), anchor="w")
        self.gunes_lbl.pack(fill="x", pady=(12, 0))

        # "yagmur ne zaman baslar" satiri (yalnizca yagis bekleniyorsa gorunur)
        self.yagmur_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAGIS_R,
                                   font=(YAZI_TIPI, 10, "bold"), anchor="w")
        self.yagmur_lbl.pack(fill="x", pady=(4, 0))

        # zemini havaya gore degisecek ogeler (hepsi ayni rengi alir)
        self._hero_ogeleri = [kart, ic, orta, sag, self.il_ad_lbl,
                              self.tarih_lbl, self.ikon_tuval,
                              self.sicaklik_lbl, self.aciklama_lbl,
                              self.hissedilen_lbl, self.gunes_lbl,
                              self.yagmur_lbl]

        # 3) uc kucuk kutu: Nem / Ruzgar / Yagis
        kutucuklar = tk.Frame(panel, bg=ARKA)
        kutucuklar.pack(fill="x", pady=(12, 0))
        for i in range(3):
            kutucuklar.columnconfigure(i, weight=1, uniform="k")
        self.nem_deger = self._mini_kutu(kutucuklar, 0, "NEM", NEM_R)
        self.ruzgar_deger = self._mini_kutu(kutucuklar, 1, "RÜZGÂR", RUZGAR_R)
        self.yagis_deger = self._mini_kutu(kutucuklar, 2, "YAĞIŞ", YAGIS_R)

        # 3.2) hava kalitesi + polen
        self._hava_kalitesi_paneli_kur(panel)

        # 3.3) detaylar (basinc / gorus / ciy / hamle / bulut / ay evresi)
        self._detaylar_paneli_kur(panel)

        # 3.5) yarin ozeti + bildirim
        self._yarin_paneli_kur(panel)

        # 3.6) otomatik uyarilar (yagmur baslangic + siddetli hava)
        self._uyari_paneli_kur(panel)

        # 3.7) model karsilastirma (ECMWF/GFS/ICON)
        self._model_paneli_kur(panel)

        # 3.75) 24 saatlik sicaklik grafigi
        self._grafik_paneli_kur(panel)

        # 3.8) ayarlar (tema / baslangic / tepsi)
        self._ayarlar_paneli_kur(panel)

        # 4) saatlik baslik
        baslik = tk.Frame(panel, bg=ARKA)
        baslik.pack(fill="x", pady=(16, 6))
        tk.Label(baslik, text="Saatlik tahmin", bg=ARKA, fg=YAZI,
                 font=(YAZI_TIPI, 13, "bold")).pack(side="left")
        tk.Label(baslik, text="(nem · rüzgâr · yağış)", bg=ARKA, fg=YAZI3,
                 font=(YAZI_TIPI, 10)).pack(side="left", padx=(8, 0))

        # saatlik liste sutun basliklari
        self._saatlik_baslik(panel)

        # 5) saatlik liste (artik tum sol panelle birlikte kayar)
        self._saatlik_liste_kur(panel)

    def _mini_kutu(self, ust, sutun, baslik, renk):
        kutu = tk.Frame(ust, bg=ICKART)
        kutu.grid(row=0, column=sutun, sticky="nsew",
                  padx=(0 if sutun == 0 else 6, 0))
        tk.Label(kutu, text=baslik, bg=ICKART, fg=YAZI3,
                 font=(YAZI_TIPI, 9, "bold")).pack(pady=(12, 2))
        deger = tk.Label(kutu, text="—", bg=ICKART, fg=renk,
                         font=(YAZI_TIPI, 15, "bold"))
        deger.pack(pady=(0, 12))
        return deger

    def _hava_kalitesi_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=12)
        tk.Label(ic, text="Hava Kalitesi", bg=PANEL, fg=YAZI2,
                 font=(YAZI_TIPI, 11, "bold"), anchor="w").pack(fill="x")
        satir = tk.Frame(ic, bg=PANEL)
        satir.pack(fill="x", pady=(6, 0))
        self.aqi_lbl = tk.Label(satir, text="—", bg=PANEL, fg=YAZI3,
                                font=(YAZI_TIPI, 24, "bold"), width=4)
        self.aqi_lbl.pack(side="left")
        sag = tk.Frame(satir, bg=PANEL)
        sag.pack(side="left", padx=(10, 0), fill="x", expand=True)
        self.aqi_kat_lbl = tk.Label(sag, text="", bg=PANEL, fg=YAZI,
                                    font=(YAZI_TIPI, 12, "bold"), anchor="w")
        self.aqi_kat_lbl.pack(fill="x")
        self.aqi_detay_lbl = tk.Label(sag, text="", bg=PANEL, fg=YAZI3,
                                      font=(YAZI_TIPI, 9), anchor="w",
                                      justify="left")
        self.aqi_detay_lbl.pack(fill="x")

    def _hava_kalitesi_goster(self, hk):
        if not hk or hk.get("aqi") is None:
            self.aqi_lbl.config(text="—", fg=YAZI3)
            self.aqi_kat_lbl.config(text="Veri yok", fg=YAZI2)
            self.aqi_detay_lbl.config(text="")
            return
        self.aqi_lbl.config(text=str(hk["aqi"]), fg=hk["renk"])
        self.aqi_kat_lbl.config(text=hk["kategori"], fg=hk["renk"])
        detay = []
        if hk.get("pm25") is not None:
            detay.append(f"PM2.5 {hk['pm25']:.0f}")
        if hk.get("pm10") is not None:
            detay.append(f"PM10 {hk['pm10']:.0f}")
        detay.append(f"Polen: {hk['polen']}")
        self.aqi_detay_lbl.config(text="   ·   ".join(detay))

    def _yagmur_goster(self, veri):
        sy = sonraki_yagis(veri)
        if sy:
            self.yagmur_lbl.config(
                text=f"Yağış ~{sy['saat']} civarında başlıyor")
        else:
            self.yagmur_lbl.config(text="")

    def _detaylar_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=12)
        tk.Label(ic, text="Detaylar", bg=PANEL, fg=YAZI2,
                 font=(YAZI_TIPI, 11, "bold"), anchor="w").pack(fill="x")
        izgara = tk.Frame(ic, bg=PANEL)
        izgara.pack(fill="x", pady=(6, 0))
        for i in range(3):
            izgara.columnconfigure(i, weight=1, uniform="d")
        self.detay_lbl = {}
        alanlar = [("basinc", "Basınç"), ("gorus", "Görüş"),
                   ("ciy", "Çiy noktası"), ("hamle", "Hamle"),
                   ("bulut", "Bulut"), ("ay", "Ay evresi")]
        for idx, (anahtar, baslik) in enumerate(alanlar):
            hucre = tk.Frame(izgara, bg=PANEL)
            hucre.grid(row=idx // 3, column=idx % 3, sticky="w", pady=3)
            tk.Label(hucre, text=baslik, bg=PANEL, fg=YAZI3,
                     font=(YAZI_TIPI, 8), anchor="w").pack(fill="x")
            boyut = 9 if anahtar == "ay" else 11
            deger = tk.Label(hucre, text="—", bg=PANEL, fg=YAZI,
                             font=(YAZI_TIPI, boyut, "bold"), anchor="w")
            deger.pack(fill="x")
            self.detay_lbl[anahtar] = deger

    def _detaylar_goster(self, g):
        b = g.get("basinc")
        self.detay_lbl["basinc"].config(
            text=f"{b} hPa" if b is not None else "—")
        gr = g.get("gorus")
        self.detay_lbl["gorus"].config(
            text=f"{gr / 1000:.0f} km" if gr is not None else "—")
        c = g.get("ciy")
        self.detay_lbl["ciy"].config(text=f"{c}°" if c is not None else "—")
        h = g.get("hamle")
        self.detay_lbl["hamle"].config(
            text=f"{h} km/s" if h is not None else "—")
        bl = g.get("bulut")
        self.detay_lbl["bulut"].config(text=f"%{bl}" if bl is not None else "—")
        self.detay_lbl["ay"].config(text=g.get("ay_evresi", "—"))

    def _model_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=(10, 12))
        tk.Label(ic, text="Yarın en yüksek — model karşılaştırma", bg=PANEL,
                 fg=YAZI2, font=(YAZI_TIPI, 10, "bold"), anchor="w").pack(
            fill="x")
        self.model_lbl = tk.Label(ic, text="—", bg=PANEL, fg=YAZI,
                                  font=(YAZI_TIPI, 13), anchor="w")
        self.model_lbl.pack(fill="x", pady=(4, 0))
        self.model_not_lbl = tk.Label(
            ic, text="(3 model yakınsa tahmin daha güvenilir)", bg=PANEL,
            fg=YAZI3, font=(YAZI_TIPI, 9), anchor="w")
        self.model_not_lbl.pack(fill="x")

    def _model_goster(self, modeller):
        if not modeller:
            self.model_lbl.config(text="Veri yok")
            return
        self.model_lbl.config(
            text="    ·    ".join(f"{ad} {t}°" for ad, t in modeller))

    # ---------- sicaklik grafigi (24 saat) ----------

    def _grafik_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=(10, 12))
        tk.Label(ic, text="Sıcaklık grafiği — önümüzdeki 24 saat", bg=PANEL,
                 fg=YAZI2, font=(YAZI_TIPI, 11, "bold"), anchor="w").pack(
            fill="x")
        self.grafik = tk.Canvas(ic, height=120, bg=PANEL, highlightthickness=0)
        self.grafik.pack(fill="x", pady=(6, 0))
        self._grafik_veri = None
        # pencere yeniden boyutlanınca grafigi tazele
        self.grafik.bind("<Configure>", lambda e: self._grafik_ciz())

    def _grafik_ciz(self):
        c = self.grafik
        c.delete("all")
        veri = self._grafik_veri
        if not veri:
            return
        temps = [s["sicaklik"] for s in veri if s["sicaklik"] is not None]
        if len(temps) < 2:
            return
        genislik = c.winfo_width() or 380
        yukseklik = int(c.cget("height"))
        tmin, tmax = min(temps), max(temps)
        if tmax == tmin:
            tmax += 1
        sol, sag, ust, alt = 22, 10, 16, 20
        gw, gh = genislik - sol - sag, yukseklik - ust - alt
        n = len(temps)

        def nokta(i, t):
            x = sol + gw * i / (n - 1)
            y = ust + gh * (1 - (t - tmin) / (tmax - tmin))
            return x, y

        # arka planda yagis olasiligi cubuklari (hafif; dolgu yerine)
        bar = max(2, gw / n * 0.4)
        for i, s in enumerate(veri):
            p = s.get("yagis_olasilik") or 0
            if p <= 0:
                continue
            x = sol + gw * i / (n - 1)
            yuk = gh * p / 100.0
            c.create_rectangle(x - bar, ust + gh - yuk, x + bar, ust + gh,
                               fill=YAGIS_R, outline="", stipple="gray50")
        # sicaklik cizgisi
        c.create_line([k for i, t in enumerate(temps) for k in nokta(i, t)],
                      fill=VURGU, width=2, smooth=True)
        # eksen etiketleri (en yuksek/dusuk + saatler)
        c.create_text(2, ust, text=f"{tmax}°", anchor="w", fill=YAZI3,
                      font=(YAZI_TIPI, 8))
        c.create_text(2, ust + gh, text=f"{tmin}°", anchor="w", fill=YAZI3,
                      font=(YAZI_TIPI, 8))
        for i in range(0, n, 6):
            x = sol + gw * i / (n - 1)
            c.create_text(x, yukseklik - 8, text=veri[i]["saat"], anchor="n",
                          fill=YAZI3, font=(YAZI_TIPI, 8))
        c.create_text(genislik - sag, ust - 1, text="çizgi °C · çubuk %yağış",
                      anchor="ne", fill=YAZI3, font=(YAZI_TIPI, 7))

    def _uyari_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=12)
        tk.Label(ic, text="Otomatik uyarılar", bg=PANEL, fg=YAZI2,
                 font=(YAZI_TIPI, 11, "bold"), anchor="w").pack(fill="x")
        self.uyari_yagmur = tk.BooleanVar(value=False)
        self.uyari_siddetli = tk.BooleanVar(value=False)
        self._onay(ic, "Yağmur başlamadan uyar", self.uyari_yagmur,
                   self._uyarilari_uygula).pack(fill="x", pady=(6, 0))
        self._onay(ic, "Şiddetli hava (fırtına / aşırı sıcak / don)",
                   self.uyari_siddetli, self._uyarilari_uygula).pack(fill="x")
        self.uyari_durum_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAZI3,
                                        font=(YAZI_TIPI, 9), anchor="w")
        self.uyari_durum_lbl.pack(fill="x", pady=(6, 0))

    def _onay(self, ust, metin, degisken, komut):
        return tk.Checkbutton(
            ust, text=metin, variable=degisken, command=komut,
            bg=PANEL, fg=YAZI, selectcolor=ICKART, activebackground=PANEL,
            activeforeground=YAZI, font=(YAZI_TIPI, 10), anchor="w",
            takefocus=0, highlightthickness=0, bd=0, cursor="hand2")

    def _uyarilari_uygula(self):
        if not self.secili:
            self.uyari_yagmur.set(False)
            self.uyari_siddetli.set(False)
            self.uyari_durum_lbl.config(text="Önce bir il seçin.", fg=HATA_R)
            return
        yagmur, siddetli = self.uyari_yagmur.get(), self.uyari_siddetli.get()
        mevcut = ayar_oku() or {}
        mevcut.update({**self.secili, "uyari_yagmur": yagmur,
                       "uyari_siddetli": siddetli})
        mevcut.setdefault("saat", self.saat_kutu.get())
        ayar_yaz(mevcut)
        if yagmur or siddetli:
            kontrol_gorev_kur()
        else:
            kontrol_gorev_kaldir()
        self._uyari_arayuz_guncelle()

    def _uyari_arayuz_guncelle(self):
        if self.uyari_yagmur.get() or self.uyari_siddetli.get():
            kayit = ayar_oku() or {}
            self.uyari_durum_lbl.config(
                text=f"✓ Açık — {kayit.get('isim', '')} için 30 dk'da bir kontrol",
                fg=NEM_R)
        else:
            self.uyari_durum_lbl.config(text="Otomatik uyarılar kapalı", fg=YAZI3)

    def _dugme(self, ust, metin, komut, arka, on=None):
        # on (yazi rengi) verilmezse temanin ana yazi rengini kullan; boylece
        # default arguman import aninda sabitlenmez, tema degisince dogru olur.
        on = on or YAZI
        return tk.Button(ust, text=metin, command=komut, bg=arka, fg=on,
                         activebackground=arka, activeforeground=on,
                         font=(YAZI_TIPI, 10, "bold"), relief="flat", bd=0,
                         padx=12, pady=6, cursor="hand2", takefocus=0)

    def _dugme_stil(self, btn, aktif):
        """Bir ac/kapa butonunu aktif (mavi) ya da pasif (gri) gorunume sokar."""
        btn.config(bg=(VURGU if aktif else BTN2), fg=(BEYAZ if aktif else YAZI),
                   activebackground=(VURGU if aktif else BTN2),
                   activeforeground=(BEYAZ if aktif else YAZI))

    # ---------- favoriler ----------

    def _favori_serit_yenile(self):
        for w in self.favori_serit.winfo_children():
            w.destroy()
        if not self.favoriler:
            tk.Label(self.favori_serit, text="Favori yok — ☆ ile ekleyin",
                     bg=ARKA, fg=YAZI3, font=(YAZI_TIPI, 9)).pack(side="left")
            return
        for ad in self.favoriler:
            tk.Button(self.favori_serit, text=ad,
                      command=lambda a=ad: self.sec_il(a),
                      bg=PANEL, fg=YAZI2, activebackground=SECILI,
                      activeforeground=YAZI, font=(YAZI_TIPI, 9), relief="flat",
                      bd=0, padx=9, pady=3, cursor="hand2",
                      takefocus=0).pack(side="left", padx=(0, 5))

    def _favori_toggle(self):
        if not self.secili:
            return
        ad = self.secili["isim"]
        if ad in self.favoriler:
            self.favoriler.remove(ad)
        else:
            self.favoriler.append(ad)
        self._tercih_kaydet(favoriler=self.favoriler)
        self._favori_serit_yenile()
        self._yildiz_guncelle()

    def _yildiz_guncelle(self):
        ad = self.secili["isim"] if self.secili else None
        favori = ad in self.favoriler
        self.yildiz_btn.config(text=("★" if favori else "☆"),
                               fg=(GUNES_R if favori else YAZI2))

    # ---------- Ayarlar paneli (tema / baslangic / tepsi) ----------

    def _ayarlar_paneli_kur(self, panel):
        kart = tk.Frame(panel, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=12)
        tk.Label(ic, text="Ayarlar", bg=PANEL, fg=YAZI2,
                 font=(YAZI_TIPI, 11, "bold"), anchor="w").pack(fill="x")

        tema_satiri = tk.Frame(ic, bg=PANEL)
        tema_satiri.pack(fill="x", pady=(6, 2))
        tk.Label(tema_satiri, text="Tema:", bg=PANEL, fg=YAZI3,
                 font=(YAZI_TIPI, 10)).pack(side="left", padx=(0, 6))
        self.tema_btnleri = {}
        for kod, etiket in [("koyu", "Koyu"), ("acik", "Açık"),
                            ("auto", "Sistem")]:
            b = self._dugme(tema_satiri, etiket,
                            lambda k=kod: self._tema_sec(k), BTN2)
            b.pack(side="left", padx=(0, 4))
            self.tema_btnleri[kod] = b
        self._tema_btn_guncelle()

        self.baslangic_var = tk.BooleanVar(value=baslangic_acik_mi())
        self._onay(ic, "Windows açılışında başlat", self.baslangic_var,
                   self._baslangic_uygula).pack(fill="x", pady=(4, 0))
        self.tepsi_var = tk.BooleanVar(value=bool(self.tercih.get("tepsi")))
        self._onay(ic, "Sistem tepsisinde sıcaklık göster", self.tepsi_var,
                   self._tepsi_uygula).pack(fill="x")
        self._dugme(ic, "Takip edilen bölgeyi değiştir",
                    self._kurulum_penceresi, BTN2).pack(fill="x", pady=(10, 2))
        self.ayar_not_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAZI3,
                                     font=(YAZI_TIPI, 9), anchor="w")
        self.ayar_not_lbl.pack(fill="x", pady=(4, 0))

    def _tema_sec(self, kod):
        self._tercih_kaydet(tema=kod)
        self._tema_btn_guncelle()
        self.ayar_not_lbl.config(
            text="Tema değişikliği uygulamayı yeniden açınca uygulanır.", fg=YAZI3)

    def _tema_btn_guncelle(self):
        secili = self.tercih.get("tema", "auto")
        for kod, b in self.tema_btnleri.items():
            self._dugme_stil(b, kod == secili)

    def _baslangic_uygula(self):
        baslangic_ayarla(self.baslangic_var.get())
        self.ayar_not_lbl.config(
            text=("Windows açılışında başlayacak." if self.baslangic_var.get()
                  else "Açılışta başlatma kapatıldı."), fg=YAZI3)

    def _tepsi_uygula(self):
        acik = self.tepsi_var.get()
        self._tercih_kaydet(tepsi=acik)
        if acik:
            self._tepsi_baslat()
        else:
            self._tepsi_durdur()

    # ---------- sistem tepsisi (pystray) ----------

    def _tepsi_resmi(self, sicaklik):
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        ciz = ImageDraw.Draw(img)
        metin = "--" if sicaklik is None else str(sicaklik)
        try:
            font = ImageFont.truetype("segoeui.ttf", 46 if len(metin) <= 2 else 34)
        except Exception:
            font = ImageFont.load_default()
        try:
            k = ciz.textbbox((0, 0), metin, font=font)
            ciz.text(((64 - (k[2] - k[0])) / 2 - k[0],
                      (64 - (k[3] - k[1])) / 2 - k[1]),
                     metin, font=font, fill=(255, 255, 255, 255))
        except Exception:
            ciz.text((10, 8), metin, fill=(255, 255, 255, 255))
        return img

    def _tepsi_baslat(self):
        if self.tepsi is not None:
            return
        try:
            import pystray
        except Exception:
            self.tepsi_var.set(False)
            return
        menu = pystray.Menu(
            pystray.MenuItem(
                "Göster", lambda: self.kuyruk.put(("tepsi", 0, "goster", None)),
                default=True),
            pystray.MenuItem(
                "Çıkış", lambda: self.kuyruk.put(("tepsi", 0, "cikis", None))),
        )
        sic = self.son_veri["guncel"]["sicaklik"] if self.son_veri else None
        self.tepsi = pystray.Icon("HavaDurumu", self._tepsi_resmi(sic),
                                  "Türkiye Hava Durumu", menu)
        threading.Thread(target=self.tepsi.run, daemon=True).start()

    def _tepsi_durdur(self):
        if self.tepsi is not None:
            try:
                self.tepsi.stop()
            except Exception:
                pass
            self.tepsi = None

    def _tepsi_guncelle(self, isim, sicaklik):
        if self.tepsi is None:
            return
        try:
            self.tepsi.icon = self._tepsi_resmi(sicaklik)
            self.tepsi.title = (f"{isim}: {sicaklik}°C" if sicaklik is not None
                                else isim)
        except Exception:
            pass

    # ---------- ilk acilis: takip edilecek bolgeyi sectirme ----------

    def _kurulum_penceresi(self):
        """Il + ILCE sectirir; secilen yer favori olur ve her sabah o bolgenin
        havasi bildirilir. Ilk acilista otomatik, sonra Ayarlar'dan acilir."""
        IL_MERKEZI = "(İl merkezi)"
        pen = tk.Toplevel(self)
        pen.title("Takip edilecek bölge")
        pen.configure(bg=ARKA)
        pen.resizable(False, False)
        pen.transient(self)

        ic = tk.Frame(pen, bg=ARKA)
        ic.pack(padx=26, pady=22)
        tk.Label(ic, text="Hangi bölgeyi takip edelim?", bg=ARKA, fg=YAZI,
                 font=(YAZI_TIPI, 15, "bold"), anchor="w").pack(fill="x")
        tk.Label(ic, text="Seçtiğiniz yer favoriniz olur ve her sabah bu bölgenin\n"
                          "hava durumu bildirim olarak gelir.",
                 bg=ARKA, fg=YAZI2, font=(YAZI_TIPI, 10), anchor="w",
                 justify="left").pack(fill="x", pady=(4, 16))

        def alan(baslik):
            tk.Label(ic, text=baslik, bg=ARKA, fg=YAZI3,
                     font=(YAZI_TIPI, 9, "bold"), anchor="w").pack(fill="x")

        alan("İl   (listeden seçin ya da yazın)")
        il_kutu = ttk.Combobox(ic, values=sehirler.isimler(),
                               font=(YAZI_TIPI, 11), width=32)
        il_kutu.pack(fill="x", pady=(2, 10))

        alan("İlçe   (listeden seçin ya da yazın)")
        ilce_kutu = ttk.Combobox(ic, values=[], font=(YAZI_TIPI, 11), width=32)
        ilce_kutu.pack(fill="x", pady=(2, 10))

        def ilce_listesi():
            il = il_kutu.get().strip()
            return ([IL_MERKEZI] + sehirler.il_ilceleri(il)
                    if sehirler.bul(il) else [])

        def il_secildi(_=None):
            ilce_kutu["values"] = ilce_listesi()
            ilce_kutu.set(IL_MERKEZI if ilce_kutu["values"] else "")

        def il_yazarken(olay):
            if olay.keysym in ("Up", "Down", "Left", "Right", "Escape"):
                return
            yazi = sehirler._kucult(il_kutu.get())
            il_kutu["values"] = ([s for s in sehirler.isimler()
                                  if yazi in sehirler._kucult(s)]
                                 if yazi else sehirler.isimler())
            il_secildi()             # il degisti -> ilce listesini tazele

        def ilce_yazarken(olay):
            if olay.keysym in ("Up", "Down", "Left", "Right", "Escape"):
                return
            tum = ilce_listesi()
            yazi = sehirler._kucult(ilce_kutu.get())
            ilce_kutu["values"] = ([s for s in tum if yazi in sehirler._kucult(s)]
                                   if yazi else tum)

        il_kutu.bind("<<ComboboxSelected>>", il_secildi)
        il_kutu.bind("<KeyRelease>", il_yazarken)
        ilce_kutu.bind("<KeyRelease>", ilce_yazarken)

        alan("Sabah bildirimi — BUGÜNÜN havası")
        saat_kutu = ttk.Combobox(
            ic, values=["06:00", "07:00", "08:00", "09:00", "10:00"],
            state="readonly", font=(YAZI_TIPI, 11), width=32)
        saat_kutu.set("08:00")
        saat_kutu.pack(fill="x", pady=(2, 10))

        alan("Akşam bildirimi — YARININ havası")
        aksam_kutu = ttk.Combobox(
            ic, values=["19:00", "20:00", "21:00", "22:00", "23:00"],
            state="readonly", font=(YAZI_TIPI, 11), width=32)
        aksam_kutu.set("21:00")
        aksam_kutu.pack(fill="x", pady=(2, 12))

        v_yagmur = tk.BooleanVar(value=True)
        v_siddetli = tk.BooleanVar(value=True)
        for metin, degisken in [("Yağmur başlamadan uyar", v_yagmur),
                                ("Şiddetli hava uyarısı", v_siddetli)]:
            tk.Checkbutton(ic, text=metin, variable=degisken, bg=ARKA, fg=YAZI,
                           selectcolor=ICKART, activebackground=ARKA,
                           activeforeground=YAZI, font=(YAZI_TIPI, 10),
                           anchor="w", takefocus=0, highlightthickness=0,
                           bd=0).pack(fill="x")

        durum = tk.Label(ic, text="", bg=ARKA, fg=HATA_R, font=(YAZI_TIPI, 9),
                         anchor="w")
        durum.pack(fill="x", pady=(8, 0))

        def coz(liste, yazi):
            """Yazilan metni listedeki en uygun ogeye cevirir.

            Once birebir, sonra 'ile baslayan', sonra 'iceren' aranir. Boylece
            kullanici tam yazmasa da ('ces' -> 'Çeşme') dogru yeri bulur.
            """
            if not yazi:
                return None
            if yazi in liste:
                return yazi
            k = sehirler._kucult(yazi)
            for a in liste:
                if sehirler._kucult(a).startswith(k):
                    return a
            for a in liste:
                if k in sehirler._kucult(a):
                    return a
            return None

        def kaydet():
            il = coz(sehirler.isimler(), il_kutu.get().strip())
            if not il:
                durum.config(text="İl bulunamadı — listeden seçin ya da doğru yazın.")
                return
            ilce_yazi = ilce_kutu.get().strip()
            ilce = None
            if ilce_yazi and ilce_yazi != IL_MERKEZI:
                ilce = coz(sehirler.il_ilceleri(il), ilce_yazi)
                if not ilce:
                    durum.config(text=f"'{ilce_yazi}' {il} ilçesi değil.")
                    return
            etiket = sehirler.ilce_etiketi(ilce, il) if ilce else il
            yer = sehirler.yer_bul(etiket)
            if not yer:
                durum.config(text="Bu yer bulunamadı.")
                return
            saat, aksam = saat_kutu.get(), aksam_kutu.get()
            if etiket in self.favoriler:
                self.favoriler.remove(etiket)
            self.favoriler.insert(0, etiket)          # ilk favori = varsayilan
            self._tercih_kaydet(favoriler=self.favoriler, kurulum_tamam=True)
            ayar_yaz({"enlem": yer[0], "boylam": yer[1], "isim": etiket,
                      "saat": saat, "aksam_saat": aksam,
                      "uyari_yagmur": v_yagmur.get(),
                      "uyari_siddetli": v_siddetli.get()})
            pen.destroy()
            self._kurulum_gorevleri(saat, aksam,
                                    v_yagmur.get() or v_siddetli.get())
            self.sec_il(etiket)

        self._dugme(ic, "Kaydet ve başla", kaydet, VURGU, BEYAZ).pack(
            fill="x", pady=(14, 0))

        # varsayilan secim: mevcut favorinin ili
        ilk = self.favoriler[0] if self.favoriler else VARSAYILAN_IL
        varsayilan = ilk.split(" (")[1][:-1] if " (" in ilk else ilk
        if not sehirler.bul(varsayilan):
            varsayilan = VARSAYILAN_IL
        il_kutu.set(varsayilan)
        il_secildi()

        pen.update_idletasks()
        x = self.winfo_rootx() + max(0, (self.winfo_width() - pen.winfo_width()) // 2)
        pen.geometry(f"+{x}+{self.winfo_rooty() + 70}")
        pen.grab_set()          # modal: once bu pencere cevaplansin

    def _kurulum_gorevleri(self, saat, aksam_saat, uyarilar):
        """Kurulumdan sonra zamanlanmis gorevleri kurar (arka planda; schtasks
        biraz surebilir, pencere donmasin)."""
        def isle():
            ok = gorev_kur(saat)            # sabah: bugunun havasi
            aksam_gorev_kur(aksam_saat)     # aksam: yarinin havasi
            if uyarilar:
                kontrol_gorev_kur()
            else:
                kontrol_gorev_kaldir()
            self.kuyruk.put(("kurulum", 0, "", ok))

        threading.Thread(target=isle, daemon=True).start()

    def _yarin_paneli_kur(self, sol):
        kart = tk.Frame(sol, bg=PANEL)
        kart.pack(fill="x", pady=(12, 0))
        ic = tk.Frame(kart, bg=PANEL)
        ic.pack(fill="x", padx=14, pady=12)

        self.yarin_baslik_lbl = tk.Label(ic, text="Yarın", bg=PANEL, fg=YAZI2,
                                         font=(YAZI_TIPI, 11, "bold"), anchor="w")
        self.yarin_baslik_lbl.pack(fill="x")

        ozet_satiri = tk.Frame(ic, bg=PANEL)
        ozet_satiri.pack(fill="x", pady=(4, 10))
        self.yarin_ikon = tk.Canvas(ozet_satiri, width=34, height=30, bg=PANEL,
                                    highlightthickness=0)
        self.yarin_ikon.pack(side="left")
        self.yarin_ozet_lbl = tk.Label(ozet_satiri, text="—", bg=PANEL, fg=YAZI,
                                       font=(YAZI_TIPI, 12), anchor="w")
        self.yarin_ozet_lbl.pack(side="left", padx=(8, 0), fill="x", expand=True)

        dugmeler = tk.Frame(ic, bg=PANEL)
        dugmeler.pack(fill="x")
        self.bildir_btn = self._dugme(dugmeler, "Yarını bildir",
                                      self._yarini_bildir, VURGU, BEYAZ)
        self.bildir_btn.pack(side="left")
        tk.Label(dugmeler, text="Her sabah", bg=PANEL, fg=YAZI3,
                 font=(YAZI_TIPI, 10)).pack(side="left", padx=(12, 4))
        self.saat_kutu = ttk.Combobox(
            dugmeler, values=["06:00", "07:00", "08:00", "09:00", "10:00"],
            width=6, font=(YAZI_TIPI, 10), state="readonly")
        self.saat_kutu.set("08:00")
        self.saat_kutu.pack(side="left")
        self.sabah_btn = self._dugme(dugmeler, "Kur", self._sabah_toggle,
                                     BTN2)
        self.sabah_btn.pack(side="left", padx=(6, 0))

        self.sabah_durum_lbl = tk.Label(ic, text="", bg=PANEL, fg=YAZI3,
                                        font=(YAZI_TIPI, 9), anchor="w")
        self.sabah_durum_lbl.pack(fill="x", pady=(8, 0))

    def _yarin_goster(self, veri):
        ozet = yarin_ozeti(veri)
        self.yarin_ikon.delete("all")
        if not ozet:
            self.yarin_baslik_lbl.config(text="Yarın")
            self.yarin_ozet_lbl.config(text="Veri yok")
            return
        self.yarin_baslik_lbl.config(
            text="Yarın · " + self._tarih_yaz(ozet["tarih"]))
        hava_ikonu(self.yarin_ikon, 17, 14, 7, ozet["kategori"])
        metin = (f"{ozet['en_dusuk']}° / {ozet['en_yuksek']}°C    "
                 f"{ozet['aciklama']}")
        if ozet["yagis_olasilik"]:
            metin += f"    ·    %{ozet['yagis_olasilik']} yağış"
        self.yarin_ozet_lbl.config(text=metin)

    def _yarini_bildir(self):
        """Secili yerin yarinki havasini HEMEN bildirim olarak gosterir."""
        if not self.son_veri or not self.secili:
            return
        self.ipucu_lbl.config(text="Bildirim gönderiliyor…", fg=YAZI2)
        veri, isim = self.son_veri, self.secili["isim"]

        def isle():  # toast gostermek powershell cagirir -> arka planda yap
            ozet = yarin_ozeti(veri)
            ok = bool(ozet) and bildirim.goster(
                "Yarının hava durumu", yarin_mesaji(ozet, isim))
            self.kuyruk.put(("bildirim", 0, "", ok))

        threading.Thread(target=isle, daemon=True).start()

    def _bildirim_sonucu(self, ok):
        if ok:
            self.ipucu_lbl.config(text="Bildirim gönderildi ✓", fg=NEM_R)
        else:
            self.ipucu_lbl.config(text="Bildirim gönderilemedi", fg=HATA_R)

    def _sabah_toggle(self):
        """'Her sabah bildir' gorevini kurar ya da kaldirir."""
        if self._gorev_acik:
            gorev_kaldir()
            self._gorev_acik = False
        else:
            if not self.secili:
                self.sabah_durum_lbl.config(text="Önce bir il seçin.",
                                            fg=HATA_R)
                return
            ayar_yaz({**self.secili, "saat": self.saat_kutu.get()})
            self._gorev_acik = gorev_kur(self.saat_kutu.get())
        self._sabah_arayuz_guncelle()

    def _sabah_arayuz_guncelle(self):
        self._dugme_stil(self.sabah_btn, self._gorev_acik)
        if self._gorev_acik:
            self.sabah_btn.config(text="Kapat")
            kayit = ayar_oku() or {}
            yer = kayit.get("isim", "")
            aksam = kayit.get("aksam_saat", "20:00")
            self.sabah_durum_lbl.config(
                text=f"✓ {yer} — sabah {self.saat_kutu.get()} bugünü, "
                     f"akşam {aksam} yarını bildirir",
                fg=NEM_R)
        else:
            self.sabah_btn.config(text="Kur")
            self.sabah_durum_lbl.config(
                text="Otomatik sabah bildirimi kapalı", fg=YAZI3)

    # ---------- 7 gunluk serit (pencerenin alti) ----------

    def _gunluk_serit_kur(self):
        dis = tk.Frame(self, bg=ARKA)
        dis.pack(side="bottom", fill="x", padx=16, pady=(0, 14))
        tk.Label(dis, text="7 Günlük Tahmin", bg=ARKA, fg=YAZI,
                 font=(YAZI_TIPI, 12, "bold"), anchor="w").pack(
            fill="x", pady=(0, 6))
        serit = tk.Frame(dis, bg=ARKA)
        serit.pack(fill="x")

        self.gun_kartlari = []
        for i in range(7):
            serit.columnconfigure(i, weight=1, uniform="gun")
            kart = tk.Frame(serit, bg=PANEL)
            kart.grid(row=0, column=i, sticky="nsew",
                      padx=(0 if i == 0 else 6, 0))
            gun = tk.Label(kart, text="—", bg=PANEL, fg=YAZI,
                           font=(YAZI_TIPI, 10, "bold"))
            gun.pack(pady=(10, 4))
            tuval = tk.Canvas(kart, width=46, height=40, bg=PANEL,
                              highlightthickness=0)
            tuval.pack()
            derece = tk.Label(kart, text="", bg=PANEL, fg=YAZI,
                              font=(YAZI_TIPI, 11))
            derece.pack(pady=(4, 2))
            yagis = tk.Label(kart, text="", bg=PANEL, fg=NEM_R,
                             font=(YAZI_TIPI, 9))
            yagis.pack(pady=(0, 10))
            self.gun_kartlari.append(
                {"gun": gun, "tuval": tuval, "derece": derece, "yagis": yagis})

    def _gunluk_goster(self, gunluk):
        for i, kart in enumerate(self.gun_kartlari):
            if i >= len(gunluk):
                continue
            g = gunluk[i]
            kart["gun"].config(text=self._gun_adi(g["tarih"], i))
            kart["tuval"].delete("all")
            hava_ikonu(kart["tuval"], 23, 19, 9, g["kategori"])
            kart["derece"].config(text=f"{g['en_yuksek']}° / {g['en_dusuk']}°")
            ols = g["yagis_olasilik"] or 0
            kart["yagis"].config(text=f"%{ols} yağış" if ols else " ")

    def _gun_adi(self, tarih, sira):
        if sira == 0:
            return "Bugün"
        if sira == 1:
            return "Yarın"
        try:
            import datetime
            return GUNLER[datetime.date.fromisoformat(tarih).weekday()]
        except Exception:
            return tarih[5:]

    def _saatlik_baslik(self, sol):
        cizgi = tk.Frame(sol, bg=ICKART)
        cizgi.pack(fill="x")
        basliklar = [("Saat", 6, "w"), ("", 5, "center"), ("°C", 5, "center"),
                     ("Nem", 6, "center"), ("Rüzgâr", 9, "center"),
                     ("mm", 6, "e")]
        satir = tk.Frame(cizgi, bg=ICKART)
        satir.pack(fill="x", padx=10, pady=5)
        for metin, gen, hiza in basliklar:
            tk.Label(satir, text=metin, bg=ICKART, fg=YAZI3,
                     font=(YAZI_TIPI, 9, "bold"), width=gen,
                     anchor=hiza).pack(side="left")

    def _saatlik_liste_kur(self, panel):
        # Kendi kaydirmasi YOK; tum sol panel birlikte kaydigi icin burasi
        # sadece saatlik satirlarin dizilecegi bir cercevedir.
        cerceve = tk.Frame(panel, bg=CIZGI)
        cerceve.pack(fill="x")
        self.liste_ic = tk.Frame(cerceve, bg=PANEL)
        self.liste_ic.pack(fill="x", padx=1, pady=1)

    def _tekerlek_bagla(self, _):
        self.sol_tuval.bind_all("<MouseWheel>", self._tekerlek)

    def _tekerlek_coz(self, _):
        self.sol_tuval.unbind_all("<MouseWheel>")

    def _tekerlek(self, olay):
        self.sol_tuval.yview_scroll(int(-olay.delta / 120), "units")

    # ------------------------------------------------------------------
    #  Olaylar: il secme / haritaya tiklama
    # ------------------------------------------------------------------

    def _kutudan_secildi(self, _=None):
        metin = self.il_kutu.get().strip()
        if sehirler.yer_bul(metin):
            self.sec_il(metin)                     # tam il ya da ilce adi
        elif self.il_kutu["values"]:
            self.sec_il(self.il_kutu["values"][0])  # kismen yazildi -> ilk sonuc
        elif metin:
            self._yer_ara(metin)                   # listede yok -> geocoding

    def _yer_ara(self, isim):
        """81 il disindaki bir yeri (ilce/kasaba/mahalle) arayip yukler."""
        self.ipucu_lbl.config(text="Yer aranıyor…", fg=YAZI2)

        def isle():
            try:
                sonuc = yer_ara(isim, sayi=1)
            except Exception:
                sonuc = []
            self.kuyruk.put(("yer", 0, "", sonuc))

        threading.Thread(target=isle, daemon=True).start()

    def _yer_sonucu(self, sonuc):
        if not sonuc:
            self.ipucu_lbl.config(text="Yer bulunamadı", fg=HATA_R)
            return
        r = sonuc[0]
        ad = r["ad"] + (f" ({r['bolge']})" if r["bolge"] else "")
        self.sec_yer(ad, r["enlem"], r["boylam"], 10)
        self.ipucu_lbl.config(text=IPUCU, fg=YAZI3)

    def _kutuda_ara(self, olay):
        """Kullanici yazdikca il VE ilcelerde arar (en fazla 50 sonuc)."""
        if olay.keysym in ("Up", "Down", "Return", "Left", "Right", "Escape"):
            return
        self.il_kutu["values"] = sehirler.ara(self.il_kutu.get())

    def sec_yer(self, ad, enlem, boylam, yakinlik=9):
        """Bir yeri (il, ilce ya da aranan nokta) secer ve havasini getirir."""
        self.il_kutu.set(ad)
        self.secili = {"enlem": enlem, "boylam": boylam, "isim": ad}
        self.harita.set_position(enlem, boylam)
        self.harita.set_zoom(yakinlik)
        self._isaretci_koy(enlem, boylam, ad)
        self._hava_getir(enlem, boylam, ad)

    def sec_il(self, isim):
        """Il adi ya da 'İlçe (İl)' etiketiyle secim yapar."""
        yer = sehirler.yer_bul(isim)
        if not yer:
            return
        # il ise biraz genis, ilce ise biraz daha yakin goster
        yakinlik = 8 if sehirler.bul(isim) else 10
        self.sec_yer(isim, yer[0], yer[1], yakinlik)

    def _haritaya_tiklandi(self, koordinat):
        enlem, boylam = koordinat
        # en yakin ile "gibi" isim ver; yoksa koordinat yaz
        isim = self._en_yakin_il(enlem, boylam)
        self.il_kutu.set(isim)
        self.secili = {"enlem": enlem, "boylam": boylam, "isim": isim}
        self._isaretci_koy(enlem, boylam, isim)
        self._hava_getir(enlem, boylam, isim)

    def _en_yakin_il(self, enlem, boylam):
        """Tiklanan noktaya en yakin YERI dondurur (ilceler dahil)."""
        return sehirler.en_yakin(enlem, boylam)

    def _isaretci_koy(self, enlem, boylam, isim):
        if self.isaretci is not None:
            self.isaretci.delete()
        self.isaretci = self.harita.set_marker(
            enlem, boylam, text=isim,
            marker_color_circle=VURGU, marker_color_outside=VURGU,
            text_color=YAZI)

    def _isaretci_metni(self, isim, sicaklik):
        """Isaretci yazisini 'İzmir 29°' gibi sicaklikla gunceller."""
        if not self.secili:
            return
        metin = f"{isim}  {sicaklik}°" if sicaklik is not None else isim
        if self.isaretci is not None:
            try:
                self.isaretci.set_text(metin)
                return
            except Exception:
                pass
        self._isaretci_koy(self.secili["enlem"], self.secili["boylam"], metin)

    # ------------------------------------------------------------------
    #  Veriyi arka planda getir (pencere donmasin diye)
    # ------------------------------------------------------------------

    def _hava_getir(self, enlem, boylam, isim):
        """Veriyi ARKA PLANDA cek. Boylece internet yavas olsa bile pencere
        donmaz; kullanici haritayi kaydirmaya devam edebilir."""
        self._istek_no += 1
        benim_no = self._istek_no
        self.ipucu_lbl.config(text="Yükleniyor…", fg=YAZI2)

        def is_parcacigi():
            # DIKKAT: bu fonksiyon ana pencerede DEGIL, ayri bir is
            # parcaciginda calisir. Bu yuzden burada tkinter'a HIC dokunmuyoruz;
            # sadece sonucu kuyruga birakiyoruz. Ekrani ana pencere gunceller.
            try:
                veri = hava_al(enlem, boylam)
                # hava kalitesi ayri bir servistir; hata verirse havayi bozmasin
                try:
                    veri["hava_kalitesi"] = hava_kalitesi_al(enlem, boylam)
                except Exception:
                    veri["hava_kalitesi"] = None
                try:
                    veri["modeller"] = model_karsilastir(enlem, boylam)
                except Exception:
                    veri["modeller"] = None
                self.kuyruk.put(("veri", benim_no, isim, veri))
            except Exception as hata:
                self.kuyruk.put(("hata", benim_no, isim, hata))

        threading.Thread(target=is_parcacigi, daemon=True).start()

    def _kuyrugu_yokla(self):
        """Ana pencerede calisir. Arka planin biraktigi sonuclari alir ve
        ekrani gunceller. Kendini 120 ms sonra tekrar cagirir (surekli dinler)."""
        if self._kapaniyor:
            return
        try:
            while True:
                tur, benim_no, isim, yuk = self.kuyruk.get_nowait()
                # bildirim sonucu istek numarasindan bagimsizdir
                if tur == "bildirim":
                    self._bildirim_sonucu(yuk)
                    continue
                if tur == "radar":
                    self._radar_sonucu(yuk)
                    continue
                if tur == "yer":
                    self._yer_sonucu(yuk)
                    continue
                if tur == "kurulum":
                    # kurulum penceresinden sonra arayuzu tazele
                    self._gorev_acik = bool(yuk)
                    kayit = ayar_oku() or {}
                    if kayit.get("saat"):
                        self.saat_kutu.set(kayit["saat"])
                    self.uyari_yagmur.set(bool(kayit.get("uyari_yagmur")))
                    self.uyari_siddetli.set(bool(kayit.get("uyari_siddetli")))
                    self._sabah_arayuz_guncelle()
                    self._uyari_arayuz_guncelle()
                    self._favori_serit_yenile()
                    self._yildiz_guncelle()
                    continue
                if tur == "tepsi":
                    if isim == "goster":
                        self.deiconify()
                        self.lift()
                        self.focus_force()
                    elif isim == "cikis":
                        self._tam_kapat()
                    continue
                # Sadece EN SON istegin sonucunu goster; kullanici hizli hizli
                # sehir degistirdiyse eski cevaplari cope at.
                if benim_no != self._istek_no:
                    continue
                if tur == "veri":
                    self._veriyi_goster(isim, yuk)
                else:
                    self._hata_goster(yuk)
        except queue.Empty:
            pass
        try:
            self.after(120, self._kuyrugu_yokla)
        except tk.TclError:
            pass

    def _hata_goster(self, hata):
        self.ipucu_lbl.config(text="İnternet/veri hatası — tekrar deneyin",
                              fg=HATA_R)

    def _veriyi_goster(self, isim, veri):
        self.ipucu_lbl.config(text=IPUCU, fg=YAZI3)
        self.son_veri = veri
        self._guncel_goster(isim, veri["guncel"])
        self._saatlik_goster(veri["guncel"], veri["saatlik"])
        self._yagmur_goster(veri)
        self._detaylar_goster(veri["guncel"])
        self._hava_kalitesi_goster(veri.get("hava_kalitesi"))
        self._model_goster(veri.get("modeller"))
        self._yarin_goster(veri)
        self._gunluk_goster(veri["gunluk"])
        # isaretciyi sicaklikla belirginlestir ("yerler belirgin olsun")
        self._isaretci_metni(isim, veri["guncel"].get("sicaklik"))
        self._yildiz_guncelle()
        self._tepsi_guncelle(isim, veri["guncel"].get("sicaklik"))

    # ------------------------------------------------------------------
    #  Ekrani doldurma
    # ------------------------------------------------------------------

    def _gece_mi(self, g):
        """Su an gece mi? (gun dogumu/batimi saatleriyle karsilastirir)"""
        try:
            simdi = g["zaman"][11:16]
            return not (g["gun_dogumu"] <= simdi <= g["gun_batimi"])
        except Exception:
            return False

    def _hero_zemini(self, g):
        """Ust kartin zeminini o anki havaya (ve gece/gunduze) gore boyar."""
        pal = HERO_KOYU if self._koyu else HERO_ACIK
        kategori = g.get("kategori", "bulut")
        if self._gece_mi(g) and kategori in ("gunes", "gunes_bulut"):
            kategori = "gunes_gece"
        renk = pal.get(kategori, pal["bulut"])
        for oge in getattr(self, "_hero_ogeleri", []):
            try:
                oge.config(bg=renk)
            except tk.TclError:
                pass

    def _guncel_goster(self, isim, g):
        self._hero_zemini(g)          # havaya gore kart zemini
        self.il_ad_lbl.config(text=isim)
        self.tarih_lbl.config(text=self._tarih_yaz(g["zaman"], saatli=True))

        self.ikon_tuval.delete("all")
        hava_ikonu(self.ikon_tuval, 48, 50, 20, g["kategori"])

        self.sicaklik_lbl.config(text=f"{g['sicaklik']}°C")
        self.aciklama_lbl.config(text=g["aciklama"])
        self.hissedilen_lbl.config(text=f"Hissedilen {g['hissedilen']}°C")

        self.nem_deger.config(text=f"%{g['nem']}")
        self.ruzgar_deger.config(
            text=f"{g['ruzgar_hiz']} km/s {g['ruzgar_yon_kisa']}")
        self.yagis_deger.config(text=f"{g['yagis']} mm")

        parcalar = []
        if g.get("gun_dogumu"):
            parcalar.append(f"↑ {g['gun_dogumu']}")
        if g.get("gun_batimi"):
            parcalar.append(f"↓ {g['gun_batimi']}")
        if g.get("uv") is not None:
            parcalar.append(f"UV {g['uv']}")
        self.gunes_lbl.config(text="      ".join(parcalar))

    def _saatlik_goster(self, guncel, saatlik):
        # onceki satirlari temizle
        for cocuk in self.liste_ic.winfo_children():
            cocuk.destroy()
        self._satir_ikonlari.clear()

        baslangic = self._simdiki_saat_indeksi(guncel, saatlik)
        gosterilecek = saatlik[baslangic:baslangic + 24]

        # sicaklik grafigini de bu 24 saatle ciz
        self._grafik_veri = gosterilecek
        self._grafik_ciz()

        onceki_tarih = None
        for sira, s in enumerate(gosterilecek):
            if s["tarih"] != onceki_tarih:
                self._gun_ayraci(s["tarih"])
                onceki_tarih = s["tarih"]
            self._saatlik_satir(s, ilk=(sira == 0))

    def _saatlik_satir(self, s, ilk):
        arka = SECILI if ilk else PANEL
        satir = tk.Frame(self.liste_ic, bg=arka)
        satir.pack(fill="x")
        ic = tk.Frame(satir, bg=arka)
        ic.pack(fill="x", padx=10, pady=3)

        saat_metni = "Şimdi" if ilk else s["saat"]
        tk.Label(ic, text=saat_metni, bg=arka,
                 fg=(YAZI if ilk else YAZI2),
                 font=(YAZI_TIPI, 10, "bold" if ilk else "normal"),
                 width=6, anchor="w").pack(side="left")

        tuval = tk.Canvas(ic, width=30, height=26, bg=arka,
                          highlightthickness=0)
        tuval.pack(side="left")
        hava_ikonu(tuval, 15, 13, 6, s["kategori"])
        self._satir_ikonlari.append(tuval)

        tk.Label(ic, text=f"{s['sicaklik']}°", bg=arka, fg=YAZI,
                 font=(YAZI_TIPI, 11), width=5, anchor="center").pack(side="left")
        tk.Label(ic, text=f"%{s['nem']}", bg=arka, fg=NEM_R,
                 font=(YAZI_TIPI, 10), width=6, anchor="center").pack(side="left")
        tk.Label(ic, text=f"{s['ruzgar_yon_kisa']} {s['ruzgar_hiz']}",
                 bg=arka, fg=RUZGAR_R, font=(YAZI_TIPI, 10),
                 width=9, anchor="center").pack(side="left")
        yagis = s["yagis"] if s["yagis"] is not None else 0
        tk.Label(ic, text=f"{yagis:g}", bg=arka,
                 fg=(YAGIS_R if yagis else YAZI3),
                 font=(YAZI_TIPI, 10), width=6, anchor="e").pack(side="left")

    def _gun_ayraci(self, tarih):
        ayrac = tk.Frame(self.liste_ic, bg=ICKART)
        ayrac.pack(fill="x")
        tk.Label(ayrac, text=self._tarih_yaz(tarih), bg=ICKART, fg=YAZI2,
                 font=(YAZI_TIPI, 10, "bold"), anchor="w").pack(
            fill="x", padx=12, pady=3)

    # ------------------------------------------------------------------
    #  Kucuk yardimcilar
    # ------------------------------------------------------------------

    def _simdiki_saat_indeksi(self, guncel, saatlik):
        """Saatlik listede 'su an'a denk gelen satirin sirasini bulur."""
        hedef = guncel["zaman"][:13]   # "2026-07-17T14"
        for i, s in enumerate(saatlik):
            if s["zaman"][:13] == hedef:
                return i
        return 0

    def _tarih_yaz(self, iso, saatli=False):
        """'2026-07-17T14:00' -> '17 Temmuz Cuma' (istenirse saat ekler)."""
        try:
            yil, ay, gun = int(iso[:4]), int(iso[5:7]), int(iso[8:10])
            # haftanin gunu: Zeller yerine basit datetime
            import datetime
            haftagun = GUNLER[datetime.date(yil, ay, gun).weekday()]
            metin = f"{gun} {AYLAR[ay - 1]} {haftagun}"
            if saatli and len(iso) >= 16:
                metin += f" · {iso[11:16]}"
            return metin
        except Exception:
            return iso


if __name__ == "__main__":
    if "--sabah" in sys.argv:
        sabah_modu()                 # pencere ACMADAN: bugunun havasi
    elif "--aksam" in sys.argv:
        aksam_modu()                 # pencere ACMADAN: yarinin havasi
    elif "--kontrol" in sys.argv:
        kontrol_modu()               # pencere ACMADAN yagmur/siddetli kontrolu
    else:
        HavaDurumu().mainloop()
