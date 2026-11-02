import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../../auth/auth';
import { Icon } from '../../../shared/ui/icon/icon';
import { NAV_ITEMS } from '../nav-items';
import { ShellState } from '../shell-state';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, Icon],
  template: `
    @if (state.drawerOpen()) {
      <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="state.closeDrawer()" aria-hidden="true"></div>
    }

    <aside
      id="sidebar"
      class="fixed inset-y-0 left-0 z-50 flex flex-col bg-nav transition-[transform,width] duration-200 ease-out lg:translate-x-0"
      [class]="asideClass()"
      [attr.aria-label]="'shell.nav.label' | transloco"
      [attr.inert]="inert() ? '' : null"
    >

      <!-- Marque et contrôle de réduction -->
      <div class="flex h-[88px] shrink-0 items-center justify-between gap-2 px-3">
        <a routerLink="/dashboard" class="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="CloseIA">
          <img
            src="logo.png"
            alt=""
            width="40"
            height="40"
            class="block h-10 w-10 shrink-0 object-contain"
            [class]="state.collapsed() ? 'lg:h-8 lg:w-8' : ''"
          />
          <span class="truncate text-lg font-bold tracking-tight text-white" [class]="state.collapsed() ? 'lg:hidden' : ''">
            CloseIA
          </span>
        </a>
        <button
          type="button"
          class="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/25 bg-white/10 text-white shadow-sm transition-colors hover:bg-white/20 lg:grid"
          (click)="state.toggleSidebar()"
          [attr.aria-label]="'shell.menu.toggle' | transloco"
          [attr.aria-expanded]="!state.collapsed()"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </button>
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-nav-ink transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          (click)="state.closeDrawer()"
          [attr.aria-label]="'shell.menu.close' | transloco"
        >
          <app-icon name="x" />
        </button>
      </div>

      <div role="separator" aria-orientation="horizontal" class="mx-4 h-0.5 shrink-0 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.18)]"></div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-4 pt-2 pb-[130px]">
        <ul class="space-y-1.5">
          @for (item of items(); track item.path) {
            @if (item.separatorBefore) {
              <li role="separator" class="mx-2 my-3 h-px bg-white/10"></li>
            }
            <li>
              @if (item.soon) {
                <span
                  class="nav-link"
                  [class.nav-link--compact]="state.collapsed()"
                  aria-disabled="true"
                  [attr.title]="'shell.nav.soon' | transloco"
                >
                  <app-icon [name]="item.icon" />
                  <span class="nav-label truncate" [class.nav-label--hidden]="state.collapsed()">{{ item.labelKey | transloco }}</span>
                  <span
                    class="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-nav-muted uppercase"
                    [class]="state.collapsed() ? 'lg:hidden' : ''"
                  >
                    {{ 'shell.nav.soon' | transloco }}
                  </span>
                </span>
              } @else {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="is-active"
                  ariaCurrentWhenActive="page"
                  class="nav-link"
                  [class.nav-link--compact]="state.collapsed()"
                  [attr.title]="state.collapsed() ? (item.labelKey | transloco) : null"
                >
                  <app-icon [name]="item.icon" />
                  <span class="nav-label truncate" [class.nav-label--hidden]="state.collapsed()">{{ item.labelKey | transloco }}</span>
                </a>
              }
            </li>
          }
        </ul>
      </nav>

      <!-- Vagues décoratives : trois couches de couleurs unies -->
      <svg
        class="pointer-events-none absolute inset-x-0 bottom-0 h-[110px] w-full"
        viewBox="0 0 264 110"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 58C38 34 84 34 124 54s84 36 140 4V110H0Z" fill="#1E4FD8" fill-opacity="0.55" />
        <path d="M0 76C46 54 92 58 138 76s78 22 126-4V110H0Z" fill="#2F6BF5" fill-opacity="0.7" />
        <path d="M0 92C50 80 98 84 142 94s80 12 122-6V110H0Z" fill="#5B6CFF" fill-opacity="0.85" />
      </svg>
    </aside>
  `,
})
export class Sidebar {
  protected readonly state = inject(ShellState);
  private readonly auth = inject(Auth);

  /** Pages disponibles et autorisées pour l'utilisateur connecté. */
  protected readonly items = computed(() => NAV_ITEMS.filter((i) => !i.soon && this.auth.hasPermission(i.permission)));

  protected readonly asideClass = computed(() => {
    const width = this.state.collapsed() ? 'w-[264px] lg:w-[84px]' : 'w-[264px]';
    const slide = this.state.drawerOpen() ? 'translate-x-0' : '-translate-x-full';
    return `${width} ${slide}`;
  });

  /** Tiroir fermé sur petit écran : ses liens ne doivent plus être atteignables au clavier. */
  protected readonly inert = computed(() => !this.state.isDesktop() && !this.state.drawerOpen());
}