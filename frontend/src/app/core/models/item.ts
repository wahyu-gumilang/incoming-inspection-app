export interface Item {
  itemid: string;
  name: string;
  inspectqty: number;
  standardCounts?: Record<string, number>;
  warningCount?: number;
}

export interface ItemLookup {
  itemid: string;
  name: string;
}

export type InspectType = 'STD' | 'VISUAL' | 'FITTING' | 'CERTIFIKAT';

export interface InspectItem {
  itemid: string;
  itemname: string;
  inspecttype: InspectType;
  inspectitem: string;
  standard_txt: string | null;
  standard: number | null;
  tolerance: string | null;
  tolerance_plus: number | null;
  tolerance_minus: number | null;
  mode?: string; // RANGE | MIN | MAX | MANUAL (computed)
  warnings?: string[];
}

export interface ItemDetail extends Item {
  inspectItems: InspectItem[];
}
