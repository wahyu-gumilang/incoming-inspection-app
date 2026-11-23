(() => {
    "use strict";

    const form = document.querySelector("[data-profile-form]");
    const avatar = document.querySelector("[data-profile-avatar]");
    const status = document.querySelector("[data-profile-avatar-status]");
    const dropzone = document.querySelector("[data-profile-dropzone]");
    const preview = document.querySelector("[data-avatar-preview]");
    const modal = document.querySelector("[data-crop-modal]");
    const cropImage = modal?.querySelector("[data-crop-image]");
    const viewport = modal?.querySelector("[data-crop-viewport]");
    const zoomInput = modal?.querySelector("[data-crop-zoom]");
    const resetButton = modal?.querySelector("[data-crop-reset]");
    const applyButton = modal?.querySelector("[data-crop-apply]");
    const maxBytes = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const outputSize = 512;

    let sourceFile = null;
    let sourceUrl = null;
    let naturalWidth = 0;
    let naturalHeight = 0;
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartOffsetX = 0;
    let dragStartOffsetY = 0;

    const setStatus = (message, tone = "") => {
        if (!status) {
            return;
        }

        status.textContent = message;
        status.classList.remove("is-error", "is-success");

        if (tone) {
            status.classList.add(`is-${tone}`);
        }
    };

    const clearCropUrl = () => {
        if (sourceUrl) {
            URL.revokeObjectURL(sourceUrl);
            sourceUrl = null;
        }
    };

    const closeCrop = () => {
        if (!modal) {
            return;
        }

        modal.hidden = true;
        document.body.classList.remove("crop-modal-open");
        cropImage?.removeAttribute("src");
        clearCropUrl();
    };

    const validate = (file) => {
        if (!allowedTypes.includes(file.type)) {
            setStatus("Use a JPG, PNG, or WebP image.", "error");

            return false;
        }

        if (file.size > maxBytes) {
            setStatus("The photo must be 5 MB or smaller.", "error");

            return false;
        }

        return true;
    };

    const clampOffsets = () => {
        if (!viewport || !naturalWidth || !naturalHeight) {
            return;
        }

        const size = viewport.clientWidth;
        const baseScale = Math.max(size / naturalWidth, size / naturalHeight);
        const displayWidth = naturalWidth * baseScale * zoom;
        const displayHeight = naturalHeight * baseScale * zoom;
        const maxX = Math.max(0, (displayWidth - size) / 2);
        const maxY = Math.max(0, (displayHeight - size) / 2);

        offsetX = Math.min(Math.max(offsetX, -maxX), maxX);
        offsetY = Math.min(Math.max(offsetY, -maxY), maxY);
    };

    const renderCrop = () => {
        if (!cropImage || !viewport || !naturalWidth || !naturalHeight) {
            return;
        }

        clampOffsets();

        const size = viewport.clientWidth;
        const baseScale = Math.max(size / naturalWidth, size / naturalHeight);

        cropImage.style.width = `${naturalWidth * baseScale * zoom}px`;
        cropImage.style.height = `${naturalHeight * baseScale * zoom}px`;
        cropImage.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
    };

    const openCrop = (file) => {
        if (!validate(file)) {
            if (avatar) {
                avatar.value = "";
            }

            return;
        }

        sourceFile = file;

        if (!modal || !cropImage || !viewport) {
            if (avatar) {
                const transfer = new DataTransfer();
                transfer.items.add(file);
                avatar.files = transfer.files;
            }

            setStatus(`${file.name} selected. Click Save changes to upload.`, "success");

            return;
        }

        modal.hidden = false;
        document.body.classList.add("crop-modal-open");
        clearCropUrl();
        sourceUrl = URL.createObjectURL(file);
        zoom = 1;
        offsetX = 0;
        offsetY = 0;

        if (zoomInput) {
            zoomInput.value = "1";
        }

        cropImage.onload = () => {
            naturalWidth = cropImage.naturalWidth;
            naturalHeight = cropImage.naturalHeight;
            renderCrop();
        };

        cropImage.src = sourceUrl;
    };

    if (avatar) {
        avatar.addEventListener("change", () => {
            const file = avatar.files?.[0];

            if (!file) {
                return;
            }

            avatar.value = "";
            openCrop(file);
        });
    }

    if (dropzone) {
        ["dragenter", "dragover"].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.add("is-dragging");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.remove("is-dragging");
            });
        });

        dropzone.addEventListener("drop", (event) => {
            const file = event.dataTransfer?.files?.[0];

            if (file) {
                openCrop(file);
            }
        });
    }

    if (viewport) {
        viewport.addEventListener("pointerdown", (event) => {
            if (!cropImage?.src) {
                return;
            }

            dragging = true;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            dragStartOffsetX = offsetX;
            dragStartOffsetY = offsetY;
            viewport.setPointerCapture?.(event.pointerId);
        });
    }

    window.addEventListener("pointermove", (event) => {
        if (!dragging) {
            return;
        }

        offsetX = dragStartOffsetX + event.clientX - dragStartX;
        offsetY = dragStartOffsetY + event.clientY - dragStartY;
        renderCrop();
    });

    window.addEventListener("pointerup", () => {
        dragging = false;
    });

    zoomInput?.addEventListener("input", () => {
        zoom = Number(zoomInput.value) || 1;
        renderCrop();
    });

    resetButton?.addEventListener("click", () => {
        zoom = 1;
        offsetX = 0;
        offsetY = 0;

        if (zoomInput) {
            zoomInput.value = "1";
        }

        renderCrop();
    });

    modal?.querySelectorAll("[data-crop-cancel]").forEach((button) => {
        button.addEventListener("click", closeCrop);
    });

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeCrop();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal && !modal.hidden) {
            closeCrop();
        }
    });

    applyButton?.addEventListener("click", () => {
        if (!sourceFile || !cropImage || !viewport || !naturalWidth || !naturalHeight) {
            return;
        }

        const size = viewport.clientWidth;
        const baseScale = Math.max(size / naturalWidth, size / naturalHeight);
        const displayWidth = naturalWidth * baseScale * zoom;
        const sourceSize = (size * naturalWidth) / displayWidth;
        const sourceX = naturalWidth / 2 - ((size / 2 + offsetX) * naturalWidth) / displayWidth;
        const sourceY = naturalHeight / 2 - ((size / 2 + offsetY) * naturalHeight) / (naturalHeight * baseScale * zoom);
        const canvas = document.createElement("canvas");

        canvas.width = outputSize;
        canvas.height = outputSize;

        const context = canvas.getContext("2d");

        if (!context) {
            setStatus("Could not prepare the cropped photo.", "error");

            return;
        }

        context.drawImage(
            cropImage,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            outputSize,
            outputSize,
        );

        canvas.toBlob((blob) => {
            if (!blob || !avatar) {
                setStatus("Could not prepare the cropped photo.", "error");

                return;
            }

            const cropped = new File([blob], "avatar-cropped.jpg", { type: "image/jpeg" });
            const transfer = new DataTransfer();

            transfer.items.add(cropped);
            avatar.files = transfer.files;

            if (preview) {
                preview.innerHTML = `<img src="${URL.createObjectURL(cropped)}" alt="">`;
            }

            setStatus("Cropped photo ready. Click Save changes to upload.", "success");
            closeCrop();
        }, "image/jpeg", 0.9);
    });
})();
