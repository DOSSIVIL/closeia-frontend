import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { EtablissementForm } from '../../components/etablissement-form/etablissement-form';
import { Etablissement, PageMeta } from '../../models/etablissement.model';
import { EtablissementsService } from '../../services/etablissements.service';

@Component({
  selector: 'app-etablissements-list',
  imports: [EtablissementForm],
  templateUrl: './etablissements-list.html',
})
export class EtablissementsList {
  private readonly api = inject(EtablissementsService);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly items = signal<Etablissement[]>([]);
  readonly canManage = computed(() => this.auth.hasPermission('schools.write'));
  readonly meta = signal<PageMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly search = signal('');
  readonly statut = signal<'tous' | 'actifs' | 'inactifs'>('tous');

  readonly formOpen = signal(false);
  readonly editing = signal<Etablissement | null>(null);
  readonly toDelete = signal<Etablissement | null>(null);
  readonly deleting = signal(false);
  readonly toast = signal<{ type: 'ok' | 'error'; text: string } | null>(null);

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.search.set(value);
        this.load(1);
      });
    this.load(1);
  }

  load(page = this.meta().page) {
    this.loading.set(true);
    this.loadError.set(null);
    const statut = this.statut();

    this.api
      .list({
        page,
        limit: this.meta().limit,
        search: this.search() || undefined,
        actif: statut === 'tous' ? undefined : statut === 'actifs',
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set('Impossible de charger les établissements.');
        },
      });
  }

  onSearch(value: string) {
    this.search$.next(value);
  }

  onStatut(value: string) {
    this.statut.set(value as 'tous' | 'actifs' | 'inactifs');
    this.load(1);
  }

  goTo(page: number) {
    if (page < 1 || page > this.meta().totalPages) return;
    this.load(page);
  }

  openCreate() {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(e: Etablissement) {
    this.editing.set(e);
    this.formOpen.set(true);
  }

  onSaved(e: Etablissement) {
    const wasEdit = !!this.editing();
    this.formOpen.set(false);
    this.editing.set(null);
    this.notify('ok', wasEdit ? `« ${e.nom} » a été mis à jour` : `« ${e.nom} » a été créé`);
    this.load(wasEdit ? this.meta().page : 1);
  }

  toggleStatut(e: Etablissement) {
    this.api.setStatut(e.id, !e.actif).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.notify('ok', updated.actif ? `« ${updated.nom} » activé` : `« ${updated.nom} » désactivé`);
      },
      error: () => this.notify('error', 'Impossible de changer le statut'),
    });
  }

  confirmDelete() {
    const target = this.toDelete();
    if (!target) return;
    this.deleting.set(true);
    this.api.remove(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.notify('ok', `« ${target.nom} » a été supprimé`);
        const onlyOne = this.items().length === 1 && this.meta().page > 1;
        this.load(onlyOne ? this.meta().page - 1 : this.meta().page);
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.notify('error', err.error?.message ?? 'Suppression impossible');
      },
    });
  }

  initiales(e: Etablissement) {
    return e.sigle.slice(0, 3);
  }

  private notify(type: 'ok' | 'error', text: string) {
    this.toast.set({ type, text });
    setTimeout(() => this.toast.set(null), 3500);
  }
}