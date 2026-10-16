import { InspectType } from '../../core/models/item';

// List row returned by GET /api/items. `standardCounts` has every inspect type
// (STD, CERTIFIKAT, VISUAL, FITTING); `warningCount` is the number of doubtful standards.
export interface ItemRow {
  itemid: string;
  name: string;
  standardCounts: Record<string, number>;
  warningCount: number;
}

export interface ItemListResponse {
  success: boolean;
  data: ItemRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// A standard the user adds/updates through the form dialog. Mirrors the backend
// validator: numbers are decimal(18,2); STD requires a numeric `standard`.
export interface StandardInput {
  inspecttype: InspectType;
  inspectitem: string;
  standard_txt: string;
  standard: number | null;
  tolerance: string;
  tolerance_plus: number;
  tolerance_minus: number;
}