import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { User, UserLookup } from '../../core/models/user';

// Create / reset responses include the one-time temporary password.
export type UserWithPassword = User & { temporaryPassword: string };

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);

  list(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    q?: string;
    role?: User['role'];
    active?: boolean;
  } = {}) {
    return this.api.page<User>('/users', params);
  }

  get(userid: number) {
    return this.api.get<User>(`/users/${userid}`);
  }

  create(data: { username: string; fullname: string; email?: string; role: User['role'] }) {
    return this.api.post<UserWithPassword>('/users', data);
  }

  update(
    userid: number,
    data: { fullname?: string; email?: string; role?: User['role']; active?: boolean },
  ) {
    return this.api.put<User>(`/users/${userid}`, data);
  }

  resetPassword(userid: number) {
    return this.api.post<UserWithPassword>(`/users/${userid}/reset-password`);
  }

  lookup(role: User['role']) {
    return this.api.get<UserLookup[]>('/users/lookup', { role });
  }
}
