import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ThemeMode } from '../models/user';

const STORAGE_KEY = 'iqc-theme';

// Light / dark / follow the device. Saved on the user's account (usertable.theme) and,
// for the login page before anyone signs in, in this browser.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  readonly mode = signal<ThemeMode>(this.stored());

  constructor() {
    // Signing in brings the user's own choice.
    effect(() => {
      const user = this.auth.user();
      if (user) this.mode.set(user.theme);
    });
    effect(() => this.apply(this.mode()));
    this.media?.addEventListener?.('change', () => this.apply(this.mode()));
  }

  async set(mode: ThemeMode): Promise<void> {
    this.mode.set(mode);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // private mode: the account still keeps it
    }
    if (this.auth.user()) await this.auth.updateProfile({ theme: mode });
  }

  private apply(mode: ThemeMode): void {
    const dark = mode === 'dark' || (mode === 'system' && !!this.media?.matches);
    this.document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  }

  private stored(): ThemeMode {
    try {
      const value = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'system' ? value : 'light';
    } catch {
      return 'light';
    }
  }
}
