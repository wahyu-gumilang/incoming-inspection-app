import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './toast';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('opens a toast with its kind, message and a longer duration for errors', () => {
    const openFromComponent = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }],
    });
    const toast = TestBed.inject(ToastService);

    toast.success('Saved');
    toast.error('Failed');

    expect(openFromComponent).toHaveBeenNthCalledWith(1, Toast, {
      data: { kind: 'success', message: 'Saved' },
      duration: 3000,
      politeness: 'polite',
    });
    expect(openFromComponent).toHaveBeenNthCalledWith(2, Toast, {
      data: { kind: 'error', message: 'Failed' },
      duration: 6000,
      politeness: 'assertive',
    });
  });
});
