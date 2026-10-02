import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { ApiError } from '../api/api-error';
import { User } from '../models/user';

// Who is signed in. The session itself is an httpOnly cookie the browser keeps;
// this service only remembers the user the server returned.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly current = signal<User | null>(null);
  private session: Promise<User | null> | null = null;

  readonly user = this.current.asReadonly();
  readonly isAdmin = computed(() => this.current()?.role === 'ADMIN');

  // Asks the server once per page load whether the cookie is still a valid session.
  ensureSession(): Promise<User | null> {
    this.session ??= firstValueFrom(this.api.get<User>('/auth/me')).then(
      (user) => this.set(user),
      (err: unknown) => {
        if (ApiError.from(err).status === 401) return this.set(null);
        this.session = null; // network trouble: ask again next time
        throw err;
      },
    );
    return this.session;
  }

  async login(username: string, password: string, remember: boolean): Promise<User> {
    const user = await firstValueFrom(
      this.api.post<User>('/auth/login', { username, password, remember }),
    );
    this.session = Promise.resolve(this.set(user));
    return user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post<void>('/auth/logout'));
    } finally {
      this.clear();
    }
  }

  async updateProfile(changes: Partial<Pick<User, 'fullname' | 'email' | 'theme'>>): Promise<User> {
    return this.set(await firstValueFrom(this.api.put<User>('/auth/me', changes)))!;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    return this.set(
      await firstValueFrom(
        this.api.put<User>('/auth/me/password', { currentPassword, newPassword }),
      ),
    )!;
  }

  // The session ended on the server (expired cookie, deactivated account).
  clear(): void {
    this.set(null);
    this.session = Promise.resolve(null);
  }

  private set(user: User | null): User | null {
    this.current.set(user);
    return user;
  }
}
