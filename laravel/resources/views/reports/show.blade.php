@extends('layouts.app')

@section('title', 'Report '.$inspection->inspectnum)

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/aql.css') }}?v={{ filemtime(public_path('css/aql.css')) }}">
@endpush

@section('content')
    @php
        $calculator = app(\App\Services\InspectionCalculator::class);
        $statusText = fn ($status) => $status === 1 ? 'OK' : ($status === 0 ? 'NG' : '');
        $number = fn ($value) => $value !== null && $value !== '' ? number_format((float) $value, 2, '.', '') : '';
        $stdRows = $stdLines->values();
        $stdCount = max(13, $stdRows->count());
        $certLines = $otherLines->filter(fn ($line) => strtoupper(trim((string) $line->inspecttype)) === 'CERTIFIKAT')->values();
        $visualLines = $otherLines->filter(fn ($line) => strtoupper(trim((string) $line->inspecttype)) === 'VISUAL')->values();
        $fittingLines = $otherLines->filter(fn ($line) => strtoupper(trim((string) $line->inspecttype)) === 'FITTING')->values();
        $otherSections = [
            ['label' => 'Certificate No', 'lines' => $certLines, 'min' => 1],
            ['label' => 'Visual', 'lines' => $visualLines, 'min' => 3],
            ['label' => 'Fitting', 'lines' => $fittingLines, 'min' => 2],
        ];
    @endphp

    <x-ui.page-header
        class="report-page-header"
        eyebrow="Inspection Report"
        :title="$inspection->inspectnum"
        :description="($inspection->itemid ?: '—').' · '.($inspection->itemname ?: '—').' · '.($inspection->name ?: '—')"
    >
        <x-slot:actions>
            <x-ui.button :href="route('reports.index')" icon="arrow-left">Back to reports</x-ui.button>
            <x-ui.button variant="primary" icon="printer" onclick="window.print()">Print</x-ui.button>
        </x-slot:actions>
    </x-ui.page-header>

    <div class="report-sheet-hint">
        <x-icon name="arrow-right" :size="16" />
        <span>Swipe horizontally to see every delivery column.</span>
    </div>

    <div class="report-sheet-scroll" role="region" aria-label="Incoming inspection check sheet" tabindex="0">
        <div class="aql-page">
        <div class="aql-sheet">
            <div class="aql-form-header">
                <div class="aql-form-number">Form No : 7.4.3-F1</div>

                <div class="aql-form-title">
                    <strong>INCOMING INSPECTION CHECK LIST</strong>
                    <span>PT. Chubb Safes Indonesia</span>
                </div>

                <div class="aql-form-meta">
                    <span>Rev.</span>
                    <span>Tanggal</span>
                    <span>Hal.</span>
                    <strong>01</strong>
                    <strong>{{ $inspection->inspectdate ? \Illuminate\Support\Carbon::parse($inspection->inspectdate)->format('d/m/y') : '' }}</strong>
                    <strong>1/1</strong>
                </div>
            </div>

            <div class="aql-form-part">
                <span>Part name: {{ $inspection->itemname }}</span>
                <span>Part no.: {{ $inspection->itemid }}</span>
                <span>Supplier name: {{ $inspection->name }}</span>
            </div>

            <div class="aql-table-scroll">
                <table class="aql-form-table">
                    <colgroup>
                        <col style="width: 3.2%">
                        <col style="width: 7.8%">
                        <col style="width: 10.5%">
                        <col style="width: 10.5%">
                        @for ($column = 0; $column < 7; $column++)
                            <col style="width: 4.8%">
                            <col style="width: 4.9%">
                        @endfor
                    </colgroup>

                    <thead>
                        <tr class="aql-group-row">
                            <th colspan="4">Dimensions</th>
                            <th colspan="14">Measurement result</th>
                        </tr>
                        <tr>
                            <th>NO.</th>
                            <th>Item</th>
                            <th>Standard</th>
                            <th>Tolerance</th>
                            @for ($column = 0; $column < 7; $column++)
                                <th>Actual</th>
                                <th>OK/<br>NG</th>
                            @endfor
                        </tr>
                    </thead>

                    <tbody>
                        @for ($index = 0; $index < $stdCount; $index++)
                            @php
                                $line = $stdRows[$index] ?? null;
                            @endphp
                            <tr>
                                <td class="aql-number">{{ $index < 13 ? $index + 1 : '' }}</td>
                                <td>{{ $line?->inspectitem }}</td>
                                <td>{{ $line ? ($line->standard_txt ?: $number($line->standard)) : '' }}</td>
                                <td>{{ $line?->tolerance_txt }}</td>
                                @for ($column = 1; $column <= 7; $column++)
                                    <td class="aql-actual">{{ $line ? $number($line->{'actual_'.$column}) : '' }}</td>
                                    <td>{{ $line ? $statusText($line->{'status_'.$column}) : '' }}</td>
                                @endfor
                            </tr>
                        @endfor

                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            @for ($column = 0; $column < 7; $column++)
                                <td class="aql-actual"></td>
                                <td></td>
                            @endfor
                        </tr>

                        @foreach ($otherSections as $section)
                            @php
                                $sectionLines = $section['lines'];
                                $rowCount = max($section['min'], $sectionLines->count());
                            @endphp
                            @for ($index = 0; $index < $rowCount; $index++)
                                @php
                                    $line = $sectionLines[$index] ?? null;
                                @endphp
                                <tr>
                                    @if ($index === 0)
                                        <td colspan="2" rowspan="{{ $rowCount }}" class="aql-section-label aql-section-tall">{{ $section['label'] }}</td>
                                        <td rowspan="{{ $rowCount }}" class="aql-section-empty"></td>
                                        <td rowspan="{{ $rowCount }}" class="aql-section-empty"></td>
                                    @endif
                                    @for ($column = 1; $column <= 7; $column++)
                                        <td class="aql-actual">{{ $line?->{'actual_txt_'.$column} }}</td>
                                        <td>{{ $line ? $statusText($line->{'status_'.$column}) : '' }}</td>
                                    @endfor
                                </tr>
                            @endfor
                        @endforeach

                        @php
                            $poFields = range(1, 7);
                        @endphp
                        <tr>
                            <td colspan="4" class="aql-bottom-label">P/O No.</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">{{ $inspection->{'purchordernum'.$column} }}</td>
                            @endforeach
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">Delivery date</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">
                                    {{ $inspection->{'deliverydate'.$column} ? \Illuminate\Support\Carbon::parse($inspection->{'deliverydate'.$column})->format('d/m/y') : '' }}
                                </td>
                            @endforeach
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">Measuring Instrument</td>
                            <td colspan="14" class="aql-measuring">{{ $inspection->instrument }}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">QTY received/ Insp. Category*)</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">
                                    @if ((float) $inspection->{'qty_received'.$column} > 0)
                                        {{ (int) $inspection->{'qty_received'.$column} }}
                                        / {{ $calculator->categoryLabel((int) $inspection->{'inspectcategory'.$column}) }}
                                    @endif
                                </td>
                            @endforeach
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">NG/Total sample</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">
                                    @if ((float) $inspection->{'qty_received'.$column} > 0)
                                        {{ (int) $inspection->{'notgood'.$column} }}
                                        / {{ $inspection->{'samplesize'.$column} ?? '—' }}
                                    @endif
                                </td>
                            @endforeach
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">Judgment**)</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">{{ $calculator->judgmentLabel((int) $inspection->{'judgment'.$column}) }}</td>
                            @endforeach
                        </tr>
                        <tr>
                            <td colspan="4" class="aql-bottom-label">QF No.</td>
                            @foreach ($poFields as $column)
                                <td colspan="2">{{ $inspection->qfnum }}</td>
                            @endforeach
                        </tr>
                    </tbody>
                </table>
            </div>

            <table class="aql-sign-table">
                <colgroup>
                    <col style="width: 18.3%">
                    @for ($column = 0; $column < 7; $column++)
                        <col style="width: 11.67%">
                    @endfor
                </colgroup>
                <tbody>
                    <tr>
                        <td class="aql-sign-label">Inspected by</td>
                        @for ($column = 0; $column < 7; $column++)
                            <td>{{ $inspection->inspectby }}</td>
                        @endfor
                    </tr>
                    <tr>
                        <td class="aql-sign-label">Checked by</td>
                        @for ($column = 0; $column < 7; $column++)
                            <td>{{ $inspection->checkedby }}</td>
                        @endfor
                    </tr>
                </tbody>
            </table>

            <div class="aql-note">
                <strong>Note:</strong>
                <span>*) T: Tightening</span>
                <span>N: Normal</span>
                <span>R: Reduce</span>
                <span>**) O: Accepted</span>
                <span>X: Rejected</span>
                <span>C: Concession</span>
                <span>No Mark: 100 % inspection</span>
            </div>
        </div>
    </div>
    </div>
@endsection
