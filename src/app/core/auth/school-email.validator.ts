import { AbstractControl, ValidationErrors } from '@angular/forms';

const LOCAL_PART = /^[a-z]+(?:-[a-z]+)*\.[a-z]+(?:-[a-z]+)*[0-9]{0,2}$/;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/** Même règle que le backend (prenom.nom@domaine). Le vrai contrôle reste côté serveur. */
export function schoolEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim().toLowerCase();
  if (!value) return null; // « required » s'en charge
  const parts = value.split('@');
  return parts.length === 2 && LOCAL_PART.test(parts[0]) && DOMAIN.test(parts[1])
    ? null
    : { schoolEmail: true };
}