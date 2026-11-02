import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session } from '../../shared/models/session';
import { LogoutReason } from './logout-reason';

const KEY = 'spacehub.session';
const MAX_TIMEOUT = 2_147_483_647; 
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export interface LogoutOptions {
 
  reason?: LogoutReason;
  
  notifyServer?: boolean;
}


function tokenExpiry(token: string): number | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64)) as { exp?: number };
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _session = signal<Session | null>(null);
 
  private remembered = false;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private inactivityTimer?: ReturnType<typeof setTimeout>;
  private lastActivity = 0;

  readonly user = computed(() => this._session()?.user ?? null);
  readonly token = computed(() => this._session()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => !!this._session());

  constructor() {
    this.restore();

    // Déconnexion dans un autre onglet (session mémorisée, donc partagée via localStorage)
    window.addEventListener('storage', (e) => this.onStorage(e));
    // Retour sur l'onglet après une veille : le jeton a peut-être expiré entre-temps
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkExpiry();
    });
    // Activité de l'utilisateur, pour le délai d'inactivité
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, () => this.onActivity(), { passive: true, capture: true });
    }
  }

  /** Administrateurs uniquement (règle appliquée par le backend). */
  loginWithPassword(email: string, password: string, rememberMe = false): Observable<Session> {
    return this.http
      .post<Session>(`${environment.apiUrl}/auth/login`, { email, password, rememberMe })
      .pipe(tap((s) => this.startSession(s, rememberMe)));
  }

  /** Le backend échange le code avec Google et vérifie le compte (domaine, format, rôle). */
  loginWithGoogleCode(code: string, rememberMe = false): Observable<Session> {
    return this.http
      .post<Session>(`${environment.apiUrl}/auth/google/code`, { code, client: 'web', rememberMe })
      .pipe(tap((s) => this.startSession(s, rememberMe)));
  }

  /**
   * Déconnexion locale + fermeture de la session côté serveur.
   * Sans effet si personne n'est connecté (plusieurs 401 simultanés ne déclenchent qu'une déconnexion).
   */
  logout(options: LogoutOptions = {}): void {
    const { reason = 'manual', notifyServer = true } = options;
    const session = this._session();
    if (!session) return;

    if (notifyServer) {
      // Le jeton est passé explicitement : la session locale est effacée juste après
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {}, { headers: { Authorization: `Bearer ${session.accessToken}` } })
        .subscribe({ error: () => undefined });
    }
    this.endSession();
    void this.router.navigate(['/login'], { queryParams: { reason }, replaceUrl: true });
  }

  /** Ferme les sessions de tous les appareils, puis déconnecte localement. */
  logoutAll(): void {
    if (!this._session()) return;
    this.http
      .post(`${environment.apiUrl}/auth/logout-all`, {})
      .pipe(finalize(() => this.logout({ reason: 'manual', notifyServer: false })))
      .subscribe({ error: () => undefined });
  }

  hasPermission(permission: string): boolean {
    return this.user()?.permissions.includes(permission) ?? false;
  }

  // ---------- session ----------

  private startSession(session: Session, remember: boolean): void {
    this._session.set(session);
    this.remembered = remember;
    try {
      const target = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;
      target.setItem(KEY, JSON.stringify(session));
      other.removeItem(KEY);
    } catch {
      /* stockage indisponible : la session reste en mémoire */
    }
    this.scheduleExpiry(session.accessToken);
    this.scheduleInactivity();
  }

  private endSession(): void {
    clearTimeout(this.expiryTimer);
    clearTimeout(this.inactivityTimer);
    this._session.set(null);
    this.remembered = false;
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  private restore(): void {
    try {
      const fromLocal = localStorage.getItem(KEY);
      const raw = fromLocal ?? sessionStorage.getItem(KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as Session;
      const expiry = tokenExpiry(session.accessToken);
      if (expiry === null || expiry <= Date.now()) {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
        return;
      }
      this._session.set(session);
      this.remembered = fromLocal !== null;
      this.scheduleExpiry(session.accessToken);
      this.scheduleInactivity();
    } catch {
      /* session illisible : on repart de zéro */
    }
  }

  // ---------- expiration, inactivité, autres onglets ----------

  /** Déconnecte si le jeton a expiré. Renvoie true si une déconnexion a eu lieu. */
  private checkExpiry(): boolean {
    const session = this._session();
    if (!session) return false;
    const expiry = tokenExpiry(session.accessToken);
    if (expiry !== null && expiry > Date.now()) return false;
    this.logout({ reason: 'expired', notifyServer: false });
    return true;
  }

  private scheduleExpiry(token: string): void {
    clearTimeout(this.expiryTimer);
    const expiry = tokenExpiry(token);
    if (expiry === null) return;
    const delay = Math.min(expiry - Date.now(), MAX_TIMEOUT);
    this.expiryTimer = setTimeout(() => {
      if (!this.checkExpiry()) this.scheduleExpiry(token); // délai plafonné : on reprogramme
    }, Math.max(delay, 0));
  }

  private scheduleInactivity(): void {
    clearTimeout(this.inactivityTimer);
    const minutes = environment.inactivityMinutes;
    // Pas d'inactivité pour une session « Se souvenir de moi » : c'est un choix explicite
    if (!minutes || this.remembered || !this._session()) return;
    this.inactivityTimer = setTimeout(() => this.logout({ reason: 'inactive' }), minutes * 60_000);
  }

  private onActivity(): void {
    if (!this._session() || this.remembered) return;
    const now = Date.now();
    if (now - this.lastActivity < 1000) return; // au plus une réinitialisation par seconde
    this.lastActivity = now;
    this.scheduleInactivity();
  }

  private onStorage(event: StorageEvent): void {
    if (event.key !== KEY || event.newValue !== null) return;
    if (!this._session() || !this.remembered) return; // concerne seulement les sessions partagées
    this.endSession();
    void this.router.navigate(['/login'], { queryParams: { reason: 'other-tab' }, replaceUrl: true });
  }
}