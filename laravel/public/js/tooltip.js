(() => {
    "use strict";

    const selector = "[data-tooltip]";
    let tooltip = null;
    let current = null;

    const createTooltip = () => {
        if (tooltip) {
            return tooltip;
        }

        tooltip = document.createElement("div");
        tooltip.className = "ui-tooltip";
        tooltip.setAttribute("role", "tooltip");
        document.body.appendChild(tooltip);

        return tooltip;
    };

    const place = (target) => {
        const tip = createTooltip();
        const targetRect = target.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();
        const gap = 8;
        const margin = 8;
        const placeBelow = targetRect.top < tipRect.height + gap + margin;
        const placement = placeBelow ? "bottom" : "top";
        const left = Math.min(
            Math.max(margin, targetRect.left + targetRect.width / 2 - tipRect.width / 2),
            window.innerWidth - tipRect.width - margin,
        );
        const top = placeBelow
            ? targetRect.bottom + gap
            : targetRect.top - tipRect.height - gap;
        const arrowLeft = Math.min(
            Math.max(10, targetRect.left + targetRect.width / 2 - left),
            tipRect.width - 10,
        );

        tip.dataset.placement = placement;
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
        tip.style.setProperty("--tooltip-arrow-left", `${arrowLeft}px`);
    };

    const show = (target) => {
        const text = target.dataset.tooltip?.trim();

        if (!text) {
            return;
        }

        const tip = createTooltip();

        current = target;
        tip.textContent = text;
        place(target);
        window.requestAnimationFrame(() => tip.classList.add("is-visible"));
    };

    const hide = () => {
        if (tooltip) {
            tooltip.classList.remove("is-visible");
        }

        current = null;
    };

    document.addEventListener("pointerover", (event) => {
        const target = event.target.closest?.(selector);

        if (!target || target === current) {
            return;
        }

        show(target);
    });

    document.addEventListener("pointerout", (event) => {
        const target = event.target.closest?.(selector);

        if (!target || target !== current) {
            return;
        }

        if (!target.contains(event.relatedTarget)) {
            hide();
        }
    });

    document.addEventListener("focusin", (event) => {
        const target = event.target.closest?.(selector);

        if (target) {
            show(target);
        }
    });

    document.addEventListener("focusout", (event) => {
        if (current && event.target.closest?.(selector) === current) {
            hide();
        }
    });

    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
})();
