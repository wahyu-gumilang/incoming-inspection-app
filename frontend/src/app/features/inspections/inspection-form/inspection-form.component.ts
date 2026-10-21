import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { InspectionDetail, DeliveryInfo } from '../../../core/models/inspection';
import { OkNgPill } from '../../../shared/ui/ok-ng-pill/ok-ng-pill';
import {
  COLUMNS,
  CATEGORY_LABEL,
  JudgmentLabel,
  JudgmentMark,
  InspectionStatusLabel,
  TYPE_LABEL,
  buildCheckSheet,
} from '../inspection.model';
import { InspectionService } from '../inspection.service';

// Read-only check sheet (Form 7.4.3-F1): header, the characteristic rows, and one
// Actual / OK-NG column per delivery. Editing (delivery modal, header form) lands
// in a later iteration; this view is what you see right now.
@Component({
  selector: 'app-inspection-form',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    OkNgPill,
  ],
  templateUrl: './inspection-form.component.html',
  styleUrl: './inspection-form.scss',
})
export class InspectionFormComponent {
  readonly inspectnum = input.required<string>();
  readonly closed = output<void>();

  readonly statusLabel = InspectionStatusLabel;
  readonly judgmentLabel = JudgmentLabel;
  readonly judgmentMark = JudgmentMark;
  readonly categoryLabel = CATEGORY_LABEL;
  readonly typeLabel = TYPE_LABEL;
  readonly columns = COLUMNS;

  private readonly service = inject(InspectionService);
  private readonly snackBar = inject(MatSnackBar);

  detail: InspectionDetail | null = null;
  rows: ReturnType<typeof buildCheckSheet> = [];
  loading = true;

  get isEditable(): boolean {
    return this.detail?.editable === true;
  }

  delivery(n: number): DeliveryInfo | null {
    return this.detail?.deliveries.find((d) => d.n === n && d.used) ?? null;
  }

  cellActual(row: ReturnType<typeof buildCheckSheet>[number], n: number): string {
    const v = row.actual(n);
    return v === null || v === undefined ? '–' : String(v);
  }

  cellStatus(row: ReturnType<typeof buildCheckSheet>[number], n: number) {
    return row.status(n);
  }

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.detail = await firstValueFrom(this.service.get(this.inspectnum()));
      this.rows = buildCheckSheet(this.detail);
    } catch {
      this.detail = null;
      this.rows = [];
      this.snackBar.open('Gagal memuat inspeksi', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  back(): void {
    this.closed.emit();
  }
}
