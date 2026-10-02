import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { fakeUser } from '../../../testing/users';
import { Login } from './login';

describe('Login', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: Login },
          { path: '**', children: [] },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    const type = (name: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await harness.fixture.whenStable();
    };
    return { harness, el, type, submit };
  }

  it('does not call the server while a field is empty', async () => {
    const { el, submit } = await open('/login');
    await submit();

    http.expectNone('/api/auth/login');
    expect(el.textContent).toContain('Enter your username');
    expect(el.textContent).toContain('Enter your password');
  });

  it('signs in and returns to the page that asked for it', async () => {
    const { type, el } = await open('/login?returnUrl=%2Fvendors');
    type('username', ' 070203 ');
    type('password', 'secret-pass');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({
      username: '070203',
      password: 'secret-pass',
      remember: true,
    });
    req.flush({ success: true, data: fakeUser() });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/vendors'));
  });

  it('never follows a return address to another site', async () => {
    const { type, el } = await open('/login?returnUrl=%2F%2Fevil.example');
    type('username', '070203');
    type('password', 'secret-pass');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/auth/login').flush({ success: true, data: fakeUser() });

    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/dashboard'));
  });

  it('shows the server message and clears the password on a wrong login', async () => {
    const { type, submit, el, harness } = await open('/login');
    type('username', '070203');
    type('password', 'wrong-pass');
    const done = submit();
    http.expectOne('/api/auth/login').flush(
      {
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Wrong username or password' },
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    await done;
    await vi.waitFor(() => {
      harness.fixture.detectChanges();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain(
        'Wrong username or password',
      );
    });
    expect(el.querySelector<HTMLInputElement>('input[formcontrolname="password"]')!.value).toBe('');
  });

  it('explains why a user was sent back after the session ended', async () => {
    const { el } = await open('/login?expired=1');

    expect(el.querySelector('[role="status"]')?.textContent).toContain('Your session ended');
  });
});
