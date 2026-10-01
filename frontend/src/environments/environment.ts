// Production: the web server (e.g. Nginx) serves the app and forwards /api to
// the backend, so the API lives on the same origin.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
