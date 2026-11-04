import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Etablissement,
  EtablissementPayload,
  EtablissementQuery,
  Paginated,
} from '../models/etablissement.model';

@Injectable({ providedIn: 'root' })
export class EtablissementsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/etablissements`;

  list(q: EtablissementQuery): Observable<Paginated<Etablissement>> {
    let params = new HttpParams().set('page', q.page).set('limit', q.limit);
    if (q.search) params = params.set('search', q.search);
    if (q.actif !== undefined) params = params.set('actif', q.actif);
    return this.http.get<Paginated<Etablissement>>(this.base, { params });
  }

  create(payload: EtablissementPayload): Observable<Etablissement> {
    return this.http.post<Etablissement>(this.base, payload);
  }

  update(id: string, payload: Partial<EtablissementPayload>): Observable<Etablissement> {
    return this.http.patch<Etablissement>(`${this.base}/${id}`, payload);
  }

  setStatut(id: string, actif: boolean): Observable<Etablissement> {
    return this.http.patch<Etablissement>(`${this.base}/${id}/statut`, { actif });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadLogo(id: string, file: File): Observable<Etablissement> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<Etablissement>(`${this.base}/${id}/logo`, form);
  }

  removeLogo(id: string): Observable<Etablissement> {
    return this.http.delete<Etablissement>(`${this.base}/${id}/logo`);
  }
}