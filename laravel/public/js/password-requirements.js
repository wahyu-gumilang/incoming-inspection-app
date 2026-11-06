(() => {
    "use strict";

    const symbolPattern = /[\p{Z}\p{S}\p{P}]/u;

    const setState = (item, state) => {
        item.classList.remove("is-neutral", "is-met", "is-unmet");
        item.classList.add(state);
    };

    document.querySelectorAll("[data-password-form]").forEach((form) => {
        const password = form.querySelector("[data-password-new]");
        const confirmation = form.querySelector("[data-password-confirm]");
        const requirements = form
            .closest(".password-layout")
            ?.querySelector("[data-password-requirements]");

        if (!password || !confirmation || !requirements) {
            return;
        }

        const items = new Map();

        requirements.querySelectorAll("[data-password-requirement]").forEach((item) => {
            items.set(item.dataset.passwordRequirement, item);
            setState(item, "is-neutral");
        });

        const evaluate = () => {
            const value = password.value;
            const confirmationValue = confirmation.value;
            const hasValue = value.length > 0;

            const states = {
                length: value.length >= 8,
                max: value.length <= 72,
                mixed: /[a-z]/.test(value) && /[A-Z]/.test(value),
                number: /\d/.test(value),
                symbol: symbolPattern.test(value),
                match: confirmationValue.length > 0 && value === confirmationValue,
            };

            items.forEach((item, key) => {
                if (key === "match" && confirmationValue.length === 0) {
                    setState(item, "is-neutral");

                    return;
                }

                if (!hasValue) {
                    setState(item, "is-neutral");

                    return;
                }

                setState(item, states[key] ? "is-met" : "is-unmet");
            });
        };

        password.addEventListener("input", evaluate);
        confirmation.addEventListener("input", evaluate);
        evaluate();
    });
})();
