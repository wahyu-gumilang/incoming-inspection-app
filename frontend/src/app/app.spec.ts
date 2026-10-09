import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { sessionExpiredInterceptor } from './core/auth/session-expired.interceptor';
import { PageTitleStrategy } from './core/layout/page-title-strategy';
import { fakeUser, signIn } from './testing/users';

// Each test lazy-loads routes through the whole shell; that takes ~6 s on a cold run,
// over Vitest's 5 s default.
describe('App routes', { timeout: 20_000 }, () => {
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([sessionExpiredInterceptor])),
        provideHttpClientTesting(),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    // The navbar's status chip polls /api/health; these tests don't care about it.
    http.match('/api/health');
    http.verify();
  });

  const url = () => TestBed.inject(Router).url;

  it('sends a visitor without a session to the login page', async () => {
    auth.clear();
    const harness = await RouterTestingHarness.create('/inspections');

    expect(url()).toBe('/login?returnUrl=%2Finspections');
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe('Welcome back');
    expect(harness.routeNativeElement?.querySelector('app-navbar')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Sign in · Incoming Inspection');
  });

  it('opens the dashboard inside the navbar shell after sign-in', async () => {
    await signIn(auth, http);
    const harness = await RouterTestingHarness.create('/');
    const el = harness.fixture.nativeElement as HTMLElement;

    expect(url()).toBe('/dashboard');
    expect(el.querySelector('.page h1')?.textContent).toBe('Dashboard');
    expect(el.querySelector('.brand + .brand-divider')).not.toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Dashboard · Incoming Inspection');
  });

  it('shows the Users menu to an Admin only', async () => {
    await signIn(auth, http, fakeUser({ role: 'INSPECTOR', fullname: 'Andi Pratama' }));
    const harness = await RouterTestingHarness.create('/dashboard');
    const el = harness.fixture.nativeElement as HTMLElement;
    const menu = [...el.querySelectorAll('.mainnav .nav-item')].map((a) => a.textContent?.trim());

    expect(menu).toEqual(['Dashboard', 'Inspections', 'Master data expand_more']);
    expect(el.querySelector('.profile-btn .who')?.textContent).toContain('QC Inspector');
    expect(el.querySelector('.avatar')?.textContent).toBe('AP');

    await harness.navigateByUrl('/users');
    expect(url()).toBe('/dashboard');
  });

  it('lets an Admin open the Users page', async () => {
    await signIn(auth, http);
    const harness = await RouterTestingHarness.create('/users');
    const el = harness.fixture.nativeElement as HTMLElement;

    expect(url()).toBe('/users');
    expect(
      [...el.querySelectorAll('.mainnav .nav-item')].map((a) => a.textContent?.trim()),
    ).toContain('Users');
  });

  it('keeps a user on a temporary password on the change-password page', async () => {
    await signIn(auth, http, fakeUser({ must_change_password: true }));
    const harness = await RouterTestingHarness.create('/inspections');

    expect(url()).toBe('/change-password');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
      'Set your own password',
    );
  });

  it('sends a signed-in user away from the login page', async () => {
    await signIn(auth, http);
    await RouterTestingHarness.create('/login');

    expect(url()).toBe('/dashboard');
  });

  it('shows a not-found page for unknown addresses', async () => {
    await signIn(auth, http);
    const harness = await RouterTestingHarness.create('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });
});
