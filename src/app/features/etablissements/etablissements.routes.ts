import { Routes } from '@angular/router';

export const ETABLISSEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/etablissements-list/etablissements-list').then((m) => m.EtablissementsList),
  },
];  