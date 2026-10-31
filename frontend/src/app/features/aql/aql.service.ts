import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AqlPlan, AqlPlanRow, AqlLookup } from '../../core/models/aql';

export interface AqlPlanWithCategories extends AqlPlan {
  categories: number[];
}

export interface AqlPlanDetail extends AqlPlan {
  rows: AqlPlanRow[];
}

export type AqlRowInput = Pick<AqlPlanRow, 'lotmin' | 'lotmax' | 'codeletter' | 'samplesize' | 'acceptnum' | 'rejectnum'>;

@Injectable({ providedIn: 'root' })
export class AqlService {
  private readonly api = inject(ApiService);

  listPlans() {
    return this.api.get<AqlPlanWithCategories[]>('/aql/plans');
  }

  getPlan(planId: number) {
    return this.api.get<AqlPlanDetail>(`/aql/plans/${planId}`);
  }

  lookup(lot: number, category: number, planId?: number) {
    return this.api.get<AqlLookup>('/aql/lookup', { lot, category, planId });
  }

  replaceRows(planId: number, inspectcategory: number, rows: AqlRowInput[]) {
    return this.api.put<AqlPlanDetail>(`/aql/plans/${planId}/rows`, { inspectcategory, rows });
  }

  setDefault(planId: number) {
    return this.api.put<AqlPlanDetail>(`/aql/plans/${planId}/default`);
  }
}
