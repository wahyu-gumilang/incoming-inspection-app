import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardPeriod } from './dashboard.service';
import { DashboardStats } from '../../core/models/dashboard';
import { ApiError } from '../../core/api/api-error';
import { LoadingIndicator } from '../../shared/ui/loading-indicator/loading-indicator';
import { AuthService } from '../../core/auth/auth.service';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
];

const STATUS_CHIP: Record<string, string> = {
  DRAFT: 'chip-draft',
  SUBMITTED: 'chip-submitted',
  CHECKED: 'chip-checked',
  // Legacy rows still carry the old int code; show them as neutral.
  '0': 'chip-neutral',
  '1': 'chip-neutral',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, LoadingIndicator],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class Dashboard implements OnInit {
  private readonly service = inject(DashboardService);

  readonly periods = PERIODS;
  private readonly authService = inject(AuthService);
  readonly auth = computed(() => this.authService.user() ?? undefined);
  readonly period = signal<DashboardPeriod>('month');
  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');

  readonly periodLabel = computed(() => PERIODS.find((p) => p.value === this.period())?.label ?? '');

  // The NG chart: bar for inspections, line+area for NG pieces, last 6 months.
  readonly chart = computed(() => this.stats()?.chart ?? []);
  readonly chartMax = computed(() =>
    Math.max(1, ...this.chart().map((p) => Math.max(p.inspections, p.ng))),
  );
  readonly hasChartData = computed(() => this.chart().some((p) => p.inspections > 0 || p.ng > 0));

  // Suppliers whose NG rate stands out: more than half of their judged deliveries
  // carry NG pieces, or at least 2 NG pieces in the period.
  readonly ngSuppliers = computed(() => {
    const list = this.stats()?.bySupplier ?? [];
    return list.filter((s) => (s.deliveries > 0 && s.ng / s.deliveries > 0.5) || s.ng >= 2);
  });

  readonly recent = computed(() => this.stats()?.recent ?? []);
  readonly waiting = computed(() => this.stats()?.waiting ?? []);
  readonly drafts = computed(() => this.stats()?.drafts ?? []);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.service.stats(this.period()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(ApiError.from(err).message);
        this.loading.set(false);
      },
    });
  }

  setPeriod(p: DashboardPeriod): void {
    if (p === this.period()) return;
    this.period.set(p);
    this.load();
  }

  statusClass(status: string): string {
    return STATUS_CHIP[status] ?? 'chip-neutral';
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Awaiting check';
      case 'CHECKED':
        return 'Checked';
      default:
        return status;
    }
  }

  monthLabel(month: string): string {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en', { month: 'short', year: '2-digit' });
  }

  // "3 h ago", "2 d ago" for the waiting card.
  ageLabel(iso: string | null): string {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h} h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} d ago`;
    return `${Math.floor(d / 30)} mo ago`;
  }

  pct(v: number): string {
    return `${Math.round(v * 1000) / 10}%`;
  }
}
