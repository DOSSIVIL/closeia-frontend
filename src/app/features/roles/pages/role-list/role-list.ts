import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../../core/auth/auth';
import {
  DocumentScope,
  DocumentScopeOption,
  ManagedRole,
  PermissionOption,
  RolePayload,
  RoleUpdatePayload,
} from '../../models/role.model';
import { RolesService } from '../../services/roles.service';

const PERMISSION_GROUPS: { name: string; permissions: PermissionOption[] }[] = [
  {
    name: 'Pilotage',
    permissions: [
      { code: 'dashboard.read', label: 'Consulter le tableau de bord', group: 'Pilotage' },
      { code: 'audit.read', label: 'Consulter le journal d’audit', group: 'Pilotage' },
    ],
  },
  {
    name: 'Établissements',
    permissions: [
      { code: 'schools.read', label: 'Consulter les établissements', group: 'Établissements' },
      { code: 'schools.write', label: 'Gérer les établissements', group: 'Établissements' },
    ],
  },
  {
    name: 'Utilisateurs et accès',
    permissions: [
      { code: 'users.read', label: 'Consulter les utilisateurs', group: 'Utilisateurs et accès' },
      { code: 'users.write', label: 'Gérer les utilisateurs', group: 'Utilisateurs et accès' },
      { code: 'roles.read', label: 'Consulter les rôles', group: 'Utilisateurs et accès' },
      { code: 'roles.write', label: 'Gérer les rôles', group: 'Utilisateurs et accès' },
      {
        code: 'assignments.read',
        label: 'Consulter les affectations',
        group: 'Utilisateurs et accès',
      },
      {
        code: 'assignments.write',
        label: 'Gérer les affectations',
        group: 'Utilisateurs et accès',
      },
    ],
  },
  {
    name: 'Documents et assistant',
    permissions: [
      { code: 'documents.read', label: 'Consulter les documents', group: 'Documents et assistant' },
      { code: 'documents.write', label: 'Gérer les documents', group: 'Documents et assistant' },
      {
        code: 'conversations.read',
        label: 'Consulter les conversations',
        group: 'Documents et assistant',
      },
      { code: 'chat.use', label: 'Utiliser le chat IA', group: 'Documents et assistant' },
    ],
  },
];

const DOCUMENT_SCOPE_OPTIONS: DocumentScopeOption[] = [
  {
    code: 'SCHOOL',
    label: 'Tous les documents de l’établissement',
    description: 'Documents rattachés à l’établissement de l’utilisateur.',
  },
  {
    code: 'ASSIGNED_SPACES',
    label: 'Espaces documentaires attribués',
    description: 'Documents des espaces auxquels l’utilisateur est explicitement rattaché.',
  },
  {
    code: 'OWN_DOCUMENTS',
    label: 'Documents personnels',
    description: 'Documents déposés par l’utilisateur lui-même.',
  },
];

@Component({
  imports: [FormsModule],
  selector: 'app-role-list',
  styleUrl: './role-list.css',
  templateUrl: './role-list.html',
})
export class RoleList {
  private readonly api = inject(RolesService);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = signal<ManagedRole[]>([]);
  readonly permissions = PERMISSION_GROUPS;
  readonly documentScopeOptions = DOCUMENT_SCOPE_OPTIONS;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly search = signal('');
  readonly formOpen = signal(false);
  readonly editing = signal<ManagedRole | null>(null);
  readonly canManage = computed(() => this.auth.hasPermission('roles.write'));
  readonly customRoleCount = computed(() => this.roles().filter((role) => !role.isSystem).length);
  readonly assignedUserCount = computed(() =>
    this.roles().reduce((total, role) => total + role.assignmentCount, 0),
  );
  readonly filteredRoles = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('fr');
    if (!term) return this.roles();
    return this.roles().filter((role) =>
      `${role.name} ${role.code} ${role.description ?? ''}`.toLocaleLowerCase('fr').includes(term),
    );
  });

  form = this.emptyForm();

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.roles.set(response.data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loadError.set(this.messageFrom(error, 'Impossible de charger les rôles.'));
          this.loading.set(false);
        },
      });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = this.emptyForm();
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEdit(role: ManagedRole): void {
    if (!this.canManage() || role.isSystem) return;
    this.editing.set(role);
    this.form = {
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      permissions: [...role.permissions],
      documentScopes: [...role.documentScopes] as Exclude<DocumentScope, 'PLATFORM'>[],
    };
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.saving()) return;
    this.formOpen.set(false);
    this.formError.set(null);
  }

  onNameChange(name: string): void {
    this.form.name = name;
    if (!this.editing()) {
      this.form.code = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50);
    }
  }

  togglePermission(code: string, checked: boolean): void {
    this.form.permissions = checked
      ? [...new Set([...this.form.permissions, code])]
      : this.form.permissions.filter((permission) => permission !== code);
  }

  toggleScope(code: Exclude<DocumentScope, 'PLATFORM'>, checked: boolean): void {
    this.form.documentScopes = checked
      ? [...new Set([...this.form.documentScopes, code])]
      : this.form.documentScopes.filter((scope) => scope !== code);
  }

  hasPermission(code: string): boolean {
    return this.form.permissions.includes(code);
  }

  hasScope(code: Exclude<DocumentScope, 'PLATFORM'>): boolean {
    return this.form.documentScopes.includes(code);
  }

  save(): void {
    const name = this.form.name.trim();
    if (!name || name.length < 2) {
      this.formError.set('Le nom du rôle doit contenir au moins 2 caractères.');
      return;
    }
    if (!this.editing() && !/^[A-Z][A-Z0-9_]{1,49}$/.test(this.form.code)) {
      this.formError.set(
        'Le code doit contenir 2 à 50 caractères : lettres majuscules, chiffres et _.',
      );
      return;
    }
    if (!this.form.documentScopes.length && this.form.permissions.includes('documents.read')) {
      this.formError.set(
        'Un rôle autorisé à consulter les documents doit avoir au moins un périmètre.',
      );
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    const editing = this.editing();
    const body: RoleUpdatePayload = {
      name,
      description: this.form.description.trim() || null,
      permissions: [...this.form.permissions],
      documentScopes: [...this.form.documentScopes],
    };
    const request = editing
      ? this.api.update(editing.id, body)
      : this.api.create({ ...body, code: this.form.code });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(this.messageFrom(error, 'Impossible d’enregistrer ce rôle.'));
      },
    });
  }

  permissionCount(role: ManagedRole): number {
    return role.permissions.length;
  }

  private emptyForm() {
    return {
      code: '',
      name: '',
      description: '',
      permissions: [] as string[],
      documentScopes: [] as Exclude<DocumentScope, 'PLATFORM'>[],
    };
  }

  private messageFrom(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message: unknown = error.error?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message))
        return message.filter((item): item is string => typeof item === 'string').join(' ');
    }
    return fallback;
  }
}
