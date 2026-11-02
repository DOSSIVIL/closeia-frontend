import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface CodeResponse {
  code?: string;
  error?: string;
}

// API globale injectée par https://accounts.google.com/gsi/client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleOauth {
  private script?: Promise<void>;

  /** À appeler à l'ouverture de la page : le script est prêt avant le clic. */
  preload(): void {
    this.load().catch(() => undefined);
  }

  /**
   * Ouvre la fenêtre Google et renvoie un code d'autorisation, à échanger côté serveur.
   * Rejette avec « popup_closed » si l'utilisateur ferme la fenêtre.
   */
  async requestCode(): Promise<string> {
    await this.load();
    return new Promise<string>((resolve, reject) => {
      const client = google.accounts.oauth2.initCodeClient({
        client_id: environment.googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        callback: (r: CodeResponse) =>
          r.code ? resolve(r.code) : reject(new Error(r.error ?? 'google_error')),
        error_callback: (e: { type?: string }) => reject(new Error(e?.type ?? 'popup_error')),
      });
      client.requestCode();
    });
  }

  private load(): Promise<void> {
    return (this.script ??= new Promise<void>((resolve, reject) => {
      if ((window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google?.accounts?.oauth2) {
        return resolve();
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        this.script = undefined; // permet de réessayer
        reject(new Error('script_load_failed'));
      };
      document.head.appendChild(s);
    }));
  }
}