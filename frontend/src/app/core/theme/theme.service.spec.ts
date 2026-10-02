import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { fakeUser, signIn } from '../../testing/users';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('iqc-theme');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const applied = () => document.documentElement.dataset['theme'];

  it('starts light and remembers a choice in this browser', async () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(applied()).toBe('light');

    await theme.set('dark');
    TestBed.tick();
    expect(applied()).toBe('dark');
    expect(localStorage.getItem('iqc-theme')).toBe('dark');
  });

  it("takes the signed-in user's theme and saves changes on the account", async () => {
    const theme = TestBed.inject(ThemeService);
    await signIn(TestBed.inject(AuthService), http, fakeUser({ theme: 'dark' }));
    TestBed.tick();
    expect(theme.mode()).toBe('dark');
    expect(applied()).toBe('dark');

    const saved = theme.set('light');
    const req = http.expectOne('/api/auth/me');
    expect(req.request.body).toEqual({ theme: 'light' });
    req.flush({ success: true, data: fakeUser({ theme: 'light' }) });
    await saved;
    TestBed.tick();
    expect(applied()).toBe('light');
  });
});
