import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { InspectType, ItemDetail } from '../../core/models/item';
import { ItemListResponse, StandardInput } from './item';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly api = inject(ApiService);

  list(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    q?: string;
    hasStandards?: boolean;
  } = {}) {
    return this.api.get<ItemListResponse>('/items', params);
  }

  get(itemid: string) {
    return this.api.get<ItemDetail>(`/items/${encodeURIComponent(itemid)}`);
  }

  create(data: { itemid: string; name: string }) {
    return this.api.post<ItemDetail>('/items', data);
  }

  rename(itemid: string, name: string) {
    return this.api.put<ItemDetail>(`/items/${encodeURIComponent(itemid)}`, { name });
  }

  addStandard(itemid: string, standard: StandardInput) {
    return this.api.post<ItemDetail>(`/items/${encodeURIComponent(itemid)}/inspect-items`, standard);
  }

  updateStandard(itemid: string, standard: StandardInput) {
    return this.api.put<ItemDetail>(`/items/${encodeURIComponent(itemid)}/inspect-items`, standard);
  }

  deleteStandard(itemid: string, inspecttype: InspectType, inspectitem: string) {
    return this.api.delete(
      `/items/${encodeURIComponent(itemid)}/inspect-items?inspecttype=${encodeURIComponent(inspecttype)}&inspectitem=${encodeURIComponent(inspectitem)}`,
    );
  }
}