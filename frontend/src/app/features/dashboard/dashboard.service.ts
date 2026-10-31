import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { DashboardStats } from '../../core/models/dashboard';

export type DashboardPeriod = 'month' | '90d' | 'quarter' | 'year';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  stats(period: DashboardPeriod = 'month') {
    return this.api.get<DashboardStats>('/inspections/stats', { period });
  }
}
