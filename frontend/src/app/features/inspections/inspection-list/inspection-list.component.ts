import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  JudgmentLabel,
  JudgmentMark,
  InspectionListItem,
  InspectionStatusLabel,
} from '../inspection.model';
import { InspectionService } from '../inspection.service';
import { InspectionFormComponent } from '../inspection-form/inspection-form.component';

@Component({
  selector: 'app-inspections',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatTableModule,
    InspectionFormComponent,
  ],
  template: `
    <section class="list">
      <div class="list-head">
        <div class="titles">
          <h1>Inspeksi Barang Diterima</h1>
          <p>Rekam, evaluasi, dan simpan inspeksi material & suku cadang yang diterima.</p>
        </div>
        <button mat-flat-button color="primary" (click)="openForm(null)">
          <mat-icon>add</mat-icon>
          Buat Inspeksi
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline" class="filter-search">
          <mat-label>Cari no. / P/O</mat-label>
          <input matInput placeholder="Ketik untuk mencari" [(ngModel)]="q" (ngModelChange)="applyFilters()" />
          <mat-icon matPrefix>search</mat-icon>
          @if (q) {
            <button matSuffix mat-icon-button (click)="q = ''; applyFilters()" aria-label="Reset">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Mulai</mat-label>
          <input matInput [ngModel]="dateFrom" (ngModelChange)="dateFrom = $event; applyFilters()" [matDatepicker]="dpFrom" />
          <mat-datepicker-toggle matSuffix [for]="dpFrom"></mat-datepicker-toggle>
          <mat-datepicker #dpFrom></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sampai</mat-label>
          <input matInput [ngModel]="dateTo" (ngModelChange)="dateTo = $event; applyFilters()" [matDatepicker]="dpTo" />
          <mat-datepicker-toggle matSuffix [for]="dpTo"></mat-datepicker-toggle>
          <mat-datepicker #dpTo></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="status" (ngModelChange)="applyFilters()">
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()">Reset</button>
      </div>

      <div class="table-card">
        <table mat-table [dataSource]="items()" class="table">
          <ng-container matColumnDef="inspectnum">
            <th mat-header-cell *matHeaderCellDef>No. Inspeksi</th>
            <td mat-cell *matCellDef="let row">
              <span class="mono">{{ row.inspectnum }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Tanggal</th>
            <td mat-cell *matCellDef="let row">{{ row.inspectdate | date: 'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="item">
            <th mat-header-cell *matHeaderCellDef>Item</th>
            <td mat-cell *matCellDef="let row">
              <div class="cell-stack">
                <div class="cell-primary">{{ row.itemname }}</div>
                <div class="cell-sub mono">{{ row.itemid }}</div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="vendor">
            <th mat-header-cell *matHeaderCellDef>Supplier</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="status-chip" [class]="'status-chip status-' + row.inspectstatus.toLowerCase()">
                {{ statusLabel[row.inspectstatus] ?? row.inspectstatus }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="judgments">
            <th mat-header-cell *matHeaderCellDef>Keputusan</th>
            <td mat-cell *matCellDef="let row">
              <div class="judgment-chips">
                @for (j of row.judgments; track $index) {
                  <span class="j-chip" [class]="'j-chip j-' + j" [title]="judgmentLabel[j]">
                    {{ judgmentMark[j] }}
                  </span>
                }
                @if (!row.judgments.length) {
                  <span class="muted">—</span>
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-header">Aksi</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="openForm(row.inspectnum)" title="Buka / lihat">
                <mat-icon>description</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>

          <tr class="empty" *matNoDataRow>
            <td colspan="7">
              @if (loading()) {
                Memuat daftar…
              } @else {
                Tidak ada inspeksi yang cocok dengan filter.
              }
            </td>
          </tr>
        </table>

        <div class="pager">
          <button mat-button [disabled]="page() <= 1 || loading()" (click)="setPage(page() - 1)">
            <mat-icon>chevron_left</mat-icon> Prev
          </button>
          <span class="muted">Halaman {{ page() }} / {{ totalPages() || 1 }} — {{ total() }} data</span>
          <button mat-button [disabled]="page() >= totalPages() || loading()" (click)="setPage(page() + 1)">
            Next <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </section>

    @if (showForm()) {
      <app-inspection-form [inspectnum]="editingId()" (closed)="onFormClosed()" />
    }
  `,
  styleUrl: './inspection-list.scss',
})
export class InspectionsListComponent implements OnInit {
  protected readonly judgmentLabel = JudgmentLabel;
  protected readonly judgmentMark = JudgmentMark;
  protected readonly statusLabel = InspectionStatusLabel;

  private readonly service = inject(InspectionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly statuses = [
    { value: '', label: 'Semua' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Waiting for check' },
    { value: 'CHECKED', label: 'Checked' },
  ];

  q = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  status = '';

  readonly items = signal<InspectionListItem[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  cols = ['inspectnum', 'date', 'item', 'vendor', 'status', 'judgments', 'actions'];



  private loadTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => void this.doLoad(), 250);
  }

  private async doLoad(): Promise<void> {
    try {
      const { rows, meta } = await firstValueFrom(
        this.service.list({
          page: this.page(),
          limit: 15,
          q: this.q || undefined,
          dateFrom: this.fmt(this.dateFrom) || undefined,
          dateTo: this.fmt(this.dateTo) || undefined,
          status: this.status || undefined,
        })
      );
      this.items.set(rows);
      this.total.set(meta.total);
      this.totalPages.set(meta.totalPages);
    } catch {
      this.snackBar.open('Gagal memuat daftar inspeksi', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters(): void {
    this.page.set(1);
    this.loading.set(true);
    this.refresh();
  }

  resetFilters(): void {
    this.q = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.status = '';
    this.applyFilters();
  }

  setPage(p: number): void {
    this.page.set(p);
    this.loading.set(true);
    this.refresh();
  }

  openForm(id: string | null): void {
    this.editingId.set(id);
    this.showForm.set(true);
  }

  onFormClosed(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.applyFilters();
  }

  private fmt(d: Date | null): string {
    if (!d) return '';
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
  }
}
