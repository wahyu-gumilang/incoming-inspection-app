import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastKind } from './toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  private show(kind: ToastKind, message: string): void {
    this.snackBar.open(message, 'Tutup', {
      duration: kind === 'error' ? 6000 : 4000,
      panelClass: [`toast-${kind}`],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
