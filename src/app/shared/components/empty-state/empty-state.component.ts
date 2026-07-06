import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Kayıt bulunmadığında gösterilen ortak boş durum bileşeni. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="art" aria-hidden="true">
        <div class="shelf">
          <span class="book b1"></span>
          <span class="book b2"></span>
          <span class="book b3"></span>
          <span class="book b4"></span>
        </div>
        <div class="plus"><span class="material-icons">{{ icon() }}</span></div>
      </div>

      <h2 class="title">{{ title() }}</h2>
      <p class="subtitle">{{ subtitle() }}</p>

      @if (actionLabel()) {
        <button mat-flat-button class="cta" (click)="action.emit()">
          <mat-icon>add</mat-icon>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--space-12) var(--space-6);
        max-width: 460px;
        margin: 0 auto;
      }
      .art {
        position: relative;
        width: 132px;
        height: 132px;
        border-radius: var(--radius-xl);
        background: linear-gradient(150deg, #eef2ff 0%, #f8fafc 60%, #ecfdf5 100%);
        border: 1px solid var(--color-border);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        margin-bottom: var(--space-6);
        box-shadow: var(--shadow-sm);
      }
      .shelf {
        display: flex;
        align-items: flex-end;
        gap: 5px;
        padding-bottom: 26px;
        height: 62px;
      }
      .book { width: 12px; border-radius: 3px 3px 1px 1px; display: block; }
      .b1 { height: 44px; background: #4f46e5; }
      .b2 { height: 56px; background: #10b981; }
      .b3 { height: 38px; background: #f59e0b; }
      .b4 { height: 50px; background: #3b82f6; }
      .plus {
        position: absolute;
        right: 16px;
        bottom: 14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-primary);
      }
      .plus .material-icons { font-size: 20px; }
      .title { font-size: 19px; font-weight: 700; margin-bottom: var(--space-2); }
      .subtitle {
        margin: 0 0 var(--space-6);
        color: var(--color-text-muted);
        font-size: 14.5px;
        line-height: 1.6;
      }
      .cta {
        --mdc-filled-button-container-color: var(--color-primary);
        height: 46px;
        border-radius: var(--radius-md) !important;
        padding: 0 22px !important;
        font-weight: 600;
        box-shadow: var(--shadow-primary);
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly actionLabel = input<string>('');
  readonly icon = input<string>('menu_book');

  readonly action = output<void>();
}
