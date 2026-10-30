@extends('layouts.app')

@section('title', 'Items')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/items.css') }}?v={{ filemtime(public_path('css/items.css')) }}">
@endpush

@section('content')
    @php($search = is_string(request('search')) ? request('search') : '')

    <livewire:items.item-list :search="$search" />
@endsection
