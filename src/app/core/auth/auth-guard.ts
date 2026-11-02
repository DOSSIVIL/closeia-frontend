import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const authGuard: CanActivateFn = () =>
  inject(Auth).isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);

/** Un utilisateur déjà connecté ne revoit pas /login. */
export const guestGuard: CanActivateFn = () =>
  inject(Auth).isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;

export const permissionGuard = (permission: string): CanActivateFn => () =>
  inject(Auth).hasPermission(permission) ? true : inject(Router).createUrlTree(['/dashboard']);