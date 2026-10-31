import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { signIn, unauthenticated, unauthenticatedBody } from '../../testing/users';
import { AuthService } from './auth.service';
import { sessionExpiredInterceptor } from './session-expired.interceptor';

describe('sessionExpiredInterceptor', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([sessionExpiredInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  const call = (url: string) =>
    firstValueFrom(TestBed.inject(HttpClient).get(url)).catch(() => 'failed');

  it('clears the session and opens the login page on a 401', async () => {
    await signIn(auth, http);
    const result = call('/api/items');
    http.expectOne('/api/items').flush(unauthenticatedBody, unauthenticated);

    expect(await result).toBe('failed');
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/', expired: 1 },
    });
  });

  it('leaves a wrong password on the login page alone', async () => {
    const result = call('/api/auth/login');
    http.expectOne('/api/auth/login').flush(unauthenticatedBody, unauthenticated);

    expect(await result).toBe('failed');
    expect(navigate).not.toHaveBeenCalled();
  });
});
