(() => {
    "use strict";

    document.querySelectorAll("[data-auto-submit-search]").forEach((form) => {
        const input = form.querySelector('input[type="search"]');

        if (!input) {
            return;
        }

        let timer = null;

        input.addEventListener("input", () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                form.requestSubmit();
            }, 350);
        });
    });
})();
