import { Component, computed, input } from '@angular/core';

type Tone = 'neutral' | 'info' | 'ok';

// inspectstatus: DRAFT → SUBMITTED → CHECKED. Legacy rows ('1') show as-is, read-only.
const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'info' },
  CHECKED: { label: 'Checked', tone: 'ok' },
};

@Component({
  selector: 'app-status-chip',
  templateUrl: './status-chip.html',
  styleUrl: './status-chip.scss',
})
export class StatusChip {
  readonly status = input.required<string>();

  protected readonly view = computed(
    () => STATUS[this.status()] ?? { label: this.status(), tone: 'neutral' as Tone },
  );
}
