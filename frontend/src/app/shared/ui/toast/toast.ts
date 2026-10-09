import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastData {
  kind: ToastKind;
  message: string;
}

const ICONS: Record<ToastKind, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

@Component({
  selector: 'app-toast',
  imports: [MatIconModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  protected readonly icon = ICONS[this.data.kind];
}
