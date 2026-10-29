@props(['role'])

<span {{ $attributes->merge(['class' => 'role-badge role-'.strtolower($role)]) }}>
    {{ \App\Domain\User\Role::label($role) }}
</span>
