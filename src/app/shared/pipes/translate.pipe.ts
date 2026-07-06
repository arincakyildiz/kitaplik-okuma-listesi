import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Custom pipe (1/2) — i18n çevirisi.
 * Kullanım: {{ 'shelf.title' | translate }}
 *          {{ 'card.pages' | translate: { count: kitap.sayfaSayisi } }}
 *
 * `pure: false` — dil signal'i değiştiğinde metin anında güncellensin diye.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
