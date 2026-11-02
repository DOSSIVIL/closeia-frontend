import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notifications } from '../../services/notifications';
import { Theme } from '../../services/theme';
import { CommandPalette } from '../command-palette/command-palette';
import { Header } from '../header/header';
import { ShellState } from '../shell-state';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TranslocoPipe, Sidebar, Header, CommandPalette],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly theme = inject(Theme);
  private readonly state = inject(ShellState);
  private readonly router = inject(Router);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');

  /** Le contenu laisse la place à la barre latérale fixe. */
  protected readonly contentOffset = computed(() => (this.state.collapsed() ? 'lg:pl-[84px]' : 'lg:pl-[264px]'));

  constructor() {
    // Chaque navigation referme le tiroir mobile et les menus déroulants
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.state.closeDrawer();
        this.state.closeMenus();
      });

    
    if (!environment.production && this.notifications.items().length === 0) this.seedDemoNotifications();
  }

  
  protected focusMain(): void {
    this.main()?.nativeElement.focus();
  }

  private seedDemoNotifications(): void {
    const t = (key: string) => this.transloco.translate(`shell.notifications.demo.${key}`);
    const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
    this.notifications.push({ kind: 'warning', title: t('documentsTitle'), message: t('documentsMessage'), createdAt: ago(60 * 26) });
    this.notifications.push({ kind: 'success', title: t('securityTitle'), message: t('securityMessage'), createdAt: ago(180) });
    this.notifications.push({ kind: 'info', title: t('welcomeTitle'), message: t('welcomeMessage'), createdAt: ago(2) });
  }
}