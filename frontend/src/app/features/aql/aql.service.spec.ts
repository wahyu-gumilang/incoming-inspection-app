import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AqlService, AqlRowInput } from './aql.service';
import { AqlPlanDetail } from './aql.service';

const basePlan: AqlPlanDetail = {
  planid: 1,
  name: 'Current practice',
  inspectlevel: 'S-1',
  aql: '0',
  isdefault: true,
  note: null,
  updated_at: '2026-10-01T08:00:00.000Z',
  rows: [
    { planid: 1, inspectcategory: 1, lotmin: 2, lotmax: 50, codeletter: 'A', samplesize: 2, acceptnum: 0, rejectnum: 1 },
    { planid: 1, inspectcategory: 1, lotmin: 51, lotmax: 500, codeletter: 'B', samplesize: 3, acceptnum: 0, rejectnum: 1 },
  ],
};

describe('AqlService', () => {
  let service: AqlService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AqlService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listPlans() returns the plan list', async () => {
    const result = firstValueFrom(service.listPlans());

    const req = http.expectOne('/api/aql/plans');
    req.flush({ success: true, data: [{ ...basePlan, categories: [1, 2, 3] }] });

    const plans = await result;
    expect(plans[0].planid).toBe(1);
    expect(plans[0].name).toBe('Current practice');
  });

  it('getPlan() fetches a plan with its rows', async () => {
    const result = firstValueFrom(service.getPlan(1));

    const req = http.expectOne('/api/aql/plans/1');
    req.flush({ success: true, data: basePlan });

    const plan = await result;
    expect(plan.rows).toHaveLength(2);
    expect(plan.rows[0].samplesize).toBe(2);
    expect(plan.rows[0].samplesize).toBe(2);
  });

  it('lookup() sends lot and category', async () => {
    const result = firstValueFrom(service.lookup(100, 1, 1));

    const req = http.expectOne((r) => r.url === '/api/aql/lookup' && r.method === 'GET');
    expect(req.request.params.get('lot')).toBe('100');
    expect(req.request.params.get('category')).toBe('1');
    expect(req.request.params.get('planId')).toBe('1');
    req.flush({
      success: true,
      data: { codeletter: 'B', samplesize: 3, acceptnum: 0, rejectnum: 1, fullInspection: false },
    });

    const res = await result;
    expect(res.samplesize).toBe(3);
  });

  it('replaceRows() PUTs the new rows for a category', async () => {
    const rows: AqlRowInput[] = [
      { lotmin: 2, lotmax: 50, codeletter: 'A', samplesize: 2, acceptnum: 0, rejectnum: 1 },
      { lotmin: 51, lotmax: null, codeletter: 'B', samplesize: 3, acceptnum: 0, rejectnum: 1 },
    ];
    const result = firstValueFrom(service.replaceRows(1, 1, rows));

    const req = http.expectOne('/api/aql/plans/1/rows');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ inspectcategory: 1, rows });
    req.flush({ success: true, data: basePlan });

    const res = await result;
    expect(res.planid).toBe(1);
  });

  it('setDefault() PUTs the default plan', async () => {
    const result = firstValueFrom(service.setDefault(2));

    const req = http.expectOne('/api/aql/plans/2/default');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: { ...basePlan, planid: 2, isdefault: true } });

    const res = await result;
    expect(res.isdefault).toBe(true);
  });
});
