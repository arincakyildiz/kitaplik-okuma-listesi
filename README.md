# 📚 Kitaplık ve Okuma Listesi

Angular 19 + localStorage tabanlı kişisel kütüphane uygulaması. Kullanıcı okuduğu, okuyacağı ve okumakta olduğu kitapları takip edebilir; kitap ekleyip düzenleyebilir, silebilir, puanlayabilir, türlerine/durumlarına göre filtreleyip arayabilir ve sıralayabilir.

Arayüz **Türkçe / İngilizce** dil desteğine sahiptir (sağ üstten anında değişir) ve tamamen responsive'dir.

---

## 🚀 Kurulum

> Bu proje **Node.js 22 (LTS)** ile geliştirilmiştir. Angular tek (LTS olmayan) Node sürümlerini desteklemez.

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
ng serve        # veya: npm start
```

Ardından tarayıcıda `http://localhost:4200` adresini aç. Uygulama otomatik olarak `/kitaplar` sayfasına yönlenir.

```bash
# Üretim derlemesi
ng build
```

---

## 🧭 Sayfalar ve Rotalar

| Rota | Açıklama |
| --- | --- |
| `/kitaplar` | Tüm kitapların listelendiği ekran (arama, filtre, sıralama, kart/tablo görünümü). |
| `/kitaplar/ekle` | Yeni kitap ekleme formu (reactive form). |
| `/kitaplar/:id/duzenle` | Mevcut kitabı düzenleme formu. |

Tüm feature rotaları **lazy loading** ile yüklenir (`loadChildren` + `loadComponent`).

---

## 🏛️ Mimari

Proje **feature-based** mimari ile kurgulanmıştır:

```
src/app/
├── core/                         # Uygulama geneli servis, guard, model
│   ├── services/
│   │   ├── storage.service.ts    # localStorage'a TEK erişim noktası
│   │   ├── i18n.service.ts       # signal tabanlı TR/EN çeviri servisi
│   │   └── translations.ts       # tr/en çeviri sözlüğü
│   ├── guards/
│   │   └── unsaved-changes.guard.ts   # canDeactivate guard
│   └── models/
│       └── language.model.ts
├── shared/                       # Yeniden kullanılabilir yapı taşları
│   ├── components/
│   │   ├── data-table/           # generic, sıralanabilir ortak tablo
│   │   ├── confirm-dialog/       # ortak "Emin misiniz?" modalı
│   │   ├── form-field/           # etiket + input + hata mesajı
│   │   ├── empty-state/          # boş durum
│   │   ├── loading-spinner/      # yükleniyor göstergesi
│   │   ├── star-rating/          # 1–5 yıldız puanlama
│   │   ├── status-badge/         # okuma durumu rozeti
│   │   └── language-switcher/    # TR/EN dil değiştirici
│   ├── pipes/
│   │   ├── translate.pipe.ts     # i18n çeviri pipe'ı
│   │   └── truncate.pipe.ts      # metin kısaltma pipe'ı
│   ├── directives/
│   │   └── status-color.directive.ts  # durum rengini uygulayan directive
│   └── validators/
│       └── custom-validators.ts  # noWhitespace + numberRange
└── features/
    └── books/
        ├── pages/
        │   ├── books-list/       # liste sayfası (computed signal filtre/sıralama)
        │   └── books-form/       # ekleme/düzenleme formu
        ├── components/
        │   └── book-card/        # kitap kartı
        ├── services/
        │   └── books.service.ts  # RxJS BehaviorSubject + CRUD
        ├── models/
        │   └── book.model.ts     # Kitap arayüzü ve tipleri
        └── books.routes.ts       # lazy child rotalar
```

- **core:** Tüm uygulamada paylaşılan `StorageService`, `I18nService` ve guard'lar.
- **shared:** DataTable, ConfirmDialog, FormField gibi yeniden kullanılabilir bileşenler, pipe, directive ve validator'lar.
- **features/books:** Bu özelliğe ait liste/form sayfaları, servis ve model.

---

## 🧩 Veri Modeli (Kitap)

```ts
type OkumaDurumu = 'okunacak' | 'okunuyor' | 'okundu';

interface Kitap {
  id: number;
  ad: string;              // zorunlu
  yazar: string;           // zorunlu
  tur?: string;
  durum: OkumaDurumu;      // zorunlu
  sayfaSayisi?: number;
  puan?: number;           // 1–5
  not?: string;
  eklenmeTarihi: string;   // ISO tarih
}
```

Veriler tarayıcının `localStorage` alanında saklanır ve sayfa yenilendiğinde korunur.

---

## ⚙️ Teknik Şartların Karşılanması

| Şart | Nerede |
| --- | --- |
| Angular 17+ | Angular **19** |
| Standalone component (NgModule yok) | Tüm bileşenler standalone |
| Reactive Forms | `books-form.component.ts` |
| Signals | Tüm bileşenlerde durum yönetimi (`signal`, `computed`) |
| RxJS (BehaviorSubject) | `books.service.ts` |
| Lazy loading | `app.routes.ts` (`loadChildren`), `books.routes.ts` (`loadComponent`) |
| localStorage yalnızca serviste | `core/services/storage.service.ts` |
| Feature-based mimari | `core` / `shared` / `features` |
| Reusable bileşenler | `data-table`, `confirm-dialog`, `form-field` |
| Confirm dialog (geri alınamaz işlem) | Silme → `ConfirmDialogComponent` |
| Computed signal ile filtre/sıralama | `books-list.component.ts` → `gorunenKitaplar` |

### Özel yapı taşları (nerede kullanıldı)

- **Custom Pipe (2):**
  - `translate` — i18n çevirisi (`shared/pipes/translate.pipe.ts`). Örn. `{{ 'shelf.title' | translate }}`. Neredeyse tüm şablonlarda kullanılır.
  - `truncate` — metin kısaltma (`shared/pipes/truncate.pipe.ts`).
- **Custom Directive:** `appStatusColor` — okuma durumu rozetini renklendirir (`shared/directives/status-color.directive.ts`). `status-badge` bileşeninde kullanılır.
- **Custom Validator (2):** `noWhitespaceValidator` ve `numberRangeValidator` (`shared/validators/custom-validators.ts`). Form'da ad/yazar ve sayfa sayısı alanlarında kullanılır.
- **Route Guard:** `unsavedChangesGuard` (canDeactivate) — form sayfasında kaydedilmemiş değişiklikle çıkışta onay ister (`core/guards/unsaved-changes.guard.ts`, `books.routes.ts`).

### Asgari sayılar

- **Component:** 11 (books-list, books-form, book-card, data-table, confirm-dialog, form-field, empty-state, loading-spinner, star-rating, status-badge, language-switcher) — asgari 6 ✓
- **Service:** 3 (StorageService, I18nService, BooksService) ✓
- **Model / interface:** 4+ (Kitap, OkumaDurumu, TableColumn, ConfirmDialogData, Dil …) ✓
- **Route guard:** 1 (unsavedChangesGuard) ✓
- **Custom validator / pipe / directive:** 2 / 2 / 1 ✓

---

## 🌍 Dil Desteği (i18n)

- Bağımlılık eklemeden, **signal tabanlı** hafif bir çeviri servisiyle (`I18nService`) sağlanır.
- Tüm metinler `core/services/translations.ts` içinde `tr` ve `en` altında tutulur.
- Navbar'daki dil değiştiriciden anında geçiş yapılır; seçim `localStorage`'da saklanır.

---

## ✨ Öne Çıkan Özellikler

- Tam CRUD akışı (ekle / listele / düzenle / sil)
- Kart **ve** tablo görünümü arasında geçiş
- Ad / yazar / türe göre arama, duruma göre filtre, çoklu sıralama
- 1–5 yıldız puanlama
- Boş durum, "sonuç yok" durumu ve yükleniyor göstergesi
- Responsive, modern ve minimal arayüz (Angular Material)
