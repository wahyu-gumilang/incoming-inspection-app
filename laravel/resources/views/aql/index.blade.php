@extends('layouts.app')

@section('title', 'AQL Table')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/aql-form.css') }}?v={{ filemtime(public_path('css/aql-form.css')) }}">
@endpush

@section('content')
    <livewire:inspections.inspection-form />
@endsection
