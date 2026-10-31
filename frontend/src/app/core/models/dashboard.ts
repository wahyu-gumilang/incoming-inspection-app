export interface DashboardKpis {
  inspections: number;
  ngRate: number; // 0..1 fraction of judged deliveries with NG pieces
  waiting: number;
  waitingOld: number;
  acceptedRate: number; // 0..1 fraction of accepted+concession qty
}

export interface ChartPoint {
  month: string; // YYYY-MM
  inspections: number;
  ng: number;
}

export interface NgSupplier {
  supplier: string;
  deliveries: number;
  ng: number;
}

export interface RecentInspection {
  inspectnum: string;
  inspectdate: string | null;
  itemname: string | null;
  supplier: string | null;
  status: string;
  ng: number;
  judged: number;
}

export interface WaitingInspection {
  inspectnum: string;
  itemname: string | null;
  supplier: string | null;
  ng: number;
  inspectby: string | null;
  created_at: string | null;
}

export interface DraftInspection {
  inspectnum: string;
  itemname: string | null;
  ng: number;
}

export interface DashboardStats {
  kpis: DashboardKpis;
  chart: ChartPoint[];
  bySupplier: NgSupplier[];
  recent: RecentInspection[];
  waiting: WaitingInspection[];
  drafts: DraftInspection[];
}
