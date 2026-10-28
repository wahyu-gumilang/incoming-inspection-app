(() => {
    "use strict";

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const weatherCode = (code, isDay) => {
        if (code === 0) return { icon: isDay ? "sun" : "moon", label: "Clear" };
        if (code === 1) return { icon: "cloud-sun", label: "Mainly clear" };
        if (code === 2) return { icon: "cloud-sun", label: "Partly cloudy" };
        if (code === 3) return { icon: "cloud", label: "Overcast" };
        if (code === 45 || code === 48) return { icon: "cloud-fog", label: "Fog" };
        if ([51, 53, 55, 56, 57].includes(code)) return { icon: "cloud-rain", label: "Drizzle" };
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "cloud-rain", label: "Rain" };
        if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "cloud-snow", label: "Snow" };
        if ([95, 96, 99].includes(code)) return { icon: "cloud-lightning", label: "Thunderstorm" };

        return { icon: "cloud-sun", label: "Mixed" };
    };

    const setWeather = (badge, data) => {
        const temp = badge.querySelector("[data-weather-temp]");
        const icons = badge.querySelectorAll("[data-weather-icon]");
        const condition = weatherCode(data.code, data.isDay === 1);

        icons.forEach((icon) => {
            icon.hidden = icon.dataset.weatherIcon !== condition.icon;
        });

        if (temp) {
            temp.textContent = `${Math.round(data.temperature)}°C`;
        }

        const label = `${data.label} · ${condition.label} · ${Math.round(data.temperature)}°C`;
        badge.title = label;
        badge.setAttribute("aria-label", label);
        badge.classList.remove("is-loading");
    };

    const weather = async (badge) => {
        const lat = badge.dataset.weatherLat;
        const lon = badge.dataset.weatherLon;
        const label = badge.dataset.weatherLabel || "Local";

        if (!lat || !lon) {
            badge.classList.remove("is-loading");

            return;
        }

        const cacheKey = `qc-navbar-weather:${lat}:${lon}`;

        try {
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                const parsed = JSON.parse(cached);

                if (parsed.fetchedAt && Date.now() - parsed.fetchedAt < 15 * 60 * 1000) {
                    setWeather(badge, { ...parsed, label });

                    return;
                }
            }
        } catch {
            // Storage can be unavailable in private mode; fetch instead.
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 6000);

        try {
            const url = new URL("https://api.open-meteo.com/v1/forecast");
            url.searchParams.set("latitude", lat);
            url.searchParams.set("longitude", lon);
            url.searchParams.set("current", "temperature_2m,weather_code,is_day");
            url.searchParams.set("timezone", "auto");

            const response = await fetch(url, { signal: controller.signal });

            if (!response.ok) {
                throw new Error(`Weather request failed with ${response.status}`);
            }

            const payload = await response.json();
            const current = payload.current;

            if (!current || typeof current.temperature_2m !== "number") {
                throw new Error("Weather response did not contain a temperature");
            }

            const data = {
                temperature: clamp(current.temperature_2m, -99, 99),
                code: Number(current.weather_code),
                isDay: Number(current.is_day),
                fetchedAt: Date.now(),
            };

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
            } catch {
                // The badge still updates when storage is unavailable.
            }

            setWeather(badge, { ...data, label });
        } catch {
            const temp = badge.querySelector("[data-weather-temp]");

            if (temp) {
                temp.textContent = "--°C";
            }

            badge.title = "Weather unavailable";
            badge.setAttribute("aria-label", "Weather unavailable");
            badge.classList.remove("is-loading");
        } finally {
            window.clearTimeout(timeout);
        }
    };

    const initUserMenu = () => {
        const root = document.querySelector("[data-user-menu]");
        const button = root?.querySelector("[data-user-menu-button]");
        const panel = root?.querySelector("[data-user-menu-panel]");

        if (!root || !button || !panel) {
            return;
        }

        const setOpen = (open, focusFirst = false) => {
            panel.hidden = !open;
            button.setAttribute("aria-expanded", String(open));

            if (open && focusFirst) {
                window.requestAnimationFrame(() => {
                    panel.querySelector("a, button")?.focus();
                });
            }
        };

        button.addEventListener("click", (event) => {
            const open = panel.hidden;

            setOpen(open, open && event.detail === 0);
        });

        document.addEventListener("click", (event) => {
            if (!root.contains(event.target)) {
                setOpen(false);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !panel.hidden) {
                setOpen(false);
                button.focus();
            }
        });
    };

    const initSearchShortcut = () => {
        const search = document.querySelector("[data-navbar-search]");

        if (!search) {
            return;
        }

        document.addEventListener("keydown", (event) => {
            const target = event.target;
            const typing = target instanceof HTMLElement
                && (target.matches("input, textarea, select") || target.isContentEditable);

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                search.focus();
                search.select();

                return;
            }

            if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                search.focus();
            }
        });
    };

    const initThemeControl = () => {
        const form = document.querySelector("[data-theme-control]");

        if (!form) {
            return;
        }

        const status = form.querySelector("[data-theme-status]");
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        let preference = form.dataset.themePreference || "system";

        const apply = (value) => {
            const dark = value === "dark" || (value === "system" && media.matches);

            document.documentElement.dataset.theme = dark ? "dark" : "light";
            preference = value;
            form.dataset.themePreference = value;

            form.querySelectorAll("[data-theme-choice]").forEach((button) => {
                const active = button.dataset.themeChoice === value;

                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", String(active));
            });
        };

        const save = async (theme, previous) => {
            form.classList.add("is-saving");

            if (status) {
                status.textContent = "";
            }

            const body = new FormData(form);
            body.set("theme", theme);

            try {
                const response = await fetch(form.action, {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    body,
                });

                if (!response.ok) {
                    throw new Error(`Theme update failed with ${response.status}`);
                }

                const payload = await response.json();
                apply(payload.theme ?? theme);
            } catch {
                apply(previous);

                if (status) {
                    status.textContent = "Could not save the theme. Try again.";
                }
            } finally {
                form.classList.remove("is-saving");
            }
        };

        apply(preference);

        form.querySelectorAll("[data-theme-choice]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();

                const theme = button.dataset.themeChoice;

                if (!theme || theme === preference) {
                    return;
                }

                const previous = preference;
                apply(theme);
                save(theme, previous);
            });
        });

        const onSystemChange = () => {
            if (preference === "system") {
                apply("system");
            }
        };

        if (typeof media.addEventListener === "function") {
            media.addEventListener("change", onSystemChange);
        } else {
            media.addListener(onSystemChange);
        }
    };

    const badge = document.querySelector("[data-weather-badge]");

    if (badge) {
        weather(badge);
    }

    initUserMenu();
    initSearchShortcut();
    initThemeControl();
})();
