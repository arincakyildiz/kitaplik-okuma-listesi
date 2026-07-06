import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator (1) — alanın yalnızca boşluk karakterlerinden
 * oluşmasını engeller. Boş bırakma kontrolü `required`'a bırakılır.
 * Hata: { whitespace: true }
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') return null; // required işini yapsın
    return typeof value === 'string' && value.trim().length === 0
      ? { whitespace: true }
      : null;
  };
}

/**
 * Custom validator (2) — sayısal bir alanın belirtilen aralıkta
 * (dahil) olmasını doğrular. Boş değerler geçerli sayılır.
 * Hata: { min: {...} } veya { max: {...} }
 */
export function numberRangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return { number: true };
    if (n < min) return { min: { min, actual: n } };
    if (n > max) return { max: { max, actual: n } };
    return null;
  };
}
