import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

/** Açık/koyu tema arasında geçiş yapan navbar butonu. */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-stroked-button
      class="theme-btn"
      (click)="theme.toggle()"
      [matTooltip]="ipucu()"
      [attr.aria-label]="ipucu()"
    >
      <mat-icon>{{ theme.tema() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [
    `
      .theme-btn {
        width: 42px;
        min-width: 42px;
        height: 42px;
        padding: 0 !important;
        border-radius: var(--radius-md) !important;
        --mdc-outlined-button-outline-color: var(--color-border);
        color: var(--color-text) !important;
        background: var(--color-card) !important;
        box-shadow: var(--shadow-xs);
      }
      .theme-btn:hover { --mdc-outlined-button-outline-color: var(--color-border-strong); }
      .theme-btn mat-icon {
        margin: 0;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  readonly ipucu = computed(() => {
    this.i18n.dil();
    return this.theme.tema() === 'dark'
      ? this.i18n.t('theme.toLight')
      : this.i18n.t('theme.toDark');
  });
}
