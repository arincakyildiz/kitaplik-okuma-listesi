import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../core/services/i18n.service';
import { DESTEKLENEN_DILLER, Dil } from '../../../core/models/language.model';

/** Navbar'daki TR/EN dil değiştirici. */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [UpperCasePipe, MatButtonModule, MatMenuModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-stroked-button class="lang-btn" [matMenuTriggerFor]="menu" aria-label="Language">
      <span class="flag">{{ aktif().bayrak }}</span>
      <span class="code">{{ i18n.dil() | uppercase }}</span>
      <mat-icon class="chev">expand_more</mat-icon>
    </button>

    <mat-menu #menu="matMenu" xPosition="before">
      @for (d of diller; track d.kod) {
        <button mat-menu-item (click)="sec(d.kod)">
          <span class="flag">{{ d.bayrak }}</span>
          <span class="name">{{ d.etiket }}</span>
          @if (i18n.dil() === d.kod) {
            <mat-icon class="check">check</mat-icon>
          }
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      .lang-btn {
        height: 42px !important;
        border-radius: var(--radius-md) !important;
        --mdc-outlined-button-outline-color: var(--color-border);
        color: var(--color-text) !important;
        font-weight: 600 !important;
        background: var(--color-card) !important;
        box-shadow: var(--shadow-xs);
        padding: 0 12px !important;
      }
      .lang-btn:hover { --mdc-outlined-button-outline-color: var(--color-border-strong); }
      .flag { font-size: 16px; margin-right: 6px; }
      .code { font-size: 13px; letter-spacing: 0.02em; }
      .chev { margin-left: 2px; color: var(--color-text-subtle); }
      .name { margin-left: 4px; }
      .check { margin-left: auto; color: var(--color-primary); }
    `,
  ],
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);
  readonly diller = DESTEKLENEN_DILLER;

  get aktif() {
    return () => DESTEKLENEN_DILLER.find((d) => d.kod === this.i18n.dil())!;
  }

  sec(dil: Dil): void {
    this.i18n.degistir(dil);
  }
}
