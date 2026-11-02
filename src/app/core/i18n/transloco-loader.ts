import { Injectable } from '@angular/core';
import type { TranslocoLoader, Translation } from '@jsverse/transloco';
import { of } from 'rxjs';

const translations: Record<string, Translation> = {
  fr: {
    nav: {
      overview: 'Vue d’ensemble',
      schools: 'Établissements',
      users: 'Utilisateurs',
      roles: 'Rôles',
      assignments: 'Affectations',
      spaces: 'Espaces',
      documents: 'Documents',
      conversations: 'Conversations',
      processing: 'Traitement',
      audit: 'Journal d’audit',
      settings: 'Paramètres',
    },
    roles: {
      GUEST: 'Invité',
      ADMIN: 'Administrateur',
      SUPER_ADMIN: 'Super administrateur',
      SCHOOL_ADMIN: 'Administrateur d’établissement',
    },
    shell: {
      skip: 'Aller au contenu principal',
      menu: { toggle: 'Ouvrir ou réduire le menu', close: 'Fermer le menu' },
      nav: { label: 'Navigation principale', soon: 'Bientôt disponible' },
      search: {
        open: 'Ouvrir la recherche',
        title: 'Recherche et commandes',
        placeholder: 'Rechercher une page ou une action…',
        empty: 'Aucun résultat pour « {{query}} »',
        hintNavigate: 'naviguer',
        hintOpen: 'ouvrir',
        hintClose: 'fermer',
        groups: { pages: 'PAGES', actions: 'ACTIONS' },
      },
      theme: { toLight: 'Passer au thème clair', toDark: 'Passer au thème sombre' },
      language: { title: 'Langue', switchTo: 'Passer en {{language}}' },
      user: { menu: 'Menu utilisateur', signOut: 'Se déconnecter' },
      notifications: {
        title: 'Notifications',
        markAll: 'Tout marquer comme lu',
        clear: 'Effacer les notifications',
        empty: 'Aucune notification',
        emptyHint: 'Les nouvelles notifications apparaîtront ici.',
        demo: {
          documentsTitle: 'Documents à vérifier',
          documentsMessage: 'Certains documents nécessitent votre attention.',
          securityTitle: 'Connexion sécurisée',
          securityMessage: 'Votre session est active et sécurisée.',
          welcomeTitle: 'Bienvenue',
          welcomeMessage: 'Bienvenue sur le portail CloseIA.',
        },
      },
    },
  },
  en: {
    nav: {
      overview: 'Overview',
      schools: 'Schools',
      users: 'Users',
      roles: 'Roles',
      assignments: 'Assignments',
      spaces: 'Spaces',
      documents: 'Documents',
      conversations: 'Conversations',
      processing: 'Processing',
      audit: 'Audit log',
      settings: 'Settings',
    },
    roles: {
      GUEST: 'Guest',
      ADMIN: 'Administrator',
      SUPER_ADMIN: 'Super administrator',
      SCHOOL_ADMIN: 'School administrator',
    },
    shell: {
      skip: 'Skip to main content',
      menu: { toggle: 'Open or collapse menu', close: 'Close menu' },
      nav: { label: 'Main navigation', soon: 'Coming soon' },
      search: {
        open: 'Open search',
        title: 'Search and commands',
        placeholder: 'Search for a page or action…',
        empty: 'No results for “{{query}}”',
        hintNavigate: 'navigate',
        hintOpen: 'open',
        hintClose: 'close',
        groups: { pages: 'PAGES', actions: 'ACTIONS' },
      },
      theme: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme' },
      language: { title: 'Language', switchTo: 'Switch to {{language}}' },
      user: { menu: 'User menu', signOut: 'Sign out' },
      notifications: {
        title: 'Notifications',
        markAll: 'Mark all as read',
        clear: 'Clear notifications',
        empty: 'No notifications',
        emptyHint: 'New notifications will appear here.',
        demo: {
          documentsTitle: 'Documents to review',
          documentsMessage: 'Some documents need your attention.',
          securityTitle: 'Secure sign-in',
          securityMessage: 'Your session is active and secure.',
          welcomeTitle: 'Welcome',
          welcomeMessage: 'Welcome to the CloseIA portal.',
        },
      },
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AppTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return of(translations[lang] ?? translations['fr']);
  }
}
