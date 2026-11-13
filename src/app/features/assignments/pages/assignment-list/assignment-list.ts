import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { Etablissement } from '../../../etablissements/models/etablissement.model';
import { EtablissementsService } from '../../../etablissements/services/etablissements.service';
import { ManagedUser } from '../../../users/models/user.model';
import { UsersService } from '../../../users/services/users.service';
import { Assignment, AssignmentRole, AssignmentsPage } from '../../models/assignment.model';
import { AssignmentsService } from '../../services/assignments.service';

@Component({
  imports: [DatePipe, FormsModule],
  selector: 'app-assignment-list',
  styleUrl: './assignment-list.css',
  templateUrl: './assignment-list.html',
})
export class AssignmentList {
  private readonly api = inject(AssignmentsService);
  private readonly usersApi = inject(UsersService);
  private readonly schoolsApi = inject(EtablissementsService);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly items = signal<Assignment[]>([]);
  readonly roles = signal<AssignmentRole[]>([]);
  readonly schools = signal<Etablissement[]>([]);
  readonly users = signal<ManagedUser[]>([]);
  readonly stats = signal<AssignmentsPage['stats']>({
    total: 0,
    schoolAdmins: 0,
    staff: 0,
    students: 0,
    guests: 0,
  });
  readonly meta = signal<AssignmentsPage['meta']>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  readonly loading = signal(false);
  readonly rolesLoading = signal(false);
  readonly schoolsLoading = signal(false);
  readonly usersLoading = signal(false);
  readonly saving = signal(false);
  readonly removing = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly removeError = signal<string | null>(null);

  readonly canManage = computed(() => this.auth.hasPermission('assignments.write'));
  readonly canChooseSchool = computed(
    () => this.auth.user()?.roles.includes('PLATFORM_ADMIN') ?? false,
  );
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  readonly search = signal('');
  readonly roleFilter = signal('');
  readonly schoolFilter = signal('');
  readonly formOpen = signal(false);
  readonly removeTarget = signal<Assignment | null>(null);

  form = { userId: '', roleCode: '', schoolId: '' };

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.search.set(value);
        this.load(1);
      });

    this.loadRoles();
    if (this.canChooseSchool()) this.loadSchools();
    this.load(1);
  }

  load(page = this.meta().page): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api
      .list({
        page,
        limit: this.meta().limit,
        search: this.search() || undefined,
        roleCode: this.roleFilter() || undefined,
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
          this.loadError.set(this.messageFrom(error, 'Impossible de charger les affectations.'));
          this.loading.set(false);
        },
      });
  }

  loadRoles(): void {
    this.rolesLoading.set(true);
    this.api
      .listRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
          this.rolesLoading.set(false);
        },
        error: () => {
          this.rolesLoading.set(false);
          this.loadError.set('Impossible de charger les rôles disponibles.');
        },
      });
  }

  loadSchools(): void {
    this.schoolsLoading.set(true);
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
          this.formError.set('Impossible de charger les établissements.');
        },
      });
  }

  loadUsers(): void {
    const schoolId = this.form.schoolId;
    if (!schoolId) {
      this.users.set([]);
      return;
    }

    this.usersLoading.set(true);
    this.usersApi
      .list({ page: 1, limit: 100, schoolId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.users.set(response.data.filter((user) => user.status !== 'SUSPENDED'));
          this.usersLoading.set(false);
        },
        error: (error: unknown) => {
          this.usersLoading.set(false);
          this.formError.set(this.messageFrom(error, 'Impossible de charger les utilisateurs.'));
        },
      });
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  onRoleFilter(value: string): void {
    this.roleFilter.set(value);
    this.load(1);
  }

  onSchoolFilter(value: string): void {
    this.schoolFilter.set(value);
    this.load(1);
  }

  onFormSchoolChange(): void {
    this.form.userId = '';
    this.formError.set(null);
    this.loadUsers();
  }

  openCreate(): void {
    this.form = {
      userId: '',
      roleCode: '',
      schoolId: this.canChooseSchool() ? '' : (this.auth.user()?.schoolId ?? ''),
    };
    this.users.set([]);
    this.formError.set(null);
    this.formOpen.set(true);
    if (!this.canChooseSchool() && this.form.schoolId) this.loadUsers();
  }

  closeForm(): void {
    if (this.saving()) return;
    this.formOpen.set(false);
    this.formError.set(null);
  }

  saveAssignment(): void {
    if (!this.form.userId || !this.form.roleCode || !this.form.schoolId) {
      this.formError.set('Sélectionnez un établissement, un utilisateur et un rôle.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.api
      .create(this.form)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.load(1);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(this.messageFrom(error, 'Impossible de créer cette affectation.'));
        },
      });
  }

  requestRemoval(assignment: Assignment): void {
    this.removeTarget.set(assignment);
    this.removeError.set(null);
  }

  confirmRemoval(): void {
    const assignment = this.removeTarget();
    if (!assignment || this.removing()) return;
    this.removing.set(true);
    this.removeError.set(null);
    this.api
      .remove(assignment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.removing.set(false);
          this.removeTarget.set(null);
          this.load(
            this.items().length === 1 && this.meta().page > 1
              ? this.meta().page - 1
              : this.meta().page,
          );
        },
        error: (error: unknown) => {
          this.removing.set(false);
          this.removeError.set(this.messageFrom(error, 'Impossible de retirer cette affectation.'));
        },
      });
  }

  goTo(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    this.load(page);
  }

  initials(assignment: Assignment): string {
    return `${assignment.user.firstName.charAt(0)}${assignment.user.lastName.charAt(0)}`.toUpperCase();
  }

  roleName(code: string): string {
    return this.roles().find((role) => role.code === code)?.name ?? code;
  }

  roleDescription(code: string): string {
    return (
      this.roles().find((role) => role.code === code)?.description ??
      'Accès défini par les permissions de ce rôle.'
    );
  }

  private messageFrom(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string'))
      return message.join(' ');
    return fallback;
  }
}
