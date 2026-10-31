import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from './user.service';
import { AuthService } from '../../core/auth/auth.service';
import { User, UserRole } from '../../core/models/user';
import { RoleFormDialog } from './role-form-dialog/role-form-dialog.component';
import { UserEditDialog } from './user-edit-dialog/user-edit-dialog.component';
import { LoadingIndicator } from '../../shared/ui/loading-indicator/loading-indicator';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'INSPECTOR', label: 'Inspector' },
  { value: 'CHECKER', label: 'Checker' },
  { value: 'ADMIN', label: 'Admin' },
];

const ROLE_LABEL: Record<UserRole, string> = {
  INSPECTOR: 'Inspector',
  CHECKER: 'Checker',
  ADMIN: 'Admin',
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingIndicator,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  users = signal<User[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(1);
  limit = signal(20);
  sort = signal('fullname');
  order = signal<'asc' | 'desc'>('asc');
  search = signal('');
  roleFilter = signal<UserRole | ''>('');
  loading = signal(false);

  readonly roleOptions = ROLE_OPTIONS;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .list({
        page: this.page(),
        limit: this.limit(),
        sort: this.sort(),
        order: this.order(),
        q: this.search() || undefined,
        role: this.roleFilter() || undefined,
      })
      .subscribe({
      next: (res) => {
        this.users.set(res.rows);
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
    this.loadUsers();
  }

  onRoleFilter(value: UserRole | ''): void {
    this.roleFilter.set(value);
    this.page.set(1);
    this.loadUsers();
  }

  onSort(column: string): void {
    if (this.sort() === column) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(column);
      this.order.set('asc');
    }
    this.loadUsers();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadUsers();
  }

  isSelf(user: User): boolean {
    return this.auth.user()?.userid === user.userid;
  }

  // The temporary password is only shown here, once, when the user is created.
  openCreateDialog(): void {
    const ref = this.dialog.open(RoleFormDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((result) => {
      if (result && typeof result === 'object') {
        this.snackBar.open(
          `User created · share the temporary password: ${result.password}`,
          'Copy',
          { duration: 15000 },
        );
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const ref = this.dialog.open(UserEditDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: user,
    });
    ref.afterClosed().subscribe((result) => {
      if (result && typeof result === 'object' && result.password) {
        this.snackBar.open(
          `Password reset · temporary password: ${result.password}`,
          'Copy',
          { duration: 15000 },
        );
      }
      if (result) this.loadUsers();
    });
  }

  formatLastLogin(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  roleLabel(user: User): string {
    return ROLE_LABEL[user.role];
  }
}
