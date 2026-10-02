import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme/theme.service';
import { ROLE_LABEL, ThemeMode } from '../../models/user';
import { ApiStatus } from '../api-status/api-status';
import { NAV, NavEntry, NavGroup, isGroup } from './nav-items';

@Component({
  selector: 'app-navbar',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    ApiStatus,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly isGroup = isGroup;
  protected readonly roleLabel = computed(() => {
    const u = this.user();
    return u ? ROLE_LABEL[u.role] : '';
  });
  protected readonly initials = computed(() => initialsOf(this.user()?.fullname ?? ''));

  // Entries the signed-in role may see.
  protected readonly entries = computed<NavEntry[]>(() => {
    const role = this.user()?.role;
    const allowed = (roles?: string[]) => !roles || (!!role && roles.includes(role));
    return NAV.filter((e) => (isGroup(e) ? true : allowed(e.roles))).map((e) =>
      isGroup(e) ? { ...e, children: e.children.filter((c) => allowed(c.roles)) } : e,
    );
  });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // A group is "active" when one of its pages is open.
  protected groupActive(group: NavGroup): boolean {
    return group.children.some((c) => this.url().startsWith(c.path));
  }

  protected readonly mobileOpen = signal(false);

  protected readonly themes: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'light_mode' },
    { mode: 'dark', label: 'Dark', icon: 'dark_mode' },
    { mode: 'system', label: 'Auto', icon: 'computer' },
  ];

  protected setTheme(mode: ThemeMode, event: Event): void {
    // Keep the profile menu open while the user compares themes.
    event.stopPropagation();
    void this.theme.set(mode);
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (
    parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}
