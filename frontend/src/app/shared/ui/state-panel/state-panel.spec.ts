import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PanelState, StatePanel } from './state-panel';

function render(state: PanelState, title = '') {
  const fixture = TestBed.createComponent(StatePanel);
  fixture.componentRef.setInput('state', state);
  fixture.componentRef.setInput('title', title);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StatePanel', () => {
  it('shows a spinner while loading', () => {
    const el = render('loading');
    expect(el.querySelector('mat-spinner')).not.toBeNull();
    expect(el.querySelector('.panel')?.getAttribute('role')).toBe('status');
  });

  it('announces errors with an alert role and its title', () => {
    const el = render('error', 'Could not load');
    expect(el.querySelector('.panel')?.getAttribute('role')).toBe('alert');
    expect(el.querySelector('h2')?.textContent).toBe('Could not load');
    expect(el.querySelector('mat-spinner')).toBeNull();
  });

  it('uses the inbox icon for empty', () => {
    expect(render('empty').querySelector('mat-icon')?.textContent).toBe('inbox');
  });
});
