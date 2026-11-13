import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Assignment,
  AssignmentPayload,
  AssignmentQuery,
  AssignmentsPage,
  AssignmentRole,
} from '../models/assignment.model';

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/assignments`;

  list(query: AssignmentQuery): Observable<AssignmentsPage> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.schoolId) params = params.set('schoolId', query.schoolId);
    if (query.roleCode) params = params.set('roleCode', query.roleCode);
    return this.http.get<AssignmentsPage>(this.base, { params });
  }

  listRoles(): Observable<AssignmentRole[]> {
    return this.http.get<AssignmentRole[]>(`${this.base}/roles`);
  }

  create(payload: AssignmentPayload): Observable<Assignment> {
    return this.http.post<Assignment>(this.base, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
