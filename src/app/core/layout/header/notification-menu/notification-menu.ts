import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Language } from '../../../services/language';
import { Notifications, type NotificationKind } from '../../../services/notifications';
import { Icon } from '../../../../shared/ui/icon/icon';
import type { IconName } from '../../../../shared/ui/icon/icon';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago-pipe';
import { ShellState } from '../../shell-state';

@Component({
  selector: 'app-notification-menu',
  imports: [TranslocoPipe, Icon, TimeAgoPipe],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div class="relative">
      <button
        #trigger
        type="button"
        class="icon-btn relative"
        (click)="toggle()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label()"
      >
        <app-icon name="bell" />
        @if (notifications.unreadCount() > 0) {
          <span class="absolute top-2 right-2.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-surface"></span>
        }
      </button>

      @if (open()) {
        <div
          class="pop-in fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_16px_40px_-12px_rgba(2,6,23,0.28)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[390px]"
          role="dialog"
          [attr.aria-label]="'shell.notifications.title' | transloco"
        >
          <!-- En-tête -->
          <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div class="flex items-center gap-2">
              <h2 class="text-[15px] font-semibold text-ink">{{ 'shell.notifications.title' | transloco }}</h2>
              @if (notifications.unreadCount() > 0) {
                <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                  {{ notifications.unreadCount() }}
                </span>
              }
            </div>
            <button
              type="button"
              class="text-[13px] font-medium text-brand-ink transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40"
              [disabled]="notifications.unreadCount() === 0"
              (click)="notifications.markAllRead()"
            >
              {{ 'shell.notifications.markAll' | transloco }}
            </button>
          </div>

          @if (notifications.items().length > 0) {
            <ul class="max-h-[min(60vh,400px)] divide-y divide-line overflow-y-auto">
              @for (n of notifications.items(); track n.id) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised"
                    [class]="n.read ? '' : 'bg-brand-soft/40'"
                    (click)="notifications.markRead(n.id)"
                  >
                    <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl" [class]="tone[n.kind].box">
                      <app-icon [name]="tone[n.kind].icon" [size]="18" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="flex items-center gap-2">
                        <span class="truncate text-[14px] text-ink" [class]="n.read ? 'font-medium' : 'font-semibold'">{{ n.title }}</span>
                        @if (!n.read) {
                          <span class="h-2 w-2 shrink-0 rounded-full bg-coral"></span>
                        }
                      </span>
                      <span class="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{{ n.message }}</span>
                      <span class="mt-1 block text-[12px] text-muted/80">{{ n.createdAt | timeAgo: lang.current() }}</span>
                    </span>
                  </button>
                </li>
              }
            </ul>
            <div class="border-t border-line p-2">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
                (click)="notifications.clear()"
              >
                {{ 'shell.notifications.clear' | transloco }}
              </button>
            </div>
          } @else {
            <div class="flex flex-col items-center px-6 py-12 text-center">
              <span class="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-raised text-muted">
                <app-icon name="bellOff" [size]="22" />
              </span>
              <p class="text-[14px] font-semibold text-ink">{{ 'shell.notifications.empty' | transloco }}</p>
              <p class="mt-1 text-[13px] text-muted">{{ 'shell.notifications.emptyHint' | transloco }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationMenu {
  protected readonly state = inject(ShellState);
  protected readonly notifications = inject(Notifications);
  protected readonly lang = inject(Language);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly open = computed(() => this.state.openMenu() === 'notifications');

  protected readonly label = computed(() => {
    const count = this.notifications.unreadCount();
    return count > 0 ? `Notifications (${count})` : 'Notifications';
  });

  protected readonly tone: Record<NotificationKind, { icon: IconName; box: string }> = {
    info: { icon: 'info', box: 'bg-brand-soft text-brand-ink' },
    success: { icon: 'checkCircle', box: 'bg-leaf/25 text-leaf-ink' },
    warning: { icon: 'alert', box: 'bg-sand/30 text-sand-ink' },
    danger: { icon: 'alert', box: 'bg-coral/15 text-coral' },
  };

  protected toggle(): void {
    this.state.toggleMenu('notifications');
  }

  protected close(): void {
    if (!this.open()) return;
    this.state.closeMenus();
    this.trigger()?.nativeElement.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.state.closeMenus();
  }
}