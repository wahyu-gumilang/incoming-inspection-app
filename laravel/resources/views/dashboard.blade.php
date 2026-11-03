@extends('layouts.app')

@section('title', 'Dashboard')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
@endpush

@section('content')
    @php
        $pending = $statusCounts[\App\Domain\Inspection\InspectionStatus::DRAFT] + $statusCounts[\App\Domain\Inspection\InspectionStatus::RETURNED];
    @endphp

    <div class="dashboard-page">
        <x-ui.page-header
            title="Dashboard"
            :description="'Welcome back, '.auth()->user()->fullname.'.'"
        >
            <x-slot:actions>
                <x-ui.button variant="primary" :href="route('aql.index')" icon="plus">
                    New inspection
                </x-ui.button>
                <x-ui.button :href="route('reports.index')" icon="reports">
                    View reports
                </x-ui.button>
            </x-slot:actions>
        </x-ui.page-header>

        <div class="ui-stat-grid dashboard-stats">
            <x-ui.stat
                tone="blue"
                icon="clipboard-check"
                label="Total inspections"
                :value="number_format($statusCounts['TOTAL'])"
                note="All saved inspection forms"
            />
            <x-ui.stat
                tone="orange"
                icon="pencil"
                label="Draft & returned"
                :value="number_format($pending)"
                note="Waiting for inspector action"
            />
            <x-ui.stat
                tone="violet"
                icon="upload"
                label="Submitted"
                :value="number_format($statusCounts[\App\Domain\Inspection\InspectionStatus::SUBMITTED])"
                note="Waiting for checker review"
            />
            <x-ui.stat
                tone="green"
                icon="check"
                label="Checked"
                :value="number_format($statusCounts[\App\Domain\Inspection\InspectionStatus::CHECKED])"
                note="Final and ready for PDF"
            />
        </div>

        <div class="dashboard-layout">
            <section class="card dashboard-recent">
                <div class="dashboard-section-head">
                    <div>
                        <h2>Recent inspections</h2>
                        <p>The latest check sheets saved by the quality team.</p>
                    </div>

                    <x-ui.button variant="ghost" size="sm" :href="route('reports.index')" icon-after="arrow-right">
                        View all
                    </x-ui.button>
                </div>

                @if ($recentInspections->isEmpty())
                    <div class="dashboard-empty">
                        <x-ui.empty-state
                            icon="clipboard-check"
                            title="No inspections yet"
                            description="Create the first inspection from the AQL Table."
                        >
                            <x-slot:actions>
                                <x-ui.button variant="primary" :href="route('aql.index')" icon="plus">
                                    New inspection
                                </x-ui.button>
                            </x-slot:actions>
                        </x-ui.empty-state>
                    </div>
                @else
                    <div class="dashboard-table-wrap">
                        <table class="items-table dashboard-table">
                            <thead>
                                <tr>
                                    <th>Inspection</th>
                                    <th>Item</th>
                                    <th>Supplier</th>
                                    <th>Status</th>
                                    <th>Inspector</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($recentInspections as $inspection)
                                    @php
                                        $status = \App\Domain\Inspection\InspectionStatus::normalize($inspection->inspectstatus);
                                    @endphp
                                    <tr>
                                        <td>
                                            <a class="dashboard-report-number" href="{{ route('reports.show', $inspection->inspectnum) }}">
                                                {{ $inspection->inspectnum }}
                                            </a>
                                        </td>
                                        <td>
                                            <span class="dashboard-item">{{ $inspection->itemid }}</span>
                                            <small>{{ $inspection->itemname ?: '—' }}</small>
                                        </td>
                                        <td>
                                            <span class="dashboard-item">{{ $inspection->accountnum }}</span>
                                            <small>{{ $inspection->name ?: '—' }}</small>
                                        </td>
                                        <td>
                                            <x-ui.badge :variant="\App\Domain\Inspection\InspectionStatus::badgeVariant($status)">
                                                {{ \App\Domain\Inspection\InspectionStatus::label($status) }}
                                            </x-ui.badge>
                                        </td>
                                        <td class="dashboard-muted">{{ $inspection->inspectby ?: '—' }}</td>
                                        <td class="dashboard-muted">
                                            {{ $inspection->inspectdate ? \Illuminate\Support\Carbon::parse($inspection->inspectdate)->format('d M Y') : '—' }}
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif
            </section>

            <aside class="dashboard-side">
                <section class="card dashboard-quick">
                    <h2>Quick actions</h2>
                    <p>Start the next task without going through the menu.</p>

                    <div class="dashboard-quick-links">
                        <x-ui.button block variant="primary" :href="route('aql.index')" icon="plus">
                            New inspection
                        </x-ui.button>
                        <x-ui.button block :href="route('reports.index')" icon="reports">
                            Open reports
                        </x-ui.button>
                        <x-ui.button block :href="route('items.index')" icon="package">
                            Browse items
                        </x-ui.button>
                        <x-ui.button block :href="route('vendors.index')" icon="building">
                            Manage vendors
                        </x-ui.button>
                    </div>
                </section>

                <section class="card dashboard-master">
                    <div class="dashboard-section-head">
                        <div>
                            <h2>Master data</h2>
                            <p>Source data used by new inspections.</p>
                        </div>
                    </div>

                    <div class="dashboard-master-grid">
                        <a class="dashboard-master-item" href="{{ route('items.index') }}">
                            <span class="dashboard-master-icon"><x-icon name="package" :size="18" /></span>
                            <span class="dashboard-master-copy">
                                <strong>{{ number_format($itemCount) }}</strong>
                                <small>Items</small>
                            </span>
                        </a>
                        <div class="dashboard-master-item">
                            <span class="dashboard-master-icon"><x-icon name="ruler" :size="18" /></span>
                            <span class="dashboard-master-copy">
                                <strong>{{ number_format($standardCount) }}</strong>
                                <small>Standards</small>
                            </span>
                        </div>
                        <a class="dashboard-master-item" href="{{ route('vendors.index') }}">
                            <span class="dashboard-master-icon"><x-icon name="building" :size="18" /></span>
                            <span class="dashboard-master-copy">
                                <strong>{{ number_format($vendorCount) }}</strong>
                                <small>Vendors</small>
                            </span>
                        </a>
                        <div class="dashboard-master-item">
                            <span class="dashboard-master-icon"><x-icon name="users" :size="18" /></span>
                            <span class="dashboard-master-copy">
                                <strong>{{ number_format($userCount) }}</strong>
                                <small>Active users</small>
                            </span>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    </div>
@endsection
