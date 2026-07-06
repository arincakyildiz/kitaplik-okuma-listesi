import { Injectable, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type Tema = 'light' | 'dark';

const STORAGE_KEY = 'kitaplik.tema';

/**
 * Açık/koyu tema yönetimi (signal tabanlı).
 * Seçim localStorage'da (StorageService üzerinden) saklanır ve
 * <html> öğesine `dark` sınıfı + `color-scheme` uygulanır.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);

  readonly tema = signal<Tema>(this.baslangicTemasi());

  constructor() {
    effect(() => {
      const tema = this.tema();
      this.storage.write(STORAGE_KEY, tema);
      const el = document.documentElement;
      el.classList.toggle('dark', tema === 'dark');
      el.style.colorScheme = tema;
    });
  }

  toggle(): void {
    this.tema.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  ayarla(tema: Tema): void {
    this.tema.set(tema);
  }

  private baslangicTemasi(): Tema {
    const kayitli = this.storage.read<Tema | null>(STORAGE_KEY, null);
    if (kayitli === 'dark' || kayitli === 'light') return kayitli;
    // Kayıt yoksa işletim sistemi tercihini kullan.
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
