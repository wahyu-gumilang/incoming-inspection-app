import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Page } from '../../core/api/api.service';
import { InspectionDetail } from '../../core/models/inspection';
import { InspectionListItem, Judgment, NewInspectionInput } from './inspection.model';

export interface InspectionListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  item?: string;
  vendor?: string;
  status?: string;
  judgment?: number;
}

export interface UpdateHeaderInput {
  accountnum?: string;
  inspectdate?: string;
  instrument?: string | null;
  qfnum?: string | null;
}

export interface DeliveryLineInput {
  linenum: number;
  actual: number | string | null;
  status: 0 | 1 | null;
}

export interface OtherLineInput {
  linenum: number;
  actual_txt: string | null;
  status: 0 | 1 | null;
}

export interface DeliveryInput {
  purchordernum: string;
  deliverydate: string;
  qty_received: number;
  inspectcategory: 0 | 1 | 2 | 3;
  lines: DeliveryLineInput[];
  otherLines: OtherLineInput[];
  notgood: number;
  judgment: Judgment;
  concessionnote: string;
}

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private readonly api = inject(ApiService);

  list(params: InspectionListParams = {}): Observable<Page<InspectionListItem>> {
    const query: Record<string, string | number | boolean | null | undefined> = { ...params };
    return this.api.page<InspectionListItem>('/inspections', query);
  }

  get(inspectnum: string): Observable<InspectionDetail> {
    return this.api.get<InspectionDetail>(`/inspections/${encodeURIComponent(inspectnum)}`);
  }

  create(data: NewInspectionInput): Observable<InspectionDetail> {
    return this.api.post<InspectionDetail>('/inspections', data);
  }

  updateHeader(inspectnum: string, data: UpdateHeaderInput): Observable<InspectionDetail> {
    return this.api.put<InspectionDetail>(
      `/inspections/${encodeURIComponent(inspectnum)}`,
      data,
    );
  }

  remove(inspectnum: string): Observable<void> {
    return this.api.delete(`/inspections/${encodeURIComponent(inspectnum)}`);
  }

  saveDelivery(inspectnum: string, n: number, data: DeliveryInput): Observable<InspectionDetail> {
    return this.api.put<InspectionDetail>(
      `/inspections/${encodeURIComponent(inspectnum)}/deliveries/${n}`,
      data,
    );
  }

  removeDelivery(inspectnum: string, n: number): Observable<void> {
    return this.api.delete(`/inspections/${encodeURIComponent(inspectnum)}/deliveries/${n}`);
  }
}
