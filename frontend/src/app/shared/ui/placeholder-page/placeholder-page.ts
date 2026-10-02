import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// Stands in for a feature page until its phase builds it. `title` and `phase`
// come from the route's data (withComponentInputBinding).
@Component({
  selector: 'app-placeholder-page',
  imports: [MatIconModule],
  template: `
    <h1>{{ title() }}</h1>
    <div class="empty">
      <mat-icon aria-hidden="true">construction</mat-icon>
      <p>This page is coming in {{ phase() }}.</p>
    </div>
  `,
  styles: `
    h1 {
      font: var(--mat-sys-headline-small);
      margin: 0 0 24px;
    }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 16px;
      border: 1px dashed var(--mat-sys-outline-variant);
      border-radius: 12px;
      color: var(--mat-sys-on-surface-variant);
    }
    .empty mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
  `,
})
export class PlaceholderPage {
  readonly title = input.required<string>();
  readonly phase = input.required<string>();
}
