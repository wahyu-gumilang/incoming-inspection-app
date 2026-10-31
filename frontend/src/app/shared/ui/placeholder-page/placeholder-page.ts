import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// Stands in for a page until its Phase 3 stage builds it. `title`, `icon` and `stage`
// come from the route's data (withComponentInputBinding).
@Component({
  selector: 'app-placeholder-page',
  imports: [MatIconModule],
  templateUrl: './placeholder-page.html',
  styleUrl: './placeholder-page.scss',
})
export class PlaceholderPage {
  readonly title = input.required<string>();
  readonly icon = input('construction');
  readonly stage = input.required<string>();
}
