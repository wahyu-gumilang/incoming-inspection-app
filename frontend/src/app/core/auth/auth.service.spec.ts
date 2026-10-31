import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { fakeUser, unauthenticated, unauthenticatedBody } from '../../testing/users';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks the server for the session only once', async () => {
    const first = auth.ensureSession();
    const second = auth.ensureSession();
    http.expectOne('/api/auth/me').flush({ success: true, data: fakeUser() });

    expect(await first).toEqual(fakeUser());
    expect(await second).toEqual(fakeUser());
    expect(auth.isAdmin()).toBe(true);
  });

  it('treats a 401 as signed out', async () => {
    const session = auth.ensureSession();
    http.expectOne('/api/auth/me').flush(unauthenticatedBody, unauthenticated);

    expect(await session).toBeNull();
    expect(auth.user()).toBeNull();
  });

  it('asks again after a network error', async () => {
    const failed = auth.ensureSession();
    http.expectOne('/api/auth/me').error(new ProgressEvent('error'));
    await expect(failed).rejects.toBeDefined();

    const retried = auth.ensureSession();
    http.expectOne('/api/auth/me').flush({ success: true, data: fakeUser() });
    expect(await retried).toEqual(fakeUser());
  });

  it('signs in with remember-me and signs out', async () => {
    const login = auth.login('070203', 'secret-pass', true);
    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({
      username: '070203',
      password: 'secret-pass',
      remember: true,
    });
    req.flush({ success: true, data: fakeUser() });
    await login;
    expect(await auth.ensureSession()).toEqual(fakeUser());

    const logout = auth.logout();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(auth.user()).toBeNull();
    expect(await auth.ensureSession()).toBeNull();
  });

  it('keeps the user returned by a password change', async () => {
    const change = auth.changePassword('temp-pass', 'my-new-pass');
    const req = http.expectOne('/api/auth/me/password');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ currentPassword: 'temp-pass', newPassword: 'my-new-pass' });
    req.flush({ success: true, data: fakeUser({ must_change_password: false }) });

    expect((await change).must_change_password).toBe(false);
    expect(auth.user()?.username).toBe('070203');
  });
});
