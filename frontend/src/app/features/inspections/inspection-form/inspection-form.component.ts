import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// Placeholder for the inspection form / detail view (§3.3). The check sheet,
// delivery modal and header editing land in the next iteration; this stub keeps
// the module compiling and the "Buat Inspeksi" flow reachable.
@Component({
  selector: 'app-inspection-form',
  imports: [CommonModule],
  template: `
    <section class="stub" role="dialog" aria-label="Inspection form">
      <h2>Inspection {{ inspectnum() ? inspectnum() : 'baru' }}</h2>
      <p>Halaman detail inspeksi akan tersedia di iterasi berikutnya.</p>
      <button mat-button (click)="closed.emit()">Kembali ke daftar</button>
    </section>
  `,
  styleUrl: './inspection-form.scss',
})
export class InspectionFormComponent {
  readonly inspectnum = input<string | null>(null);
  readonly closed = output<void>();
}
