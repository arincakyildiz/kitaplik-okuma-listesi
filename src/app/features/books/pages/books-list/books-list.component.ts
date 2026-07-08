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
  private readonly SAYFA_BOYUTU = 12;
  readonly sayfa = signal(1);

  readonly toplamSayfa = computed(() =>
    Math.max(1, Math.ceil(this.gorunenKitaplar().length / this.SAYFA_BOYUTU)),
  );

  /** O anki sayfaya düşen kitaplar (grid ve tablo bunu kullanır). */
  readonly sayfaliKitaplar = computed<Kitap[]>(() => {
    const bas = (this.sayfa() - 1) * this.SAYFA_BOYUTU;
    return this.gorunenKitaplar().slice(bas, bas + this.SAYFA_BOYUTU);
  });

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
    // Arama / filtre / sıralama değişince ilk sayfaya dön.
    effect(() => {
      this.arama();
      this.durumFiltresi();
      this.turFiltresi();
      this.siralama();
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
