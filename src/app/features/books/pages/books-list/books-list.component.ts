import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BooksService } from '../../services/books.service';
import {
  DurumFiltresi,
  Kitap,
  OKUMA_DURUMLARI,
  OkumaDurumu,
  SiralamaAnahtari,
  TURLER,
} from '../../models/book.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { BookCardComponent } from '../../components/book-card/book-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

import { DecimalPipe } from '@angular/common';

const SIRALAMALAR: SiralamaAnahtari[] = [
  'yeni',
  'ad-artan',
  'ad-azalan',
  'yazar-artan',
  'puan-azalan',
  'sayfa-azalan',
];

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    BookCardComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
    StatusBadgeComponent,
    StarRatingComponent,
    DataTableComponent,
    TranslatePipe,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './books-list.component.html',
  styleUrl: './books-list.component.css',
})
export class BooksListComponent {
  private readonly books = inject(BooksService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  readonly i18n = inject(I18nService);

  // RxJS akışlarını signal'e köprüle
  private readonly kitaplar = toSignal(this.books.kitaplar$, { initialValue: [] as Kitap[] });
  readonly yukleniyor = toSignal(this.books.yukleniyor$, { initialValue: true });

  // Görünüm durumu (signals)
  readonly arama = signal('');
  readonly durumFiltresi = signal<DurumFiltresi>('hepsi');
  readonly turFiltresi = signal<string>('hepsi');
  readonly siralama = signal<SiralamaAnahtari>('yeni');
  readonly gorunum = signal<'kart' | 'tablo'>('kart');

  // Dashboard & İstatistikler
  readonly dashboardAcik = signal(false);
  readonly hedefDuzenleModu = signal(false);
  readonly yillikHedef = toSignal(this.books.yillikHedef$, { initialValue: 20 });

  readonly hedefYuzdesi = computed(() => {
    const okundu = this.sayaclar().okundu;
    const hedef = this.yillikHedef();
    if (hedef <= 0) return 0;
    return Math.min(100, Math.round((okundu / hedef) * 100));
  });

  readonly toplamOkunanSayfa = computed(() => {
    return this.kitaplar()
      .filter((k) => k.durum === 'okundu' && k.sayfaSayisi)
      .reduce((sum, k) => sum + (k.sayfaSayisi || 0), 0);
  });

  readonly puanOrtalamasi = computed(() => {
    const rated = this.kitaplar().filter((k) => k.puan && k.puan > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, k) => sum + (k.puan || 0), 0) / rated.length;
  });

  readonly favoriTur = computed(() => {
    const counts: Record<string, number> = {};
    for (const k of this.kitaplar()) {
      if (k.tur) {
        counts[k.tur] = (counts[k.tur] || 0) + 1;
      }
    }
    let maxTur = '';
    let maxCount = 0;
    for (const [tur, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxTur = tur;
      }
    }
    return maxTur;
  });

  readonly ortalamaSayfaSayisi = computed(() => {
    const hasPages = this.kitaplar().filter((k) => k.sayfaSayisi && k.sayfaSayisi > 0);
    if (hasPages.length === 0) return 0;
    return Math.round(hasPages.reduce((sum, k) => sum + (k.sayfaSayisi || 0), 0) / hasPages.length);
  });

  readonly tumAlintilar = computed(() => {
    const alintilar: { metin: string; yazar: string; kitap: string; sayfa?: number }[] = [];
    for (const k of this.kitaplar()) {
      if (k.alintilar) {
        for (const q of k.alintilar) {
          alintilar.push({ metin: q.metin, yazar: k.yazar, kitap: k.ad, sayfa: q.sayfa });
        }
      }
    }
    return alintilar;
  });

  readonly gununAlintisi = computed(() => {
    const list = this.tumAlintilar();
    if (list.length === 0) return null;
    const day = new Date().getDate();
    return list[day % list.length];
  });

  hedefGuncelle(deger: string): void {
    const hedef = Number(deger);
    if (hedef > 0) {
      this.books.hedefGuncelle(hedef);
      this.hedefDuzenleModu.set(false);
    }
  }

  veriDisaAktar(): void {
    this.books.disaAktar();
  }

  veriDisaAktarExcel(): void {
    this.books.disaAktarExcel();
  }

  veriIceAktar(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const basarili = this.books.iceAktar(text);
        if (basarili) {
          this.snack.open(this.i18n.t('toolbar.importSuccess'), this.i18n.t('toast.dismiss'), { duration: 3000 });
        } else {
          this.snack.open(this.i18n.t('toolbar.importError'), this.i18n.t('toast.dismiss'), { duration: 3000 });
        }
      };
      reader.readAsText(file);
      input.value = '';
    }
  }

  readonly durumlar = OKUMA_DURUMLARI;
  readonly turler = TURLER;
  readonly siralamalar = SIRALAMALAR;

  // --- Sayaçlar ------------------------------------------------------------
  readonly sayaclar = computed(() => {
    const k = this.kitaplar();
    return {
      hepsi: k.length,
      okundu: k.filter((x) => x.durum === 'okundu').length,
      okunuyor: k.filter((x) => x.durum === 'okunuyor').length,
      okunacak: k.filter((x) => x.durum === 'okunacak').length,
    };
  });

  // --- Filtrelenmiş + sıralanmış liste (computed signal) -------------------
  readonly gorunenKitaplar = computed<Kitap[]>(() => {
    const terim = this.arama().trim().toLocaleLowerCase('tr');
    const durum = this.durumFiltresi();
    const sirala = this.siralama();

    const tur = this.turFiltresi();

    let liste = this.kitaplar();

    if (durum !== 'hepsi') {
      liste = liste.filter((k) => k.durum === durum);
    }
    if (tur !== 'hepsi') {
      liste = liste.filter((k) => k.tur === tur);
    }
    if (terim) {
      liste = liste.filter(
        (k) =>
          k.ad.toLocaleLowerCase('tr').includes(terim) ||
          k.yazar.toLocaleLowerCase('tr').includes(terim) ||
          (k.tur ?? '').toLocaleLowerCase('tr').includes(terim),
      );
    }

    const sirali = [...liste];
    switch (sirala) {
      case 'ad-artan': sirali.sort((a, b) => a.ad.localeCompare(b.ad, 'tr')); break;
      case 'ad-azalan': sirali.sort((a, b) => b.ad.localeCompare(a.ad, 'tr')); break;
      case 'yazar-artan': sirali.sort((a, b) => a.yazar.localeCompare(b.yazar, 'tr')); break;
      case 'puan-azalan': sirali.sort((a, b) => (b.puan ?? 0) - (a.puan ?? 0)); break;
      case 'sayfa-azalan': sirali.sort((a, b) => (b.sayfaSayisi ?? 0) - (a.sayfaSayisi ?? 0)); break;
      case 'yeni':
      default:
        sirali.sort((a, b) => b.eklenmeTarihi.localeCompare(a.eklenmeTarihi));
        break;
    }
    return sirali;
  });

  readonly kitapVar = computed(() => this.kitaplar().length > 0);
  readonly sonucVar = computed(() => this.gorunenKitaplar().length > 0);
  readonly filtreAktif = computed(
    () =>
      this.arama().trim().length > 0 ||
      this.durumFiltresi() !== 'hepsi' ||
      this.turFiltresi() !== 'hepsi',
  );

  // --- Sayfalama -----------------------------------------------------------
  /** Kart ve tablo görünümü farklı sayfa başına kayıt seçeneklerine sahiptir. */
  readonly KART_SAYFA_BOYUTLARI = [12, 24, 36, 48] as const;
  readonly TABLO_SAYFA_BOYUTLARI = [5, 20, 50, 80, 100] as const;

  private readonly kartSayfaBoyutu = signal<number>(this.KART_SAYFA_BOYUTLARI[0]);
  private readonly tabloSayfaBoyutu = signal<number>(this.TABLO_SAYFA_BOYUTLARI[1]);

  /** Aktif görünüme göre geçerli sayfa boyutu. */
  readonly sayfaBoyutu = computed(() =>
    this.gorunum() === 'kart' ? this.kartSayfaBoyutu() : this.tabloSayfaBoyutu(),
  );

  /** Aktif görünümün sayfa boyutu seçenekleri. */
  readonly sayfaBoyutuSecenekleri = computed<readonly number[]>(() =>
    this.gorunum() === 'kart' ? this.KART_SAYFA_BOYUTLARI : this.TABLO_SAYFA_BOYUTLARI,
  );

  readonly sayfa = signal(1);

  readonly toplamSayfa = computed(() =>
    Math.max(1, Math.ceil(this.gorunenKitaplar().length / this.sayfaBoyutu())),
  );

  /** O anki sayfaya düşen kitaplar (grid ve tablo bunu kullanır). */
  readonly sayfaliKitaplar = computed<Kitap[]>(() => {
    const boyut = this.sayfaBoyutu();
    const bas = (this.sayfa() - 1) * boyut;
    return this.gorunenKitaplar().slice(bas, bas + boyut);
  });

  /** Sayfa başına gösterilecek kayıt sayısını değiştirir (görünüme özel). */
  sayfaBoyutuSec(n: number): void {
    if (this.gorunum() === 'kart') {
      this.kartSayfaBoyutu.set(n);
    } else {
      this.tabloSayfaBoyutu.set(n);
    }
  }

  /** Gösterilecek sayfa numaraları; çok sayfa varsa "…" ile kısaltır. */
  readonly sayfaNumaralari = computed<(number | '...')[]>(() => {
    const toplam = this.toplamSayfa();
    const aktif = this.sayfa();
    if (toplam <= 7) {
      return Array.from({ length: toplam }, (_, i) => i + 1);
    }
    const gorunur = new Set<number>([1, toplam, aktif, aktif - 1, aktif + 1]);
    const nums = [...gorunur].filter((n) => n >= 1 && n <= toplam).sort((a, b) => a - b);
    const sonuc: (number | '...')[] = [];
    let onceki = 0;
    for (const n of nums) {
      if (n - onceki > 1) sonuc.push('...');
      sonuc.push(n);
      onceki = n;
    }
    return sonuc;
  });

  constructor() {
    // Arama / filtre / sıralama / görünüm / sayfa boyutu değişince ilk sayfaya dön.
    effect(() => {
      this.arama();
      this.durumFiltresi();
      this.turFiltresi();
      this.siralama();
      this.sayfaBoyutu();
      this.sayfa.set(1);
    });
  }

  /** Mevcut kitaplarda gerçekten bulunan türler (alfabetik). */
  readonly mevcutTurler = computed(() => {
    const set = new Set<string>();
    for (const k of this.kitaplar()) {
      if (k.tur) set.add(k.tur);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  });

  readonly turFiltreEtiketi = computed(() => {
    this.i18n.dil();
    const t = this.turFiltresi();
    return t === 'hepsi' ? this.i18n.t('toolbar.allGenres') : this.i18n.t('genre.' + t);
  });

  // --- Tablo kolonları (i18n başlıklar) ------------------------------------
  readonly kolonlar = computed<TableColumn[]>(() => {
    this.i18n.dil(); // dile reaktif
    return [
      { key: 'ad', header: this.i18n.t('table.title'), sortable: true },
      { key: 'yazar', header: this.i18n.t('table.author'), sortable: true },
      { key: 'tur', header: this.i18n.t('table.genre'), sortable: true },
      { key: 'durum', header: this.i18n.t('table.status'), sortable: true, align: 'center' },
      { key: 'sayfaSayisi', header: this.i18n.t('table.pages'), sortable: true, numeric: true, align: 'right' },
      { key: 'puan', header: this.i18n.t('table.rating'), sortable: true, numeric: true, align: 'center' },
      { key: 'islemler', header: this.i18n.t('table.actions'), align: 'center' },
    ];
  });

  // --- Başlık alt metni ----------------------------------------------------
  readonly altBaslik = computed(() => {
    this.i18n.dil();
    const s = this.sayaclar();
    if (s.hepsi === 0) return this.i18n.t('shelf.empty');
    if (s.okunuyor > 0) {
      return this.i18n.t('shelf.summaryReading', { count: s.hepsi, reading: s.okunuyor });
    }
    return this.i18n.t('shelf.summary', { count: s.hepsi });
  });

  readonly filtreEtiketi = computed(() => {
    this.i18n.dil();
    const f = this.durumFiltresi();
    return f === 'hepsi' ? this.i18n.t('toolbar.allBooks') : this.i18n.t('status.' + f);
  });

  readonly siralamaEtiketi = computed(() => {
    this.i18n.dil();
    return this.i18n.t('sort.' + this.siralama());
  });

  // --- Aksiyonlar ----------------------------------------------------------
  durumMeta(d: OkumaDurumu): string {
    return this.i18n.t('status.' + d);
  }

  /** Bir durumun toplam içindeki yüzdesi (istatistik barları için). */
  yuzde(sayi: number): number {
    const toplam = this.sayaclar().hepsi;
    return toplam ? Math.round((sayi / toplam) * 100) : 0;
  }

  yeniKitap(): void {
    this.router.navigate(['/kitaplar/ekle']);
  }

  duzenle(kitap: Kitap): void {
    this.router.navigate(['/kitaplar', kitap.id, 'duzenle']);
  }

  silOnayla(kitap: Kitap): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('confirm.deleteTitle'),
        message: this.i18n.t('confirm.deleteText', { title: kitap.ad }),
        confirmText: this.i18n.t('confirm.delete'),
        cancelText: this.i18n.t('confirm.cancel'),
        danger: true,
      },
      panelClass: 'app-dialog',
      autoFocus: false,
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((onay) => {
      if (onay) {
        this.books.sil(kitap.id);
        this.bildir(this.i18n.t('toast.deleted', { title: kitap.ad }));
      }
    });
  }
  ornekVerileriYukle(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('toolbar.loadSamples'),
        message: this.i18n.t('toolbar.loadSamplesConfirm'),
        confirmText: this.i18n.t('confirm.yes'),
        cancelText: this.i18n.t('confirm.cancel'),
        danger: true,
      },
      panelClass: 'app-dialog',
      autoFocus: false,
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((onay) => {
      if (onay) {
        this.books.ornekVeriYukle();
        this.bildir(this.i18n.t('toolbar.loadSamplesSuccess'));
      }
    });
  }
  kutuphaneyiTemizleOnayla(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('toolbar.clearLibrary'),
        message: this.i18n.t('toolbar.clearLibraryConfirm'),
        confirmText: this.i18n.t('confirm.yes'),
        cancelText: this.i18n.t('confirm.cancel'),
        danger: true,
      },
      panelClass: 'app-dialog',
      autoFocus: false,
      maxWidth: '96vw',
    });

    ref.afterClosed().subscribe((onay) => {
      if (onay) {
        this.books.kutuphaneyiTemizle();
        this.bildir(this.i18n.t('toolbar.clearLibrarySuccess'));
      }
    });
  }
  filtreTemizle(): void {
    this.arama.set('');
    this.durumFiltresi.set('hepsi');
    this.turFiltresi.set('hepsi');
  }

  sayfaSec(n: number): void {
    const hedef = Math.min(Math.max(1, n), this.toplamSayfa());
    if (hedef === this.sayfa()) return;
    this.sayfa.set(hedef);
    // Sayfa değişince içerik en üstten başlasın.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private bildir(mesaj: string): void {
    this.snack.open(mesaj, this.i18n.t('toast.dismiss'), {
      duration: 3200,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
