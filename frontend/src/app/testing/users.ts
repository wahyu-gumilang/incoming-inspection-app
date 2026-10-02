import { HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../core/auth/auth.service';
import { Role, User } from '../core/models/user';

export function fakeUser(changes: Partial<User> = {}): User {
  return {
    userid: 1,
    username: '070203',
    fullname: 'Wahyu Gumilang',
    email: null,
    role: 'ADMIN' as Role,
    active: true,
    must_change_password: false,
    theme: 'light',
    last_login_at: null,
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
    ...changes,
  };
}

// Puts a user in the session the way the login page does.
export async function signIn(
  auth: AuthService,
  http: HttpTestingController,
  user: User = fakeUser(),
): Promise<User> {
  const done = auth.login(user.username, 'secret-pass', false);
  http.expectOne('/api/auth/login').flush({ success: true, data: user });
  return done;
}

export const unauthenticated = {
  status: 401,
  statusText: 'Unauthorized',
};
export const unauthenticatedBody = {
  success: false,
  error: { code: 'UNAUTHENTICATED', message: 'Please sign in' },
};
