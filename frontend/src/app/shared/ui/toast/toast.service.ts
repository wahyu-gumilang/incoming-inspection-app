import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Toast, ToastData, ToastKind } from './toast';

// Errors stay longer than confirmations so the message can be read.
const DURATION: Record<ToastKind, number> = { success: 3000, info: 4000, error: 6000 };

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
    this.snackBar.openFromComponent<Toast, ToastData>(Toast, {
      data: { kind, message },
      duration: DURATION[kind],
      politeness: kind === 'error' ? 'assertive' : 'polite',
    });
  }
}
