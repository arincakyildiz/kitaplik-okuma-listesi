import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { I18nService } from '../../../core/services/i18n.service';

/**
 * Ortak form alanı: etiket, (projeksiyonla gelen) input ve
 * doğrulama hata mesajını standart biçimde gösterir.
 * Hata mesajları i18n anahtarlarına ('valid.*') eşlenir.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" [class.has-error]="showError()">
      @if (label()) {
        <label class="label">
          {{ label() }}
          @if (required()) {
            <span class="req">*</span>
          } @else if (optionalLabel()) {
            <span class="opt">{{ optionalLabel() }}</span>
          }
        </label>
      }

      <div class="control"><ng-content></ng-content></div>

      @if (showError()) {
        <p class="error">
          <span class="material-icons">error_outline</span>{{ errorText() }}
        </p>
      } @else if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .field { display: flex; flex-direction: column; }
      .label {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text);
        margin-bottom: var(--space-2);
      }
      .req { color: var(--color-danger); margin-left: 2px; }
      .opt { color: var(--color-text-subtle); font-weight: 400; margin-left: 4px; }
      .control { display: flex; flex-direction: column; }
      .error {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: var(--space-2) 0 0;
        font-size: 12.5px;
        font-weight: 500;
        color: var(--color-danger);
      }
      .error .material-icons { font-size: 15px; }
      .hint {
        margin: var(--space-2) 0 0;
        font-size: 12.5px;
        color: var(--color-text-subtle);
      }
    `,
  ],
})
export class FormFieldComponent {
  private readonly i18n = inject(I18nService);

  readonly label = input<string>('');
  readonly control = input<AbstractControl | null>(null);
  readonly required = input<boolean>(false);
  readonly optionalLabel = input<string>('');
  readonly hint = input<string>('');

  /**
   * AbstractControl'ün touched/invalid/errors alanları normal (sinyal
   * olmayan) mutasyonlardır — `markAllAsTouched()` gibi çağrılar
   * computed()'i otomatik tetiklemez. `control.events` (Angular 14+)
   * touched/value/status değişimlerinde yayın yapar; bunu dinleyip
   * bir sayaç sinyalini artırarak computed()'lerin gerçek zamanlı
   * yeniden hesaplanmasını sağlıyoruz.
   */
  private readonly tick = signal(0);

  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      if (!c) return;
      const sub = c.events.subscribe(() => this.tick.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly showError = computed(() => {
    this.tick();
    const c = this.control();
    return !!c && c.invalid && (c.touched || c.dirty);
  });

  readonly errorText = computed(() => {
    this.tick();
    const c = this.control();
    // i18n dilini reaktif tutmak için okuyoruz
    this.i18n.dil();
    if (!c || !c.errors) return '';
    const errors = c.errors;
    if (errors['required']) return this.i18n.t('valid.required');
    if (errors['whitespace']) return this.i18n.t('valid.whitespace');
    if (errors['minlength']) return this.i18n.t('valid.minlength');
    if (errors['min']) return this.i18n.t('valid.min');
    if (errors['max']) return this.i18n.t('valid.max');
    if (errors['number']) return this.i18n.t('valid.min');
    if (errors['futureDate']) return this.i18n.t('valid.futureDate');
    if (errors['date']) return this.i18n.t('valid.date');
    return this.i18n.t('valid.required');
  });
}
