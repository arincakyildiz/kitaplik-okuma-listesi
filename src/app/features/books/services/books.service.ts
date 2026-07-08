import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../../../core/services/storage.service';
import { Alinti, Kitap, KitapFormModel, OkumaDurumu, TimelineLog } from '../models/book.model';

const STORAGE_KEY = 'kitaplik.kitaplar.v1';
const HEDEF_KEY = 'kitaplik.yillikHedef';

/**
 * Kitap veri servisi.
 * Doküman şartı gereği durum RxJS (BehaviorSubject) ile yönetilir ve
 * localStorage erişimi YALNIZCA StorageService üzerinden yapılır.
 */
@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storage = inject(StorageService);

  private readonly kitaplarSubject = new BehaviorSubject<Kitap[]>([]);
  private readonly yukleniyorSubject = new BehaviorSubject<boolean>(true);

  private readonly yillikHedefSubject = new BehaviorSubject<number>(20);

  /** Kitap listesi akışı. */
  readonly kitaplar$: Observable<Kitap[]> = this.kitaplarSubject.asObservable();
  /** Yükleniyor durumu akışı. */
  readonly yukleniyor$: Observable<boolean> = this.yukleniyorSubject.asObservable();
  /** Yıllık okuma hedefi akışı. */
  readonly yillikHedef$: Observable<number> = this.yillikHedefSubject.asObservable();

  constructor() {
    this.yukle();
  }

  // --- Okuma ---------------------------------------------------------------
  /** Anlık kitap listesi (senkron). */
  get kitaplar(): Kitap[] {
    return this.kitaplarSubject.value;
  }

  /** Yıllık hedef değeri (senkron). */
  get yillikHedef(): number {
    return this.yillikHedefSubject.value;
  }

  /** id ile tek kitap (senkron). */
  getir(id: number): Kitap | undefined {
    return this.kitaplarSubject.value.find((k) => k.id === id);
  }

  /** Yıllık hedefi günceller. */
  hedefGuncelle(hedef: number): void {
    this.yillikHedefSubject.next(hedef);
    this.storage.write(HEDEF_KEY, hedef);
  }

  // --- Veri Yedekleme / Yükleme --------------------------------------------
  /** Kütüphaneyi JSON olarak indirir. */
  disaAktar(): void {
    if (typeof window === 'undefined') return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.kitaplar, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `kitaplik_yedek_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  /** Kütüphaneyi Excel (CSV) olarak indirir. */
  disaAktarExcel(): void {
    if (typeof window === 'undefined') return;
    
    const headers = [
      'Kitap Adı',
      'Yazar',
      'Tür',
      'Durum',
      'Toplam Sayfa',
      'Kalınan Sayfa',
      'Puan',
      'Notlar',
      'Alıntı Sayısı',
      'Eklenme Tarihi'
    ];

    const rows = this.kitaplar.map(k => [
      `"${k.ad.replace(/"/g, '""')}"`,
      `"${k.yazar.replace(/"/g, '""')}"`,
      `"${(k.tur || '').replace(/"/g, '""')}"`,
      `"${k.durum}"`,
      k.sayfaSayisi || 0,
      k.kalinanSayfa || 0,
      k.puan || 0,
      `"${(k.not || '').replace(/"/g, '""')}"`,
      k.alintilar ? k.alintilar.length : 0,
      k.eklenmeTarihi ? new Date(k.eklenmeTarihi).toLocaleDateString('tr-TR') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', url);
    dlAnchor.setAttribute('download', `kitaplik_liste_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    URL.revokeObjectURL(url);
  }

  /** JSON yedeğini yükler. */
  iceAktar(veriStr: string): boolean {
    try {
      const parsed = JSON.parse(veriStr);
      if (Array.isArray(parsed)) {
        const dogrula = parsed.every(
          (k) =>
            k &&
            typeof k.id === 'number' &&
            typeof k.ad === 'string' &&
            typeof k.yazar === 'string' &&
            typeof k.durum === 'string'
        );
        if (dogrula) {
          this.yayinla(parsed);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /** Örnek verileri kütüphaneye yükler (mevcut verileri sıfırlar). */
  ornekVeriYukle(): void {
    const ornekler = ORNEK_KITAPLAR();
    this.yayinla(ornekler);
    this.hedefGuncelle(20);
  }

  // --- CRUD ----------------------------------------------------------------
  ekle(form: KitapFormModel): Kitap {
    const simdi = new Date().toISOString();
    const log: TimelineLog = {
      tarih: simdi,
      mesaj: 'timeline.created',
    };
    
    const kitap: Kitap = {
      ...form,
      id: this.siradakiId(),
      eklenmeTarihi: simdi,
      timeline: [log],
    };
    this.yayinla([kitap, ...this.kitaplarSubject.value]);
    return kitap;
  }

  guncelle(id: number, form: KitapFormModel): void {
    const eski = this.kitaplarSubject.value.find((k) => k.id === id);
    if (!eski) return;

    const logs: TimelineLog[] = [...(eski.timeline || [])];
    const simdi = new Date().toISOString();

    if (eski.durum !== form.durum) {
      if (form.durum === 'okundu') {
        logs.push({ tarih: simdi, mesaj: 'timeline.completed' });
      } else {
        logs.push({ tarih: simdi, mesaj: 'timeline.status_changed', deger: form.durum });
      }
    }

    if (
      form.durum === 'okunuyor' &&
      eski.kalinanSayfa !== form.kalinanSayfa &&
      form.kalinanSayfa !== undefined
    ) {
      logs.push({ tarih: simdi, mesaj: 'timeline.page_changed', deger: form.kalinanSayfa });
    }

    const yeni = this.kitaplarSubject.value.map((k) =>
      k.id === id ? { ...k, ...form, timeline: logs } : k
    );
    this.yayinla(yeni);
  }

  sil(id: number): void {
    this.yayinla(this.kitaplarSubject.value.filter((k) => k.id !== id));
  }

  // --- İç yardımcılar ------------------------------------------------------
  private yayinla(kitaplar: Kitap[]): void {
    this.kitaplarSubject.next(kitaplar);
    this.storage.write(STORAGE_KEY, kitaplar);
  }

  private siradakiId(): number {
    const ids = this.kitaplarSubject.value.map((k) => k.id);
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }

  private yukle(): void {
    // Yükleniyor durumunu görünür kılmak için kısa gecikme.
    setTimeout(() => {
      const kayitli = this.storage.read<Kitap[] | null>(STORAGE_KEY, null);
      
      let varsayilan: Kitap[] = [];
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
        if (isLocal) {
          varsayilan = ORNEK_KITAPLAR();
        }
      }

      const kitaplar = kayitli !== null ? kayitli : varsayilan;
      this.kitaplarSubject.next(kitaplar);
      // İlk kez açılıyorsa varsayılanı kalıcı hale getir.
      if (kayitli === null) this.storage.write(STORAGE_KEY, kitaplar);

      const kayitliHedef = this.storage.read<number | null>(HEDEF_KEY, null);
      if (kayitliHedef !== null) {
        this.yillikHedefSubject.next(kayitliHedef);
      }

      this.yukleniyorSubject.next(false);
    }, 600);
  }
}

// ---------------------------------------------------------------------------
// Örnek kitaplar — ilk açılışta kütüphane dolu görünsün
// ---------------------------------------------------------------------------
function ORNEK_KITAPLAR(): Kitap[] {
  const now = Date.now();
  const yap = (
    id: number,
    ad: string,
    yazar: string,
    tur: string,
    durum: OkumaDurumu,
    sayfaSayisi: number,
    puan: number,
    not = '',
    kalinanSayfa?: number,
    alintilar?: Alinti[]
  ): Kitap => {
    const eklenmeISO = new Date(now - id * 8_000_000).toISOString();
    const timeline: TimelineLog[] = [
      { tarih: eklenmeISO, mesaj: 'timeline.created' }
    ];
    if (durum === 'okunuyor') {
      timeline.push({ tarih: new Date(now - id * 4_000_000).toISOString(), mesaj: 'timeline.status_changed', deger: 'okunuyor' });
      if (kalinanSayfa) {
        timeline.push({ tarih: new Date(now - id * 2_000_000).toISOString(), mesaj: 'timeline.page_changed', deger: kalinanSayfa });
      }
    } else if (durum === 'okundu') {
      timeline.push({ tarih: new Date(now - id * 4_000_000).toISOString(), mesaj: 'timeline.status_changed', deger: 'okunuyor' });
      timeline.push({ tarih: new Date(now - id * 1_000_000).toISOString(), mesaj: 'timeline.completed' });
    }
    return {
      id,
      ad,
      yazar,
      tur,
      durum,
      sayfaSayisi,
      puan,
      not,
      kalinanSayfa,
      alintilar,
      timeline,
      eklenmeTarihi: eklenmeISO,
    };
  };

  return [
    yap(30, 'Savaş ve Barış', 'Leo Tolstoy', 'Roman', 'okundu', 1225, 5, 'Çok uzun ama muhteşem bir destan.'),
    yap(29, 'Martin Eden', 'Jack London', 'Roman', 'okunuyor', 400, 5, 'Bireyin topluma karşı mücadelesi.', 150),
    yap(28, 'Dönüşüm', 'Franz Kafka', 'Klasik', 'okundu', 80, 4, 'Gregor Samsa bir sabah uyandığında...'),
    yap(27, 'Karamazov Kardeşler', 'Fyodor Dostoyevski', 'Roman', 'okunacak', 1008, 0),
    yap(26, 'Yüzyıllık Yalnızlık', 'Gabriel García Márquez', 'Roman', 'okundu', 464, 4),
    yap(25, 'Devlet', 'Platon', 'Felsefe', 'okunacak', 372, 0),
    yap(24, 'Faust', 'Johann Wolfgang von Goethe', 'Klasik', 'okundu', 350, 4),
    yap(23, 'Körlük', 'José Saramago', 'Roman', 'okunuyor', 320, 5, 'Etkileyici bir distopya toplumsal eleştiri.', 200),
    yap(22, 'Ulusların Zenginliği', 'Adam Smith', 'Felsefe', 'okundu', 900, 4),
    yap(21, 'Denemeler', 'Michel de Montaigne', 'Felsefi', 'okundu', 320, 5),
    yap(20, 'Suç ve Ceza', 'Fyodor Dostoyevski', 'Roman', 'okundu', 687, 5, 'Raskolnikov karakteri unutulmaz.', undefined, [
      { metin: 'Hayatta her şey insana bağlıdır ve insan her şeyi korkaklığı yüzünden kaçırır.', sayfa: 12 }
    ]),
    yap(19, 'Sefiller', 'Victor Hugo', 'Roman', 'okunuyor', 1463, 4, '', 450),
    yap(18, 'Dune', 'Frank Herbert', 'Bilim Kurgu', 'okunacak', 688, 0, 'Filmden önce okunacak.'),
    yap(17, 'Sapiens', 'Yuval Noah Harari', 'Tarih', 'okundu', 443, 5, 'İnsanlığın kısa tarihi.', undefined, [
      { metin: 'Tarih, az sayıda insanın yaptığı ama geri kalanların tarlaları sürüp su taşıdığı bir şeydir.', sayfa: 104 }
    ]),
    yap(16, 'Hayvan Çiftliği', 'George Orwell', 'Roman', 'okundu', 152, 4, ''),
    yap(15, 'Atomik Alışkanlıklar', 'James Clear', 'Kişisel Gelişim', 'okunuyor', 320, 4, 'Alışkanlık istifleme bölümündeyim.', 120),
    yap(14, 'Otostopçunun Galaksi Rehberi', 'Douglas Adams', 'Bilim Kurgu', 'okunacak', 224, 0, ''),
    yap(13, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'Roman', 'okundu', 160, 5, ''),
    yap(12, 'Küçük Prens', 'Antoine de Saint-Exupéry', 'Klasik', 'okundu', 96, 5, 'Her yaştan insan okuyabilir.', undefined, [
      { metin: 'Gönül gözüyle görmeli insan; çünkü asıl görülmesi gerekenler gözle görülemez.', sayfa: 72 },
      { metin: 'Vereceğin kararların sorumluluğunu üstlenmelisin.', sayfa: 45 }
    ]),
    yap(11, 'Fahrenheit 451', 'Ray Bradbury', 'Bilim Kurgu', 'okundu', 256, 4, 'Kitap yakmak üzerine bir kitap.'),
    yap(10, 'Simyacı', 'Paulo Coelho', 'Roman', 'okunuyor', 208, 3, 'Kişisel efsane yolculuğu.'),
    yap(9, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Gizem', 'okundu', 307, 4, ''),
    yap(8, 'Yüzüklerin Efendisi', 'J.R.R. Tolkien', 'Fantastik', 'okunacak', 1178, 0, 'Serinin ilk kitabıyla başlayacağım.'),
    yap(7, 'Cesur Yeni Dünya', 'Aldous Huxley', 'Distopya', 'okundu', 311, 4, '1984 ile birlikte okunmalı.', undefined, [
      { metin: 'İnsan mutlu olunca iyi olamaz.', sayfa: 210 }
    ]),
    yap(6, '1984', 'George Orwell', 'Distopya', 'okundu', 328, 5, 'Big Brother sizi izliyor.'),
    yap(5, 'Don Kişot', 'Miguel de Cervantes', 'Klasik', 'okunacak', 992, 0, ''),
    yap(4, 'Siddhartha', 'Hermann Hesse', 'Felsefi', 'okundu', 152, 4, 'Aydınlanma yolculuğu.'),
    yap(3, 'Böyle Buyurdu Zerdüşt', 'Friedrich Nietzsche', 'Felsefe', 'okunuyor', 352, 3, 'Ağır ama düşündürücü.', 90),
    yap(2, 'Şeker Portakalı', 'José Mauro de Vasconcelos', 'Roman', 'okundu', 213, 5, 'Zezé\'nin masumiyeti yürek sızlatıyor.'),
    yap(1, 'Bülbülü Öldürmek', 'Harper Lee', 'Roman', 'okundu', 376, 5, 'Atticus Finch efsanevi bir kahraman.'),
  ];
}
