export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  schoolId?: string;
}

export interface Session {
  accessToken: string;
  user: AuthUser;
}