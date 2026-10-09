import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <app-modal [(open)]="open" title="New vendor" [dismissible]="dismissible()">
      <p class="content">Body</p>
      <button modalFooter class="save">Save</button>
    </app-modal>
  `,
})
class Host {
  readonly open = signal(false);
  readonly dismissible = signal(true);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
  return { fixture, host: fixture.componentInstance, dialog };
}

describe('Modal', () => {
  // jsdom has no <dialog> methods; mimic the browser: open attribute + `close` event.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  it('opens and closes with the open model', async () => {
    const { fixture, host, dialog } = setup();
    expect(dialog.open).toBe(false);

    host.open.set(true);
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(fixture.nativeElement.querySelector('#modal-title').textContent).toContain('New vendor');
    expect(fixture.nativeElement.querySelector('.content')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.save')).not.toBeNull();

    host.open.set(false);
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
  });

  it('closes on the ✕ button and on Esc', () => {
    const { fixture, host, dialog } = setup();
    host.open.set(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.close').click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    host.open.set(true);
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });

  it('ignores ✕ and Esc while not dismissible', () => {
    const { fixture, host, dialog } = setup();
    host.dismissible.set(false);
    host.open.set(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.close').click();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(true);
    expect(dialog.open).toBe(true);
  });
});
