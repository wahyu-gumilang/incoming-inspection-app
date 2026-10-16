import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('shows a success message', () => {
    const open = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open } }],
    });
    const toast = TestBed.inject(ToastService);

    toast.success('Saved');
    toast.error('Failed');

    expect(open).toHaveBeenNthCalledWith(1, 'Saved', 'Tutup', {
      duration: 4000,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
    expect(open).toHaveBeenNthCalledWith(2, 'Failed', 'Tutup', {
      duration: 6000,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  });
});