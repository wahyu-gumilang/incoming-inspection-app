import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StatusChip } from './status-chip';

function render(status: string) {
  const fixture = TestBed.createComponent(StatusChip);
  fixture.componentRef.setInput('status', status);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('.chip');
  return { text: el.textContent?.trim(), cls: el.className };
}

describe('StatusChip', () => {
  it('maps each status to its label and tone', () => {
    expect(render('DRAFT')).toEqual({ text: 'Draft', cls: 'chip neutral' });
    expect(render('SUBMITTED')).toEqual({ text: 'Submitted', cls: 'chip info' });
    expect(render('CHECKED')).toEqual({ text: 'Checked', cls: 'chip ok' });
  });

  it('shows a legacy value as-is', () => {
    expect(render('1')).toEqual({ text: '1', cls: 'chip neutral' });
  });
});
