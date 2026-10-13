import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VendorService } from './vendor.service';
import { Vendor } from './vendor';
import { VendorFormDialog } from './vendor-form-dialog/vendor-form-dialog.component';
import { VendorImportDialog } from './vendor-import-dialog/vendor-import-dialog.component';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../shared/ui/data-table/data-table';
import { LoadingIndicator } from '../../shared/ui/loading-indicator/loading-indicator';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    DataTable,
    LoadingIndicator,
  ],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss'],
})
export class Vendors implements OnInit {
  private vendorService = inject(VendorService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  vendors = signal<Vendor[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(1);
  limit = signal(20);
  sort = signal('vendaccount');
  order = signal<'asc' | 'desc'>('asc');
  search = signal('');
  loading = signal(false);

  readonly columns = [
    { key: 'vendaccount', label: 'Vendor Code', sortable: true },
    { key: 'name', label: 'Vendor Name', sortable: true },
    { key: 'inspectionCount', label: 'Inspections', sortable: true },
  ];

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.loading.set(true);
    this.vendorService
      .list({
        page: this.page(),
        limit: this.limit(),
        sort: this.sort(),
        order: this.order(),
        q: this.search() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.vendors.set(res.data);
          this.total.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadVendors();
  }

  onSortChange(column: string): void {
    if (this.sort() === column) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(column);
      this.order.set('asc');
    }
    this.loadVendors();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadVendors();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(VendorFormDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Vendor created', 'Close', { duration: 3000 });
        this.loadVendors();
      }
    });
  }

  openEditDialog(vendor: Vendor): void {
    const ref = this.dialog.open(VendorFormDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: vendor,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Vendor updated', 'Close', { duration: 3000 });
        this.loadVendors();
      }
    });
  }

  openImportDialog(): void {
    const ref = this.dialog.open(VendorImportDialog, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Vendors imported', 'Close', { duration: 3000 });
        this.loadVendors();
      }
    });
  }

  confirmDelete(vendor: Vendor): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete vendor',
        message: `Are you sure you want to delete "${vendor.name}" (${vendor.vendaccount})?`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.vendorService.delete(vendor.vendaccount).subscribe({
          next: () => {
            this.snackBar.open('Vendor deleted', 'Close', { duration: 3000 });
            this.loadVendors();
          },
          error: (err) => {
            const msg = err.error?.error?.message || 'Failed to delete vendor';
            this.snackBar.open(msg, 'Close', { duration: 5000 });
          },
        });
      }
    });
  }
}
