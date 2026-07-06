import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BooksService } from '../../services/books.service';
import {
  KitapFormModel,
  OKUMA_DURUMLARI,
  OkumaDurumu,
  TURLER,
} from '../../models/book.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import {
  noWhitespaceValidator,
  numberRangeValidator,
} from '../../../../shared/validators/custom-validators';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-books-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    FormFieldComponent,
    StarRatingComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './books-form.component.html',
  styleUrl: './books-form.component.css',
})
export class BooksFormComponent implements CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly books = inject(BooksService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  readonly i18n = inject(I18nService);

  readonly turler = TURLER;
  readonly durumlar = OKUMA_DURUMLARI;

  private readonly duzenlenenId = signal<number | null>(null);
  readonly duzenlemeModu = computed(() => this.duzenlenenId() !== null);

  /** Puanı reaktif tutmak için signal (form control'ü signal değil). */
  readonly puan = signal<number>(0);

  private kaydedildi = false;

  readonly form = this.fb.group({
    ad: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      noWhitespaceValidator(),
    ]),
    yazar: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      noWhitespaceValidator(),
    ]),
    tur: this.fb.nonNullable.control(''),
    durum: this.fb.nonNullable.control<OkumaDurumu>('okunacak', [Validators.required]),
    sayfaSayisi: this.fb.control<number | null>(null, [numberRangeValidator(1, 20000)]),
    puan: this.fb.nonNullable.control<number>(0),
    not: this.fb.nonNullable.control(''),
  });

  readonly puanEtiketi = computed(() => {
    this.i18n.dil();
    return this.i18n.t('rating.' + this.puan());
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      const kitap = this.books.getir(id);
      if (kitap) {
        this.duzenlenenId.set(id);
        this.form.patchValue({
          ad: kitap.ad,
          yazar: kitap.yazar,
          tur: kitap.tur ?? '',
          durum: kitap.durum,
          sayfaSayisi: kitap.sayfaSayisi ?? null,
          puan: kitap.puan ?? 0,
          not: kitap.not ?? '',
        });
        this.puan.set(kitap.puan ?? 0);
      } else {
        // Geçersiz id → listeye dön
        this.router.navigate(['/kitaplar']);
      }
    }
  }

  // --- Durum & puan --------------------------------------------------------
  durumSec(d: OkumaDurumu): void {
    this.form.controls.durum.setValue(d);
    this.form.controls.durum.markAsDirty();
  }

  puanSec(p: number): void {
    this.form.controls.puan.setValue(p);
    this.form.controls.puan.markAsDirty();
    this.puan.set(p);
  }

  // --- Kaydet / iptal ------------------------------------------------------
  kaydet(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: KitapFormModel = {
      ad: v.ad.trim(),
      yazar: v.yazar.trim(),
      tur: v.tur || undefined,
      durum: v.durum,
      sayfaSayisi: v.sayfaSayisi ?? undefined,
      puan: v.puan || undefined,
      not: v.not.trim() || undefined,
    };

    if (this.duzenlemeModu()) {
      this.books.guncelle(this.duzenlenenId()!, payload);
      this.bildir(this.i18n.t('toast.updated', { title: payload.ad }));
    } else {
      this.books.ekle(payload);
      this.bildir(this.i18n.t('toast.added', { title: payload.ad }));
    }

    this.kaydedildi = true;
    this.router.navigate(['/kitaplar']);
  }

  iptal(): void {
    this.router.navigate(['/kitaplar']);
  }

  geri(): void {
    this.router.navigate(['/kitaplar']);
  }

  // --- canDeactivate guard -------------------------------------------------
  canDeactivate(): boolean | Observable<boolean> {
    if (this.kaydedildi || !this.form.dirty) return true;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('guard.title'),
        message: this.i18n.t('guard.text'),
        confirmText: this.i18n.t('guard.leave'),
        cancelText: this.i18n.t('guard.stay'),
        danger: true,
        icon: 'warning_amber',
      },
      panelClass: 'app-dialog',
      autoFocus: false,
      maxWidth: '96vw',
    });
    return ref.afterClosed().pipe(map((x) => !!x)) ?? of(true);
  }

  private bildir(mesaj: string): void {
    this.snack.open(mesaj, this.i18n.t('toast.dismiss'), {
      duration: 3200,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
