import { Routes } from '@angular/router';

// Placeholders until each feature's phase replaces them with real routes.
const placeholder = () => import('./shared/placeholder-page').then((m) => m.PlaceholderPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inspections' },
  {
    path: 'inspections',
    title: 'Inspections',
    loadComponent: placeholder,
    data: { title: 'Inspections', phase: 'Phase 3' },
  },
  {
    path: 'items',
    title: 'Items',
    loadComponent: placeholder,
    data: { title: 'Items', phase: 'Phase 3' },
  },
  {
    path: 'vendors',
    title: 'Vendors',
    loadComponent: placeholder,
    data: { title: 'Vendors', phase: 'Phase 3' },
  },
  {
    path: 'checkers',
    title: 'Checkers',
    loadComponent: placeholder,
    data: { title: 'Checkers', phase: 'Phase 3' },
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./shared/not-found-page').then((m) => m.NotFoundPage),
  },
];
