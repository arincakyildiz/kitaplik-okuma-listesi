import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Kitap } from '../../models/book.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DatePipe,
    StatusBadgeComponent,
    StarRatingComponent,
    TranslatePipe,
    TruncatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [attr.data-lang]="i18n.dil()" [class.expanded]="acik()">
      <!-- Kapak alanı — tıklayınca detaylar açılır -->
      <div
        class="cover"
        [style.--cover-from]="palet().from"
        [style.--cover-to]="palet().to"
        (click)="detayAc()"
        role="button"
        [attr.aria-expanded]="acik()"
      >
        <span class="spine"></span>
        @if (kitap().durum === 'okunuyor' && kitap().kalinanSayfa) {
          <div class="bookmark-ribbon" [matTooltip]="'card.progressLabel' | translate">
            <span class="material-icons">bookmark</span>
            <span class="ribbon-page">{{ kitap().kalinanSayfa }}</span>
          </div>
        }
        <span class="initials">{{ bashHarfler() }}</span>
        <div class="cover-status">
          <app-status-badge [durum]="kitap().durum" />
        </div>
        <!-- Hover/detay chip -->
        <div class="cover-overlay">
          <span class="details-chip">
            <span class="material-icons">{{ acik() ? 'expand_less' : 'info_outline' }}</span>
            {{ acik() ? ('card.hideDetails' | translate) : ('card.showDetails' | translate) }}
          </span>
        </div>
        @if (kitap().durum === 'okunuyor' && kitap().sayfaSayisi && kitap().kalinanSayfa) {
          <div class="cover-progress-bar">
            <span [style.width.%]="okumaYuzdesi()"></span>
          </div>
        }
      </div>

      <!-- Detay paneli (genişleyerek açılır) -->
      <div class="details-panel" [class.open]="acik()">
        <div class="details-inner">
          @if (kitap().durum === 'okunuyor' && kitap().kalinanSayfa) {
            <div class="detail-progress-section">
              <div class="detail-item">
                <span class="detail-icon material-icons">bookmark_border</span>
                <div>
                  <span class="detail-label">{{ 'card.progressLabel' | translate }}</span>
                  <span class="detail-value">
                    {{ 'card.progressValue' | translate: { current: kitap().kalinanSayfa!, total: kitap().sayfaSayisi || 0, percent: okumaYuzdesi() } }}
                  </span>
                  @if (kalanSure()) {
                    <span class="detail-time-hint">{{ kalanSure() }}</span>
                  }
                </div>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="okumaYuzdesi()"></div>
              </div>
            </div>
          }
          <div class="details-row">
            @if (kitap().tur) {
              <div class="detail-item">
                <span class="detail-icon material-icons">category</span>
                <div>
                  <span class="detail-label">{{ 'card.genre' | translate }}</span>
                  <span class="detail-value">{{ 'genre.' + kitap().tur | translate }}</span>
                </div>
              </div>
            }
            @if (kitap().sayfaSayisi) {
              <div class="detail-item">
                <span class="detail-icon material-icons">description</span>
                <div>
                  <span class="detail-label">{{ 'card.pagesLabel' | translate }}</span>
                  <span class="detail-value">{{ 'card.pages' | translate: { count: kitap().sayfaSayisi! } }}</span>
                </div>
              </div>
            }
          </div>
          <div class="details-row">
            <div class="detail-item">
              <span class="detail-icon material-icons">star</span>
              <div>
                <span class="detail-label">{{ 'card.ratingLabel' | translate }}</span>
                <app-star-rating [value]="kitap().puan" [showValue]="true" />
              </div>
            </div>
            @if (kitap().baslamaTarihi) {
              <div class="detail-item">
                <span class="detail-icon material-icons">event</span>
                <div>
                  <span class="detail-label">{{ 'card.startedLabel' | translate }}</span>
                  <span class="detail-value">{{ kitap().baslamaTarihi | date: 'dd.MM.yyyy' }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Alıntılar -->
          @if (kitap().alintilar && kitap().alintilar!.length > 0) {
            <div class="detail-quotes-section">
              <span class="detail-label">{{ 'card.quotesTitle' | translate: { count: kitap().alintilar!.length } }}</span>
              <div class="detail-quotes-list">
                @for (q of kitap().alintilar!; track q) {
                  <div class="detail-quote-item">
                    <span class="quote-symbol">“</span>
                    <div class="quote-body">
                      <p class="quote-text">{{ q.metin }}</p>
                      @if (q.sayfa) {
                        <span class="quote-page">sf. {{ q.sayfa }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Okuma Günlüğü -->
          @if (kitap().timeline && kitap().timeline!.length > 0) {
            <div class="detail-timeline-section">
              <span class="detail-label">{{ 'card.timelineTitle' | translate }}</span>
              <div class="detail-timeline-list">
                @for (log of kitap().timeline!; track log) {
                  <div class="timeline-item">
                    <span class="timeline-dot"></span>
                    <div class="timeline-content">
                      <span class="timeline-date">{{ log.tarih | date: 'dd.MM.yyyy HH:mm' }}</span>
                      <p class="timeline-msg">
                        {{ log.mesaj | translate: { durum: ('status.' + (log.deger ?? '') | translate), sayfa: log.deger ?? '' } }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (kitap().not) {
            <div class="detail-note">
              <span class="material-icons">notes</span>
              <p>{{ kitap().not }}</p>
            </div>
          }
        </div>
      </div>

      <div class="body">
        <div class="head">
          <h3 class="name" [title]="kitap().ad">{{ kitap().ad }}</h3>
          <p class="author"><span class="material-icons">person</span>{{ kitap().yazar }}</p>
        </div>

        <div class="meta">
          @if (kitap().tur) {
            <span class="genre">{{ 'genre.' + kitap().tur | translate }}</span>
          } @else {
            <span></span>
          }
          @if (kitap().sayfaSayisi) {
            <span class="pages">
              <span class="material-icons">description</span>
              @if (kitap().durum === 'okunuyor' && kitap().kalinanSayfa) {
                {{ kitap().kalinanSayfa }} / {{ 'card.pages' | translate: { count: kitap().sayfaSayisi! } }}
              } @else {
                {{ 'card.pages' | translate: { count: kitap().sayfaSayisi! } }}
              }
            </span>
          }
        </div>

        <div class="rating-row">
          <app-star-rating [value]="kitap().puan" [showValue]="true" />
        </div>

        @if (kitap().not) {
          <p class="note">{{ kitap().not | truncate: 90 }}</p>
        }
      </div>

      <div class="actions">
        <button mat-stroked-button class="btn edit" (click)="duzenle.emit(kitap())" [matTooltip]="'card.edit' | translate">
          <mat-icon>edit</mat-icon>
          {{ 'card.edit' | translate }}
        </button>
        <button mat-button class="btn delete" (click)="sil.emit(kitap())" [matTooltip]="'card.delete' | translate" [attr.aria-label]="'card.delete' | translate">
          <mat-icon>delete_outline</mat-icon>
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .card {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease),
          border-color var(--dur) var(--ease);
      }
      .card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
      }
      .card.expanded {
        border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);
      }

      /* Kapak */
      .cover {
        position: relative;
        height: 132px;
        background: linear-gradient(135deg, var(--cover-from), var(--cover-to));
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: pointer;
        flex-shrink: 0;
      }
      .spine {
        position: absolute;
        left: 22px; top: 0; bottom: 0;
        width: 3px;
        background: rgba(255, 255, 255, 0.35);
        box-shadow: 4px 0 8px rgba(0, 0, 0, 0.06);
      }
      .initials {
        font-size: 40px;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: -0.03em;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
        transition: transform 280ms var(--ease), opacity 280ms var(--ease);
        pointer-events: none;
      }
      .card.expanded .initials {
        transform: scale(0.82);
        opacity: 0.55;
      }
      .cover-status {
        position: absolute;
        top: 12px; right: 12px;
        background: rgba(255, 255, 255, 0.92);
        border-radius: var(--radius-full);
        padding: 2px;
        backdrop-filter: blur(4px);
      }

      /* Hover overlay */
      .cover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 12px;
        transition: background 220ms var(--ease);
        pointer-events: none;
      }
      .cover:hover .cover-overlay {
        background: rgba(0, 0, 0, 0.28);
      }
      .card.expanded .cover-overlay {
        background: rgba(0, 0, 0, 0.18);
      }
      .details-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.94);
        color: #1a1a2e;
        font-size: 11.5px;
        font-weight: 700;
        padding: 5px 13px;
        border-radius: var(--radius-full);
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 12px rgba(0,0,0,0.22);
        transform: translateY(0);
        /* Dokunmatik cihazlarda hover tetiklenmediği için ipucu her zaman
           görünür olmalı; aksi halde kullanıcı kapağın tıklanabilir
           olduğunu ve detayları açtığını hiç fark edemez. */
        opacity: 0.92;
        transition: opacity 220ms var(--ease), transform 220ms var(--ease);
        white-space: nowrap;
        letter-spacing: 0.01em;
      }
      .details-chip .material-icons { font-size: 14px; }
      .cover:hover .details-chip,
      .card.expanded .details-chip {
        opacity: 1;
        transform: translateY(-2px);
      }

      /* Bookmark Ribbon */
      .bookmark-ribbon {
        position: absolute;
        top: 0;
        left: 36px;
        width: 24px;
        height: 38px;
        background: #ff4757;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 3px;
        font-size: 8px;
        font-weight: 800;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
        z-index: 2;
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
      }
      .bookmark-ribbon .material-icons {
        font-size: 10px;
        height: 10px;
        width: 10px;
      }
      .ribbon-page {
        margin-top: 1px;
        line-height: 1;
        font-size: 8px;
        font-variant-numeric: tabular-nums;
      }

      /* Progress Bar on Cover */
      .cover-progress-bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        background: rgba(0, 0, 0, 0.18);
        z-index: 2;
      }
      .cover-progress-bar span {
        display: block;
        height: 100%;
        background: #00d2d3;
        box-shadow: 0 0 4px #00d2d3;
        transition: width var(--dur) var(--ease);
      }

      /* Progress Section in Details */
      .detail-progress-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--color-border);
      }
      .progress-track {
        height: 6px;
        background: var(--color-border);
        border-radius: var(--radius-full);
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), #00d2d3);
        border-radius: var(--radius-full);
        transition: width var(--dur) var(--ease);
      }

      /* Detay paneli */
      .details-panel {
        max-height: 0;
        overflow: hidden;
        background: color-mix(in srgb, var(--color-primary) 6%, var(--color-card));
        transition: max-height 380ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      .details-panel.open {
        /* İçerik (uzun not + çok sayıda alıntı/günlük kaydı) 800px'i aşabildiğinden
           gerçek metni kesmemesi için animasyon üst sınırı bolca yüksek tutulur. */
        max-height: 3000px;
        border-bottom: 1px solid var(--color-border);
      }
      .detail-time-hint {
        font-size: 11px;
        font-weight: 600;
        color: var(--color-primary);
        margin-top: 2px;
        display: block;
      }

      /* Quotes section in details */
      .detail-quotes-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border);
      }
      .detail-quotes-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 140px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .detail-quote-item {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        background: rgba(0, 0, 0, 0.02);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--color-primary);
      }
      .detail-quote-item .quote-symbol {
        font-size: 18px;
        line-height: 14px;
        font-family: Georgia, serif;
        color: var(--color-primary);
        opacity: 0.5;
        text-shadow: none;
        letter-spacing: normal;
        margin: 0;
        height: auto;
        font-weight: normal;
      }
      .quote-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .quote-body .quote-text {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: var(--color-text-muted);
        font-style: italic;
        border-left: none;
        padding-left: 0;
        overflow-wrap: anywhere;
      }
      .quote-body .quote-page {
        font-size: 10px;
        font-weight: 700;
        color: var(--color-text-subtle);
      }

      /* Reading timeline section */
      .detail-timeline-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: var(--space-2);
        border-top: 1px solid var(--color-border);
      }
      .detail-timeline-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 150px;
        overflow-y: auto;
        padding: 4px 4px 4px 14px;
        border-left: 2px solid var(--color-border);
        margin-left: 6px;
      }
      .timeline-item {
        position: relative;
        display: flex;
        align-items: flex-start;
      }
      .timeline-dot {
        position: absolute;
        left: -18px;
        top: 5px;
        width: 6px;
        height: 6px;
        background: var(--color-primary);
        border-radius: 50%;
        box-shadow: 0 0 0 2px var(--color-primary-soft);
      }
      .timeline-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .timeline-date {
        font-size: 9.5px;
        font-weight: 700;
        color: var(--color-text-subtle);
      }
      .timeline-msg {
        margin: 0;
        font-size: 11.5px;
        line-height: 1.4;
        color: var(--color-text-muted);
      }
      .details-inner {
        padding: 14px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .details-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .detail-item {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        flex: 1;
        min-width: 100px;
      }
      .detail-icon {
        font-size: 16px;
        color: var(--color-primary);
        margin-top: 2px;
        flex-shrink: 0;
      }
      .detail-item > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .detail-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--color-text-subtle);
      }
      .detail-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .detail-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--color-border);
      }
      .detail-note .material-icons {
        font-size: 15px;
        color: var(--color-text-subtle);
        flex-shrink: 0;
        margin-top: 2px;
      }
      .detail-note p {
        margin: 0;
        font-size: 12px;
        line-height: 1.55;
        color: var(--color-text-muted);
        font-style: italic;
        overflow-wrap: anywhere;
      }

      /* Body */
      .body {
        padding: var(--space-4) var(--space-4) var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        flex: 1;
      }
      .head { display: flex; flex-direction: column; gap: 4px; }
      .name {
        font-size: 16px;
        font-weight: 700;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 43px;
      }
      .author {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 0;
        font-size: 13.5px;
        color: var(--color-text-muted);
      }
      .author .material-icons { font-size: 15px; color: var(--color-text-subtle); }
      .meta { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
      .genre {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-primary);
        background: var(--color-primary-soft);
        padding: 4px 10px;
        border-radius: var(--radius-full);
      }
      .pages {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12.5px;
        color: var(--color-text-muted);
        white-space: nowrap;
      }
      .pages .material-icons { font-size: 15px; color: var(--color-text-subtle); }
      .rating-row { display: flex; align-items: center; }
      .note {
        margin: 0;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--color-text-muted);
        font-style: italic;
        border-left: 2px solid var(--color-border);
        padding-left: var(--space-3);
        overflow-wrap: anywhere;
      }
      .actions {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4) var(--space-4);
        border-top: 1px solid var(--color-border);
      }
      .btn { height: 40px; border-radius: var(--radius-md) !important; font-weight: 600 !important; }
      .edit {
        flex: 1;
        --mdc-outlined-button-outline-color: var(--color-border-strong);
        color: var(--color-text) !important;
      }
      .edit:hover { background: var(--color-primary-soft) !important; color: var(--color-primary) !important; }
      .delete {
        min-width: 40px; width: 40px; padding: 0 !important;
        color: var(--color-text-muted) !important;
      }
      .delete:hover { background: var(--color-danger-soft) !important; color: var(--color-danger) !important; }
      .btn .mat-icon { margin: 0 4px 0 0; }
      .delete .mat-icon { margin: 0; }
    `,
  ],
})
export class BookCardComponent {
  /** Dil signal'i template'de okunarak dil değişiminde çevirilerin güncellenmesini sağlar. */
  readonly i18n = inject(I18nService);
  readonly kitap = input.required<Kitap>();

  readonly duzenle = output<Kitap>();
  readonly sil = output<Kitap>();

  /** Detay panelinin açık/kapalı durumu */
  readonly acik = signal(false);

  private static readonly PALETLER = [
    { from: '#6366f1', to: '#8b5cf6' },
    { from: '#10b981', to: '#059669' },
    { from: '#3b82f6', to: '#2563eb' },
    { from: '#f59e0b', to: '#ea580c' },
    { from: '#ec4899', to: '#db2777' },
    { from: '#14b8a6', to: '#0d9488' },
    { from: '#8b5cf6', to: '#6d28d9' },
    { from: '#0ea5e9', to: '#0284c7' },
  ];

  readonly palet = computed(() => {
    const key = this.kitap().id + this.kitap().ad;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return BookCardComponent.PALETLER[Math.abs(hash) % BookCardComponent.PALETLER.length];
  });

  readonly bashHarfler = computed(() => {
    const kelimeler = this.kitap().ad.trim().split(/\s+/).filter(Boolean);
    return kelimeler.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  });

  readonly okumaYuzdesi = computed(() => {
    const k = this.kitap();
    if (!k.sayfaSayisi || !k.kalinanSayfa) return 0;
    return Math.min(100, Math.round((k.kalinanSayfa / k.sayfaSayisi) * 100));
  });

  readonly kalanSure = computed(() => {
    const k = this.kitap();
    if (k.durum !== 'okunuyor' || !k.sayfaSayisi || !k.kalinanSayfa) return '';
    const kalanSayfa = Math.max(0, k.sayfaSayisi - k.kalinanSayfa);
    if (kalanSayfa === 0) return '';
    const sureDk = Math.round(kalanSayfa * 1.5);
    if (sureDk >= 60) {
      const saat = (sureDk / 60).toFixed(1);
      return this.i18n.t('card.readingTime', { time: saat });
    }
    return this.i18n.t('card.readingTimeMins', { time: sureDk });
  });

  detayAc(): void {
    this.acik.update((v) => !v);
  }
}
