import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./core/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/google-error',
    loadComponent: () =>
      import('./core/auth/pages/google-error/google-error').then((m) => m.GoogleError),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'etablissements',
        loadChildren: () =>
          import('./features/etablissements/etablissements.routes').then((m) => m.ETABLISSEMENTS_ROUTES),
      },
      { path: 'schools', pathMatch: 'full', redirectTo: 'etablissements' },
      {
        path: 'schools/new',
        redirectTo: 'etablissements',
      },
      {
        path: 'schools/:id/edit',
        redirectTo: 'etablissements',
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/pages/user-list/user-list').then((m) => m.UserList),
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/pages/role-list/role-list').then((m) => m.RoleList),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/assignments/pages/assignment-list/assignment-list').then((m) => m.AssignmentList),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/pages/document-list/document-list').then((m) => m.DocumentList),
      },
      {
        path: 'documents/upload',
        loadComponent: () =>
          import('./features/documents/pages/document-upload/document-upload').then((m) => m.DocumentUpload),
      },
      {
        path: 'conversations',
        loadComponent: () =>
          import('./features/conversations/pages/conversation-list/conversation-list').then(
            (m) => m.ConversationList,
          ),
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/pages/audit-log/audit-log').then((m) => m.AuditLog),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];