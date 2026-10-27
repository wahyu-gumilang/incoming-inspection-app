import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { sessionExpiredInterceptor } from './core/auth/session-expired.interceptor';
import { PageTitleStrategy } from './core/layout/page-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // View Transitions cross-fade the page on every menu change (skipped by browsers without it).
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([sessionExpiredInterceptor])),
    provideNativeDateAdapter(),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
  ],
};
