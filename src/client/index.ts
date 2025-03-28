import './components/app/app-shell.js';
import { router } from './utils/router.js';
import { routes } from './routes.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize router
  router.init(routes, '#app-outlet');
  
  // Mount app shell
  const app = document.createElement('app-shell');
  document.body.appendChild(app);
});
