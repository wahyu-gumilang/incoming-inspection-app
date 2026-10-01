import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { ApiStatus } from './api-status';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const MAIN_NAV: NavItem[] = [
  { path: '/inspections', label: 'Inspections', icon: 'fact_check' },
];

export const MASTER_DATA_NAV: NavItem[] = [
  { path: '/items', label: 'Items', icon: 'inventory_2' },
  { path: '/vendors', label: 'Vendors', icon: 'local_shipping' },
  { path: '/checkers', label: 'Checkers', icon: 'badge' },
];

// Narrow screens get an overlay menu; tablets in landscape and desktops keep it open.
const NARROW = '(max-width: 959.98px)';

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ApiStatus,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly mainNav = MAIN_NAV;
  protected readonly masterDataNav = MASTER_DATA_NAV;

  protected readonly narrow = toSignal(
    inject(BreakpointObserver)
      .observe(NARROW)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
  protected readonly sidenavMode = computed(() => (this.narrow() ? 'over' : 'side'));
}
