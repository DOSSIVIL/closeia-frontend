import { Component } from '@angular/core';

@Component({
  selector: 'app-wave-background',
  host: { class: 'pointer-events-none absolute inset-0 z-0', 'aria-hidden': 'true' },
  template: `
    <svg class="wave-corner wave-corner--top-left absolute -top-1 -left-1 h-[130px] w-[130px]" viewBox="0 0 130 130" fill="none" preserveAspectRatio="none">
      <path d="M0 0 H130 C95 12, 82 28, 70 48 C55 72, 40 95, 0 130 Z" fill="#8CB8D9" opacity="0.85"/>
      <path d="M0 0 H95 C70 10, 58 24, 48 42 C36 62, 22 80, 0 100 Z" fill="#A3CBE8" opacity="0.55"/>
    </svg>
    <svg class="wave-corner wave-corner--top-right absolute -top-1 -right-1 h-[110px] w-[110px]" viewBox="0 0 110 110" fill="none" preserveAspectRatio="none">
      <path d="M110 0 H0 C35 14, 48 30, 60 50 C72 72, 88 92, 110 110 Z" fill="#A8D0C4" opacity="0.85"/>
      <path d="M110 0 H28 C52 12, 64 26, 74 44 C84 62, 96 78, 110 92 Z" fill="#9BD5CB" opacity="0.5"/>
    </svg>
    <svg class="wave-corner wave-corner--bottom-left absolute -bottom-1 -left-1 h-[110px] w-[110px]" viewBox="0 0 110 110" fill="none" preserveAspectRatio="none">
      <path d="M0 110 V0 C18 26, 32 44, 46 62 C60 80, 78 96, 110 110 Z" fill="#DBCBB3" opacity="0.85"/>
      <path d="M0 110 V32 C14 52, 26 66, 40 80 C54 94, 72 104, 110 110 Z" fill="#E8DCC8" opacity="0.5"/>
    </svg>
    <svg class="wave-corner wave-corner--bottom-right absolute -bottom-1 -right-1 h-[130px] w-[130px]" viewBox="0 0 130 130" fill="none" preserveAspectRatio="none">
      <path d="M130 110 V0 C110 28, 96 46, 82 64 C68 82, 50 100, 0 110 Z" fill="#A3CBE8" opacity="0.85"/>
      <path d="M130 110 V42 C114 62, 102 76, 88 90 C74 102, 56 108, 0 110 Z" fill="#B8D9F0" opacity="0.5"/>
    </svg>
  `,
})
export class WaveBackground {}