"""Turkiye'nin 81 ili ve koordinatlari.

Her il icin (isim, enlem, boylam) tutulur. Enlem/boylam, il merkezinin
harita uzerindeki yerini gosterir; hava durumu bu nokta icin cekilir.
Liste plaka sirasina gore dizilmistir (1 Adana ... 81 Duzce).

Bu dosya yalnizca veridir; ekranda hicbir sey cizmez.
"""

# (isim, enlem, boylam)  -- enlem = kuzey, boylam = dogu
ILLER = [
    ("Adana", 37.00, 35.32),
    ("Adıyaman", 37.76, 38.28),
    ("Afyonkarahisar", 38.76, 30.54),
    ("Ağrı", 39.72, 43.05),
    ("Amasya", 40.65, 35.83),
    ("Ankara", 39.92, 32.85),
    ("Antalya", 36.90, 30.70),
    ("Artvin", 41.18, 41.82),
    ("Aydın", 37.85, 27.84),
    ("Balıkesir", 39.65, 27.89),
    ("Bilecik", 40.14, 29.98),
    ("Bingöl", 38.88, 40.50),
    ("Bitlis", 38.40, 42.11),
    ("Bolu", 40.74, 31.61),
    ("Burdur", 37.72, 30.29),
    ("Bursa", 40.19, 29.06),
    ("Çanakkale", 40.15, 26.41),
    ("Çankırı", 40.60, 33.62),
    ("Çorum", 40.55, 34.95),
    ("Denizli", 37.78, 29.09),
    ("Diyarbakır", 37.91, 40.24),
    ("Edirne", 41.68, 26.56),
    ("Elazığ", 38.68, 39.22),
    ("Erzincan", 39.75, 39.50),
    ("Erzurum", 39.90, 41.27),
    ("Eskişehir", 39.78, 30.52),
    ("Gaziantep", 37.07, 37.38),
    ("Giresun", 40.91, 38.39),
    ("Gümüşhane", 40.46, 39.48),
    ("Hakkari", 37.58, 43.74),
    ("Hatay", 36.20, 36.16),
    ("Isparta", 37.76, 30.55),
    ("Mersin", 36.81, 34.64),
    ("İstanbul", 41.01, 28.98),
    ("İzmir", 38.42, 27.14),
    ("Kars", 40.60, 43.10),
    ("Kastamonu", 41.39, 33.78),
    ("Kayseri", 38.73, 35.49),
    ("Kırklareli", 41.74, 27.22),
    ("Kırşehir", 39.15, 34.16),
    ("Kocaeli", 40.77, 29.92),
    ("Konya", 37.87, 32.48),
    ("Kütahya", 39.42, 29.99),
    ("Malatya", 38.35, 38.31),
    ("Manisa", 38.61, 27.43),
    ("Kahramanmaraş", 37.58, 36.93),
    ("Mardin", 37.31, 40.74),
    ("Muğla", 37.22, 28.36),
    ("Muş", 38.73, 41.49),
    ("Nevşehir", 38.62, 34.71),
    ("Niğde", 37.97, 34.68),
    ("Ordu", 40.98, 37.88),
    ("Rize", 41.02, 40.52),
    ("Sakarya", 40.78, 30.40),
    ("Samsun", 41.29, 36.33),
    ("Siirt", 37.93, 41.94),
    ("Sinop", 42.03, 35.15),
    ("Sivas", 39.75, 37.02),
    ("Tekirdağ", 40.98, 27.51),
    ("Tokat", 40.31, 36.55),
    ("Trabzon", 41.00, 39.72),
    ("Tunceli", 39.11, 39.55),
    ("Şanlıurfa", 37.17, 38.79),
    ("Uşak", 38.68, 29.41),
    ("Van", 38.49, 43.41),
    ("Yozgat", 39.82, 34.81),
    ("Zonguldak", 41.45, 31.79),
    ("Aksaray", 38.37, 34.03),
    ("Bayburt", 40.26, 40.22),
    ("Karaman", 37.18, 33.22),
    ("Kırıkkale", 39.85, 33.52),
    ("Batman", 37.88, 41.13),
    ("Şırnak", 37.52, 42.46),
    ("Bartın", 41.64, 32.34),
    ("Ardahan", 41.11, 42.70),
    ("Iğdır", 39.92, 44.04),
    ("Yalova", 40.65, 29.28),
    ("Karabük", 41.20, 32.63),
    ("Kilis", 36.72, 37.12),
    ("Osmaniye", 37.07, 36.25),
    ("Düzce", 40.84, 31.16),
]

# Turkce alfabe sirasi. Python'un normal siralamasi Turkce'yi bilmez
# (ornegin 'Ç' harfini 'Z'den sonraya atar). Bu yuzden kendi sıramizi
# tanimliyoruz: a b c ç d ... i ... ı ... s ş ...
_DUZEN = "abcçdefgğhıijklmnoöprsştuüvyz"


def _kucult(metin):
    """Turkce'ye uygun kucuk harf: I->ı, İ->i, gerisi normal."""
    return metin.replace("I", "ı").replace("İ", "i").lower()


def turkce_anahtar(metin):
    """Bir metni Turkce alfabe sirasina gore siralanabilir hale getirir.

    Her harfi _DUZEN icindeki sira numarasina cevirir. Boylece sorted()
    fonksiyonu Turkce'ye gore dogru sıralar.
    """
    return [_DUZEN.find(harf) for harf in _kucult(metin)]


def alfabetik():
    """Illeri isimlerine gore (Turkce alfabetik) sirali dondurur."""
    return sorted(ILLER, key=lambda il: turkce_anahtar(il[0]))


def isimler():
    """Sadece il isimlerini alfabetik liste olarak dondurur."""
    return [il[0] for il in alfabetik()]


def bul(isim):
    """Il ismine gore (enlem, boylam) dondurur; bulunamazsa None."""
    for ad, enlem, boylam in ILLER:
        if ad == isim:
            return (enlem, boylam)
    return None


# ======================================================================
#  Ilceler (957 adet) - ilceler.py dosyasindan gelir
# ======================================================================

from ilceler import ILCELER


def ilce_etiketi(ilce, il):
    """Listede gorunen ad: 'Çeşme (İzmir)'. Ayni adli ilceler (ornegin
    bircok ilde bulunan 'Merkez') boylece birbirinden ayrilir."""
    return f"{ilce} ({il})"


# --- hizli arama icin ONCEDEN hesaplanan tablolar ---
# Her tusa basista 1000+ ismi kucultmek yerine, bir kez kucultup sakliyoruz.
_YERLER = {ad: (e, b) for ad, e, b in ILLER}
_YERLER.update({ilce_etiketi(a, i): (e, b) for a, i, e, b in ILCELER})

_IL_ARAMA = [(_kucult(ad), ad) for ad in isimler()]
_ILCE_ARAMA = [(_kucult(a), ilce_etiketi(a, i)) for a, i, _, _ in ILCELER]


def yer_bul(etiket):
    """Il adi ya da 'İlçe (İl)' etiketinden (enlem, boylam) dondurur."""
    return _YERLER.get(etiket)


def il_ilceleri(il):
    """Bir ilin ilcelerini Turkce alfabetik sirali dondurur."""
    return sorted([a for a, i, _, _ in ILCELER if i == il], key=turkce_anahtar)


def en_yakin(enlem, boylam):
    """Verilen noktaya en yakin yerin etiketini dondurur.

    Ilceler de dahil oldugu icin haritaya tiklayinca il degil, dogrudan
    ILCE bulunur (ornegin 'İzmir' yerine 'Çeşme (İzmir)') - cok daha isabetli.
    """
    en_iyi, en_kisa = None, None
    for etiket, (e, b) in _YERLER.items():
        uzaklik = (e - enlem) ** 2 + (b - boylam) ** 2
        if en_kisa is None or uzaklik < en_kisa:
            en_kisa, en_iyi = uzaklik, etiket
    return en_iyi


def ara(metin, sinir=50):
    """Il ve ilcelerde arar. Once iller, sonra ilceler.

    'sinir' neden var? 1000'den fazla ogeyi her tusa basista acilir menuye
    yazmak arayuzu yavaslatir. En uygun ilk 50 sonuc yeterlidir.
    """
    k = _kucult(metin.strip())
    if not k:
        return isimler()          # bos ise sadece iller listelensin
    sonuc = [ad for kucuk, ad in _IL_ARAMA if k in kucuk]
    for kucuk, etiket in _ILCE_ARAMA:
        if len(sonuc) >= sinir:
            break
        if k in kucuk:
            sonuc.append(etiket)
    return sonuc[:sinir]
