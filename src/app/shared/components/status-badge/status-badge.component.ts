import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OkumaDurumu } from '../../../features/books/models/book.model';
import { StatusColorDirective } from '../../directives/status-color.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Okuma durumu rozeti. Renklendirmeyi custom `appStatusColor`
 * directive'i, metni ise `translate` pipe'ı yapar.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [StatusColorDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" appStatusColor [durum]="durum()">
      <span class="dot"></span>
      {{ 'status.' + durum() | translate }}
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
  readonly durum = input.required<OkumaDurumu>();
}
