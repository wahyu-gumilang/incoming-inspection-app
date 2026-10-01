// Loaded in <head> on every page so the saved theme applies before the first paint.
// In the app the choice is stored per user (usertable.theme); the mockup uses localStorage.
(function () {
  var mode = 'light';
  try {
    mode = localStorage.getItem('iqc-theme') || 'light';
  } catch (e) {}
  var dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
