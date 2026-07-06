import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Kitap } from '../../models/book.model';
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
    StatusBadgeComponent,
    StarRatingComponent,
    TranslatePipe,
    TruncatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <div class="cover" [style.--cover-from]="palet().from" [style.--cover-to]="palet().to">
        <span class="spine"></span>
        <span class="initials">{{ bashHarfler() }}</span>
        <div class="cover-status">
          <app-status-badge [durum]="kitap().durum" />
        </div>
      </div>

      <div class="body">
        <div class="head">
          <h3 class="name" [title]="kitap().ad">{{ kitap().ad }}</h3>
          <p class="author"><span class="material-icons">person</span>{{ kitap().yazar }}</p>
        </div>

        <div class="meta">
          @if (kitap().tur) {
            <span class="genre">{{ kitap().tur }}</span>
          } @else {
            <span></span>
          }
          @if (kitap().sayfaSayisi) {
            <span class="pages">
              <span class="material-icons">description</span>{{ 'card.pages' | translate: { count: kitap().sayfaSayisi! } }}
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
      .cover {
        position: relative;
        height: 132px;
        background: linear-gradient(135deg, var(--cover-from), var(--cover-to));
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
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
      }
      .cover-status {
        position: absolute;
        top: 12px; right: 12px;
        background: rgba(255, 255, 255, 0.92);
        border-radius: var(--radius-full);
        padding: 2px;
        backdrop-filter: blur(4px);
      }
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
  readonly kitap = input.required<Kitap>();

  readonly duzenle = output<Kitap>();
  readonly sil = output<Kitap>();

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
}
