(() => {
    "use strict";

    const form = document.querySelector("[data-profile-form]");

    if (!form) {
        return;
    }

    const avatar = form.querySelector("[data-profile-avatar]");
    const avatarStatus = form.querySelector("[data-profile-avatar-status]");
    const themeStatus = form.querySelector("[data-profile-theme-status]");
    const maxBytes = 2 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    const setStatus = (element, message, tone = "") => {
        if (!element) {
            return;
        }

        element.textContent = message;
        element.classList.remove("is-error", "is-success");

        if (tone) {
            element.classList.add(`is-${tone}`);
        }
    };

    if (avatar && avatarStatus) {
        avatar.addEventListener("change", () => {
            const file = avatar.files?.[0];

            if (!file) {
                setStatus(avatarStatus, "");

                return;
            }

            if (!allowedTypes.includes(file.type)) {
                avatar.value = "";
                setStatus(avatarStatus, "Use a JPG, PNG, or WebP image.", "error");

                return;
            }

            if (file.size > maxBytes) {
                avatar.value = "";
                setStatus(avatarStatus, "The photo must be 2 MB or smaller.", "error");

                return;
            }

            const size = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
            setStatus(avatarStatus, `${file.name} selected (${size}). Click Save changes to upload.`, "success");
        });
    }

    const applyTheme = (theme) => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const dark = theme === "dark" || (theme === "system" && media.matches);

        document.documentElement.dataset.theme = dark ? "dark" : "light";

        document.querySelectorAll("[data-theme-choice]").forEach((button) => {
            const active = button.dataset.themeChoice === theme;

            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    };

    form.querySelectorAll('input[name="theme"]').forEach((input) => {
        input.addEventListener("change", async () => {
            if (!input.checked) {
                return;
            }

            applyTheme(input.value);
            setStatus(themeStatus, "Saving theme...");

            try {
                const body = new FormData();
                body.set("_token", form.querySelector('input[name="_token"]')?.value ?? "");
                body.set("_method", "PATCH");
                body.set("theme", input.value);

                const response = await fetch(form.dataset.themeEndpoint, {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    body,
                });

                if (!response.ok) {
                    throw new Error(`Theme update failed with ${response.status}`);
                }

                const payload = await response.json();
                applyTheme(payload.theme ?? input.value);
                setStatus(themeStatus, "Theme updated.", "success");
            } catch {
                setStatus(themeStatus, "Could not save the theme. Try again.", "error");
            }
        });
    });
})();
