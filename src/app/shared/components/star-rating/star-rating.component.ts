import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Yıldız puanlama — varsayılan görüntüleme, `editable` true ise düzenlenebilir.
 * Düzenlenebilirken seçimde `ratingChange` yayınlar.
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="stars"
      [class.editable]="editable()"
      [class.lg]="size() === 'lg'"
      role="img"
      [attr.aria-label]="value() + ' / 5'"
    >
      @for (star of starList; track star) {
        <button
          type="button"
          class="star"
          [class.filled]="star <= displayValue()"
          [disabled]="!editable()"
          (mouseenter)="editable() && hover.set(star)"
          (mouseleave)="editable() && hover.set(0)"
          (click)="select(star)"
        >
          <span class="material-icons">{{ star <= displayValue() ? 'star' : 'star_border' }}</span>
        </button>
      }
      @if (showValue() && !editable()) {
        <span class="value">{{ value() ? value()!.toFixed(1) : '—' }}</span>
      }
    </div>
  `,
  styles: [
    `
      .stars { display: inline-flex; align-items: center; gap: 1px; }
      .star {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: none;
        color: #d1d5db;
        cursor: default;
        transition: transform 150ms var(--ease), color 150ms var(--ease);
      }
      .star .material-icons { font-size: 18px; }
      .stars.lg .star .material-icons { font-size: 30px; }
      .star.filled { color: #f59e0b; }
      .editable .star { cursor: pointer; }
      .editable .star:hover { transform: scale(1.18); }
      .value {
        margin-left: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class StarRatingComponent {
  readonly value = input<number | undefined>(0);
  readonly editable = input<boolean>(false);
  readonly showValue = input<boolean>(true);
  readonly size = input<'md' | 'lg'>('md');

  readonly ratingChange = output<number>();

  protected readonly hover = signal(0);
  protected readonly starList = [1, 2, 3, 4, 5];

  protected readonly displayValue = computed(() =>
    this.editable() && this.hover() > 0 ? this.hover() : Math.round(this.value() ?? 0),
  );

  protected select(star: number): void {
    if (!this.editable()) return;
    this.ratingChange.emit((this.value() ?? 0) === star ? 0 : star);
  }
}
