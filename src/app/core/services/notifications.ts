import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';

export type NotificationKind = 'info' | 'success' | 'warning' | 'danger';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationApiItem extends Omit<AppNotification, 'createdAt'> {
  createdAt: string;
}

interface NotificationListResponse {
  data: NotificationApiItem[];
  unreadCount: number;
}

const EMPTY: NotificationListResponse = { data: [], unreadCount: 0 };

@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);

  private readonly _items = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);

  readonly items = this._items.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private activeUserId: string | null = null;
  private requestGeneration = 0;

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id ?? null;
      if (userId === this.activeUserId) return;
      this.activeUserId = userId;
      this.requestGeneration += 1;
      this.loading.set(false);
      if (userId) {
        this.load();
      } else {
        this._items.set([]);
        this._unreadCount.set(0);
        this.error.set(null);
      }
    });
  }

  load(): void {
    if (!this.activeUserId || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const generation = this.requestGeneration;
    this.http.get<NotificationListResponse>(`${environment.apiUrl}/notifications`).subscribe({
      next: (response) => {
        if (generation !== this.requestGeneration) return;
        this.setResponse(response);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        if (generation !== this.requestGeneration) return;
        this.error.set(this.messageFrom(error));
        this.loading.set(false);
      },
    });
  }

  markRead(id: string): void {
    const userId = this.activeUserId;
    if (!userId || !this._items().some((item) => item.id === id && !item.read)) return;
    this.http.patch<void>(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        if (this.activeUserId !== userId) return;
        const wasUnread = this._items().some((item) => item.id === id && !item.read);
        this._items.update((items) =>
          items.map((item) => (item.id === id ? { ...item, read: true } : item)),
        );
        if (wasUnread) {
          this._unreadCount.update((count) => Math.max(0, count - 1));
        }
      },
      error: (error: unknown) => {
        if (this.activeUserId === userId) this.error.set(this.messageFrom(error));
      },
    });
  }

  markAllRead(): void {
    const userId = this.activeUserId;
    if (!userId || this.unreadCount() === 0) return;
    this.http.patch<void>(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        if (this.activeUserId !== userId) return;
        this._items.update((items) => items.map((item) => ({ ...item, read: true })));
        this._unreadCount.set(0);
      },
      error: (error: unknown) => {
        if (this.activeUserId === userId) this.error.set(this.messageFrom(error));
      },
    });
  }

  clear(): void {
    const userId = this.activeUserId;
    if (!userId) return;
    this.http.delete<void>(`${environment.apiUrl}/notifications`).subscribe({
      next: () => {
        if (this.activeUserId === userId) this.setResponse(EMPTY);
      },
      error: (error: unknown) => {
        if (this.activeUserId === userId) this.error.set(this.messageFrom(error));
      },
    });
  }

  private setResponse(response: NotificationListResponse): void {
    this._items.set(
      response.data.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })),
    );
    this._unreadCount.set(response.unreadCount);
  }

  private messageFrom(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Le service de notifications est momentanément inaccessible.';
    }
    return 'Impossible de mettre à jour les notifications. Réessayez.';
  }
}
