import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, sessionGuard } from './core/auth/auth.guards';

// Placeholders until each Phase 3 stage replaces them with the real page.
const placeholder = () =>
  import('./shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'change-password',
    title: 'Set your password',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password').then((m) => m.ChangePassword),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./core/layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: placeholder,
        data: { title: 'Dashboard', icon: 'space_dashboard', stage: 'Stage 5' },
      },
      {
        path: 'inspections',
        title: 'Inspections',
        loadComponent: placeholder,
        data: { title: 'Inspections', icon: 'fact_check', stage: 'Stage 4' },
      },
      {
        path: 'vendors',
        title: 'Vendors',
        loadComponent: () =>
          import('./features/vendors/vendors.component').then((m) => m.Vendors),
        data: { title: 'Vendors', icon: 'local_shipping' },
      },
      {
        path: 'items',
        title: 'Items & standards',
        loadComponent: () =>
          import('./features/items/items.component').then((m) => m.Items),
        data: { title: 'Items & standards', icon: 'inventory_2' },
      },
      {
        path: 'aql',
        title: 'AQL table',
        loadComponent: () =>
          import('./features/aql/aql.component').then((m) => m.AqlPage),
        data: { title: 'AQL table', icon: 'table_chart' },
      },
      {
        path: 'users',
        title: 'Users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.Users),
        data: { title: 'Users', icon: 'group' },
      },
      {
        path: 'profile',
        title: 'Profile settings',
        loadComponent: placeholder,
        data: { title: 'Profile settings', icon: 'manage_accounts', stage: 'Stage 2' },
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () =>
          import('./shared/ui/not-found-page/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
