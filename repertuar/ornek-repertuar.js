/* ornek-repertuar.js — ilk açılışta gelen örnek
   TELİF NOTU: buraya hazır telifli şarkı sözü KONMAZ. Gelen tek kayıt,
   biçimi öğreten uydurma sözlü bir örnektir. Kendi repertuarını sen girersin. */

var ORNEK_SARKILAR = [
  {
    id: 'ornek-bicim',
    ad: 'Biçim örneği — nasıl yazılır',
    sanatci: 'Repertuar',
    yazim: 'duyulan',
    kapo: 0,
    calgi: 'gitar',
    akort: 'standart',
    ton: 'Am',
    tempo: null,
    etiketler: ['örnek', 'yardım'],
    eklendi: '2026-09-07',
    govde: [
      '{not: Akoru, değiştiği HECENİN önüne köşeli parantezle yaz.}',
      '',
      '{kita}',
      '[Am]Akor sözün üstünde [C]durur,',
      'yazı boyunu büyütsen de [F]kaymaz.',
      '[Dm]Aynı heceye iki akor: [E7][Am]böyle.',
      '',
      '{nakarat}',
      '[F]Ton düğmeleri özgün [G]hâlden hesaplar,',
      '[C]ileri geri gidip [Am]gelsen de yazım bozulmaz.',
      '[F/G]Bas notalı akorda iki nota da döner.',
      '',
      '{not: Aşağısı tab bloğu — ham kalır, transpoze edilmez.}',
      '{tab}',
      'e|-----0-----------|',
      'B|---1---1---------|',
      'G|-0-------0-------|',
      'D|-----------2-----|',
      '{tab_son}',
      '',
      '{not: Kapo düğmesini çevir: üstteki şerit hangisini gösterdiğini yazar.}'
    ].join('\n')
  }
];
