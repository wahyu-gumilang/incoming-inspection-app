import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  InspectionDetail,
  InspectionLine,
  InspectionOtherLine,
} from '../../../core/models/inspection';
import { JUDGMENT, LINE_STATUS } from '../../../shared/judgement';
import { AqlService } from '../../aql/aql.service';
import { InspectionService } from '../inspection.service';
import { DeliveryDialogComponent } from './delivery-dialog.component';

const NULLS = {
  actual_1: null,
  actual_2: null,
  actual_3: null,
  actual_4: null,
  actual_5: null,
  actual_6: null,
  actual_7: null,
  status_1: null,
  status_2: null,
  status_3: null,
  status_4: null,
  status_5: null,
  status_6: null,
  status_7: null,
};

function std(linenum: number, item: string, values: Partial<InspectionLine>): InspectionLine {
  return {
    inspectnum: 'INS-000003',
    linenum,
    inspecttype: 'STD',
    inspectitem: item,
    standard_txt: '12.5',
    standard: 12.5,
    tolerance: 0.4,
    tolerance_txt: '0.4',
    tolerance_plus: 0.4,
    tolerance_minus: 0.4,
    ...NULLS,
    mode: 'RANGE',
    ...values,
  } as InspectionLine;
}

function other(linenum: number, item: string): InspectionOtherLine {
  return {
    inspectnum: 'INS-000003',
    linenum,
    inspecttype: 'VISUAL',
    inspectitem: item,
    standard_txt: null,
    actual_txt_1: null,
    actual_txt_2: null,
    actual_txt_3: null,
    actual_txt_4: null,
    actual_txt_5: null,
    actual_txt_6: null,
    actual_txt_7: null,
    status_1: null,
    status_2: null,
    status_3: null,
    status_4: null,
    status_5: null,
    status_6: null,
    status_7: null,
  };
}

const detail: InspectionDetail = {
  inspectnum: 'INS-000003',
  inspectdate: '2026-10-01',
  itemid: '000-228',
  itemname: 'Handle Rhino Prima',
  accountnum: 'V-0001',
  name: 'PT Sinar Logam Abadi',
  inspectstatus: 'DRAFT',
  instrument: null,
  qfnum: null,
  inspectby: 'Budi Santoso',
  inspectbyid: 2,
  checkedby: null,
  aqlplanid: 1,
  created_at: '2026-10-01T08:00:00.000Z',
  updated_at: '2026-10-01T08:00:00.000Z',
  deliveryCount: 1,
  totalReceived: 50,
  editable: true,
  deliveries: [
    {
      n: 1,
      used: true,
      purchordernum: '33932',
      deliverydate: '2026-09-15',
      qty_received: 50,
      inspectcategory: 1,
      notgood: 0,
      judgment: JUDGMENT.ACCEPTED,
      concessionnote: null,
      samplesize: 2,
      acceptnum: 0,
      rejectnum: 1,
      ngCells: 0,
      suggestedJudgment: JUDGMENT.ACCEPTED,
    },
  ],
  lines: [
    std(1, 'A', { actual_1: 12.6, status_1: LINE_STATUS.OK }),
    std(2, 'B', {
      standard_txt: 'Ø16',
      standard: 16,
      tolerance_txt: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
      actual_1: 16.12,
      status_1: LINE_STATUS.OK,
    }),
  ],
  otherLines: [other(10, 'Black')],
};

const plan = {
  planid: 1,
  lot: 50,
  inspectcategory: 1,
  codeletter: 'A',
  samplesize: 2,
  acceptnum: 0,
  rejectnum: 1,
  fullInspection: false,
};

describe('DeliveryDialogComponent', () => {
  // jsdom has no <dialog> methods; the shared modal calls these.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  function setup() {
    const saveDelivery = vi.fn(() => of(detail));
    const lookup = vi.fn(() => of(plan));

    TestBed.configureTestingModule({
      imports: [DeliveryDialogComponent],
      providers: [
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: AqlService, useValue: { lookup } },
        { provide: InspectionService, useValue: { saveDelivery } },
      ],
    });

    const fixture = TestBed.createComponent(DeliveryDialogComponent);
    fixture.componentRef.setInput('detail', detail);
    fixture.componentRef.setInput('editN', 1);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, saveDelivery, lookup };
  }

  it('loads the column, marks an out-of-tolerance value NG and saves it', async () => {
    const { fixture, component, saveDelivery, lookup } = setup();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(lookup).toHaveBeenCalledWith(50, 1, 1);
    expect(component.aql()?.samplesize).toBe(2);

    component.next();
    fixture.detectChanges();
    expect(component.step()).toBe(2);

    component.setActual(2, '16.35');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.actual-input.ng')).toHaveLength(1);

    component.next();
    fixture.detectChanges();
    expect(component.step()).toBe(3);
    expect(component.draft()?.notgood).toBe(1);
    expect(component.choice(JUDGMENT.ACCEPTED)?.enabled).toBe(false);

    const saved = vi.fn();
    component.saved.subscribe(saved);
    await component.save();

    expect(saveDelivery).toHaveBeenCalledWith(
      'INS-000003',
      1,
      expect.objectContaining({
        purchordernum: '33932',
        qty_received: 50,
        notgood: 1,
        judgment: JUDGMENT.REJECTED,
      }),
    );
    expect(component.open()).toBe(false);
    expect(saved).toHaveBeenCalledWith(detail);
  });

  it('refuses Accepted above Ac without calling the server', async () => {
    const { fixture, component, saveDelivery } = setup();
    await fixture.whenStable();
    fixture.detectChanges();

    component.next();
    component.next();
    component.setNotgood(2);
    component.setJudgment(JUDGMENT.ACCEPTED);
    await component.save();

    expect(saveDelivery).not.toHaveBeenCalled();
    expect(component.problems().join(' ')).toContain("can't be Accepted");
  });
});
