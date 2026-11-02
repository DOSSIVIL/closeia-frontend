import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../auth/auth';
import { Theme } from '../../services/theme';

interface NavItem {
  label: string;
  labelEn: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './shell.html',
})
export class Shell {
  auth = inject(Auth);
  private router = inject(Router);
  readonly theme = inject(Theme);

  collapsed = signal(false);
  isMobileOpen = signal(false);
  searchQuery = signal('');
  isProfileMenuOpen = signal(false);
  profileMenuSource = signal<'sidebar' | 'header'>('sidebar');
  isNotificationsOpen = signal(false);
  currentLang = signal<'FR' | 'EN'>(this.readLanguage());

  readonly copy = computed(() => this.currentLang() === 'FR'
    ? {
        workspace: 'Espace de travail',
        welcome: 'Bienvenue sur Close IA',
        search: 'Rechercher une page…',
        searchLabel: 'Rechercher dans la navigation',
        profile: 'Mon profil',
        connected: 'Connecté',
        language: 'Langue',
        logout: 'Déconnexion',
        notifications: 'Notifications',
        noNotifications: 'Tout est à jour',
        noNotificationsHint: 'Vous n’avez aucune nouvelle notification.',
        noResults: 'Aucune page trouvée',
        themeLight: 'Activer le thème clair',
        themeDark: 'Activer le thème sombre',
      }
    : {
        workspace: 'Workspace',
        welcome: 'Welcome to Close IA',
        search: 'Search a page…',
        searchLabel: 'Search navigation',
        profile: 'My profile',
        connected: 'Online',
        language: 'Language',
        logout: 'Sign out',
        notifications: 'Notifications',
        noNotifications: 'You’re all caught up',
        noNotificationsHint: 'You have no new notifications.',
        noResults: 'No pages found',
        themeLight: 'Switch to light mode',
        themeDark: 'Switch to dark mode',
      });

  readonly filteredNav = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return this.nav.filter((item) => {
      const label = this.currentLang() === 'FR' ? item.label : item.labelEn;
      return label.toLocaleLowerCase().includes(query);
    });
  });

  nav: NavItem[] = [
    { label: 'Tableau de bord', labelEn: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Écoles', labelEn: 'Schools', path: '/schools', icon: 'school' },
    { label: 'Utilisateurs', labelEn: 'Users', path: '/users', icon: 'users' },
    { label: 'Rôles', labelEn: 'Roles', path: '/roles', icon: 'shield' },
    { label: 'Affectations', labelEn: 'Assignments', path: '/assignments', icon: 'link' },
    { label: 'Documents', labelEn: 'Documents', path: '/documents', icon: 'document' },
    { label: 'Conversations', labelEn: 'Conversations', path: '/conversations', icon: 'chat' },
    { label: 'Audit', labelEn: 'Audit log', path: '/audit', icon: 'clipboard' },
  ];

  constructor() {
    if (this.router.url === '/' || this.router.url === '') {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  openMobile(): void {
    this.isMobileOpen.set(true);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  toggleProfileMenu(source: 'sidebar' | 'header' = 'sidebar'): void {
    if (this.isProfileMenuOpen() && this.profileMenuSource() === source) {
      this.isProfileMenuOpen.set(false);
      return;
    }
    this.profileMenuSource.set(source);
    this.isProfileMenuOpen.set(true);
    this.isNotificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update((open) => !open);
    this.isProfileMenuOpen.set(false);
  }

  toggleDarkMode(): void {
    this.theme.toggle();
  }

  setLanguage(language: 'FR' | 'EN'): void {
    this.currentLang.set(language);
    this.searchQuery.set('');
    try {
      localStorage.setItem('spacehub.language', language);
    } catch {
      // La préférence reste active pour cette session si le stockage est indisponible.
    }
  }

  labelFor(item: NavItem): string {
    return this.currentLang() === 'FR' ? item.label : item.labelEn;
  }

  @HostListener('document:keydown.escape')
  closeMenus(): void {
    this.isProfileMenuOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.closeMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 768) {
      this.isMobileOpen.set(false);
    }
  }

  private readLanguage(): 'FR' | 'EN' {
    try {
      return localStorage.getItem('spacehub.language') === 'EN' ? 'EN' : 'FR';
    } catch {
      return 'FR';
    }
  }
}