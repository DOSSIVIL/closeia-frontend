import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ManagedRole, RolePayload, RolesResponse, RoleUpdatePayload } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  list(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(this.base);
  }

  create(payload: RolePayload): Observable<ManagedRole> {
    return this.http.post<ManagedRole>(this.base, payload);
  }

  update(id: string, payload: RoleUpdatePayload): Observable<ManagedRole> {
    return this.http.patch<ManagedRole>(`${this.base}/${id}`, payload);
  }
}
