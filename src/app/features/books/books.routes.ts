import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

/**
 * books özelliğinin rotaları. Tüm sayfalar lazy loadComponent ile yüklenir.
 * Form rotalarında canDeactivate guard, kaydedilmemiş değişiklik uyarısı verir.
 */
export const BOOKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/books-list/books-list.component').then((m) => m.BooksListComponent),
    title: 'Kitaplar',
  },
  {
    path: 'ekle',
    loadComponent: () =>
      import('./pages/books-form/books-form.component').then((m) => m.BooksFormComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'Kitap Ekle',
  },
  {
    path: ':id/duzenle',
    loadComponent: () =>
      import('./pages/books-form/books-form.component').then((m) => m.BooksFormComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'Kitap Düzenle',
  },
];
