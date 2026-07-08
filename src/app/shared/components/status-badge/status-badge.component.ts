import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OkumaDurumu } from '../../../features/books/models/book.model';
import { I18nService } from '../../../core/services/i18n.service';
import { StatusColorDirective } from '../../directives/status-color.directive';

/**
 * Okuma durumu rozeti. Renklendirmeyi custom `appStatusColor`
 * directive'i yapar. Etiket, dil signal'ini okuyan bir computed ile
 * üretilir — böylece OnPush bileşen dil değiştiğinde de güncellenir
 * (translate pipe OnPush bileşende dil değişimini tetiklemiyordu).
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [StatusColorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" appStatusColor [durum]="durum()">
      <span class="dot"></span>
      {{ etiket() }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 8px;
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        letter-spacing: 0.01em;
        /* renk + arka plan directive tarafından atanır */
      }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--durum-renk);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--durum-renk) 18%, transparent);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  private readonly i18n = inject(I18nService);
  readonly durum = input.required<OkumaDurumu>();

  readonly etiket = computed(() => {
    this.i18n.dil(); // dil signal'ini okuyarak reaktif ol
    return this.i18n.t('status.' + this.durum());
  });
}
