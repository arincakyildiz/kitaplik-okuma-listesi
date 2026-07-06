import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Bu arayüzü uygulayan bileşenler, rotadan ayrılmadan önce
 * kaydedilmemiş değişiklik olup olmadığını bildirebilir.
 */
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

/**
 * canDeactivate guard — form sayfasında kaydedilmemiş değişikliklerle
 * çıkışta kullanıcıyı uyarmak için kullanılır. Asıl onay mantığı
 * (dil destekli dialog) bileşenin canDeactivate() metodundadır.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component,
) => {
  return component?.canDeactivate ? component.canDeactivate() : true;
};
