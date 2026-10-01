import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [MatButtonModule, RouterLink],
  template: `
    <h1>Page not found</h1>
    <p>The address you opened doesn't match any page.</p>
    <a mat-flat-button routerLink="/">Go to Inspections</a>
  `,
  styles: `
    h1 {
      font: var(--mat-sys-headline-small);
      margin: 0 0 8px;
    }
  `,
})
export class NotFoundPage {}
