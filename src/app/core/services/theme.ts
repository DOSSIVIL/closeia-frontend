import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const KEY = 'spacehub.theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly _mode = signal<ThemeMode>(this.initial());

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(KEY, this._mode());
      } catch {
        
      }
    });
  }

  toggle(): void {
    this._mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  
  private initial(): ThemeMode {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}