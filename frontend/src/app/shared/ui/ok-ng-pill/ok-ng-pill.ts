import { Component, computed, input } from '@angular/core';

// status_N / OK-NG of one value: 1 = OK, 0 = NG, null = not measured.
@Component({
  selector: 'app-ok-ng-pill',
  templateUrl: './ok-ng-pill.html',
  styleUrl: './ok-ng-pill.scss',
})
export class OkNgPill {
  readonly status = input<number | null | undefined>(null);

  protected readonly kind = computed(() => {
    const s = this.status();
    return s === 1 ? 'ok' : s === 0 ? 'ng' : 'none';
  });
  protected readonly label = computed(() => ({ ok: 'OK', ng: 'NG', none: '–' })[this.kind()]);
}
