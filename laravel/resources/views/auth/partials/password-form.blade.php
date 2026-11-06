<div class="password-layout">
    <aside class="password-panel">
        <span class="password-panel-glow" aria-hidden="true"></span>
        <span class="password-panel-icon">
            <x-icon name="shield" :size="26" />
        </span>
        <span class="password-panel-kicker">Security center</span>
        <h2>Keep your account protected</h2>
        <p>
            Choose a password that is unique to this account and not reused anywhere else.
        </p>

        <ul class="password-requirements" data-password-requirements>
            <li class="password-requirement" data-password-requirement="length">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                At least 8 characters
            </li>
            <li class="password-requirement" data-password-requirement="max">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                Maximum 72 characters
            </li>
            <li class="password-requirement" data-password-requirement="mixed">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                Uppercase and lowercase letters
            </li>
            <li class="password-requirement" data-password-requirement="number">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                At least one number
            </li>
            <li class="password-requirement" data-password-requirement="symbol">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                At least one symbol
            </li>
            <li class="password-requirement" data-password-requirement="match">
                <span class="password-requirement-icon">
                    <span data-requirement-met><x-icon name="check" :size="13" /></span>
                    <span data-requirement-unmet><x-icon name="x" :size="13" /></span>
                </span>
                Passwords match
            </li>
        </ul>
    </aside>

    <section class="card password-form-card">
        <div class="account-section-head">
            <span class="account-section-icon">
                <x-icon name="key" :size="18" />
            </span>
            <div>
                <h2>Update your password</h2>
                <p>Enter your current password, then choose a new one.</p>
            </div>
        </div>

        <form method="POST" action="{{ route('password.update') }}" class="form" data-password-form>
            @csrf

            <x-ui.field label="Current password" for="current-password" name="current_password">
                <div class="password-input-wrap">
                    <input
                        id="current-password"
                        class="input"
                        type="password"
                        name="current_password"
                        autocomplete="current-password"
                        required
                    >
                    <button
                        class="password-toggle"
                        type="button"
                        data-password-toggle
                        data-password-target="current-password"
                        aria-label="Show password"
                        aria-pressed="false"
                    >
                        <span data-password-show><x-icon name="eye" :size="16" /></span>
                        <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                    </button>
                </div>
            </x-ui.field>

            <x-ui.field label="New password" for="new-password" name="password">
                <div class="password-input-wrap">
                    <input
                        id="new-password"
                        class="input"
                        type="password"
                        name="password"
                        autocomplete="new-password"
                        minlength="8"
                        maxlength="72"
                        required
                        data-password-new
                    >
                    <button
                        class="password-toggle"
                        type="button"
                        data-password-toggle
                        data-password-target="new-password"
                        aria-label="Show password"
                        aria-pressed="false"
                    >
                        <span data-password-show><x-icon name="eye" :size="16" /></span>
                        <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                    </button>
                </div>
            </x-ui.field>

            <x-ui.field label="Confirm new password" for="confirm-password" name="password_confirmation">
                <div class="password-input-wrap">
                    <input
                        id="confirm-password"
                        class="input"
                        type="password"
                        name="password_confirmation"
                        autocomplete="new-password"
                        minlength="8"
                        maxlength="72"
                        required
                        data-password-confirm
                    >
                    <button
                        class="password-toggle"
                        type="button"
                        data-password-toggle
                        data-password-target="confirm-password"
                        aria-label="Show password"
                        aria-pressed="false"
                    >
                        <span data-password-show><x-icon name="eye" :size="16" /></span>
                        <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                    </button>
                </div>
            </x-ui.field>

            <div class="account-actions">
                <x-ui.button variant="primary" type="submit" icon="save">Update password</x-ui.button>
            </div>
        </form>
    </section>
</div>
