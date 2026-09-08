/* baslangic-paketi.js — ilk açılışta gelen repertuar

   TELİF SINIRI (açıkça): buraya telifli şarkı sözü KONMAZ. Pakette iki tür
   içerik var:
     1. ALIŞTIRMA — sözü ve dizilimi bu uygulama için yazıldı, tamamen özgün.
     2. ANONİM / GELENEKSEL — bestecisi ve sözü belli olmayan, kamuya mal
        olmuş ezgiler. Sözler kısa tutuldu.

   NE GARANTİ EDİYORUZ, NE ETMİYORUZ (K-89):
     ✓ Her akor `akorCozumle`dan geçiyor — tanınmayan akor yok.
     ✓ Her gövde `metinCozumle`dan geçiyor — bozuk satır yok.
     ✓ Şeması olan her akor `semaDogrula`dan geçiyor — yanlış parmak basma yok.
     ✗ Sözlerin senin bildiğin kaynakla birebir aynı olduğunu garanti ETMİYORUZ.
       Geleneksel parçaların yöreye göre değişen sayısız çeşitlemesi var.
       O yüzden hepsi **denetlenmeli** etiketiyle geliyor — kendi kaynağınla
       karşılaştır, düzelt, etiketi kaldır.

   Bunların hepsi sınamada tek tek koşuluyor (grup 14). */

var BASLANGIC_PAKETI = [
  /* ================= ALIŞTIRMALAR (özgün) ================= */
  {
    id: 'p-alistirma-145', ad: 'Alıştırma: I–IV–V (Do)', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'C', tempo: 90, sure: 60, etiketler: ['alıştırma', 'başlangıç'],
    notlar: 'Her akorda dört vuruş. Değiştirirken durma, geç kalsan da geç.',
    govde: [
      '{not: Batı müziğinin en yaygın üç akoru. Bunu çalabilen yüzlerce şarkı çalar.}',
      '',
      '{kita}',
      '[C]Bir iki üç dört [F]beş altı yedi sekiz',
      '[G]Dokuz on on bir [C]on iki bitti',
      '',
      '{nakarat}',
      '[C]Aynısını tekrar [F]yavaşlamadan',
      '[G]Parmağın alışsın [C]bakmadan bul'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-1645', ad: 'Alıştırma: I–vi–IV–V (Sol)', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'G', tempo: 100, sure: 60, etiketler: ['alıştırma'],
    notlar: 'Pop şarkılarının yarısı bu dizilim. Em geçişini akıcı yapmaya çalış.',
    govde: [
      '{kita}',
      '[G]Dört akor dönüyor [Em]durmadan',
      '[C]Biri ötekini [D]çağırıyor',
      '[G]Dinleyen tanıyor [Em]nereden',
      '[C]Bilmiyor ama [D]bekliyor'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-minor', ad: 'Alıştırma: Minör dönüş (La minör)', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'Am', tempo: 76, sure: 75, etiketler: ['alıştırma', 'ağır'],
    notlar: 'Ağır çal. E7 dönüşünde bas teli vurgula.',
    govde: [
      '{kita}',
      '[Am]Akşam iniyor [Dm]sessizce',
      '[E7]Bir tek lamba [Am]yanıyor',
      '[Am]Kimse acele [Dm]etmiyor',
      '[E7]Saat bile [Am]yavaşlıyor'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-kapo', ad: 'Alıştırma: Kapo 3 — tutulan mı duyulan mı', sanatci: 'Alıştırma',
    yazim: 'tutulan', kapo: 3, calgi: 'gitar', akort: 'standart',
    ton: 'D', tempo: 88, sure: 60, etiketler: ['alıştırma', 'kapo'],
    notlar: 'Bu şarkıda akorlar TUTULAN olarak yazılı. "İkili" düğmesine bas: parantezde duyulan çıkar.',
    govde: [
      '{not: Kapo 3 takılı. Aşağıdaki şekilleri tut; duyulan ses üç yarım ses tizdir.}',
      '',
      '{kita}',
      '[D]Aynı şekil [G]başka ses',
      '[A]Kapo taşır [D]hepsini',
      '[D]Parmak burada [G]kulak orada',
      '[A]İkisi de [D]doğru'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-blues', ad: 'Alıştırma: On iki ölçü blues (Mi)', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'E', tempo: 84, sure: 90, etiketler: ['alıştırma', 'blues'],
    notlar: 'Her akor dört ölçü / iki ölçü. Yedili akorların tınısına alış.',
    govde: [
      '{kita}',
      '[E7]Bir kalıp var [E7]tekrar eder',
      '[A7]Dört ölçü sonra [E7]geri döner',
      '[B7]Yukarı çıkar [A7]aşağı iner',
      '[E7]Baştan alır [B7]yeniden'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-ukulele', ad: 'Alıştırma: Ukulele dört akor', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'ukulele', akort: 'standart',
    ton: 'C', tempo: 110, sure: 50, etiketler: ['alıştırma', 'ukulele'],
    notlar: 'Ukulelede bu dört akor neredeyse her şeyi açar.',
    govde: [
      '{kita}',
      '[C]Dört tel yeter [Am]başlamaya',
      '[F]Küçük bir kutu [G7]çok iş görür',
      '[C]Parmak azalır [Am]ses çoğalır',
      '[F]Elinde durur [G7]hafifçe'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-piyano', ad: 'Alıştırma: Piyano — bemol tonlar', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'piyano', akort: 'standart',
    ton: 'F', tempo: 80, sure: 70, etiketler: ['alıştırma', 'piyano'],
    notlar: 'Ton düğmesine bas: yazım bemol kalır, çünkü hedef tonlar bemollü.',
    govde: [
      '{not: Piyanoda bemol yazım alışkanlıktır. Transpoze edince kendiliğinden bemol gelir.}',
      '',
      '{kita}',
      '[F]Siyah tuşlar [Bb]korkutmasın',
      '[C7]Aynı ses [F]başka isim',
      '[F]Yazım değişir [Bb]el değişmez',
      '[C7]Kulak aynı [F]şeyi duyar'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-alistirma-tab', ad: 'Alıştırma: Tab okuma', sanatci: 'Alıştırma',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'Em', tempo: 70, sure: 60, etiketler: ['alıştırma', 'tab'],
    notlar: 'Sayılar perde, satırlar tel. En üst satır en ince tel.',
    govde: [
      '{not: Aşağısı tab bloğu — transpoze edilmez, olduğu gibi kalır.}',
      '{tab}',
      'e|---0---0---0---0---|',
      'B|-----0---0---0-----|',
      'G|---------0---------|',
      'D|-2---2---2---2-----|',
      'A|-------------------|',
      'E|-0---0---0---0-----|',
      '{tab_son}',
      '',
      '{kita}',
      '[Em]Aynı desen [G]tekrar eder',
      '[Am]Elin ezberler [Em]gözün değil'
    ].join('\n'), eklendi: '2026-09-08'
  },

  /* ================= ANONİM / GELENEKSEL ================= */
  {
    id: 'p-anonim-ninni', ad: 'Ninni (anonim)', sanatci: 'Anonim',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'C', tempo: 64, sure: 80, etiketler: ['anonim', 'ağır', 'denetlenmeli'],
    notlar: 'Yöreden yöreye değişir. Kendi bildiğin sözle değiştir.',
    govde: [
      '{not: Kamuya mal olmuş ezgi. Sözü senin bildiğinle aynı olmayabilir — düzelt.}',
      '',
      '{kita}',
      '[C]Uyusun da büyüsün [F]ninni',
      '[G]Tıpış tıpış yürüsün [C]ninni'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-anonim-halay', ad: 'Halay ezgisi (anonim)', sanatci: 'Anonim',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'Am', tempo: 120, sure: 70, etiketler: ['anonim', 'hızlı', 'denetlenmeli'],
    notlar: 'Hızlı ve düz vuruş. Sözü yörelere göre değişir.',
    govde: [
      '{not: Geleneksel dizilim. Kendi yörenin sözünü sen gir.}',
      '',
      '{kita}',
      '[Am]Davul çalar [Dm]meydan dolar',
      '[Am]El ele tutar [E7]halka [Am]olur'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-anonim-cocuk', ad: 'Çocuk şarkısı (anonim)', sanatci: 'Anonim',
    yazim: 'duyulan', kapo: 0, calgi: 'ukulele', akort: 'standart',
    ton: 'C', tempo: 108, sure: 45, etiketler: ['anonim', 'çocuk', 'denetlenmeli'],
    notlar: 'Ukulele için kolay. Çocukla birlikte çalınır.',
    govde: [
      '{kita}',
      '[C]Bir küçük ördek [G7]göle daldı',
      '[G7]Çıktığında [C]ıslanmıştı'
    ].join('\n'), eklendi: '2026-09-08'
  },
  {
    id: 'p-anonim-uzunhava', ad: 'Serbest ezgi (anonim)', sanatci: 'Anonim',
    yazim: 'duyulan', kapo: 0, calgi: 'gitar', akort: 'standart',
    ton: 'Dm', tempo: 60, sure: 110, etiketler: ['anonim', 'ağır', 'denetlenmeli'],
    notlar: 'Ölçüsü serbest — otomatik kaydırmayı kapatıp elle takip etmek daha rahat.',
    govde: [
      '{not: Serbest ölçülü ezgilerde kaydırma yanıltır; Kaydır düğmesini kapat.}',
      '',
      '{kita}',
      '[Dm]Uzun bir yol [Gm]uzun bir gece',
      '[A7]Ses uzar gider [Dm]acele yok'
    ].join('\n'), eklendi: '2026-09-08'
  }
];
