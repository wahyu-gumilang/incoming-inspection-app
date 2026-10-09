import { Component, ElementRef, effect, input, model, output, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ModalSize = 'sm' | 'md' | 'lg';

// Wraps a native <dialog>: showModal() gives the focus trap, Esc handling and focus
// restoration for free. Project the body as content and the buttons as [modalFooter].
@Component({
  selector: 'app-modal',
  imports: [MatIconModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly size = input<ModalSize>('sm');
  // false while a save is running or a form is dirty: Esc and ✕ then do nothing.
  readonly dismissible = input(true);
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  protected close(): void {
    if (this.dismissible()) {
      this.open.set(false);
    }
  }

  // Esc fires `cancel`; route it through close() so `dismissible` is respected.
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected onClosed(): void {
    // Also reached when the dialog is closed by the effect, so keep the model in sync.
    this.open.set(false);
    this.closed.emit();
  }
}
