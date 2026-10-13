import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  template: `
    <div class="data-table-wrapper">
      <table mat-table [dataSource]="data()" class="data-table">
        @for (col of columns(); track col.key) {
          <ng-container [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef>
              @if (col.sortable) {
                <button mat-button class="sort-header" (click)="onSortClick(col.key)">
                  {{ col.label }}
                  @if (sort() === col.key) {
                    <mat-icon class="sort-icon">
                      {{ order() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                    </mat-icon>
                  }
                </button>
              } @else {
                {{ col.label }}
              }
            </th>
            <td mat-cell *matCellDef="let row">
              <ng-container
                [ngTemplateOutlet]="cellTemplate"
                [ngTemplateOutletContext]="{ $implicit: row }"
              />
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
      </table>

      @if (data().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>No data found</p>
        </div>
      }

      <mat-paginator
        [length]="total()"
        [pageSize]="limit()"
        [pageIndex]="page() - 1"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="onPageEvent($event)"
        showFirstLastButtons
      >
      </mat-paginator>
    </div>
  `,
  styles: [
    `
      .data-table-wrapper {
        background: var(--mat-sys-surface, #fff);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .data-table {
        width: 100%;
      }

      .sort-header {
        font-weight: 500;
        text-transform: none;
      }

      .sort-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        vertical-align: middle;
        margin-left: 4px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 16px;
        color: var(--mat-sys-on-surface-variant, #888);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }
    `,
  ],
})
export class DataTable {
  readonly columns = input.required<DataTableColumn[]>();
  readonly data = input.required<any[]>();
  readonly sort = input<string>('');
  readonly order = input<'asc' | 'desc'>('asc');
  readonly page = input<number>(1);
  readonly total = input<number>(0);
  readonly limit = input<number>(20);

  readonly sortChange = output<string>();
  readonly pageChange = output<number>();

  readonly cellTemplate = input<any>();

  get displayedColumns(): string[] {
    return [...this.columns().map((c) => c.key), 'actions'];
  }

  displayedColumns(): string[] {
    return this.columns().map((c) => c.key);
  }

  onSortClick(key: string): void {
    this.sortChange.emit(key);
  }

  onPageEvent(event: PageEvent): void {
    this.pageChange.emit(event.pageIndex + 1);
  }
}
