import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { PageTitleStrategy } from './core/layout/page-title-strategy';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
      ],
    });
  });

  afterEach(() => {
    // The API status chip polls /api/health; these tests don't care about it.
    TestBed.inject(HttpTestingController).match('/api/health');
  });

  it('shows the app name, company and every menu entry', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.app-name')?.textContent).toContain('Incoming Inspection');
    expect(el.querySelector('.company')?.textContent).toContain('PT. Chubb Safes Indonesia');
    const links = [...el.querySelectorAll('mat-nav-list a')].map((a) => [
      a.querySelector('[matListItemTitle]')?.textContent?.trim(),
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Inspections', '/inspections'],
      ['Items', '/items'],
      ['Vendors', '/vendors'],
      ['Checkers', '/checkers'],
    ]);
  });

  it('redirects the root to inspections', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect(TestBed.inject(Router).url).toBe('/inspections');
    expect(harness.routeNativeElement?.textContent).toContain('Inspections');
  });

  it('opens a placeholder page and sets the tab title', async () => {
    const harness = await RouterTestingHarness.create('/vendors');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Vendors');
    expect(harness.routeNativeElement?.textContent).toContain('coming in Phase 3');
    expect(TestBed.inject(Title).getTitle()).toBe('Vendors · Incoming Inspection');
  });

  it('shows a not-found page for unknown addresses', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });
});
