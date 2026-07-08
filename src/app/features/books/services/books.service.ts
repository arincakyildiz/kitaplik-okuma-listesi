import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../../../core/services/storage.service';
import { Kitap, KitapFormModel, OkumaDurumu } from '../models/book.model';

const STORAGE_KEY = 'kitaplik.kitaplar.v1';

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

  /** Kitap listesi akışı. */
  readonly kitaplar$: Observable<Kitap[]> = this.kitaplarSubject.asObservable();
  /** Yükleniyor durumu akışı. */
  readonly yukleniyor$: Observable<boolean> = this.yukleniyorSubject.asObservable();

  constructor() {
    this.yukle();
  }

  // --- Okuma ---------------------------------------------------------------
  /** Anlık kitap listesi (senkron). */
  get kitaplar(): Kitap[] {
    return this.kitaplarSubject.value;
  }

  /** id ile tek kitap (senkron). */
  getir(id: number): Kitap | undefined {
    return this.kitaplarSubject.value.find((k) => k.id === id);
  }

  // --- CRUD ----------------------------------------------------------------
  ekle(form: KitapFormModel): Kitap {
    const kitap: Kitap = {
      ...form,
      id: this.siradakiId(),
      eklenmeTarihi: new Date().toISOString(),
    };
    this.yayinla([kitap, ...this.kitaplarSubject.value]);
    return kitap;
  }

  guncelle(id: number, form: KitapFormModel): void {
    const yeni = this.kitaplarSubject.value.map((k) =>
      k.id === id ? { ...k, ...form } : k,
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
      const kitaplar = kayitli && kayitli.length >= 0 ? kayitli : ORNEK_KITAPLAR();
      this.kitaplarSubject.next(kitaplar);
      // İlk kez açılıyorsa örnekleri kalıcı hale getir.
      if (!kayitli) this.storage.write(STORAGE_KEY, kitaplar);
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
  ): Kitap => ({
    id,
    ad,
    yazar,
    tur,
    durum,
    sayfaSayisi,
    puan,
    not,
    kalinanSayfa,
    eklenmeTarihi: new Date(now - id * 8_000_000).toISOString(),
  });

  return [
    yap(20, 'Suç ve Ceza', 'Fyodor Dostoyevski', 'Roman', 'okundu', 687, 5, 'Raskolnikov karakteri unutulmaz.'),
    yap(19, 'Sefiller', 'Victor Hugo', 'Roman', 'okunuyor', 1463, 4, '', 450),
    yap(18, 'Dune', 'Frank Herbert', 'Bilim Kurgu', 'okunacak', 688, 0, 'Filmden önce okunacak.'),
    yap(17, 'Sapiens', 'Yuval Noah Harari', 'Tarih', 'okundu', 443, 5, 'İnsanlığın kısa tarihi.'),
    yap(16, 'Hayvan Çiftliği', 'George Orwell', 'Roman', 'okundu', 152, 4, ''),
    yap(15, 'Atomik Alışkanlıklar', 'James Clear', 'Kişisel Gelişim', 'okunuyor', 320, 4, 'Alışkanlık istifleme bölümündeyim.', 120),
    yap(14, 'Otostopçunun Galaksi Rehberi', 'Douglas Adams', 'Bilim Kurgu', 'okunacak', 224, 0, ''),
    yap(13, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'Roman', 'okundu', 160, 5, ''),
    yap(12, 'Küçük Prens', 'Antoine de Saint-Exupéry', 'Klasik', 'okundu', 96, 5, 'Her yaştan insan okuyabilir.'),
    yap(11, 'Fahrenheit 451', 'Ray Bradbury', 'Bilim Kurgu', 'okundu', 256, 4, 'Kitap yakmak üzerine bir kitap.'),
    yap(10, 'Simyacı', 'Paulo Coelho', 'Roman', 'okunuyor', 208, 3, 'Kişisel efsane yolculuğu.'),
    yap(9, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Gizem', 'okundu', 307, 4, ''),
    yap(8, 'Yüzüklerin Efendisi', 'J.R.R. Tolkien', 'Fantastik', 'okunacak', 1178, 0, 'Serinin ilk kitabıyla başlayacağım.'),
    yap(7, 'Cesur Yeni Dünya', 'Aldous Huxley', 'Distopya', 'okundu', 311, 4, '1984 ile birlikte okunmalı.'),
    yap(6, '1984', 'George Orwell', 'Distopya', 'okundu', 328, 5, 'Big Brother sizi izliyor.'),
    yap(5, 'Don Kişot', 'Miguel de Cervantes', 'Klasik', 'okunacak', 992, 0, ''),
    yap(4, 'Siddhartha', 'Hermann Hesse', 'Felsefi', 'okundu', 152, 4, 'Aydınlanma yolculuğu.'),
    yap(3, 'Böyle Buyurdu Zerdüşt', 'Friedrich Nietzsche', 'Felsefe', 'okunuyor', 352, 3, 'Ağır ama düşündürücü.', 90),
    yap(2, 'Şeker Portakalı', 'José Mauro de Vasconcelos', 'Roman', 'okundu', 213, 5, 'Zezé\'nin masumiyeti yürek sızlatıyor.'),
    yap(1, 'Bülbülü Öldürmek', 'Harper Lee', 'Roman', 'okundu', 376, 5, 'Atticus Finch efsanevi bir kahraman.'),
  ];
}
