import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, interval, map, of, startWith, switchMap } from 'rxjs';
import { HealthService } from '../../health/health.service';

export type ApiState = 'checking' | 'ok' | 'db-down' | 'api-down';

export const API_STATUS_POLL_MS = 30_000;

const LABELS: Record<ApiState, string> = {
  checking: 'Checking…',
  ok: 'All systems online',
  'db-down': 'Database offline',
  'api-down': 'Server offline',
};

const ICONS: Record<ApiState, string> = {
  checking: 'sync',
  ok: 'check_circle',
  'db-down': 'warning',
  'api-down': 'error',
};

// Shows at a glance whether the browser can reach the backend and the backend can
// reach MariaDB, so a broken connection is obvious before data entry starts.
@Component({
  selector: 'app-api-status',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './api-status.html',
  styleUrl: './api-status.scss',
})
export class ApiStatus {
  private readonly health = inject(HealthService);

  protected readonly state = signal<ApiState>('checking');
  protected readonly detail = signal('');
  protected readonly label = computed(() => LABELS[this.state()]);
  protected readonly icon = computed(() => ICONS[this.state()]);

  constructor() {
    interval(API_STATUS_POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.health.check().pipe(
            map((h) => ({
              state: (h.db === 'connected' ? 'ok' : 'db-down') as ApiState,
              detail: `db: ${h.db} · checked ${new Date(h.timestamp).toLocaleTimeString()}`,
            })),
            catchError(() =>
              of({ state: 'api-down' as ApiState, detail: 'No response from /api/health' }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ state, detail }) => {
        this.state.set(state);
        this.detail.set(detail);
      });
  }
}
