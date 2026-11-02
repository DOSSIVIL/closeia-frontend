import { Component, ElementRef, afterNextRender, computed, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { WaveBackground } from '../../../../shared/ui/wave-background/wave-background';
import { GOOGLE_ERROR_ICONS, GOOGLE_ERRORS, normalizeGoogleErrorCode } from '../../google-error-messages';

const TONES = {
  warning: 'bg-[#FFF6E5] text-[#B7791F] ring-[#FBEBCB]',
  danger: 'bg-[#FDF3F3] text-[#B42318] ring-[#F9DCDC]',
  info: 'bg-[#F1F8FD] text-[#2C5F85] ring-[#DCEBF6]',
} as const;

@Component({
  selector: 'app-google-error',
  imports: [RouterLink, WaveBackground],
  templateUrl: './google-error.html',
})
export class GoogleError {
  /** Lu dans l'URL : /auth/google-error?code=... (grâce à withComponentInputBinding). */
  readonly code = input<string>();

  readonly errorCode = computed(() => normalizeGoogleErrorCode(this.code()));
  readonly info = computed(() => GOOGLE_ERRORS[this.errorCode()]);
  readonly toneClasses = computed(() => TONES[this.info().tone]);
  readonly iconPaths = computed(() => GOOGLE_ERROR_ICONS[this.info().icon]);

  /** Compte Google utilisé, transmis par l'état de navigation (jamais dans l'URL). */
  readonly email = signal<string | null>(this.readEmail());

  readonly mailto = computed(() => {
    const email = this.email();
    const body = [
      'Bonjour,',
      '',
      'Je n’arrive pas à me connecter avec Google.',
      `Référence de l’erreur : ${this.errorCode()}`,
      email ? `Compte utilisé : ${email}` : '',
    ].join('\n');
    return `mailto:${environment.supportEmail}?subject=${encodeURIComponent('Connexion Google impossible')}&body=${encodeURIComponent(body)}`;
  });

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => {
      if (!this.email()) this.email.set(this.readEmail());
      this.heading()?.nativeElement.focus(); // les lecteurs d'écran annoncent le titre
    });
  }

  private readEmail(): string | null {
    const value = (history.state as { email?: unknown } | null)?.email;
    return typeof value === 'string' && value.length <= 254 ? value : null;
  }
}