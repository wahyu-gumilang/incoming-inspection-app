import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ItemService } from './item.service';

describe('ItemService', () => {
  let service: ItemService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ItemService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() returns rows and meta, not the envelope', async () => {
    const result = firstValueFrom(service.list({ page: 1, q: 'handle', hasStandards: true }));

    const req = http.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('hasStandards')).toBe('true');
    expect(req.request.params.get('q')).toBe('handle');
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    req.flush({
      success: true,
      data: [
        {
          itemid: '000-228',
          name: 'Handle Rhino Prima',
          standardCounts: { STD: 3, VISUAL: 3, FITTING: 1 },
          warningCount: 0,
        },
      ],
      meta,
    });

    expect(await result).toEqual({
      rows: [
        {
          itemid: '000-228',
          name: 'Handle Rhino Prima',
          standardCounts: { STD: 3, VISUAL: 3, FITTING: 1 },
          warningCount: 0,
        },
      ],
      meta,
    });
  });
});
