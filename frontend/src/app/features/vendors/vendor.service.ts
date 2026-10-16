import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { VendorListResponse, VendorResponse } from './vendor';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private api = inject(ApiService);

  list(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    q?: string;
  } = {}) {
    return this.api.get<VendorListResponse>('/vendors', params);
  }

  lookup(q: string) {
    return this.api.get<VendorListResponse>('/vendors/lookup', { q, limit: 20 });
  }

  get(vendaccount: string) {
    return this.api.get<VendorResponse>(`/vendors/${encodeURIComponent(vendaccount)}`);
  }

  create(data: { vendaccount: string; name: string }) {
    return this.api.post<VendorResponse>('/vendors', data);
  }

  update(vendaccount: string, data: { name: string }) {
    return this.api.put<VendorResponse>(`/vendors/${encodeURIComponent(vendaccount)}`, data);
  }

  delete(vendaccount: string) {
    return this.api.delete(`/vendors/${encodeURIComponent(vendaccount)}`);
  }

  importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    // Angular sets the multipart Content-Type (with boundary) from the FormData body.
    return this.api.post<VendorListResponse>('/vendors/import', formData);
  }
}
