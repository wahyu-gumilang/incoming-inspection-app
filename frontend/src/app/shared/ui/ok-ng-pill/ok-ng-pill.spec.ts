import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OkNgPill } from './ok-ng-pill';

function render(status: number | null) {
  const fixture = TestBed.createComponent(OkNgPill);
  fixture.componentRef.setInput('status', status);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('.okng');
  return { text: el.textContent?.trim(), cls: el.className };
}

describe('OkNgPill', () => {
  it('shows OK, NG and a dash for not measured (null is never NG)', () => {
    expect(render(1)).toEqual({ text: 'OK', cls: 'okng ok' });
    expect(render(0)).toEqual({ text: 'NG', cls: 'okng ng' });
    expect(render(null)).toEqual({ text: '–', cls: 'okng none' });
  });
});
