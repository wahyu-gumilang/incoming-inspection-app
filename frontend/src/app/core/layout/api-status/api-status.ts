import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, interval, map, of, startWith, switchMap } from 'rxjs';
import { HealthService } from '../health/health.service';

export type ApiState = 'checking' | 'ok' | 'db-down' | 'api-down';

export const API_STATUS_POLL_MS = 30_000;

const LABELS: Record<ApiState, string> = {
  checking: 'Checking API…',
  ok: 'API connected',
  'db-down': 'Database disconnected',
  'api-down': 'API unreachable',
};

const ICONS: Record<ApiState, string> = {
  checking: 'sync',
  ok: 'check_circle',
  'db-down': 'warning',
  'api-down': 'error',
};

// Shows at a glance whether the browser can reach the backend and the backend
// can reach MariaDB, so a broken connection is obvious before data entry starts.
@Component({
  selector: 'app-api-status',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <span
      class="api-status"
      [class]="state()"
      role="status"
      aria-live="polite"
      [matTooltip]="detail()"
    >
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <span class="label">{{ label() }}</span>
    </span>
  `,
  styles: `
    .api-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 16px;
      font: var(--mat-sys-label-medium);
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
    }
    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .ok mat-icon {
      color: #2e7d32;
    }
    .db-down mat-icon {
      color: #ed6c02;
    }
    .api-down mat-icon {
      color: var(--mat-sys-error);
    }
    @media (max-width: 599px) {
      .label {
        display: none;
      }
    }
  `,
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
