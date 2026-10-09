import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type PanelState = 'empty' | 'error' | 'loading';

// One look for "nothing here", "failed to load" and "loading". Project an action
// (e.g. a Retry button) as content.
@Component({
  selector: 'app-state-panel',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './state-panel.html',
  styleUrl: './state-panel.scss',
})
export class StatePanel {
  readonly state = input.required<PanelState>();
  readonly title = input('');
  readonly message = input('');
  readonly icon = input('');

  protected readonly defaultIcon = { empty: 'inbox', error: 'error', loading: '' } as const;
}
