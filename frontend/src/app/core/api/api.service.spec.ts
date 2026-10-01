import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
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
});
