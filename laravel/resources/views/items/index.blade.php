@extends('layouts.app')

@section('title', 'Items')

@section('content')
    @php($search = is_string(request('search')) ? request('search') : '')

    <livewire:items.item-list :search="$search" />
@endsection
