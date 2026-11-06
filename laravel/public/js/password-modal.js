(() => {
    "use strict";

    const modal = document.querySelector("[data-password-modal]");

    if (!modal) {
        return;
    }

    let opener = null;

    const open = (trigger = null) => {
        opener = trigger;
        modal.hidden = false;
        document.body.classList.add("password-modal-open");
        window.requestAnimationFrame(() => {
            modal.querySelector('input[name="current_password"]')?.focus();
        });
    };

    const close = () => {
        modal.hidden = true;
        document.body.classList.remove("password-modal-open");

        if (opener instanceof HTMLElement) {
            opener.focus();
        }
    };

    document.querySelectorAll("[data-open-password-modal]").forEach((button) => {
        button.addEventListener("click", () => open(button));
    });

    modal.querySelectorAll("[data-close-password-modal]").forEach((button) => {
        button.addEventListener("click", close);
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            close();
        }
    });

    if (modal.dataset.autoOpen === "true") {
        open();
    }
})();
