# -*- coding: utf-8 -*-
"""ERİŞİLEBİLİRLİK AYARINI İPTAL EDEN SOLDURMA — nöbetçi.

NEDEN VAR (07.09.2026, ölçüldü)
    `@media (prefers-contrast: more)` bir accommodation'dır ve BELİRTECİ
    değiştirerek çalışır: `--yazi2: #656c7a` → `#475569`.
    `opacity` ise belirteçten SONRA, çizim anında uygulanır.

    Hesap Araçları'nda `.bekleyen-simge` ikisini birden taşıyordu:
        color: var(--yazi2);  opacity: .65;
    Sonuç: kullanıcı işletim sisteminden "daha yüksek karşıtlık" açıyor,
    sistem 7,01 vaat ediyor, ekrana 3,10 geliyor — vaadin %44'ü.

    Ayarı açan kullanıcı, tam da o ayara ihtiyacı olan kullanıcıdır.
    Ona "ayarın çalışıyor" deyip çalışmaması, hiç ayar olmamasından
    KÖTÜDÜR — çünkü bakıldığı sanılır (K-22).

NİYE KONTRAST HESAPLAMIYOR
    Hesaplayabilmek için zemini bilmek gerekir; zemin ancak TARAYICIDA
    kesinleşir. Bu dosyada tam o tuzağa düştük: `.kutu` zemini `--kart`
    sanıldı, oysa `.kutu.bekleyen` onu `transparent` yapıyor ve gerçek
    zemin `body`den (`--zemin`) geliyordu. Yanlış zeminle çıkan sayı,
    sayı olmadığı hâlde sayı gibi görünür.

    Bu yüzden nöbetçi ZEMİNDEN BAĞIMSIZ olanı ölçer: accommodation'ın
    vaat ettiği artışın yüzde kaçının soldurmayla geri alındığını.
    Bu oran her zeminde aynıdır ve tahmin içermez.

KULLANIM
    python soldurma_denetle.py            (bulguları yazar)
    python soldurma_denetle.py --sinama   (kendi nöbetini sınar)
Çıkış kodu 1 = accommodation iptal edilen kural var.
"""
import io, os, re, sys

DOSYALAR = [
    ("09 kaynak", r"D:\Projeler\09 Hesap Araclari\stil.css"),
    ("09 yayin",  r"D:\Projeler\02 Hava Dururmu\hesap\stil.css"),
    ("07 kaynak", r"D:\Projeler\07 Kur Hesaplama\stil.css"),
    ("07 yayin",  r"D:\Projeler\02 Hava Dururmu\kur-pusulasi\stil.css"),
]
KURAL = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)


def yorumsuz(s):
    return re.sub(r"/\*.*?\*/", "", s, flags=re.S)


def yukseltilen_belirtecler(s):
    """prefers-contrast: more altinda DEGERI DEGISEN belirtecler."""
    blok = re.search(r"@media[^{]*prefers-contrast\s*:\s*more[^{]*\{(.*?)\n\}", s, re.S)
    if not blok:
        return set()
    return set(re.findall(r"(--[\w-]+)\s*:", blok.group(1)))


def soldurma(govde):
    """(tur, deger) ya da None. Belirtecin rengini SULANDIRAN her sey."""
    m = re.search(r"(?<![-\w])opacity\s*:\s*([0-9.]+)\s*(?:;|$)", govde)
    if m and float(m.group(1)) < 1:
        return ("opacity", float(m.group(1)))
    m = re.search(r"(?<![-\w])opacity\s*:\s*([0-9.]+)%", govde)
    if m and float(m.group(1)) < 100:
        return ("opacity", float(m.group(1)) / 100)
    m = re.search(r"filter\s*:\s*[^;]*opacity\(\s*([0-9.]+)", govde)
    if m:
        return ("filter", float(m.group(1)))
    return None


def denetle(yol, yaz=True):
    """Bulgu listesi doner."""
    if not os.path.exists(yol):
        return [{"hata": "dosya yok"}]
    s = yorumsuz(io.open(yol, encoding="utf-8", errors="ignore").read())
    yukselen = yukseltilen_belirtecler(s)
    if not yukselen:
        # ACCOMMODATION YOKSA "TEMIZ" DENMEZ. Iptal edilecek bir vaat yok,
        # ama vaadin kendisi de yok -- bu ayri bir eksiklik, sessiz gecilmez.
        return [{"not": "prefers-contrast bloku yok — iptal riski yok, DESTEK de yok"}]

    bulgular = []
    for m in KURAL.finditer(s):
        secici = m.group(1).split("}")[-1].strip()
        govde = m.group(2)
        if not secici or secici.startswith("@"):
            continue
        renk = re.search(r"(?<![-\w])color\s*:\s*([^;]+)", govde)
        if not renk:
            continue
        kullanilan = set(re.findall(r"var\(\s*(--[\w-]+)", renk.group(1)))
        ortak = kullanilan & yukselen
        if not ortak:
            continue
        sol = soldurma(govde)
        if not sol:
            continue
        bulgular.append({
            "satir": s[:m.start(2)].count("\n") + 1,
            "secici": secici,
            "belirtec": sorted(ortak)[0],
            "tur": sol[0],
            "alfa": sol[1],
            "kalan": "%%%d" % round(sol[1] * 100),
        })
    return bulgular


def yaz(bulgular, ad):
    if bulgular and "hata" in bulgular[0]:
        print("  ? %-10s %s" % (ad, bulgular[0]["hata"])); return 0
    if bulgular and "not" in bulgular[0]:
        print("  ~ %-10s %s" % (ad, bulgular[0]["not"])); return 0
    if not bulgular:
        print("  %s %-10s accommodation iptal eden kural yok" % (TIK, ad)); return 0
    for b in bulgular:
        print("  %s %-10s satir %-5d %s" % (CARPI, ad, b["satir"], b["secici"]))
        print("      %s yukseltiliyor ama %s:%s ile sulandiriliyor "
              "-> artisin yalniz %s'i ekrana ulasiyor"
              % (b["belirtec"], b["tur"], b["alfa"], b["kalan"]))
    return len(bulgular)


TIK, CARPI = "OK", "!!"
try:
    sys.stdout.reconfigure(encoding="utf-8"); TIK, CARPI = "\u2713", "\u2717"
except Exception:
    pass


def sinama():
    """NOBETI SINA: bozunca bagiriyor mu, duzeltince susuyor mu?

    Tek yon yetmez. Yalniz "bagiriyor mu" olculse, HER SEYE bagiran bir
    arac da gecerdi; yalniz "susuyor mu" olculse, hicbir seye bakmayan
    arac gecerdi. Ikisi birden sorulur."""
    import tempfile
    ACC = ('@media (prefers-contrast: more) {\n'
           '  :root { --yazi2: #475569; }\n}\n')
    haller = [
        ("BOZUK: belirtec yukseliyor + opacity",
         ACC + '.simge { color: var(--yazi2); opacity: .65; }\n', 1),
        ("BOZUK: ayni sey filter ile gizlenmis",
         ACC + '.simge { color: var(--yazi2); filter: opacity(0.5); }\n', 1),
        ("TEMIZ: soldurma yok",
         ACC + '.simge { color: var(--yazi2); }\n', 0),
        ("TEMIZ: opacity var ama belirtec yukselmiyor",
         ACC + '.simge { color: var(--yazi-sabit); opacity: .65; }\n', 0),
        ("TEMIZ: opacity:1 soldurma degildir",
         ACC + '.simge { color: var(--yazi2); opacity: 1; }\n', 0),
        ("KOR NOKTA: yorumdaki ornek bulgu sayilmaz",
         ACC + '/* eskiden: .simge { color: var(--yazi2); opacity: .65; } */\n'
               '.simge { color: var(--yazi2); }\n', 0),
    ]
    gecti = kaldi = 0
    for baslik, css, beklenen in haller:
        k = tempfile.mkdtemp(prefix="soldurma_")
        p = os.path.join(k, "stil.css")
        io.open(p, "w", encoding="utf-8").write(css)
        n = len([b for b in denetle(p) if "satir" in b])
        if n == beklenen:
            gecti += 1; print("  [GECTI] %s" % baslik)
        else:
            kaldi += 1
            print("  [KALDI] %s  (beklenen %d, gelen %d)" % (baslik, beklenen, n))
    print("\nGECTI: %d   KALDI: %d" % (gecti, kaldi))
    return 1 if kaldi else 0


if __name__ == "__main__":
    if "--sinama" in sys.argv:
        print("NOBETCIYI SINA — bozunca bagirmali, duzeltince susmali\n")
        sys.exit(sinama())
    print("ERISILEBILIRLIK AYARINI IPTAL EDEN SOLDURMA\n")
    t = sum(yaz(denetle(y), a) for a, y in DOSYALAR)
    print()
    print("%d kural accommodation'i iptal ediyor." % t if t else
          "Accommodation iptal eden kural yok.")
    sys.exit(1 if t else 0)
