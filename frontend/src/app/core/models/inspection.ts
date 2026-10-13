import { InspectType } from './item';

export type InspectStatus = 'DRAFT' | 'SUBMITTED' | 'CHECKED';
export type InspectCategory = 0 | 1 | 2 | 3; // 0=100%, 1=N, 2=R, 3=T
export type Judgment = 0 | 1 | 2 | 3; // 0=not judged, 1=Accepted, 2=Rejected, 3=Concession
export type LineStatus = 0 | 1 | null; // 0=NG, 1=OK, null=not measured

export interface InspectionHeader {
  inspectnum: string;
  inspectdate: string;
  itemid: string;
  itemname: string;
  accountnum: string;
  name: string;
  inspectstatus: InspectStatus;
  instrument: string | null;
  qfnum: string | null;
  inspectby: string | null;
  inspectbyid: number | null;
  checkedby: string | null;
  aqlplanid: number | null;
  created_at: string;
  updated_at: string;
  // Computed
  deliveryCount?: number;
  totalReceived?: number;
  editable?: boolean;
}

export interface InspectionLine {
  inspectnum: string;
  linenum: number;
  inspecttype: InspectType;
  inspectitem: string;
  standard_txt: string | null;
  standard: number | null;
  tolerance: number | null;
  tolerance_txt: string | null;
  tolerance_plus: number | null;
  tolerance_minus: number | null;
  actual_1: number | null;
  actual_2: number | null;
  actual_3: number | null;
  actual_4: number | null;
  actual_5: number | null;
  actual_6: number | null;
  actual_7: number | null;
  status_1: LineStatus;
  status_2: LineStatus;
  status_3: LineStatus;
  status_4: LineStatus;
  status_5: LineStatus;
  status_6: LineStatus;
  status_7: LineStatus;
  mode?: string;
}

export interface InspectionOtherLine {
  inspectnum: string;
  linenum: number;
  inspecttype: InspectType;
  inspectitem: string;
  standard_txt: string | null;
  actual_txt_1: string | null;
  actual_txt_2: string | null;
  actual_txt_3: string | null;
  actual_txt_4: string | null;
  actual_txt_5: string | null;
  actual_txt_6: string | null;
  actual_txt_7: string | null;
  status_1: LineStatus;
  status_2: LineStatus;
  status_3: LineStatus;
  status_4: LineStatus;
  status_5: LineStatus;
  status_6: LineStatus;
  status_7: LineStatus;
}

export interface DeliveryInfo {
  n: number; // 1-7
  used: boolean;
  purchordernum: string | null;
  deliverydate: string | null;
  qty_received: number | null;
  inspectcategory: InspectCategory;
  notgood: number | null;
  judgment: Judgment;
  concessionnote: string | null;
  samplesize: number | null;
  acceptnum: number | null;
  rejectnum: number | null;
  ngCells: number;
  suggestedJudgment: Judgment;
}

export interface InspectionDetail extends InspectionHeader {
  lines: InspectionLine[];
  otherLines: InspectionOtherLine[];
  deliveries: DeliveryInfo[];
}

export interface InspectionListItem {
  inspectnum: string;
  inspectdate: string;
  itemid: string;
  itemname: string;
  name: string;
  inspectstatus: InspectStatus;
  deliveryCount: number;
  ngPieces: number;
  judgments: Judgment[];
}
