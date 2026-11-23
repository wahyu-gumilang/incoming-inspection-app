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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $inspection->inspectnum }}</title>
    <style>{!! file_get_contents(public_path('css/pdf.css')) !!}</style>
</head>
<body>
<div class="pdf-page">
    <table class="form-header">
        <tbody>
            <tr>
                <td class="form-number" style="width: 24%">Form No : 7.4.3-F1</td>
                <td class="form-title" style="width: 53%">
                    <strong>INCOMING INSPECTION CHECK LIST</strong>
                    <span>PT. Chubb Safes Indonesia</span>
                </td>
                <td style="width: 23%; padding: 0">
                    <table class="meta-table">
                        <tbody>
                            <tr>
                                <td>Rev.</td>
                                <td>Tanggal</td>
                                <td>Hal.</td>
                            </tr>
                            <tr>
                                <td>01</td>
                                <td>{{ $inspection->inspectdate ? \Illuminate\Support\Carbon::parse($inspection->inspectdate)->format('d/m/y') : '' }}</td>
                                <td>1/1</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>

    <table class="part-table">
        <tbody>
            <tr>
                <td>Part name: {{ $inspection->itemname }}</td>
                <td>Part no.: {{ $inspection->itemid }}</td>
                <td>Supplier name: {{ $inspection->name }}</td>
            </tr>
        </tbody>
    </table>

    <table class="form-table">
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
            <tr class="group-row">
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
                    <th class="ok-ng">OK/<br>NG</th>
                @endfor
            </tr>
        </thead>

        <tbody>
            @for ($index = 0; $index < $stdCount; $index++)
                @php
                    $line = $stdRows[$index] ?? null;
                @endphp
                <tr>
                    <td class="number">{{ $index < 13 ? $index + 1 : '' }}</td>
                    <td>{{ $line?->inspectitem }}</td>
                    <td>{{ $line ? ($line->standard_txt ?: $number($line->standard)) : '' }}</td>
                    <td>{{ $line?->tolerance_txt }}</td>
                    @for ($column = 1; $column <= 7; $column++)
                        <td class="actual">{{ $line ? $number($line->{'actual_'.$column}) : '' }}</td>
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
                    <td class="actual"></td>
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
                            <td colspan="2" rowspan="{{ $rowCount }}" class="section-label">{{ $section['label'] }}</td>
                            <td rowspan="{{ $rowCount }}"></td>
                            <td rowspan="{{ $rowCount }}"></td>
                        @endif
                        @for ($column = 1; $column <= 7; $column++)
                            <td class="actual">{{ $line?->{'actual_txt_'.$column} }}</td>
                            <td>{{ $line ? $statusText($line->{'status_'.$column}) : '' }}</td>
                        @endfor
                    </tr>
                @endfor
            @endforeach

            @php
                $poFields = range(1, 7);
            @endphp

            <tr>
                <td colspan="4" class="bottom-label">P/O No.</td>
                @foreach ($poFields as $column)
                    <td colspan="2">{{ $inspection->{'purchordernum'.$column} }}</td>
                @endforeach
            </tr>
            <tr>
                <td colspan="4" class="bottom-label">Delivery date</td>
                @foreach ($poFields as $column)
                    <td colspan="2">
                        {{ $inspection->{'deliverydate'.$column} ? \Illuminate\Support\Carbon::parse($inspection->{'deliverydate'.$column})->format('d/m/y') : '' }}
                    </td>
                @endforeach
            </tr>
            <tr>
                <td colspan="4" class="bottom-label">Measuring Instrument</td>
                <td colspan="14" class="measuring">{{ $inspection->instrument }}</td>
            </tr>
            <tr>
                <td colspan="4" class="bottom-label">QTY received/ Insp. Category*)</td>
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
                <td colspan="4" class="bottom-label">NG/Total sample</td>
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
                <td colspan="4" class="bottom-label">Judgment**)</td>
                @foreach ($poFields as $column)
                    <td colspan="2">{{ $calculator->judgmentLabel((int) $inspection->{'judgment'.$column}) }}</td>
                @endforeach
            </tr>
            <tr>
                <td colspan="4" class="bottom-label">QF No.</td>
                @foreach ($poFields as $column)
                    <td colspan="2">{{ $inspection->qfnum }}</td>
                @endforeach
            </tr>
        </tbody>
    </table>

    <table class="sign-table">
        <colgroup>
            <col style="width: 18.3%">
            @for ($column = 0; $column < 7; $column++)
                <col style="width: 11.67%">
            @endfor
        </colgroup>
        <tbody>
            <tr>
                <td class="sign-label">Inspected by</td>
                @for ($column = 0; $column < 7; $column++)
                    <td>{{ $inspection->inspectby }}</td>
                @endfor
            </tr>
            <tr>
                <td class="sign-label">Checked by</td>
                @for ($column = 0; $column < 7; $column++)
                    <td>{{ $inspection->checkedby }}</td>
                @endfor
            </tr>
        </tbody>
    </table>

    <div class="note">
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
</body>
</html>
