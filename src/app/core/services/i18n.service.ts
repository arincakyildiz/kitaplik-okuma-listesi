import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Dil } from '../models/language.model';
import { StorageService } from './storage.service';
import { CEVIRILER } from './translations';

const STORAGE_KEY = 'kitaplik.dil';

/**
 * Basit, signal tabanlı çeviri servisi (bağımlılık yok).
 * `dil` bir signal olduğundan, şablonlarda `t(...)` çağrısı dile reaktiftir:
 * dil değişince ilgili ifadeler otomatik yeniden hesaplanır.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly storage = inject(StorageService);

  /** Aktif dil (okunabilir). */
  readonly dil = signal<Dil>(this.baslangicDili());

  /** Şablonlarda kolaylık için aktif sözlük. */
  private readonly sozluk = computed(() => CEVIRILER[this.dil()]);

  constructor() {
    // Dil değişince kaydet ve <html lang> güncelle.
    effect(() => {
      const dil = this.dil();
      this.storage.write(STORAGE_KEY, dil);
      document.documentElement.lang = dil;
    });
  }

  /**
   * Anahtara karşılık gelen metni döndürür.
   * `{isim}` yer tutucuları `params` ile doldurulur.
   */
  t(key: string, params?: Record<string, string | number>): string {
    let text = this.sozluk()[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  /** Dili değiştirir. */
  degistir(dil: Dil): void {
    this.dil.set(dil);
  }

  /** TR ↔ EN geçişi. */
  toggle(): void {
    this.dil.update((d) => (d === 'tr' ? 'en' : 'tr'));
  }

  private baslangicDili(): Dil {
    const kayitli = this.storage.read<Dil | null>(STORAGE_KEY, null);
    if (kayitli === 'tr' || kayitli === 'en') return kayitli;
    // Tarayıcı diline göre varsayılan, aksi halde Türkçe.
    const tarayici = (navigator.language || 'tr').toLowerCase();
    return tarayici.startsWith('en') ? 'en' : 'tr';
  }
}
