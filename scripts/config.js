// Static deployment: set this to the real backend HTTPS URL, including /api.
// Leave empty when a reverse proxy forwards this origin's /api to the backend.
(() => {
  const backendApiUrl = '';
  window.CALCULATOR_API_URL = backendApiUrl || (window.location.port === '4173'
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : `${window.location.origin}/api`);
})();
