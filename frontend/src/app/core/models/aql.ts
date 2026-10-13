export interface AqlPlan {
  planid: number;
  name: string;
  inspectlevel: string;
  aql: string;
  isdefault: boolean;
  note: string | null;
  updated_at: string;
}

export interface AqlPlanRow {
  planid: number;
  inspectcategory: number;
  lotmin: number;
  lotmax: number | null;
  codeletter: string;
  samplesize: number;
  acceptnum: number;
  rejectnum: number;
}

export interface AqlLookup {
  codeletter: string;
  samplesize: number;
  acceptnum: number;
  rejectnum: number;
  fullInspection: boolean;
}
