export type UserRole = 'INSPECTOR' | 'CHECKER' | 'ADMIN';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  userid: number;
  username: string;
  fullname: string;
  email: string | null;
  role: UserRole;
  active: boolean;
  must_change_password: boolean;
  theme: ThemeMode;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserLookup {
  userid: number;
  fullname: string;
}
