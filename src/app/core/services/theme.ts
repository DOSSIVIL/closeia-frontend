import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const KEY = 'spacehub.theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  private _mode = signal<ThemeMode>(this.initial());

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    effect(() => {
      const mode = this._mode();
      document.documentElement.classList.toggle('dark', mode === 'dark');
      try {
        localStorage.setItem(KEY, mode);
      } catch {
        /* stockage indisponible : on ignore */
      }
    });
  }

  toggle() {
    this._mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  set(mode: ThemeMode) {
    this._mode.set(mode);
  }

  /** Préférence enregistrée, sinon réglage du système (sombre par défaut). */
  private initial(): ThemeMode {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
