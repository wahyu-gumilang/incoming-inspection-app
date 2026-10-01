import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { Shell } from './core/layout/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  template: '<app-shell />',
})
export class App {
  constructor() {
    // Icons come from the bundled Material Symbols font (no Google Fonts CDN).
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
