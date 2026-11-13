export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  school: { id: string; name: string } | null;
  roles: { code: string; name: string }[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ManagedUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  roleCode: string;
  password?: string;
}

export interface AssignableRole {
  code: string;
  name: string;
  description: string | null;
}

export interface ManagedUserCreation extends ManagedUser {
  welcomeEmailSent: boolean;
}

export interface UserImportResult {
  rowNumber: number;
  email: string;
  status: 'CREATED' | 'CREATED_EMAIL_FAILED' | 'FAILED';
  message: string;
}

export interface UserImportReport {
  total: number;
  created: number;
  failed: number;
  emailFailed: number;
  results: UserImportResult[];
}

export interface ManagedUserUpdate {
  firstName: string;
  lastName: string;
}

export interface UsersQuery {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
  schoolId?: string;
}

export interface UsersPage {
  data: ManagedUser[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  stats: { total: number; active: number; invited: number; suspended: number };
}
