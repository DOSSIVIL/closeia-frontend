import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../auth';
import { GoogleOauth } from '../../google-oauth';
import { extractErrorEmail, resolveGoogleErrorCode } from '../../google-error-messages';
import { LOGOUT_MESSAGES, isLogoutReason } from '../../logout-reason';
import { schoolEmailValidator } from '../../school-email.validator';
import { environment } from '../../../../../environments/environment';

type ApiError = { status?: number; error?: { message?: string | string[] } };

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private googleOauth = inject(GoogleOauth);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly supportEmail = environment.supportEmail;

  
  readonly reason = input<string>();
  readonly logoutMessage = computed(() => {
    const r = this.reason();
    return isLogoutReason(r) ? LOGOUT_MESSAGES[r] : null;
  });

  loading = signal(false);
  googleLoading = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, schoolEmailValidator]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  constructor() {
    this.googleOauth.preload();
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.invalid && (c.touched || c.dirty);
  }

  onLogin() {
    if (this.loading() || this.googleLoading()) return;
    this.resetMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, rememberMe } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.loginWithPassword(email.trim().toLowerCase(), password, rememberMe).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e: ApiError) => this.fail(e),
    });
  }

  async onGoogleLogin() {
    if (this.loading() || this.googleLoading()) return;
    this.resetMessages();
    this.googleLoading.set(true);

    let code: string;
    try {
      code = await this.googleOauth.requestCode();
    } catch (err) {
      this.googleLoading.set(false);
      if ((err as Error).message === 'popup_closed') return; // fermeture volontaire : pas d'erreur
      this.showGoogleError(err);
      return;
    }

    this.auth.loginWithGoogleCode(code, this.form.controls.rememberMe.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e: unknown) => {
        this.googleLoading.set(false);
        this.showGoogleError(e);
      },
    });
  }

  onForgotPassword() {
    this.resetMessages();
    this.info.set(
      `La réinitialisation du mot de passe est effectuée par un administrateur. Écrivez à ${this.supportEmail}.`,
    );
  }

  onContact() {
    const subject = encodeURIComponent('Demande d’accès au portail d’administration');
    window.location.href = `mailto:${this.supportEmail}?subject=${subject}`;
  }

  /** Page d'erreur dédiée : le code est dans l'URL, le compte utilisé dans l'état de navigation. */
  private showGoogleError(err: unknown) {
    const code = resolveGoogleErrorCode(err);
    const email = extractErrorEmail(err);
    void this.router.navigate(['/auth/google-error'], {
      queryParams: { code },
      state: email ? { email } : undefined,
    });
  }

  private resetMessages() {
    this.error.set(null);
    this.info.set(null);
  }

  private fail(e: ApiError) {
    this.loading.set(false);
    this.googleLoading.set(false);
    const raw = e.error?.message;
    const serverMessage = Array.isArray(raw) ? raw[0] : raw;
    this.error.set(
      e.status === 401 ? serverMessage ?? 'Identifiants invalides.'
      : (e.status === 403 || e.status === 429) && serverMessage ? serverMessage
      : e.status === 0 ? 'Serveur injoignable. Vérifiez votre connexion.'
      : 'Erreur de connexion. Réessayez plus tard.',
    );
  }
}