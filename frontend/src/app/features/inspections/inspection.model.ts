import {
  InspectionDetail,
  InspectionListItem,
  InspectStatus,
  Judgment as CoreJudgment,
} from '../../core/models/inspection';

export type { InspectionDetail, InspectionListItem, CoreJudgment, InspectStatus };
export type Judgment = CoreJudgment;

export interface ItemRef {
  itemid: string;
  name: string;
}

export interface VendorRef {
  vendaccount: string;
  name: string;
}

export interface ItemDetailLike {
  itemid: string;
  name: string;
  standardCounts?: Record<string, number>;
  warningCount?: number;
}

export const JudgmentLabel: Record<number, string> = {
  0: '—',
  1: 'O · Accepted',
  2: 'X · Rejected',
  3: 'C · Concession',
};

export const JudgmentMark: Record<number, string> = {
  0: '—',
  1: 'O',
  2: 'X',
  3: 'C',
};

export const InspectionStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Waiting for check',
  CHECKED: 'Checked',
};

export interface NewInspectionInput {
  itemid: string;
  accountnum: string;
  inspectdate: string;
  instrument?: string | null;
  qfnum?: string | null;
}

export const CATEGORY_LABEL: Record<number, string> = {
  0: '100 %',
  1: 'N',
  2: 'R',
  3: 'T',
};
