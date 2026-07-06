import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Generic tablo kolon tanımı. */
export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  numeric?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

/**
 * Yeniden kullanılabilir generic tablo bileşeni.
 * Veri ve kolon tanımını @Input ile alır; her hücrenin içeriği
 * `#cell` ng-template'i ile dışarıdan sağlanır (tam esneklik).
 * Kolon başlığına tıklayınca client-side sıralama yapar.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th
                [style.text-align]="col.align ?? 'left'"
                [style.width]="col.width ?? null"
                [class.sortable]="col.sortable"
                (click)="col.sortable && toggleSort(col.key)"
              >
                <span class="th-inner" [style.justify-content]="align(col)">
                  {{ col.header }}
                  @if (col.sortable) {
                    <mat-icon class="sort-icon" [class.active]="sortKey() === col.key">
                      {{ sortIcon(col.key) }}
                    </mat-icon>
                  }
                </span>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track trackValue(row)) {
            <tr>
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align ?? 'left'">
                  <ng-container
                    *ngTemplateOutlet="cell(); context: { $implicit: row, col: col }"
                  ></ng-container>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .table-wrap {
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: auto;
        box-shadow: var(--shadow-sm);
      }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      thead th {
        position: sticky;
        top: 0;
        background: var(--color-elevated);
        border-bottom: 1px solid var(--color-border);
        padding: var(--space-3) var(--space-4);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        white-space: nowrap;
        user-select: none;
      }
      th.sortable { cursor: pointer; transition: color 160ms var(--ease); }
      th.sortable:hover { color: var(--color-primary); }
      .th-inner { display: inline-flex; align-items: center; gap: 4px; }
      .sort-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        opacity: 0.35;
        transition: opacity 160ms var(--ease);
      }
      .sort-icon.active { opacity: 1; color: var(--color-primary); }
      tbody td {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
        color: var(--color-text);
        vertical-align: middle;
      }
      tbody tr { transition: background 140ms var(--ease); }
      tbody tr:hover { background: var(--color-row-hover); }
      tbody tr:last-child td { border-bottom: none; }
    `,
  ],
})
export class DataTableComponent<T extends Record<string, any>> {
  readonly data = input.required<T[]>();
  readonly columns = input.required<TableColumn[]>();
  readonly trackKey = input<string>('id');

  readonly cell = contentChild.required<TemplateRef<unknown>>('cell');

  private readonly sortKeyS = signal<string | null>(null);
  private readonly sortDirS = signal<SortDir>(null);
  readonly sortKey = this.sortKeyS.asReadonly();

  readonly rows = computed<T[]>(() => {
    const list = [...this.data()];
    const key = this.sortKeyS();
    const dir = this.sortDirS();
    if (!key || !dir) return list;

    const col = this.columns().find((c) => c.key === key);
    const numeric = col?.numeric ?? false;

    list.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      let cmp: number;
      if (numeric) {
        cmp = (Number(av) || 0) - (Number(bv) || 0);
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  });

  trackValue(row: T): unknown {
    return row[this.trackKey()];
  }

  align(col: TableColumn): string {
    return col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start';
  }

  sortIcon(key: string): string {
    if (this.sortKeyS() !== key) return 'unfold_more';
    return this.sortDirS() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleSort(key: string): void {
    if (this.sortKeyS() !== key) {
      this.sortKeyS.set(key);
      this.sortDirS.set('asc');
      return;
    }
    // asc → desc → kapalı döngüsü
    const dir = this.sortDirS();
    if (dir === 'asc') this.sortDirS.set('desc');
    else if (dir === 'desc') {
      this.sortDirS.set(null);
      this.sortKeyS.set(null);
    } else this.sortDirS.set('asc');
  }
}
