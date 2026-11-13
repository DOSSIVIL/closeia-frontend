export type DocumentScope = 'PLATFORM' | 'SCHOOL' | 'ASSIGNED_SPACES' | 'OWN_DOCUMENTS';

export interface ManagedRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  documentScopes: DocumentScope[];
  assignmentCount: number;
  updatedAt: string;
}

export interface RolesResponse {
  data: ManagedRole[];
  permissions: string[];
  documentScopes: DocumentScope[];
}

export interface RolePayload {
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  documentScopes: DocumentScope[];
}

export type RoleUpdatePayload = Omit<RolePayload, 'code'>;

export interface PermissionOption {
  code: string;
  label: string;
  group: string;
}

export interface DocumentScopeOption {
  code: Exclude<DocumentScope, 'PLATFORM'>;
  label: string;
  description: string;
}
