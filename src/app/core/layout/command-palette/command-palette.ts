import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Auth } from '../../auth/auth';
import { Language } from '../../services/language';
import { Theme } from '../../services/theme';
import { Icon, type IconName } from '../../../shared/ui/icon/icon';
import { NAV_ITEMS } from '../nav-items';
import { ShellState } from '../shell-state';

interface Command {
  id: string;
  group: 'pages' | 'actions';
  label: string;
  icon: IconName;
  keywords: string;
  run: () => void;
}

/** Minuscules sans accents : « Établissements » se trouve avec « etab ». */
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-command-palette',
  imports: [TranslocoPipe, Icon],
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-4 pt-[10vh] sm:pt-[14vh]"
        role="presentation"
        (mousedown)="close()"
      >
        <div
          class="pop-in w-full max-w-[580px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_64px_-12px_rgba(2,6,23,0.4)]"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'shell.search.title' | transloco"
          (mousedown)="$event.stopPropagation()"
        >
          <!-- Champ -->
          <div class="flex items-center gap-3 border-b border-line px-4">
            <app-icon name="search" class="text-muted" />
            <input
              #field
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="cmd-list"
              aria-expanded="true"
              autocomplete="off"
              spellcheck="false"
              class="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              [placeholder]="'shell.search.placeholder' | transloco"
              [value]="query()"
              [attr.aria-activedescendant]="activeId()"
              (input)="onInput($event)"
            />
            <kbd class="rounded-md border border-line bg-raised px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted">Esc</kbd>
          </div>

          <!-- Résultats -->
          <ul id="cmd-list" role="listbox" class="max-h-[min(55vh,380px)] overflow-y-auto p-2">
            @for (item of results(); track item.id; let i = $index) {
              @if (i === 0 || results()[i - 1].group !== item.group) {
                <li role="presentation" class="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                  {{ 'shell.search.groups.' + item.group | transloco }}
                </li>
              }
              <li
                role="option"
                [id]="'cmd-' + item.id"
                [attr.aria-selected]="i === active()"
                class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px]"
                [class]="i === active() ? 'bg-brand-soft text-brand-ink' : 'text-ink'"
                (mouseenter)="active.set(i)"
                (click)="run(item)"
              >
                <app-icon [name]="item.icon" [size]="18" />
                <span class="flex-1 truncate">{{ item.label }}</span>
                @if (i === active()) {
                  <app-icon name="cornerDownLeft" [size]="16" class="opacity-70" />
                }
              </li>
            } @empty {
              <li class="px-3 py-10 text-center text-[14px] text-muted">
                {{ 'shell.search.empty' | transloco: { query: query() } }}
              </li>
            }
          </ul>

          <!-- Aide clavier -->
          <div class="hidden items-center gap-4 border-t border-line bg-raised/50 px-4 py-2.5 text-[12px] text-muted sm:flex">
            <span class="flex items-center gap-1.5">
              <kbd class="rounded border border-line bg-surface px-1.5 font-sans">↑</kbd>
              <kbd class="rounded border border-line bg-surface px-1.5 font-sans">↓</kbd>
              {{ 'shell.search.hintNavigate' | transloco }}
            </span>
            <span class="flex items-center gap-1.5">
              <kbd class="rounded border border-line bg-surface px-1.5 font-sans">↵</kbd>
              {{ 'shell.search.hintOpen' | transloco }}
            </span>
            <span class="flex items-center gap-1.5">
              <kbd class="rounded border border-line bg-surface px-1.5 font-sans">Esc</kbd>
              {{ 'shell.search.hintClose' | transloco }}
            </span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPalette {
  private readonly state = inject(ShellState);
  private readonly auth = inject(Auth);
  private readonly theme = inject(Theme);
  private readonly lang = inject(Language);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly open = this.state.paletteOpen;
  protected readonly query = signal('');
  protected readonly active = signal(0);
  private previouslyFocused: HTMLElement | null = null;

  /** Pages autorisées + actions. Recalculé au changement de langue, de thème ou de droits. */
  private readonly commands = computed<Command[]>(() => {
    this.lang.current();
    const dark = this.theme.isDark();
    const t = (key: string, params?: Record<string, string>) => this.transloco.translate(key, params);

    const pages: Command[] = NAV_ITEMS.filter((i) => !i.soon && this.auth.hasPermission(i.permission))
      .map((i) => ({
        id: `page:${i.path}`,
        group: 'pages' as const,
        label: t(i.labelKey),
        icon: i.icon,
        keywords: `${t(i.labelKey)} ${i.path}`,
        run: () => void this.router.navigateByUrl(i.path),
      }));

    const actions: Command[] = [
      {
        id: 'action:theme',
        group: 'actions',
        label: dark ? t('shell.theme.toLight') : t('shell.theme.toDark'),
        icon: dark ? 'sun' : 'moon',
        keywords: 'theme thème dark light sombre clair mode',
        run: () => this.theme.toggle(),
      },
      {
        id: 'action:language',
        group: 'actions',  
        label: t('shell.language.switchTo', { language: this.lang.other().label }),
        icon: 'globe',
        keywords: 'langue language english français francais',
        run: () => this.lang.set(this.lang.other().code),
      },
      {
        id: 'action:signout',
        group: 'actions',
        label: t('shell.user.signOut'),
        icon: 'logOut',
        keywords: 'deconnexion déconnexion sign out logout quitter',
        run: () => this.auth.logout(),
      },
    ];

    return [...pages, ...actions];
  });

  protected readonly results = computed(() => {
    const terms = normalize(this.query()).split(/\s+/).filter(Boolean);
    const all = this.commands();
    if (terms.length === 0) return all;
    return all.filter((c) => {
      const haystack = normalize(`${c.label} ${c.keywords}`);
      return terms.every((term) => haystack.includes(term));
    });
  });

  protected readonly activeId = computed(() => {
    const item = this.results()[this.active()];
    return item ? `cmd-${item.id}` : null;
  });

  constructor() {
    // Ouverture : on mémorise l'élément focalisé, on vide le champ et on le focalise. Fermeture : on rend le focus.
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        this.query.set('');
        this.active.set(0);
        setTimeout(() => this.field()?.nativeElement.focus());
      } else if (this.previouslyFocused) {
        this.previouslyFocused.focus?.();
        this.previouslyFocused = null;
      }
    });

    // L'élément actif reste visible quand on navigue au clavier
    effect(() => {
      const id = this.activeId();
      if (id) queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
    });
  }

  protected close(): void {
    this.state.closePalette();
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected run(command: Command): void {
    this.close();
    command.run();
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Raccourci global : Ctrl+K (Windows, Linux) ou ⌘K (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.open()) this.close();
      else this.state.openPalette();
      return;
    }
    if (!this.open()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.active.set(0);
        break;
      case 'End':
        event.preventDefault();
        this.active.set(Math.max(this.results().length - 1, 0));
        break;
      case 'Enter': {
        event.preventDefault();
        const command = this.results()[this.active()];
        if (command) this.run(command);
        break;
      }
      case 'Tab':
        event.preventDefault(); 
        this.field()?.nativeElement.focus();
        break;
    }
  }

  private move(delta: number): void {
    const count = this.results().length;
    if (count === 0) return;
    this.active.update((i) => (i + delta + count) % count);
  }
}