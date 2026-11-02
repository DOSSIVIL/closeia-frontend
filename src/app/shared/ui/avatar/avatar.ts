import { Component, computed, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  host: {
    class: 'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand-ink select-none',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.38',
  },
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" (error)="failed.set(true)" />
    } @else {
      {{ initials() }}
    }
  `,
})
export class Avatar {
  readonly name = input('');
  readonly src = input<string | null | undefined>();
  readonly size = input(36);

  protected readonly failed = signal(false);

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    const first = words[0].charAt(0);
    const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  });

  constructor() {
    effect(() => {
      this.src(); // nouvelle photo : on réessaie de la charger
      this.failed.set(false);
    });
  }
}