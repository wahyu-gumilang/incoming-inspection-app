// forms.js — mockup behaviour for simple modal forms: submitting closes the modal and shows a toast.
// The real app validates on the server and shows field errors from error.details[].
document.querySelectorAll('form[data-toast]').forEach((form) =>
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal();
    toast(form.dataset.toast);
    form.reset();
  }),
);
