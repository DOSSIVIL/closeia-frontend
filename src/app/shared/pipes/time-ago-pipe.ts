import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date, locale = 'fr'): string {
    const seconds = Math.round((value.getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
    ];
    for (const [unit, size] of units) {
      if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return rtf.format(0, 'second'); // « maintenant »
  }
}