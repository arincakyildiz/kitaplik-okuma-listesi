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
  ): Kitap => ({
    id,
    ad,
    yazar,
    tur,
    durum,
    sayfaSayisi,
    puan,
    not,
    eklenmeTarihi: new Date(now - id * 8_000_000).toISOString(),
  });

  return [
    yap(8, 'Suç ve Ceza', 'Fyodor Dostoyevski', 'Roman', 'okundu', 687, 5, 'Raskolnikov karakteri unutulmaz.'),
    yap(7, 'Sefiller', 'Victor Hugo', 'Roman', 'okunuyor', 1463, 4, ''),
    yap(6, 'Dune', 'Frank Herbert', 'Bilim Kurgu', 'okunacak', 688, 0, 'Filmden önce okunacak.'),
    yap(5, 'Sapiens', 'Yuval Noah Harari', 'Tarih', 'okundu', 443, 5, 'İnsanlığın kısa tarihi.'),
    yap(4, 'Hayvan Çiftliği', 'George Orwell', 'Roman', 'okundu', 152, 4, ''),
    yap(3, 'Atomik Alışkanlıklar', 'James Clear', 'Kişisel Gelişim', 'okunuyor', 320, 4, 'Alışkanlık istifleme bölümündeyim.'),
    yap(2, 'Otostopçunun Galaksi Rehberi', 'Douglas Adams', 'Bilim Kurgu', 'okunacak', 224, 0, ''),
    yap(1, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'Roman', 'okundu', 160, 5, ''),
  ];
}
