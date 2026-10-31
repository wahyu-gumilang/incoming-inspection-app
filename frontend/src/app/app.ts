import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  constructor() {
    // Icons come from the bundled Material Symbols Rounded font (no Google Fonts CDN).
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
    // Applies the saved theme before the first page paints.
    inject(ThemeService);
  }
}
