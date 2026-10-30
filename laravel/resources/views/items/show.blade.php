@extends('layouts.app')

@section('title', 'Item detail')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/items.css') }}?v={{ filemtime(public_path('css/items.css')) }}">
@endpush

@section('content')
    <livewire:items.item-detail :itemid="$itemid" />
@endsection
