import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'loading-indicator',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-spinner diameter="40" />
      <p>Loading...</p>
    </div>
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 16px;
        gap: 12px;
        color: var(--mat-sys-on-surface-variant, #888);
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    `,
  ],
})
export class LoadingIndicator {}
