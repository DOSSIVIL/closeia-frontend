import { computed, Injectable, signal } from '@angular/core';

export type NotificationKind = 'info' | 'success' | 'warning' | 'danger';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface NewNotification {
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt?: Date;
}

const MAX_ITEMS = 50;

/** Centre de notifications du portail : n'importe quelle partie de l'application peut y publier. */
@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly _items = signal<AppNotification[]>([]);

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  push(input: NewNotification): void {
    const item: AppNotification = {
      id: crypto.randomUUID(),
      kind: input.kind,
      title: input.title,
      message: input.message,
      createdAt: input.createdAt ?? new Date(),
      read: false,
    };
    this._items.update((list) => [item, ...list].slice(0, MAX_ITEMS));
  }

  markRead(id: string): void {
    this._items.update((list) => list.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)));
  }

  markAllRead(): void {
    this._items.update((list) => list.map((n) => (n.read ? n : { ...n, read: true })));
  }

  clear(): void {
    this._items.set([]);
  }
}