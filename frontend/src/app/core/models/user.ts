// Mirrors backend/constants/auth.js; field names are the usertable columns.
export type Role = 'INSPECTOR' | 'CHECKER' | 'ADMIN';
export type ThemeMode = 'light' | 'dark' | 'system';

export const ROLE_LABEL: Record<Role, string> = {
  INSPECTOR: 'Inspector',
  CHECKER: 'Checker',
  ADMIN: 'Admin',
};

export interface User {
  userid: number;
  username: string;
  fullname: string;
  email: string | null;
  role: Role;
  active: boolean;
  must_change_password: boolean;
  theme: ThemeMode;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// Mirrors backend/constants/auth.js.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
