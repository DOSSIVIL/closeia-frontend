import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../../../auth/auth';
import { Language, type LangCode } from '../../../services/language';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ShellState } from '../../shell-state';

@Component({
  selector: 'app-user-menu',
  imports: [TranslocoPipe, Avatar, Icon],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div class="relative">
      <button
        #trigger
        type="button"
        class="flex h-10 items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition-colors hover:bg-raised"
        [class]="open() ? 'bg-raised' : ''"
        (click)="toggle()"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'shell.user.menu' | transloco"
      >
        <app-avatar [name]="user()?.fullName ?? ''" [src]="user()?.avatarUrl" [size]="32" />
        <span class="hidden max-w-[140px] truncate text-[14px] font-semibold text-ink md:block">{{ user()?.fullName }}</span>
        <app-icon
          name="chevronDown"
          [size]="16"
          class="hidden text-muted transition-transform md:inline-flex"
          [class]="open() ? 'rotate-180' : ''"
        />
      </button>

      @if (open()) {
        <div
          class="pop-in absolute top-full right-0 z-50 mt-2 w-[min(92vw,310px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_16px_40px_-12px_rgba(2,6,23,0.28)]"
          role="menu"
        >
          <!-- Identité -->
          <div class="flex items-center gap-3 px-4 py-4">
            <app-avatar [name]="user()?.fullName ?? ''" [src]="user()?.avatarUrl" [size]="44" />
            <div class="min-w-0">
              <p class="truncate text-[14.5px] font-semibold text-ink">{{ user()?.fullName }}</p>
              <p class="truncate text-[12.5px] text-muted">{{ user()?.email }}</p>
              <span class="mt-1.5 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                {{ roleKey() | transloco }}
              </span>
            </div>
          </div>

          <!-- Langue -->
          <div class="border-t border-line p-2">
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-ink transition-colors hover:bg-raised"
              [attr.aria-expanded]="langOpen()"
              (click)="langOpen.set(!langOpen())"
            >
              <app-icon name="globe" class="text-muted" />
              <span class="flex-1">{{ 'shell.language.title' | transloco }}</span>
              <span class="rounded-md border border-line bg-raised px-2 py-0.5 text-[12px] font-semibold text-muted">
                {{ lang.currentOption().short }}
              </span>
              <app-icon name="chevronDown" [size]="16" class="text-muted transition-transform" [class]="langOpen() ? 'rotate-180' : ''" />
            </button>

            @if (langOpen()) {
              <div class="mt-1 space-y-0.5 rounded-xl bg-raised/60 p-1" role="group">
                @for (option of lang.options; track option.code) {
                  <button
                    type="button"
                    role="menuitemradio"
                    class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition-colors hover:bg-surface"
                    [class]="option.code === lang.current() ? 'font-semibold text-brand-ink' : 'text-ink'"
                    [attr.aria-checked]="option.code === lang.current()"
                    (click)="chooseLanguage(option.code)"
                  >
                    <span class="grid h-6 w-8 place-items-center rounded-md border border-line bg-surface text-[11px] font-bold text-muted">
                      {{ option.short }}
                    </span>
                    <span class="flex-1">{{ option.label }}</span>
                    @if (option.code === lang.current()) {
                      <app-icon name="check" [size]="16" />
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Déconnexion -->
          <div class="border-t border-line p-2">
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[14px] font-semibold text-coral transition-colors hover:border-coral/40 hover:bg-coral/10"
              (click)="signOut()"
            >
              <app-icon name="logOut" [size]="18" />
              {{ 'shell.user.signOut' | transloco }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UserMenu {
  protected readonly auth = inject(Auth);
  protected readonly lang = inject(Language);
  private readonly state = inject(ShellState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly user = this.auth.user;
  protected readonly open = computed(() => this.state.openMenu() === 'user');
  protected readonly langOpen = signal(false);
  protected readonly roleKey = computed(() => `roles.${this.user()?.roles[0] ?? 'GUEST'}`);

  protected toggle(): void {
    this.langOpen.set(false);
    this.state.toggleMenu('user');
  }

  protected close(): void {
    if (!this.open()) return;
    this.state.closeMenus();
    this.trigger()?.nativeElement.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.state.closeMenus();
  }

  protected chooseLanguage(code: LangCode): void {
    this.lang.set(code);
    this.langOpen.set(false);
    this.state.closeMenus();
  }

  protected signOut(): void {
    this.state.closeMenus();
    this.auth.logout();
  }
}