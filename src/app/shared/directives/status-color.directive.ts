import { Directive, ElementRef, effect, inject, input, Renderer2 } from '@angular/core';
import { OkumaDurumu } from '../../features/books/models/book.model';

/** Her okuma durumu için renk paleti. */
const DURUM_RENK: Record<OkumaDurumu, { renk: string; yumusak: string }> = {
  okundu: { renk: '#22c55e', yumusak: '#dcfce7' },
  okunuyor: { renk: '#f59e0b', yumusak: '#fef3c7' },
  okunacak: { renk: '#3b82f6', yumusak: '#dbeafe' },
};

/**
 * Custom directive — bir öğeyi okuma durumuna göre renklendirir.
 * Doküman şartı: "Durum rozetlerini renklendiren bir custom directive".
 *
 * Kullanım:
 *   <span appStatusColor [durum]="kitap.durum">…</span>
 * Host öğeye metin rengi + yumuşak arka plan uygular ve
 * `--durum-renk` / `--durum-yumusak` CSS değişkenlerini yayınlar.
 */
@Directive({
  selector: '[appStatusColor]',
  standalone: true,
})
export class StatusColorDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly durum = input.required<OkumaDurumu>();

  /** Arka planı da boyansın mı? (false ise yalnızca değişkenler + metin rengi) */
  readonly fill = input<boolean>(true);

  constructor() {
    effect(() => {
      const palet = DURUM_RENK[this.durum()];
      const host = this.el.nativeElement;
      this.renderer.setStyle(host, '--durum-renk', palet.renk);
      this.renderer.setStyle(host, '--durum-yumusak', palet.yumusak);
      this.renderer.setStyle(host, 'color', palet.renk);
      if (this.fill()) {
        this.renderer.setStyle(host, 'background-color', palet.yumusak);
      }
    });
  }
}
