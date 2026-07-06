/** Desteklenen arayüz dilleri. */
export type Dil = 'tr' | 'en';

/** Tek bir çeviri sözlüğü: düz anahtar → metin. */
export type CeviriSozlugu = Record<string, string>;

/** Tüm diller için çeviri haritası. */
export type Ceviriler = Record<Dil, CeviriSozlugu>;

export const DESTEKLENEN_DILLER: { kod: Dil; etiket: string; bayrak: string }[] = [
  { kod: 'tr', etiket: 'Türkçe', bayrak: '🇹🇷' },
  { kod: 'en', etiket: 'English', bayrak: '🇬🇧' },
];
