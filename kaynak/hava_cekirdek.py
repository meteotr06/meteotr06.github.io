"""Hava Durumu - veri motoru (arayuzsuz).

Bu dosya internetten hava verisini ceker ve duzenler; ekranda hicbir sey
cizmez. Arayuz (hava_durumu.py) bu dosyayi cagirir. Boylece bir gun veri
kaynagi degisirse yalnizca burasi degisir, arayuze dokunulmaz.

Veri kaynagi: Open-Meteo  (https://open-meteo.com)
  - Ucretsizdir ve API anahtari (sifre) istemez.
  - Ulusal meteoroloji servislerinin bilimsel modellerini (ICON, GFS,
    ECMWF, ...) birlestirir. Yani ciddi hava tahmin sistemleriyle ayni
    kaynaklari kullanir.
  - Her saat icin sicaklik, NEM, RUZGAR ve YAGIS verir.

Sadece Python'un kendi kutuphaneleri kullanilir (urllib, json). Ekstra
paket gerekmez.
"""

import datetime
import json
import urllib.parse
import urllib.request
from collections import Counter

# Open-Meteo'nun tahmin adresi
ADRES = "https://api.open-meteo.com/v1/forecast"

# WMO hava kodu -> (Turkce aciklama, ikon kategorisi)
# Kaynak: Dunya Meteoroloji Orgutu (WMO) standart hava kodlari.
# Kategori, arayuzde hangi resmin cizilecegini belirler.
WMO = {
    0:  ("Açık", "gunes"),
    1:  ("Az bulutlu", "gunes_bulut"),
    2:  ("Parçalı bulutlu", "gunes_bulut"),
    3:  ("Çok bulutlu", "bulut"),
    45: ("Sisli", "sis"),
    48: ("Kırağılı sis", "sis"),
    51: ("Hafif çisenti", "yagmur"),
    53: ("Çisenti", "yagmur"),
    55: ("Yoğun çisenti", "yagmur"),
    56: ("Dondurucu çisenti", "yagmur"),
    57: ("Yoğun dondurucu çisenti", "yagmur"),
    61: ("Hafif yağmur", "yagmur"),
    63: ("Yağmurlu", "yagmur"),
    65: ("Kuvvetli yağmur", "yagmur"),
    66: ("Dondurucu yağmur", "yagmur"),
    67: ("Kuvvetli dondurucu yağmur", "yagmur"),
    71: ("Hafif kar", "kar"),
    73: ("Karlı", "kar"),
    75: ("Yoğun kar", "kar"),
    77: ("Kar taneli", "kar"),
    80: ("Hafif sağanak", "yagmur"),
    81: ("Sağanak yağış", "yagmur"),
    82: ("Şiddetli sağanak", "yagmur"),
    85: ("Hafif kar sağanağı", "kar"),
    86: ("Yoğun kar sağanağı", "kar"),
    95: ("Gök gürültülü fırtına", "firtina"),
    96: ("Dolulu fırtına", "firtina"),
    99: ("Şiddetli dolu fırtınası", "firtina"),
}

# Ruzgarin geldigi yon: 8 yonlu pusula. 0 derece = Kuzey, saat yonunde artar.
YONLER = ["Kuzey", "Kuzeydoğu", "Doğu", "Güneydoğu",
          "Güney", "Güneybatı", "Batı", "Kuzeybatı"]
YONLER_KISA = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"]


def ruzgar_yonu(derece, kisa=False):
    """Dereceyi (0-360) yazili yone cevirir. kisa=True ise 'KD' gibi."""
    if derece is None:
        return "-"
    dilim = int((derece + 22.5) // 45) % 8
    return YONLER_KISA[dilim] if kisa else YONLER[dilim]


def kod_coz(kod):
    """WMO kodunu (aciklama, kategori) olarak dondurur."""
    return WMO.get(kod, ("Bilinmiyor", "bulut"))


def hava_al(enlem, boylam, gun=7, zaman_asimi=15):
    """Open-Meteo'dan hava verisini ceker ve duzenli bir sozluk dondurur.

    Parametreler:
      enlem, boylam : konum (Turkiye icin enlem ~36-42, boylam ~26-45)
      gun           : kac gunluk saatlik tahmin (varsayilan 2 = 48 saat)
      zaman_asimi   : internet yavassa kac saniye beklensin

    Doner:
      {
        "guncel":  {sicaklik, hissedilen, nem, yagis, ruzgar_hiz,
                    ruzgar_yon, ruzgar_yon_kisa, aciklama, kategori, zaman},
        "saatlik": [ {saat, tarih, sicaklik, nem, yagis, yagis_olasilik,
                      ruzgar_hiz, ruzgar_yon_kisa, aciklama, kategori}, ... ]
      }

    Internet yoksa veya adres yanit vermezse Exception firlatir; cagiran
    taraf (arayuz) bunu yakalayip kullaniciya Turkce hata gosterir.
    """
    parametreler = {
        "latitude": enlem,
        "longitude": boylam,
        # "current" = su anki durum
        "current": ",".join([
            "temperature_2m",        # sicaklik
            "apparent_temperature",  # hissedilen sicaklik
            "relative_humidity_2m",  # bagil nem (%)
            "precipitation",         # yagis (mm)
            "weather_code",          # WMO hava kodu
            "wind_speed_10m",        # ruzgar hizi
            "wind_direction_10m",    # ruzgar yonu (derece)
            "wind_gusts_10m",        # ruzgar hamlesi (en siddetli esinti)
            "uv_index",              # UV indeksi
            "surface_pressure",      # basinc (hPa)
            "visibility",            # gorus mesafesi (metre)
            "dew_point_2m",          # ciy noktasi (°C)
            "cloud_cover",           # bulut ortusu (%)
        ]),
        # "daily" = gun gun tahmin (7 gunluk)
        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "uv_index_max",
            "sunrise",               # gun dogumu
            "sunset",                # gun batimi
        ]),
        # "hourly" = saat saat tahmin
        "hourly": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "precipitation_probability",  # yagis olasiligi (%)
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
        ]),
        # "minutely_15" = 15 dakikalik yagis (yagmur ne zaman baslar sorusu icin)
        "minutely_15": "precipitation",
        "wind_speed_unit": "kmh",      # ruzgari km/saat olarak iste
        "timezone": "Europe/Istanbul",  # saatler Turkiye saatiyle gelsin
        "forecast_days": gun,
    }

    url = ADRES + "?" + urllib.parse.urlencode(parametreler)
    istek = urllib.request.Request(url, headers={"User-Agent": "HavaDurumu/1.0"})
    with urllib.request.urlopen(istek, timeout=zaman_asimi) as cevap:
        ham = json.loads(cevap.read().decode("utf-8"))

    return _duzenle(ham)


# ---------- ic yardimcilar (dışardan cagrilmaz) ----------

def _duzenle(ham):
    """Open-Meteo'nun ham cevabini arayuzun kullandigi bicime cevirir."""
    guncel = _guncel(ham["current"])
    gunluk = _gunluk(ham["daily"])
    # bugunun gun dogumu/batimi bilgisini gunluk listenin ilk gununden al
    if gunluk:
        guncel["gun_dogumu"] = gunluk[0]["gun_dogumu"]
        guncel["gun_batimi"] = gunluk[0]["gun_batimi"]
    return {
        "guncel": guncel,
        "saatlik": _saatlik(ham["hourly"]),
        "gunluk": gunluk,
        "dakikalik": _dakikalik(ham.get("minutely_15")),
    }


def _dakikalik(m):
    """minutely_15 blogunu [{zaman, yagis}, ...] listesine cevirir."""
    if not m:
        return []
    return [{"zaman": z, "yagis": y}
            for z, y in zip(m["time"], m["precipitation"])]


def _guncel(g):
    aciklama, kategori = kod_coz(g["weather_code"])
    return {
        "sicaklik": _tam(g["temperature_2m"]),
        "hissedilen": _tam(g["apparent_temperature"]),
        "nem": g["relative_humidity_2m"],
        "yagis": g["precipitation"],
        "ruzgar_hiz": _tam(g["wind_speed_10m"]),
        "ruzgar_yon": ruzgar_yonu(g["wind_direction_10m"]),
        "ruzgar_yon_kisa": ruzgar_yonu(g["wind_direction_10m"], kisa=True),
        "hamle": _tam(g.get("wind_gusts_10m")),
        "uv": _tam(g.get("uv_index")),
        "basinc": _tam(g.get("surface_pressure")),
        "gorus": g.get("visibility"),          # metre
        "ciy": _tam(g.get("dew_point_2m")),
        "bulut": g.get("cloud_cover"),         # %
        "ay_evresi": ay_evresi(g["time"]),
        "aciklama": aciklama,
        "kategori": kategori,
        "zaman": g["time"],          # "2026-07-17T14:00"
    }


AY_EVRELERI = [
    "Yeni Ay", "Büyüyen Hilal", "İlk Dördün", "Büyüyen Şişkin Ay",
    "Dolunay", "Küçülen Şişkin Ay", "Son Dördün", "Küçülen Hilal",
]


def ay_evresi(zaman):
    """Tarihe gore ayin evresini (Turkce) dondurur.

    Bilinen bir yeni aydan (2000-01-06) bu yana gecen gunu ay dongusune
    (29.53 gun) gore hesaplar. Basit ama pratikte yeterince dogru.
    """
    try:
        d = datetime.date.fromisoformat(zaman[:10])
        gun = (d - datetime.date(2000, 1, 6)).days % 29.53058867
        dilim = int((gun / 29.53058867) * 8 + 0.5) % 8
        return AY_EVRELERI[dilim]
    except Exception:
        return "-"


# ---------- yer arama (geocoding: herhangi bir yer adi -> koordinat) ----------

ADRES_GEOKOD = "https://geocoding-api.open-meteo.com/v1/search"


def yer_ara(isim, sayi=1, zaman_asimi=10):
    """Bir yer adini (ilce, kasaba, mahalle...) koordinata cevirir.

    81 il disindaki yerler icin kullanilir. Doner: [{ad, enlem, boylam,
    bolge}, ...] (bulunanlar) ya da bos liste.
    """
    if not isim or not isim.strip():
        return []
    parametreler = {"name": isim.strip(), "count": sayi,
                    "language": "tr", "format": "json"}
    url = ADRES_GEOKOD + "?" + urllib.parse.urlencode(parametreler)
    istek = urllib.request.Request(url, headers={"User-Agent": "HavaDurumu/1.0"})
    with urllib.request.urlopen(istek, timeout=zaman_asimi) as cevap:
        veri = json.loads(cevap.read().decode("utf-8"))
    sonuc = []
    for r in (veri.get("results") or []):
        sonuc.append({
            "ad": r["name"],
            "enlem": r["latitude"],
            "boylam": r["longitude"],
            "bolge": r.get("admin1", ""),
        })
    return sonuc


def _gunluk(d):
    """daily bloğunu 7 gunluk listeye cevirir."""
    liste = []
    for i, tarih in enumerate(d["time"]):
        aciklama, kategori = kod_coz(d["weather_code"][i])
        liste.append({
            "tarih": tarih,                                   # "2026-07-18"
            "en_yuksek": _tam(d["temperature_2m_max"][i]),
            "en_dusuk": _tam(d["temperature_2m_min"][i]),
            "aciklama": aciklama,
            "kategori": kategori,
            "yagis_mm": d["precipitation_sum"][i],
            "yagis_olasilik": d["precipitation_probability_max"][i],
            "ruzgar": _tam(d["wind_speed_10m_max"][i]),
            "uv": _tam(d["uv_index_max"][i]),
            "gun_dogumu": d["sunrise"][i][11:16],             # "05:42"
            "gun_batimi": d["sunset"][i][11:16],              # "20:31"
        })
    return liste


def _saatlik(h):
    satirlar = []
    for i, zaman in enumerate(h["time"]):
        aciklama, kategori = kod_coz(h["weather_code"][i])
        satirlar.append({
            "zaman": zaman,                    # "2026-07-17T14:00"
            "saat": zaman[11:16],              # "14:00"
            "tarih": zaman[:10],               # "2026-07-17"
            "sicaklik": _tam(h["temperature_2m"][i]),
            "nem": h["relative_humidity_2m"][i],
            "yagis": h["precipitation"][i],
            "yagis_olasilik": h["precipitation_probability"][i],
            "ruzgar_hiz": _tam(h["wind_speed_10m"][i]),
            "ruzgar_yon_kisa": ruzgar_yonu(h["wind_direction_10m"][i], kisa=True),
            "aciklama": aciklama,
            "kategori": kategori,
        })
    return satirlar


def _tam(sayi):
    """Sayiyi en yakin tam sayiya yuvarlar; deger yoksa None birakir."""
    return None if sayi is None else round(sayi)


# ---------- yarin ozeti (bildirim icin) ----------

def yarin_ozeti(veri):
    """Saatlik veriden YARIN'in ozetini cikarir.

    Doner: {tarih, en_dusuk, en_yuksek, aciklama, kategori,
            yagis_olasilik, yagis_mm, ruzgar}  ya da veri yoksa None.
    """
    bugun = veri["guncel"]["zaman"][:10]                      # "2026-07-17"
    yarin = (datetime.date.fromisoformat(bugun)
             + datetime.timedelta(days=1)).isoformat()        # "2026-07-18"

    saatler = [s for s in veri["saatlik"] if s["tarih"] == yarin]
    if not saatler:
        return None

    sicakliklar = [s["sicaklik"] for s in saatler if s["sicaklik"] is not None]
    # gunduz saatleri (09-21) durumu daha iyi temsil eder
    gunduz = [s for s in saatler if 9 <= int(s["saat"][:2]) <= 21] or saatler
    # en sik gorulen hava durumunu "baskin" kabul et
    sayac = Counter((s["aciklama"], s["kategori"]) for s in gunduz)
    (aciklama, kategori), _ = sayac.most_common(1)[0]
    olasiliklar = [s["yagis_olasilik"] for s in saatler
                   if s["yagis_olasilik"] is not None]

    return {
        "tarih": yarin,
        "en_dusuk": min(sicakliklar) if sicakliklar else None,
        "en_yuksek": max(sicakliklar) if sicakliklar else None,
        "aciklama": aciklama,
        "kategori": kategori,
        "yagis_olasilik": max(olasiliklar) if olasiliklar else 0,
        "yagis_mm": round(sum((s["yagis"] or 0) for s in saatler), 1),
        "ruzgar": max((s["ruzgar_hiz"] or 0) for s in saatler),
    }


def yarin_mesaji(ozet, isim):
    """Yarin ozetini insan diliyle tek cumleye cevirir (bildirim metni)."""
    m = (f"{isim}: {ozet['en_dusuk']}° / {ozet['en_yuksek']}°C, "
         f"{ozet['aciklama'].lower()}")
    if ozet["yagis_olasilik"] >= 40 or ozet["yagis_mm"] >= 0.2:
        m += f". Yağış ihtimali %{ozet['yagis_olasilik']}"
        if ozet["kategori"] in ("yagmur", "firtina"):
            m += ", yanınıza şemsiye alın"
        elif ozet["kategori"] == "kar":
            m += ", kar bekleniyor"
    m += f". Rüzgâr en çok {ozet['ruzgar']} km/s."
    return m


# ---------- gunluk ozet (0 = bugun, 1 = yarin) ----------

def gun_ozeti(veri, sira=0):
    """Gunluk listeden ozet alir: sira=0 bugun, sira=1 yarin.

    Sabah 'bugun nasil gececek', aksam 'yarin nasil olacak' bildirimi icin.
    """
    gunluk = veri.get("gunluk") or []
    return gunluk[sira] if sira < len(gunluk) else None


def gun_mesaji(g, isim):
    """Gunluk ozeti tek cumlelik bildirim metnine cevirir."""
    m = (f"{isim}: {g['en_dusuk']}° / {g['en_yuksek']}°C, "
         f"{g['aciklama'].lower()}")
    olasilik = g.get("yagis_olasilik") or 0
    if olasilik >= 40 or (g.get("yagis_mm") or 0) >= 0.2:
        m += f". Yağış ihtimali %{olasilik}"
        if g["kategori"] in ("yagmur", "firtina"):
            m += ", yanınıza şemsiye alın"
        elif g["kategori"] == "kar":
            m += ", kar bekleniyor"
    if g.get("uv") and g["uv"] >= 7:
        m += f". UV yüksek ({g['uv']}), güneşten korunun"
    m += f". Rüzgâr en çok {g['ruzgar']} km/s."
    return m


# ---------- sonraki yagis ("yagmur ne zaman baslar") ----------

def sonraki_yagis(veri, saat_siniri=2):
    """Onumuzdeki 'saat_siniri' saatte yagis baslayacak mi (15 dk cozunurluk)?

    Doner: {saat, yagis} (ilk kayda deger yagisli dilim) ya da None.
    """
    dakikalik = veri.get("dakikalik") or []
    simdi = veri["guncel"]["zaman"]                 # "2026-07-17T23:00"
    gelecek = [s for s in dakikalik if s["zaman"] >= simdi][:saat_siniri * 4]
    for s in gelecek:
        if (s["yagis"] or 0) > 0.05:                # 0.05 mm ustu = kayda deger
            return {"saat": s["zaman"][11:16], "yagis": s["yagis"]}
    return None


# ---------- hava kalitesi + polen (ayri servis) ----------

ADRES_HAVA_KALITE = "https://air-quality-api.open-meteo.com/v1/air-quality"

# Avrupa Hava Kalitesi Indeksi (EAQI): (ust sinir, ad, renk)
AQI_BANTLARI = [
    (20, "İyi", "#4fc978"),
    (40, "Makul", "#a3d900"),
    (60, "Orta", "#f4c500"),
    (80, "Kötü", "#ff8c42"),
    (100, "Çok kötü", "#ff4d4f"),
    (10 ** 9, "Aşırı kötü", "#a05cf0"),
]

# polen turleri: API adi -> Turkce
POLEN_ADLARI = {
    "grass_pollen": "Çim",
    "birch_pollen": "Huş ağacı",
    "olive_pollen": "Zeytin",
    "alder_pollen": "Kızılağaç",
    "mugwort_pollen": "Pelin otu",
    "ragweed_pollen": "Kanarya otu",
}


def _aqi_coz(aqi):
    for ust, ad, renk in AQI_BANTLARI:
        if aqi <= ust:
            return ad, renk
    return "Bilinmiyor", "#9fb0c0"


def hava_kalitesi_al(enlem, boylam, zaman_asimi=15):
    """Open-Meteo Hava Kalitesi servisinden AQI ve polen verisini ceker.

    Doner: {aqi, kategori, renk, pm25, pm10, polen}  (hata olursa Exception).
    """
    parametreler = {
        "latitude": enlem,
        "longitude": boylam,
        "current": "european_aqi,pm2_5,pm10",
        "hourly": ",".join(POLEN_ADLARI.keys()),
        "timezone": "Europe/Istanbul",
        "forecast_days": 1,
    }
    url = ADRES_HAVA_KALITE + "?" + urllib.parse.urlencode(parametreler)
    istek = urllib.request.Request(url, headers={"User-Agent": "HavaDurumu/1.0"})
    with urllib.request.urlopen(istek, timeout=zaman_asimi) as cevap:
        ham = json.loads(cevap.read().decode("utf-8"))

    g = ham.get("current", {})
    aqi = g.get("european_aqi")
    if aqi is not None:
        kategori, renk = _aqi_coz(aqi)
    else:
        kategori, renk = "Veri yok", "#9fb0c0"
    return {
        "aqi": _tam(aqi),
        "kategori": kategori,
        "renk": renk,
        "pm25": g.get("pm2_5"),
        "pm10": g.get("pm10"),
        "polen": _baskin_polen(ham.get("hourly", {})),
    }


def _baskin_polen(hourly):
    """Bugunku en yuksek polen turunu 'Çim (orta)' gibi bir metne cevirir."""
    en_ad, en_deger = None, 0
    for anahtar, turkce in POLEN_ADLARI.items():
        degerler = [d for d in hourly.get(anahtar, []) if d is not None]
        if degerler and max(degerler) > en_deger:
            en_deger, en_ad = max(degerler), turkce
    if not en_ad or en_deger < 1:
        return "Düşük"
    seviye = "düşük" if en_deger < 30 else ("orta" if en_deger < 70 else "yüksek")
    return f"{en_ad} ({seviye})"


# ---------- yagis radari (RainViewer) ----------

ADRES_RADAR = "https://api.rainviewer.com/public/weather-maps.json"


def radar_url(zaman_asimi=10):
    """RainViewer'in EN SON yagis radari karesi icin doseme (tile) URL sablonu.
    tkintermapview'e overlay olarak verilir. Bulunamazsa None dondurur."""
    with urllib.request.urlopen(ADRES_RADAR, timeout=zaman_asimi) as cevap:
        veri = json.loads(cevap.read().decode("utf-8"))
    host = veri.get("host", "https://tilecache.rainviewer.com")
    kareler = (veri.get("radar") or {}).get("past") or []
    if not kareler:
        return None
    yol = kareler[-1]["path"]        # en son (guncel) kare
    # 256 px tile, renk semasi 2, secenek 1_1 (yumusatma + golge)
    return f"{host}{yol}/256/{{z}}/{{x}}/{{y}}/2/1_1.png"


# ---------- model karsilastirma (ECMWF / GFS / ICON) ----------

MODELLER = [
    ("ecmwf_ifs025", "ECMWF"),
    ("gfs_seamless", "GFS"),
    ("icon_seamless", "ICON"),
]


def model_karsilastir(enlem, boylam, zaman_asimi=15):
    """Yarinin en yuksek sicakligini 3 dunya modelinden ceker.

    Doner: [("ECMWF", 31), ("GFS", 30), ("ICON", 32)] (bulunabilenler).
    Farkli modeller farkli tahmin verir; bu, tahminin ne kadar 'kesin'
    oldugunu gosterir (hepsi yakinsa guven yuksek).
    """
    parametreler = {
        "latitude": enlem,
        "longitude": boylam,
        "daily": "temperature_2m_max",
        "models": ",".join(anahtar for anahtar, _ in MODELLER),
        "timezone": "Europe/Istanbul",
        "forecast_days": 2,
    }
    url = ADRES + "?" + urllib.parse.urlencode(parametreler)
    istek = urllib.request.Request(url, headers={"User-Agent": "HavaDurumu/1.0"})
    with urllib.request.urlopen(istek, timeout=zaman_asimi) as cevap:
        d = json.loads(cevap.read().decode("utf-8"))["daily"]

    sonuc = []
    for anahtar, ad in MODELLER:
        dizi = d.get(f"temperature_2m_max_{anahtar}")
        if dizi and len(dizi) > 1 and dizi[1] is not None:
            sonuc.append((ad, round(dizi[1])))
    return sonuc


# ---------- siddetli hava tespiti (uyari icin) ----------

def siddetli_hava(veri):
    """Bugun veya yarin icin tehlikeli hava var mi?

    Doner: {anahtar, mesaj} (ilk bulunan uyari) ya da None.
    'anahtar' ayni uyariyi tekrar tekrar bildirmemek icin kullanilir.
    """
    for i, g in enumerate(veri.get("gunluk", [])[:2]):
        ne = "Bugün" if i == 0 else "Yarın"
        tarih = g["tarih"]
        if g["kategori"] == "firtina":
            return {"anahtar": tarih + "firtina",
                    "mesaj": f"{ne} gök gürültülü fırtına bekleniyor."}
        if g["en_yuksek"] is not None and g["en_yuksek"] >= 40:
            return {"anahtar": tarih + "sicak",
                    "mesaj": f"{ne} aşırı sıcak: {g['en_yuksek']}°C. Bol su için, "
                             f"öğle güneşinden kaçının."}
        if g["en_dusuk"] is not None and g["en_dusuk"] <= -5:
            return {"anahtar": tarih + "soguk",
                    "mesaj": f"{ne} şiddetli soğuk: {g['en_dusuk']}°C. Buzlanmaya "
                             f"dikkat."}
        if g["kategori"] == "kar" and (g["yagis_mm"] or 0) >= 10:
            return {"anahtar": tarih + "kar",
                    "mesaj": f"{ne} yoğun kar yağışı bekleniyor."}
    return None


# Bu dosyayi dogrudan calistirirsan (test icin) Ankara'nin havasini yazar.
if __name__ == "__main__":
    veri = hava_al(39.92, 32.85)  # Ankara
    g = veri["guncel"]
    print("ANKARA - su an:")
    print("  Durum   :", g["aciklama"])
    print("  Sicaklik:", g["sicaklik"], "C  (hissedilen", g["hissedilen"], "C)")
    print("  Nem     :", g["nem"], "%")
    print("  Ruzgar  :", g["ruzgar_hiz"], "km/s", g["ruzgar_yon"])
    print("  Yagis   :", g["yagis"], "mm")
    print()
    print("Sonraki 5 saat:")
    for s in veri["saatlik"][:5]:
        print(f"  {s['saat']}  {s['sicaklik']:>3} C  "
              f"nem %{s['nem']:<3}  ruzgar {s['ruzgar_hiz']:>3} km/s "
              f"{s['ruzgar_yon_kisa']:<2}  yagis {s['yagis']} mm  {s['aciklama']}")
