import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
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
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');

  /** Le contenu laisse la place à la barre latérale fixe. */
  protected readonly contentOffset = computed(() =>
    this.state.collapsed() ? 'lg:pl-[84px]' : 'lg:pl-[264px]',
  );

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
  }

  protected focusMain(): void {
    this.main()?.nativeElement.focus();
  }
}
