import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { VendorService } from './vendor.service';

describe('VendorService', () => {
  let service: VendorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VendorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() returns rows and meta, not the envelope', async () => {
    const result = firstValueFrom(service.list({ page: 2, q: 'metal' }));

    const req = http.expectOne((r) => r.url === '/api/vendors');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('q')).toBe('metal');
    const meta = { page: 2, limit: 20, total: 21, totalPages: 2 };
    req.flush({
      success: true,
      data: [{ vendaccount: 'V-0001', name: 'PT Supplier', inspectionCount: 0 }],
      meta,
    });

    expect(await result).toEqual({
      rows: [{ vendaccount: 'V-0001', name: 'PT Supplier', inspectionCount: 0 }],
      meta,
    });
  });

  it('lookup() returns the array directly', async () => {
    const result = firstValueFrom(service.lookup('sin'));

    const req = http.expectOne((r) => r.url === '/api/vendors/lookup');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({
      success: true,
      data: [{ vendaccount: 'V-0001', name: 'PT Sinar Logam Abadi' }],
    });

    expect(await result).toEqual([{ vendaccount: 'V-0001', name: 'PT Sinar Logam Abadi' }]);
  });

  it('importCsv() posts the file text as text/csv', async () => {
    const file = new File(['V-0001,PT Supplier\n'], 'vendors.csv', { type: 'text/csv' });
    const result = firstValueFrom(service.importCsv(file));

    // File.text() resolves on a microtask before the request goes out.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const req = http.expectOne((r) => r.url === '/api/vendors/import' && r.method === 'POST');
    expect(req.request.body).toBe('V-0001,PT Supplier\n');
    expect(req.request.headers.get('Content-Type')).toContain('text/csv');
    req.flush({ success: true, data: { created: 1, skipped: [] } });

    expect(await result).toEqual({ created: 1, skipped: [] });
  });
});
