@props(['placeholder' => 'Search...', 'label' => 'Search'])

<div class="ui-search">
    <x-icon name="search" :size="18" />
    <input
        {{ $attributes->merge(['class' => 'input', 'type' => 'search', 'placeholder' => $placeholder, 'aria-label' => $label]) }}
    >
</div>
