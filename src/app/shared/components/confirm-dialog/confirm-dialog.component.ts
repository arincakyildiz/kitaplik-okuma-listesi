import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** ConfirmDialog'a geçilen, dile göre çevrilmiş metinler. */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger?: boolean;
  icon?: string;
}

/**
 * Ortak "Emin misiniz?" onay modalı. Silme gibi geri alınamaz
 * işlemlerde ve canDeactivate guard'ında yeniden kullanılır.
 * Sonuç: onay → true, iptal → false.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="icon" [class.danger]="data.danger">
        <span class="material-icons">{{ data.icon ?? (data.danger ? 'delete_outline' : 'help_outline') }}</span>
      </div>

      <h2 class="title">{{ data.title }}</h2>
      <p class="text">{{ data.message }}</p>

      <div class="actions">
        <button mat-stroked-button class="cancel" (click)="close(false)">
          {{ data.cancelText }}
        </button>
        <button
          mat-flat-button
          class="confirm"
          [class.danger]="data.danger"
          (click)="close(true)"
        >
          @if (data.danger) {
            <mat-icon>delete_outline</mat-icon>
          }
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        padding: var(--space-6);
        text-align: center;
        width: min(420px, 86vw);
      }
      .icon {
        width: 56px;
        height: 56px;
        margin: 0 auto var(--space-4);
        border-radius: 50%;
        background: var(--color-primary-soft);
        color: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon.danger { background: var(--color-danger-soft); color: var(--color-danger); }
      .icon .material-icons { font-size: 28px; }
      .title { font-size: 19px; font-weight: 700; margin-bottom: var(--space-2); }
      .text {
        margin: 0 auto var(--space-6);
        color: var(--color-text-muted);
        font-size: 14.5px;
        line-height: 1.6;
        max-width: 320px;
      }
      .actions { display: flex; gap: var(--space-3); }
      .actions button {
        flex: 1;
        height: 46px;
        border-radius: var(--radius-md) !important;
        font-weight: 600 !important;
      }
      .cancel {
        --mdc-outlined-button-outline-color: var(--color-border-strong);
        color: var(--color-text) !important;
      }
      .cancel:hover { background: #f3f4f6 !important; }
      .confirm {
        --mdc-filled-button-container-color: var(--color-primary);
        color: #fff !important;
        box-shadow: var(--shadow-primary);
      }
      .confirm:hover { --mdc-filled-button-container-color: var(--color-primary-hover); }
      .confirm.danger {
        --mdc-filled-button-container-color: var(--color-danger);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.28);
      }
      .confirm.danger:hover { --mdc-filled-button-container-color: var(--color-danger-hover); }
      .confirm .mat-icon { margin-right: 4px; }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ConfirmDialogComponent>);

  close(confirmed: boolean): void {
    this.ref.close(confirmed);
  }
}
