import { computed, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type LangCode = 'fr' | 'en';

interface LanguageOption {
  code: LangCode;
  label: string;
  short: string;
}

const LANGUAGE_KEY = 'spacehub.language';

@Injectable({ providedIn: 'root' })
export class Language {
  readonly options: readonly LanguageOption[] = [
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'en', label: 'English', short: 'EN' },
  ];

  private readonly _current = signal<LangCode>(this.readSavedLanguage());
  readonly current = this._current.asReadonly();
  readonly currentOption = computed(() => this.options.find((option) => option.code === this.current())!);
  readonly other = computed(() => this.options.find((option) => option.code !== this.current())!);

  constructor(private readonly transloco: TranslocoService) {
    this.transloco.setActiveLang(this.current());
  }

  set(code: LangCode): void {
    this._current.set(code);
    this.transloco.setActiveLang(code);
    try {
      localStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      // The selected language remains active for the current session.
    }
  }

  private readSavedLanguage(): LangCode {
    try {
      return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  }
}
