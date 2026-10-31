import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap, tap } from 'rxjs';

export interface LookupOption {
  /** The value that will be emitted on selection. */
  value: string;
  /** Primary display label. */
  label: string;
  /** Optional secondary text (e.g. item name below the part number). */
  sublabel?: string;
}

@Component({
  selector: 'app-lookup-autocomplete',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      class="lookup-field"
    >
      <mat-label>{{ label() }}</mat-label>

      <input
        #trigger="matAutocompleteTrigger"
        matInput
        [matAutocomplete]="auto"
        [formControl]="searchControl"
        [placeholder]="placeholder()"
        [required]="required()"
        [disabled]="disabled()"
        (blur)="onBlur()"
        (focus)="onFocus()"
      />

      @if (clearable() && searchControl.value) {
        <button
          matSuffix
          mat-icon-button
          type="button"
          class="lookup-clear-btn"
          (click)="onClear($event)"
          [attr.aria-label]="'Clear ' + label()"
        >
          <mat-icon fontIcon="close" />
        </button>
      }

      @if (loading()) {
        <mat-spinner matSuffix [diameter]="18" />
      } @else {
        <mat-icon matSuffix fontIcon="search" class="lookup-search-icon" />
      }

      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayFn"
        (optionSelected)="onOptionSelected($event)"
      >
        @if (loading() && options().length === 0) {
          <mat-option disabled class="lookup-loading-option">
            <mat-spinner [diameter]="20" />
            <span>Searching…</span>
          </mat-option>
        }

        @for (option of filteredOptions(); track option.value) {
          <mat-option [value]="option">
            <div class="lookup-option">
              <span class="lookup-option-label">{{ option.label }}</span>
              @if (option.sublabel) {
                <span class="lookup-option-sublabel">{{ option.sublabel }}</span>
              }
            </div>
          </mat-option>
        }

        @if (!loading() && (filteredOptions().length === 0) && searchControl.value) {
          <mat-option disabled class="lookup-no-results">
            No results found
          </mat-option>
        }
      </mat-autocomplete>

      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }

      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: [`
    .lookup-field {
      width: 100%;
    }

    .lookup-search-icon {
      color: var(--mat-sys-on-surface-variant, #666);
    }

    .lookup-clear-btn {
      width: 24px;
      height: 24px;
      line-height: 24px;

      .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
    }

    .lookup-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 0;
    }

    .lookup-option-label {
      font-weight: 500;
    }

    .lookup-option-sublabel {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
    }

    .lookup-loading-option,
    .lookup-no-results {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 14px;
      cursor: default;
    }

    .lookup-loading-option span {
      margin-left: 4px;
    }
  `],
})
export class LookupAutocomplete {
  /** Label for the form field. */
  readonly label = input.required<string>();
  /** Placeholder text. */
  readonly placeholder = input<string>('');
  /** Hint text below the field. */
  readonly hint = input<string>('');
  /** Error message (shown when non-empty). */
  readonly error = input<string>('');
  /** Whether the field is required. */
  readonly required = input(false);
  /** Whether the field is disabled. */
  readonly disabled = input(false);
  /** Whether to show a clear button when a value is entered. */
  readonly clearable = input(true);
  /** Form field appearance. */
  readonly appearance = input<'fill' | 'outline'>('outline');
  /** Float label behaviour. */
  readonly floatLabel = input<'auto' | 'always'>('auto');
  /** Minimum characters before search fires. */
  readonly minSearchLength = input(1);
  /** Debounce time in ms. */
  readonly debounceMs = input(300);
  /** The currently selected option (two-way binding). */
  readonly selected = model<LookupOption | null>(null);
  /** The raw search text (two-way binding). */
  readonly searchText = model<string>('');

  /** Function that returns an Observable of options given a search query. */
  readonly search = input.required<(query: string) => Observable<LookupOption[]>>();

  /** Emitted when the selected option changes. */
  readonly selectionChange = output<LookupOption | null>();

  /** Emitted when the search text changes (after debounce). */
  readonly searchChange = output<string>();

  readonly loading = signal(false);
  readonly options = signal<LookupOption[]>([]);

  @ViewChild(MatAutocompleteTrigger) private readonly trigger!: MatAutocompleteTrigger;

  // Referenced by the template (formControl binding, clear button, no-results check).
readonly searchControl = new FormControl<string | LookupOption>('');

  readonly displayFn = (option: LookupOption | string): string => {
    if (typeof option === 'string') return option;
    return option?.label ?? '';
  };

  // Options filtered by the current search text. A plain array (not an Observable),
  // so the template reads it directly instead of through the async pipe.
  readonly filteredOptions = computed<LookupOption[]>(() => {
    const opts = this.options();
    const text = this.searchControl.value;
    if (!text || typeof text !== 'string') return opts;
    const q = text.toLowerCase();
    return opts.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  });

  constructor() {
    // Debounced search
    effect(() => {
      const minLen = this.minSearchLength();
      const debounce = this.debounceMs();

      this.searchControl.valueChanges
        .pipe(
          debounceTime(debounce),
          distinctUntilChanged(),
          tap(() => {
            const val = this.searchControl.value;
            if (typeof val !== 'string') return;
            this.searchText.set(val);
            this.searchChange.emit(val);
          }),
          switchMap((value) => {
            if (typeof value !== 'string' || value.length < minLen) {
              this.loading.set(false);
              this.options.set([]);
              return of([]);
            }
            this.loading.set(true);
            return this.search()(value).pipe(
              tap({
                next: (opts) => {
                  this.options.set(opts);
                  this.loading.set(false);
                },
                error: () => this.loading.set(false),
              }),
            );
          }),
        )
        .subscribe();
    });
  }

  onOptionSelected(event: { option: { value: LookupOption } }): void {
    const option = event.option.value;
    this.selected.set(option);
    this.selectionChange.emit(option);
    this.searchControl.setValue(option.label, { emitEvent: false });
  }

  onClear(event: MouseEvent): void {
    event.stopPropagation();
    this.selected.set(null);
    this.selectionChange.emit(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.searchText.set('');
    this.searchChange.emit('');
    this.options.set([]);
  }

  onBlur(): void {
    // If the user typed something that doesn't match a selected option, clear it
    const val = this.searchControl.value;
    if (typeof val === 'string' && val && !this.selected()) {
      // Don't clear on blur — let the user see what they typed
    }
  }

  onFocus(): void {
    if (this.searchControl.value && typeof this.searchControl.value === 'string') {
      this.trigger.openPanel();
    }
  }

  /** Programmatically set the selected option. */
  setSelection(option: LookupOption | null): void {
    this.selected.set(option);
    this.searchControl.setValue(option?.label ?? '', { emitEvent: false });
    if (option) {
      this.searchText.set(option.label);
    }
  }

  /** Programmatically set the search text. */
  setSearchText(text: string): void {
    this.searchControl.setValue(text, { emitEvent: true });
  }
}
