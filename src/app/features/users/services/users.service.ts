import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ManagedUser,
  ManagedUserCreation,
  ManagedUserPayload,
  ManagedUserUpdate,
  UserStatus,
  UsersPage,
  UsersQuery,
  AssignableRole,
  UserImportReport,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  list(query: UsersQuery): Observable<UsersPage> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.schoolId) params = params.set('schoolId', query.schoolId);
    return this.http.get<UsersPage>(this.base, { params });
  }

  listAssignableRoles(): Observable<AssignableRole[]> {
    return this.http.get<AssignableRole[]>(`${this.base}/roles`);
  }

  create(payload: ManagedUserPayload): Observable<ManagedUserCreation> {
    return this.http.post<ManagedUserCreation>(this.base, payload);
  }

  import(file: File, schoolId: string): Observable<UserImportReport> {
    const body = new FormData();
    body.append('file', file);
    body.append('schoolId', schoolId);
    return this.http.post<UserImportReport>(`${this.base}/import`, body);
  }

  update(id: string, payload: ManagedUserUpdate): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, status: UserStatus): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.base}/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
