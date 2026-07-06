/** Bir kitabın okuma durumu. */
export type OkumaDurumu = 'okunacak' | 'okunuyor' | 'okundu';

/** Uygulamadaki bir kitap kaydı. localStorage'da bu şekilde saklanır. */
export interface Kitap {
  id: number;
  ad: string;
  yazar: string;
  tur?: string;
  durum: OkumaDurumu;
  sayfaSayisi?: number;
  puan?: number; // 1–5
  not?: string;
  eklenmeTarihi: string; // ISO tarih
}

/** Form'dan gelen, sistem alanları (id, eklenmeTarihi) olmayan veri. */
export type KitapFormModel = Omit<Kitap, 'id' | 'eklenmeTarihi'>;

/** Liste ekranındaki sıralama seçenekleri. */
export type SiralamaAnahtari =
  | 'yeni'
  | 'ad-artan'
  | 'ad-azalan'
  | 'yazar-artan'
  | 'puan-azalan'
  | 'sayfa-azalan';

/** Durum filtresi ('hepsi' = filtre yok). */
export type DurumFiltresi = OkumaDurumu | 'hepsi';

/** i18n anahtarları ile eşleşen okuma durumu meta verisi. */
export const OKUMA_DURUMLARI: OkumaDurumu[] = ['okunacak', 'okunuyor', 'okundu'];

/** Uygulamada kullanılan kitap türleri. */
export const TURLER: string[] = [
  'Roman',
  'Bilim Kurgu',
  'Fantastik',
  'Polisiye',
  'Gerilim',
  'Tarih',
  'Biyografi',
  'Kişisel Gelişim',
  'İş / Ekonomi',
  'Bilim',
  'Felsefe',
  'Şiir',
  'Çocuk',
  'Diğer',
];
