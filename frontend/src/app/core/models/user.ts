export type UserRole = 'INSPECTOR' | 'CHECKER' | 'ADMIN';
export type ThemeMode = 'light' | 'dark' | 'system';

// Labels shown in the navbar profile chip ("QC Inspector", "QC Checker", "QC Admin").
export const ROLE_LABEL: Record<UserRole, string> = {
  INSPECTOR: 'Inspector',
  CHECKER: 'Checker',
  ADMIN: 'Admin',
};

// Matches backend/constants/auth.js.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores anything after 72 bytes

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
