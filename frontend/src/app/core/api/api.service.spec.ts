import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError } from './api-error';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefixes the API base URL and unwraps data', async () => {
    const result = firstValueFrom(api.get<{ itemid: string }>('/items/000-228'));

    http.expectOne('/api/items/000-228').flush({ success: true, data: { itemid: '000-228' } });

    expect(await result).toEqual({ itemid: '000-228' });
  });

  it('returns rows and meta for a list and leaves out empty query values', async () => {
    const result = firstValueFrom(api.page('/vendors', { q: '', page: 2, sort: undefined }));

    const req = http.expectOne((r) => r.url === '/api/vendors');
    expect(req.request.params.keys()).toEqual(['page']);
    const meta = { page: 2, limit: 20, total: 21, totalPages: 2 };
    req.flush({ success: true, data: [{ vendaccount: 'V-0001' }], meta });

    expect(await result).toEqual({ rows: [{ vendaccount: 'V-0001' }], meta });
  });

  it('accepts a 204 reply without a body', async () => {
    const result = firstValueFrom(api.post<void>('/auth/logout'));

    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });

    expect(await result).toBeUndefined();
  });

  it('sends a raw text body for CSV import', async () => {
    const result = firstValueFrom(
      api.postText<{ created: number }>('/vendors/import', 'V-0001,PT Supplier'),
    );

    const req = http.expectOne((r) => r.url === '/api/vendors/import' && r.method === 'POST');
    expect(req.request.body).toBe('V-0001,PT Supplier');
    expect(req.request.headers.get('Content-Type')).toContain('text/csv');
    req.flush({ success: true, data: { created: 1 } });

    expect(await result).toEqual({ created: 1 });
  });

  it('turns an error reply into an ApiError with the field details', async () => {
    const result = firstValueFrom(api.post('/vendors', {})).catch((e: unknown) => e);

    http.expectOne('/api/vendors').flush(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [{ field: 'name', message: 'is required' }],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const err = (await result) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.fieldMessage('name')).toBe('is required');
  });
});
