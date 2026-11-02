import { Injectable, signal } from '@angular/core';

const KEY = 'spacehub.sidebar';

export type MenuName = 'notifications' | 'user';

@Injectable({ providedIn: 'root' })
export class ShellState {
  private readonly desktopQuery = window.matchMedia('(min-width: 1024px)');

  readonly isDesktop = signal(this.desktopQuery.matches);
 
  readonly collapsed = signal(this.readCollapsed());
  
  readonly drawerOpen = signal(false);
  readonly paletteOpen = signal(false);
  
  readonly openMenu = signal<MenuName | null>(null);

  constructor() {
    this.desktopQuery.addEventListener('change', (e) => {
      this.isDesktop.set(e.matches);
      if (e.matches) this.drawerOpen.set(false);
    });
  }

  toggleSidebar(): void {
    if (this.isDesktop()) {
      this.collapsed.update((v) => !v);
      try {
        localStorage.setItem(KEY, this.collapsed() ? '1' : '0');
      } catch {
        
      }
    } else {
      this.drawerOpen.update((v) => !v);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  openPalette(): void {
    this.openMenu.set(null);
    this.paletteOpen.set(true);
  }

  closePalette(): void {
    this.paletteOpen.set(false);
  }

  toggleMenu(name: MenuName): void {
    this.openMenu.update((current) => (current === name ? null : name));
  }

  closeMenus(): void {
    this.openMenu.set(null);
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  }
}