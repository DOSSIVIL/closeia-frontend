import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { Etablissement } from '../../../etablissements/models/etablissement.model';
import { EtablissementsService } from '../../../etablissements/services/etablissements.service';
import {
  AssignableRole,
  ManagedUser,
  UserImportReport,
  UserStatus,
  UsersPage,
} from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type StatusFilter = 'ALL' | UserStatus;

@Component({
  imports: [DatePipe, FormsModule],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList {
  private readonly api = inject(UsersService);
  private readonly schoolsApi = inject(EtablissementsService);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly items = signal<ManagedUser[]>([]);
  readonly schools = signal<Etablissement[]>([]);
  readonly assignableRoles = signal<AssignableRole[]>([]);
  readonly stats = signal<UsersPage['stats']>({ total: 0, active: 0, invited: 0, suspended: 0 });
  readonly meta = signal<UsersPage['meta']>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  readonly loading = signal(false);
  readonly schoolsLoading = signal(false);
  readonly rolesLoading = signal(false);
  readonly rolesError = signal<string | null>(null);
  readonly schoolsError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly statusSaving = signal(false);
  readonly deleting = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly notice = signal<{ kind: 'success' | 'warning'; message: string } | null>(null);
  readonly importOpen = signal(false);
  readonly importing = signal(false);
  readonly importFile = signal<File | null>(null);
  readonly importSchoolId = signal('');
  readonly importError = signal<string | null>(null);
  readonly importReport = signal<UserImportReport | null>(null);

  readonly canManage = computed(() => this.auth.hasPermission('users.write'));
  readonly canChooseSchool = computed(
    () => this.auth.user()?.roles.includes('PLATFORM_ADMIN') ?? false,
  );
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly schoolFilter = signal('');

  readonly formOpen = signal(false);
  readonly editing = signal<ManagedUser | null>(null);
  readonly statusTarget = signal<ManagedUser | null>(null);
  readonly deleteTarget = signal<ManagedUser | null>(null);

  form = {
    email: '',
    firstName: '',
    lastName: '',
    schoolId: '',
    roleCode: '',
    password: '',
    passwordConfirm: '',
  };

  requiresPassword(): boolean {
    return this.form.roleCode === 'SCHOOL_ADMIN' || this.form.roleCode === 'PLATFORM_ADMIN';
  }

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.search.set(value);
        this.load(1);
      });

    if (this.canChooseSchool()) this.loadSchools();
    if (this.canManage()) this.loadAssignableRoles();
    this.load(1);
  }

  loadAssignableRoles(): void {
    this.rolesLoading.set(true);
    this.rolesError.set(null);
    this.api
      .listAssignableRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => {
          this.assignableRoles.set(roles);
          if (!this.form.roleCode && !this.editing()) {
            this.form.roleCode =
              roles.find((role) => role.code === 'GUEST')?.code ?? roles[0]?.code ?? '';
          }
          this.rolesLoading.set(false);
        },
        error: (error: unknown) => {
          this.rolesLoading.set(false);
          this.rolesError.set(
            this.messageFrom(error, 'Impossible de charger les rôles attribuables.'),
          );
        },
      });
  }

  load(page = this.meta().page): void {
    this.loading.set(true);
    this.loadError.set(null);
    const status = this.statusFilter();
    this.api
      .list({
        page,
        limit: this.meta().limit,
        search: this.search() || undefined,
        status: status === 'ALL' ? undefined : status,
        schoolId: this.schoolFilter() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.meta.set(response.meta);
          this.stats.set(response.stats);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loadError.set(this.messageFrom(error, 'Impossible de charger les utilisateurs.'));
          this.loading.set(false);
        },
      });
  }

  loadSchools(): void {
    this.schoolsLoading.set(true);
    this.schoolsError.set(null);
    this.schoolsApi
      .list({ page: 1, limit: 100, actif: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schools.set(response.data);
          this.schoolsLoading.set(false);
        },
        error: () => {
          this.schoolsLoading.set(false);
          this.schoolsError.set('Impossible de charger la liste des établissements.');
        },
      });
  }

  retrySchools(): void {
    this.loadSchools();
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  onStatusFilter(value: string): void {
    if (value !== 'ALL' && value !== 'ACTIVE' && value !== 'INVITED' && value !== 'SUSPENDED')
      return;
    this.statusFilter.set(value);
    this.load(1);
  }

  onSchoolFilter(value: string): void {
    this.schoolFilter.set(value);
    this.load(1);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    this.load(page);
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form = {
      email: '',
      firstName: '',
      lastName: '',
      schoolId: this.canChooseSchool() ? '' : (this.auth.user()?.schoolId ?? ''),
      roleCode:
        this.assignableRoles().find((role) => role.code === 'GUEST')?.code ??
        this.assignableRoles()[0]?.code ??
        '',
      password: '',
      passwordConfirm: '',
    };
    this.formOpen.set(true);
  }

  openEdit(user: ManagedUser): void {
    this.editing.set(user);
    this.formError.set(null);
    this.form = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      schoolId: user.school?.id ?? '',
      roleCode: user.roles[0]?.code ?? '',
      password: '',
      passwordConfirm: '',
    };
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.saving()) return;
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  saveUser(): void {
    const editing = this.editing();
    const schoolId = this.canChooseSchool()
      ? this.form.schoolId
      : (this.auth.user()?.schoolId ?? '');
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.formError.set('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!editing && !schoolId) {
      this.formError.set('Sélectionnez un établissement avant de créer le compte.');
      return;
    }
    if (!editing && !this.form.roleCode) {
      this.formError.set('Sélectionnez un rôle pour ce nouvel utilisateur.');
      return;
    }
    if (!editing && this.requiresPassword()) {
      if (this.form.password.length < 12) {
        this.formError.set('Le mot de passe administrateur doit contenir au moins 12 caractères.');
        return;
      }
      if (this.form.password !== this.form.passwordConfirm) {
        this.formError.set('Les deux mots de passe ne correspondent pas.');
        return;
      }
    }

    this.saving.set(true);
    this.formError.set(null);
    const request = editing
      ? this.api.update(editing.id, {
          firstName: this.form.firstName.trim(),
          lastName: this.form.lastName.trim(),
        })
      : this.api.create({
          email: this.form.email.trim().toLowerCase(),
          firstName: this.form.firstName.trim(),
          lastName: this.form.lastName.trim(),
          schoolId,
          roleCode: this.form.roleCode,
          ...(this.requiresPassword() ? { password: this.form.password } : {}),
        });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editing.set(null);
        if (!editing) {
          const emailSent = 'welcomeEmailSent' in created && created.welcomeEmailSent;
          this.notify(
            emailSent ? 'success' : 'warning',
            emailSent
              ? 'Le compte a été créé et le courriel de bienvenue envoyé.'
              : 'Le compte a été créé, mais le courriel de bienvenue n’a pas pu être envoyé.',
          );
        }
        this.load(editing ? this.meta().page : 1);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(
          this.messageFrom(
            error,
            'Impossible d’enregistrer cet utilisateur. Vérifiez les informations puis réessayez.',
          ),
        );
      },
    });
  }

  openImport(): void {
    this.importFile.set(null);
    this.importError.set(null);
    this.importReport.set(null);
    this.importSchoolId.set(this.canChooseSchool() ? '' : (this.auth.user()?.schoolId ?? ''));
    this.importOpen.set(true);
  }

  closeImport(): void {
    if (this.importing()) return;
    this.importOpen.set(false);
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.importFile.set(file);
    this.importReport.set(null);
    this.importError.set(null);
  }

  submitImport(): void {
    const file = this.importFile();
    const schoolId = this.canChooseSchool()
      ? this.importSchoolId()
      : (this.auth.user()?.schoolId ?? '');
    if (!file) {
      this.importError.set('Sélectionnez un fichier CSV, Excel (.xlsx) ou PDF.');
      return;
    }
    if (!schoolId) {
      this.importError.set('Sélectionnez l’établissement auquel rattacher ces comptes.');
      return;
    }

    this.importing.set(true);
    this.importError.set(null);
    this.api
      .import(file, schoolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => {
          this.importReport.set(report);
          this.importing.set(false);
          if (report.created) this.load(1);
        },
        error: (error: unknown) => {
          this.importing.set(false);
          this.importError.set(
            this.messageFrom(
              error,
              'L’import a échoué. Vérifiez le format du fichier et réessayez.',
            ),
          );
        },
      });
  }

  downloadImportTemplate(): void {
    const content = 'email,firstName,lastName,roleCode,password\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-import-utilisateurs.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  requestStatusChange(user: ManagedUser): void {
    this.statusTarget.set(user);
  }

  confirmStatusChange(): void {
    const user = this.statusTarget();
    if (!user || this.statusSaving()) return;
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.statusSaving.set(true);
    this.api
      .setStatus(user.id, nextStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.statusSaving.set(false);
          this.statusTarget.set(null);
          this.load();
        },
        error: (error: unknown) => {
          this.statusSaving.set(false);
          this.statusTarget.set(null);
          this.loadError.set(
            this.messageFrom(error, 'Impossible de modifier le statut du compte.'),
          );
        },
      });
  }

  confirmDelete(): void {
    const user = this.deleteTarget();
    if (!user || this.deleting()) return;

    this.deleting.set(true);
    this.actionError.set(null);
    this.api
      .remove(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.deleteTarget.set(null);
          const previousPage = this.items().length === 1 && this.meta().page > 1;
          this.load(previousPage ? this.meta().page - 1 : this.meta().page);
        },
        error: (error: unknown) => {
          this.deleting.set(false);
          this.actionError.set(this.messageFrom(error, 'Impossible de supprimer cet utilisateur.'));
        },
      });
  }

  initials(user: ManagedUser): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  statusLabel(status: UserStatus): string {
    return status === 'ACTIVE' ? 'Actif' : status === 'INVITED' ? 'En attente' : 'Suspendu';
  }

  roleNames(user: ManagedUser): string {
    return user.roles.length ? user.roles.map((role) => role.name).join(', ') : 'Aucun rôle';
  }

  private messageFrom(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string'))
      return message.join(' ');
    return fallback;
  }

  private notify(kind: 'success' | 'warning', message: string): void {
    this.notice.set({ kind, message });
    setTimeout(() => this.notice.set(null), 6000);
  }
}
