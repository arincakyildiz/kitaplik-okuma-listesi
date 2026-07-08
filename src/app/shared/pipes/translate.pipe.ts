import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { effect } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Custom pipe (1/2) — i18n çevirisi.
 * Kullanım: {{ 'shelf.title' | translate }}
 *          {{ 'card.pages' | translate: { count: kitap.sayfaSayisi } }}
 *
 * `pure: false` + `effect` — OnPush bileşenlerinde dil değiştiğinde
 * ChangeDetectorRef.markForCheck() çağrılarak CD tetiklenir.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    // Dil sinyali her değiştiğinde bu pipe'ı barındıran OnPush bileşenini
    // yeniden render etmesi için işaretle.
    effect(() => {
      this.i18n.dil(); // reaktif bağımlılık
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
