import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { ApiService, Page } from '../../core/api/api.service';
import { Vendor, VendorImportResult, VendorLookup } from './vendor';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private api = inject(ApiService);

  list(
    params: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      q?: string;
    } = {},
  ): Observable<Page<Vendor>> {
    return this.api.page<Vendor>('/vendors', params);
  }

  lookup(q: string): Observable<VendorLookup[]> {
    return this.api.get<VendorLookup[]>('/vendors/lookup', { q, limit: 20 });
  }

  get(vendaccount: string): Observable<Vendor> {
    return this.api.get<Vendor>(`/vendors/${encodeURIComponent(vendaccount)}`);
  }

  create(data: { vendaccount: string; name: string }): Observable<Vendor> {
    return this.api.post<Vendor>('/vendors', data);
  }

  update(vendaccount: string, data: { name: string }): Observable<Vendor> {
    return this.api.put<Vendor>(`/vendors/${encodeURIComponent(vendaccount)}`, data);
  }

  delete(vendaccount: string): Observable<void> {
    return this.api.delete(`/vendors/${encodeURIComponent(vendaccount)}`);
  }

  // The API takes the raw CSV text (text/csv), not multipart form data.
  importCsv(file: File): Observable<VendorImportResult> {
    return from(file.text()).pipe(
      switchMap((text) => this.api.postText<VendorImportResult>('/vendors/import', text)),
    );
  }
}
