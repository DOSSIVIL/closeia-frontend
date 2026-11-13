export interface AssignmentRole {
  code: string;
  name: string;
  description: string | null;
}

export interface AssignmentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface AssignmentSchool {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  createdAt: string;
  user: AssignmentUser;
  role: AssignmentRole;
  school: AssignmentSchool;
}

export interface AssignmentPayload {
  userId: string;
  roleCode: string;
  schoolId: string;
}

export interface AssignmentQuery {
  page: number;
  limit: number;
  search?: string;
  schoolId?: string;
  roleCode?: string;
}

export interface AssignmentsPage {
  data: Assignment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  stats: { total: number; schoolAdmins: number; staff: number; students: number; guests: number };
}
