import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Ortak yükleniyor göstergesi. */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <mat-spinner [diameter]="diameter()" strokeWidth="4"></mat-spinner>
      @if (message()) {
        <p class="text">{{ message() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        padding: var(--space-12) var(--space-6);
      }
      .text {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 14.5px;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  readonly diameter = input<number>(46);
  readonly message = input<string>('');
}
