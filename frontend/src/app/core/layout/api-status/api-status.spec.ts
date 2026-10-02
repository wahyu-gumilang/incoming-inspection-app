import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiStatus } from './api-status';

describe('ApiStatus', () => {
  let http: HttpTestingController;

  async function render(respond: (http: HttpTestingController) => void): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ApiStatus);
    fixture.detectChanges();
    respond(http);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.api-status') as HTMLElement;
  }

  const health = (db: string) => ({
    success: true,
    data: {
      status: 'ok',
      service: 'incoming-inspection-api',
      db,
      timestamp: new Date().toISOString(),
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApiStatus],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reports a connected API and database', async () => {
    const el = await render((h) => h.expectOne('/api/health').flush(health('connected')));

    expect(el.classList).toContain('ok');
    expect(el.textContent).toContain('API connected');
  });

  it('reports a database outage reported by the API', async () => {
    const el = await render((h) =>
      h.expectOne('/api/health').flush(health('disconnected: ETIMEDOUT')),
    );

    expect(el.classList).toContain('db-down');
    expect(el.textContent).toContain('Database disconnected');
  });

  it('reports an unreachable API', async () => {
    const el = await render((h) =>
      h.expectOne('/api/health').flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }),
    );

    expect(el.classList).toContain('api-down');
    expect(el.textContent).toContain('API unreachable');
  });
});
