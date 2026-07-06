import { Injectable } from '@angular/core';

/**
 * Uygulamadaki TEK localStorage erişim noktası.
 * Doküman şartı: component'ler doğrudan localStorage kullanamaz,
 * yalnızca bu servis üzerinden okuma/yazma yapılır.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private get available(): boolean {
    try {
      const test = '__ls_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /** Anahtardan tip güvenli okuma. Yoksa/bozuksa `fallback` döner. */
  read<T>(key: string, fallback: T): T {
    if (!this.available) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** Değeri JSON olarak yazar. */
  write<T>(key: string, value: T): void {
    if (!this.available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* kota dolu / erişilemez — sessizce geç */
    }
  }

  /** Anahtarı siler. */
  remove(key: string): void {
    if (!this.available) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* yoksay */
    }
  }
}
