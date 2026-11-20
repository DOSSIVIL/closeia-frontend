import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  private readonly api = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly exportError = signal<string | null>(null);

  readonly metrics = computed(() => {
    const data = this.summary();
    if (!data) return [];
    return [
      {
        label: 'Établissements',
        value: data.schools.total,
        detail: `${data.schools.active} actifs · ${data.schools.inactive} inactifs`,
        color: 'blue',
        icon: 'school',
      },
      {
        label: 'Utilisateurs',
        value: data.users.total,
        detail: 'Comptes enregistrés',
        color: 'sand',
        icon: 'users',
      },
      {
        label: 'Utilisateurs actifs',
        value: data.users.active,
        detail: 'Comptes au statut actif',
        color: 'sage',
        icon: 'active',
      },
      {
        label: 'Invitations en attente',
        value: data.users.invited,
        detail: 'Comptes au statut invité',
        color: 'coral',
        icon: 'invite',
      },
    ];
  });

  readonly statusBreakdown = computed(() => {
    const users = this.summary()?.users;
    if (!users) return [];
    return [
      { label: 'Actifs', value: users.active, color: 'var(--dashboard-sage)' },
      { label: 'Invités', value: users.invited, color: 'var(--dashboard-sand)' },
      { label: 'Suspendus', value: users.suspended, color: 'var(--dashboard-coral)' },
    ];
  });

  readonly donutStyle = computed(() => {
    const parts = this.statusBreakdown();
    const total = parts.reduce((sum, item) => sum + item.value, 0);
    if (!total) return 'conic-gradient(var(--dashboard-chart-empty) 0% 100%)';

    let start = 0;
    const slices = parts.map((item) => {
      const end = start + (item.value / total) * 100;
      const slice = `${item.color} ${start}% ${end}%`;
      start = end;
      return slice;
    });
    return `conic-gradient(${slices.join(', ')})`;
  });

  readonly chartCoordinates = computed(() => {
    const values = this.summary()?.users.monthlyRegistrations ?? [];
    const max = Math.max(1, ...values.map((item) => item.count));
    return values.map((item, index) => ({
      ...item,
      x: values.length < 2 ? 400 : 36 + (index * 728) / (values.length - 1),
      y: 190 - (item.count / max) * 156,
    }));
  });

  readonly chartLine = computed(() =>
    this.chartCoordinates()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  readonly chartArea = computed(() => {
    const points = this.chartCoordinates();
    if (!points.length) return '';
    return `M ${points[0].x},190 L ${points.map((point) => `${point.x},${point.y}`).join(' L ')} L ${points[points.length - 1].x},190 Z`;
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.errorMessage(error));
          this.loading.set(false);
        },
      });
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.exportError.set(null);
    this.api
      .exportExcel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'tableau-de-bord-closeia.xlsx';
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.exporting.set(false);
        },
        error: (error: unknown) => {
          this.exportError.set(this.errorMessage(error));
          this.exporting.set(false);
        },
      });
  }

  monthLabel(month: string): string {
    const date = new Date(`${month}-01T00:00:00`);
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0
        ? 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.'
        : (error.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
    }
    return 'Une erreur inattendue est survenue.';
  }
}
