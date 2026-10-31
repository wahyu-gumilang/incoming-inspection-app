import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Page } from '../../core/api/api.service';
import { InspectType, ItemDetail } from '../../core/models/item';
import { ItemRow, StandardInput } from './item';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly api = inject(ApiService);

  list(
    params: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      q?: string;
      hasStandards?: boolean;
    } = {},
  ): Observable<Page<ItemRow>> {
    return this.api.page<ItemRow>('/items', params);
  }

  get(itemid: string): Observable<ItemDetail> {
    return this.api.get<ItemDetail>(`/items/${encodeURIComponent(itemid)}`);
  }

  create(data: { itemid: string; name: string }): Observable<ItemDetail> {
    return this.api.post<ItemDetail>('/items', data);
  }

  rename(itemid: string, name: string): Observable<ItemDetail> {
    return this.api.put<ItemDetail>(`/items/${encodeURIComponent(itemid)}`, { name });
  }

  addStandard(itemid: string, standard: StandardInput): Observable<ItemDetail> {
    return this.api.post<ItemDetail>(
      `/items/${encodeURIComponent(itemid)}/inspect-items`,
      standard,
    );
  }

  updateStandard(itemid: string, standard: StandardInput): Observable<ItemDetail> {
    return this.api.put<ItemDetail>(`/items/${encodeURIComponent(itemid)}/inspect-items`, standard);
  }

  deleteStandard(itemid: string, inspecttype: InspectType, inspectitem: string): Observable<void> {
    return this.api.delete(
      `/items/${encodeURIComponent(itemid)}/inspect-items?inspecttype=${encodeURIComponent(inspecttype)}&inspectitem=${encodeURIComponent(inspectitem)}`,
    );
  }
}
