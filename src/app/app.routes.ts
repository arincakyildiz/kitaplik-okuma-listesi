import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'kitaplar', pathMatch: 'full' },
  {
    path: 'kitaplar',
    loadChildren: () =>
      import('./features/books/books.routes').then((m) => m.BOOKS_ROUTES),
  },
  { path: '**', redirectTo: 'kitaplar' },
];
