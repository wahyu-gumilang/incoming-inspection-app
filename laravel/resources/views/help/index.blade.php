@extends('layouts.app')

@section('title', 'Help Center')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/help.css') }}?v={{ filemtime(public_path('css/help.css')) }}">
@endpush

@section('content')
    <x-ui.page-header
        eyebrow="Support"
        title="Help Center"
        description="Quick guidance for access, incoming inspection, and direct support."
    />

    <div class="help-grid">
        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="user" :size="24" />
            </span>
            <h2>Sign in and access</h2>
            <p>
                Use your PT. Chubb Safes Indonesia username. If your account is inactive or you
                need a password reset, contact an administrator.
            </p>
        </div>

        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="clipboard-check" :size="24" />
            </span>
            <h2>Incoming inspection</h2>
            <p>
                Select the item and supplier, fill up to seven delivery columns, enter the actual
                values, and choose a judgment. AQL values follow the received quantity and
                inspection category.
            </p>
        </div>

        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="key" :size="24" />
            </span>
            <h2>Password and profile</h2>
            <p>
                Open <strong>User Settings</strong> from the account menu to update your profile,
                avatar, theme, or password. Password changes require your current password.
            </p>
        </div>
    </div>

    <section class="card help-support">
        <div class="help-support-head">
            <div>
                <span class="help-support-eyebrow">Direct support</span>
                <h2>Talk to the QC system owner</h2>
                <p>Include the inspection number and a screenshot so the issue can be traced quickly.</p>
            </div>
            <span class="help-support-status">
                <span class="help-support-status-dot" aria-hidden="true"></span>
                Support channel
            </span>
        </div>

        <div class="help-support-grid">
            <a
                class="help-support-card help-support-whatsapp"
                href="https://wa.me/6281281973198?text=Halo%2C%20saya%20butuh%20bantuan%20Incoming%20Inspection%20QC."
                target="_blank"
                rel="noopener noreferrer"
            >
                <span class="help-support-icon">
                    <x-icon name="message-circle" :size="22" />
                </span>
                <span class="help-support-copy">
                    <strong>WhatsApp</strong>
                    <span>+62 812-8197-3198</span>
                    <small>Chat directly with support</small>
                </span>
                <x-icon name="arrow-up-right" :size="17" class="help-support-arrow" />
            </a>

            <a
                class="help-support-card help-support-email"
                href="mailto:wahyu.gumilang@gunnebo.com?subject=Incoming%20Inspection%20QC%20Support"
            >
                <span class="help-support-icon">
                    <x-icon name="mail" :size="22" />
                </span>
                <span class="help-support-copy">
                    <strong>Email / Outlook</strong>
                    <span>wahyu.gumilang@gunnebo.com</span>
                    <small>Open your email client and compose a message</small>
                </span>
                <x-icon name="arrow-up-right" :size="17" class="help-support-arrow" />
            </a>
        </div>
    </section>
@endsection
