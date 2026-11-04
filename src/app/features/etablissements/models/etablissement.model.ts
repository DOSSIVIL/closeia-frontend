export interface Etablissement {
  id: string;
  nom: string;
  sigle: string;
  domaineEmail: string;
  description: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  emailContact: string | null;
  siteWeb: string | null;
  logoUrl: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EtablissementPayload {
  nom: string;
  sigle: string;
  domaineEmail: string;
  description?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  emailContact?: string;
  siteWeb?: string;
  actif?: boolean;
}

export interface EtablissementQuery {
  page: number;
  limit: number;
  search?: string;
  actif?: boolean;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}