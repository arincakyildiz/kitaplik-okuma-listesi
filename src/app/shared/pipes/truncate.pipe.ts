import { Pipe, PipeTransform } from '@angular/core';

/**
 * Custom pipe (2/2) — metni belirli uzunlukta keser ve sonuna "…" ekler.
 * Kullanım: {{ kitap.not | truncate: 80 }}
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 100, suffix = '…'): string {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.length <= limit) return trimmed;
    return trimmed.slice(0, limit).trimEnd() + suffix;
  }
}
