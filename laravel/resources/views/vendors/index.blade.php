@extends('layouts.app')

@section('title', 'Vendors')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/vendors.css') }}?v={{ filemtime(public_path('css/vendors.css')) }}">
@endpush

@section('content')
    <livewire:vendors.vendor-manager />
@endsection
