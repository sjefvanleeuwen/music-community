// Debug helper for registration flow
document.addEventListener('DOMContentLoaded', function() {
  // Log navigation events
  window.addEventListener('popstate', function(event) {
    console.log('Navigation event (popstate):', window.location.pathname);
  });
  
  // Log client-side redirects
  const originalPushState = history.pushState;
  history.pushState = function() {
    console.log('Client-side navigation to:', arguments[2]);
    return originalPushState.apply(this, arguments);
  };
  
  // Monitor forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.id === 'register-form' || form.id === 'login-form') {
      console.log('Form submitted:', form.id);
    }
  });
  
  console.log('Debug helper loaded for registration flow');
});
