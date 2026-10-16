import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { ItemService } from './item.service';
import { ItemRow } from './item';
import { ItemFormDialog } from './item-form-dialog/item-form-dialog.component';
import { StandardsDialog } from './standards-dialog/standards-dialog.component';
import { LoadingIndicator } from '../../shared/ui/loading-indicator/loading-indicator';

// The chips shown under "Standards", in the form order (STD, CERTIFIKAT, VISUAL, FITTING).
const TYPE_LABELS: Record<string, string> = {
  STD: 'STD',
  CERTIFIKAT: 'COA',
  VISUAL: 'Visual',
  FITTING: 'Fitting',
};

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingIndicator,
  ],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
})
export class Items implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  items = signal<ItemRow[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(1);
  limit = signal(20);
  sort = signal('itemid');
  order = signal<'asc' | 'desc'>('asc');
  search = signal('');
  hasStandards = signal<boolean | undefined>(undefined);
  loading = signal(false);

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.itemService
      .list({
        page: this.page(),
        limit: this.limit(),
        sort: this.sort(),
        order: this.order(),
        q: this.search() || undefined,
        hasStandards: this.hasStandards(),
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
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
    this.loadItems();
  }

  onFilterStandards(value: boolean | undefined): void {
    this.hasStandards.set(value);
    this.page.set(1);
    this.loadItems();
  }

  onSort(column: string): void {
    if (this.sort() === column) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(column);
      this.order.set('asc');
    }
    this.loadItems();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadItems();
  }

  typeCounts(item: ItemRow): { key: string; label: string; count: number }[] {
    return Object.entries(TYPE_LABELS)
      .map(([key, label]) => ({ key, label, count: item.standardCounts[key] ?? 0 }))
      .filter((c) => c.count > 0);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ItemFormDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Item created', 'Close', { duration: 3000 });
        this.loadItems();
      }
    });
  }

  openEditDialog(item: ItemRow): void {
    const ref = this.dialog.open(ItemFormDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: item,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Item updated', 'Close', { duration: 3000 });
        this.loadItems();
      }
    });
  }

  openStandards(item: ItemRow): void {
    const ref = this.dialog.open(StandardsDialog, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: false,
      data: { itemid: item.itemid, name: item.name },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadItems();
      }
    });
  }
}