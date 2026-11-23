@extends('layouts.app')

@section('title', 'Reports')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/reports.css') }}?v={{ filemtime(public_path('css/reports.css')) }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/auto-submit-search.js') }}?v={{ filemtime(public_path('js/auto-submit-search.js')) }}" defer></script>
@endpush

@section('content')
    <x-ui.page-header
        eyebrow="Inspection Reports"
        title="Reports"
        description="Saved inspection check sheets and their AQL results."
    />

    <div class="card reports-panel">
        <div class="reports-toolbar">
            <form
                class="reports-search"
                method="GET"
                action="{{ route('reports.index') }}"
                data-auto-submit-search
            >
                <input type="hidden" name="status" value="{{ $status }}">

                <x-ui.search
                    name="search"
                    value="{{ $search }}"
                    placeholder="Search inspection, item, or supplier..."
                    label="Search inspections"
                />

                <div class="reports-status-filter">
                    <x-ui.dropdown
                        :label="$statusOptions[$status] ?? 'All statuses'"
                        :value="$status"
                        :options="$statusOptions"
                        :links="$statusLinks"
                        aria-label="Filter reports by status"
                    />
                </div>

                @if ($search !== '' || $status !== '')
                    <x-ui.button variant="ghost" icon="rotate-ccw" :href="route('reports.index')">Clear</x-ui.button>
                @endif
            </form>

            <span class="reports-count">{{ number_format($inspections->total()) }} reports</span>
        </div>

        @if ($inspections->isEmpty())
            <div class="reports-empty">
                <x-ui.empty-state
                    icon="clipboard-check"
                    title="No inspections found"
                    description="Completed AQL Table entries will appear here."
                >
                    @if ($search !== '' || $status !== '')
                        <x-slot:actions>
                            <x-ui.button variant="secondary" icon="rotate-ccw" :href="route('reports.index')">Clear filters</x-ui.button>
                        </x-slot:actions>
                    @endif
                </x-ui.empty-state>
            </div>
        @else
            <div class="reports-table-wrap">
                <table class="items-table reports-table">
                    <thead>
                        <tr>
                            <th>Inspection</th>
                            <th>Date</th>
                            <th>Item</th>
                            <th>Supplier</th>
                            <th>Status</th>
                            <th>Inspector</th>
                            <th class="reports-actions-head">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($inspections as $inspection)
                            <tr>
                                <td>
                                    <a class="report-number" href="{{ route('reports.show', $inspection->inspectnum) }}">
                                        {{ $inspection->inspectnum }}
                                    </a>
                                </td>
                                <td class="reports-muted">
                                    {{ $inspection->inspectdate ? \Illuminate\Support\Carbon::parse($inspection->inspectdate)->format('j M Y') : '—' }}
                                </td>
                                <td>
                                    <span class="report-item">{{ $inspection->itemid }}</span>
                                    <small>{{ $inspection->itemname ?: '—' }}</small>
                                </td>
                                <td>
                                    <span class="report-item">{{ $inspection->accountnum }}</span>
                                    <small>{{ $inspection->name ?: '—' }}</small>
                                </td>
                                <td>
                                    @php
                                        $rowStatus = \App\Domain\Inspection\InspectionStatus::normalize($inspection->inspectstatus);
                                    @endphp
                                    <x-ui.badge :variant="\App\Domain\Inspection\InspectionStatus::badgeVariant($rowStatus)">
                                        {{ \App\Domain\Inspection\InspectionStatus::label($rowStatus) }}
                                    </x-ui.badge>
                                </td>
                                <td class="reports-muted">{{ $inspection->inspectby ?: '—' }}</td>
                                <td class="reports-actions-head">
                                    <x-ui.button
                                        variant="ghost"
                                        size="sm"
                                        :href="route('reports.show', $inspection->inspectnum)"
                                        icon-after="chevron-right"
                                    >
                                        View
                                    </x-ui.button>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="reports-footer">
                <span class="reports-count">
                    Showing {{ $inspections->firstItem() }}-{{ $inspections->lastItem() }} of
                    {{ number_format($inspections->total()) }} reports
                </span>

                @if ($inspections->hasPages())
                    <nav class="pagination" aria-label="Pagination">
                        <a
                            class="page-btn {{ $inspections->onFirstPage() ? 'is-disabled' : '' }}"
                            href="{{ $inspections->previousPageUrl() ?: '#' }}"
                            @if ($inspections->onFirstPage()) aria-disabled="true" @endif
                        >
                            <x-icon name="chevron-left" :size="14" />
                            Previous
                        </a>

                        @foreach ($inspections->getUrlRange(max(1, $inspections->currentPage() - 1), min($inspections->lastPage(), $inspections->currentPage() + 1)) as $page => $url)
                            <a class="page-btn {{ $page === $inspections->currentPage() ? 'is-active' : '' }}" href="{{ $url }}">
                                {{ $page }}
                            </a>
                        @endforeach

                        <a
                            class="page-btn {{ $inspections->hasMorePages() ? '' : 'is-disabled' }}"
                            href="{{ $inspections->nextPageUrl() ?: '#' }}"
                            @if (! $inspections->hasMorePages()) aria-disabled="true" @endif
                        >
                            Next
                            <x-icon name="chevron-right" :size="14" />
                        </a>
                    </nav>
                @endif
            </div>
        @endif
    </div>
@endsection
