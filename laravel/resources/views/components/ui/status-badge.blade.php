@props(['active'])

<span {{ $attributes->merge(['class' => 'status-pill '.($active ? 'is-active' : 'is-inactive')]) }}>
    <span class="status-dot"></span>
    {{ $active ? 'Active' : 'Inactive' }}
</span>
