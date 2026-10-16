import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { UserService, UserWithPassword } from './user.service';
import { User } from '../../core/models/user';

// The backend create/reset endpoints return the user plus the one-time temporary password.
const baseUser: User = {
  userid: 2,
  username: '10412',
  fullname: 'Andi Pratama',
  email: null,
  role: 'INSPECTOR',
  active: true,
  must_change_password: true,
  theme: 'system',
  last_login_at: null,
  created_at: '2026-10-01T08:00:00.000Z',
  updated_at: '2026-10-01T08:00:00.000Z',
};

const created: UserWithPassword = { ...baseUser, temporaryPassword: 'Qc-7mK4-tP' };

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() unwraps the paged user rows and query params', async () => {
    const result = firstValueFrom(service.list({ page: 1, limit: 20, q: 'andi' }));

    const req = http.expectOne((r) => r.url === '/api/users' && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('q')).toBe('andi');
    req.flush({
      success: true,
      data: [baseUser],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const page = await result;
    expect(page.rows).toEqual([baseUser]);
    expect(page.meta.total).toBe(1);
  });

  it('create() returns the user and the one-time temporary password', async () => {
    const result = firstValueFrom(
      service.create({ username: '10412', fullname: 'Andi Pratama', role: 'INSPECTOR' }),
    );

    const req = http.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: '10412',
      fullname: 'Andi Pratama',
      email: undefined,
      role: 'INSPECTOR',
    });
    req.flush({ success: true, data: created });

    const res = await result;
    expect(res.userid).toBe(2);
    expect(res.temporaryPassword).toBe('Qc-7mK4-tP');
  });

  it('resetPassword() returns the new temporary password', async () => {
    const result = firstValueFrom(service.resetPassword(2));

    const req = http.expectOne('/api/users/2/reset-password');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { ...baseUser, temporaryPassword: 'Ab-9xL2-qK' } });

    const res = await result;
    expect(res.temporaryPassword).toBe('Ab-9xL2-qK');
  });

  it('lookup() asks for users of a specific role', async () => {
    const result = firstValueFrom(service.lookup('CHECKER'));

    const req = http.expectOne((r) => r.url === '/api/users/lookup' && r.method === 'GET');
    expect(req.request.params.get('role')).toBe('CHECKER');
    req.flush({ success: true, data: [{ userid: 3, fullname: 'Budi Santoso' }] });

    expect(await result).toEqual([{ userid: 3, fullname: 'Budi Santoso' }]);
  });
});
