(() => {
    "use strict";

    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        const input = document.getElementById(button.dataset.passwordTarget);

        if (!input) {
            return;
        }

        button.addEventListener("click", () => {
            const visible = input.type === "text";
            const show = button.querySelector("[data-password-show]");
            const hide = button.querySelector("[data-password-hide]");

            input.type = visible ? "password" : "text";
            button.setAttribute("aria-pressed", String(!visible));
            button.setAttribute("aria-label", visible ? "Show password" : "Hide password");

            if (show && hide) {
                show.hidden = !visible;
                hide.hidden = visible;
            }
        });
    });
})();
