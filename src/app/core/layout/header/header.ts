import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Theme } from '../../services/theme';
import { Icon } from '../../../shared/ui/icon/icon';
import { ShellState } from '../shell-state';
import { NotificationMenu } from './notification-menu/notification-menu';
import { UserMenu } from './user-menu/user-menu';

@Component({
  selector: 'app-header',
  imports: [TranslocoPipe, Icon, NotificationMenu, UserMenu],
  template: `
    <header
      class="fixed top-0 right-0 left-0 z-30 flex h-[72px] items-center gap-3 border-b border-line bg-surface px-4 transition-[left] duration-200 sm:px-6"
      [class]="offset()"
    >
      <!-- Menu (petit écran) -->
      <button
        type="button"
        class="icon-btn shrink-0 lg:hidden"
        (click)="state.toggleSidebar()"
        aria-controls="sidebar"
        [attr.aria-expanded]="state.drawerOpen()"
        [attr.aria-label]="'shell.menu.toggle' | transloco"
      >
        <app-icon name="menu" />
      </button>

      <!-- Recherche : ouvre la palette de commandes -->
      <button
        type="button"
        class="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-line bg-raised px-4 text-left text-[14px] text-muted transition-colors hover:border-brand sm:max-w-[560px]"
        (click)="state.openPalette()"
        aria-haspopup="dialog"
        [attr.aria-label]="'shell.search.open' | transloco"
      >
        <app-icon name="search" [size]="18" />
        <span class="truncate">{{ 'shell.search.placeholder' | transloco }}</span>
        <kbd class="ml-auto hidden shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted sm:inline-block">
          {{ shortcut }}
        </kbd>
      </button>

      <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <!-- Thème : supprime ce bouton si tu ne veux pas du mode sombre -->
        <button
          type="button"
          class="icon-btn"
          (click)="theme.toggle()"
          [attr.aria-label]="(theme.isDark() ? 'shell.theme.toLight' : 'shell.theme.toDark') | transloco"
          [attr.title]="(theme.isDark() ? 'shell.theme.toLight' : 'shell.theme.toDark') | transloco"
        >
          <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
        </button>

        <app-notification-menu />
        <app-user-menu />
      </div>
    </header>
  `,
})
export class Header {
  protected readonly state = inject(ShellState);
  protected readonly theme = inject(Theme);

  protected readonly shortcut = /Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';

  
  protected readonly offset = computed(() => (this.state.collapsed() ? 'lg:left-[84px]' : 'lg:left-[264px]'));
}