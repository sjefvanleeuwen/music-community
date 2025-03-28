import { store } from '../store';

type Route = {
  path: string;
  component: string;
  authRequired?: boolean;
  title?: string;
};

class Router {
  private routes: Route[] = [];
  private outlet: HTMLElement | null = null;
  private currentPath = '';
  
  constructor() {
    window.addEventListener('popstate', () => this._handleRouteChange());
    
    // Intercept link clicks for client-side navigation
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.hasAttribute('external')) {
        e.preventDefault();
        this.navigate(anchor.pathname);
      }
    });
  }
  
  init(routes: Route[], outletSelector: string) {
    this.routes = routes;
    this.outlet = document.querySelector(outletSelector);
    this._handleRouteChange();
  }
  
  navigate(path: string) {
    if (path === this.currentPath) return;
    
    window.history.pushState(null, '', path);
    this._handleRouteChange();
  }
  
  private _handleRouteChange() {
    const path = window.location.pathname;
    this.currentPath = path;
    
    // Find matching route
    const route = this._findRoute(path);
    
    if (!route) {
      this._renderComponent('not-found-page');
      document.title = 'Page Not Found | Music Community';
      return;
    }
    
    // Check auth if required
    if (route.authRequired && !store.getState().auth.isAuthenticated) {
      // Redirect to login
      window.history.replaceState(null, '', '/login?redirect=' + encodeURIComponent(path));
      this._handleRouteChange();
      return;
    }
    
    // Set page title
    if (route.title) {
      document.title = `${route.title} | Music Community`;
    } else {
      document.title = 'Music Community';
    }
    
    // Render component
    this._renderComponent(route.component);
  }
  
  private _findRoute(path: string): Route | undefined {
    // First try exact match
    let route = this.routes.find(r => r.path === path);
    
    if (route) return route;
    
    // Try parameterized routes
    for (const r of this.routes) {
      if (r.path.includes(':')) {
        const routeParts = r.path.split('/');
        const pathParts = path.split('/');
        
        if (routeParts.length === pathParts.length) {
          const match = routeParts.every((part, i) => {
            return part.startsWith(':') || part === pathParts[i];
          });
          
          if (match) {
            return r;
          }
        }
      }
    }
    
    return undefined;
  }
  
  private _renderComponent(componentTag: string) {
    if (!this.outlet) return;
    
    // Clear outlet
    this.outlet.innerHTML = '';
    
    // Create and append component
    const component = document.createElement(componentTag);
    this.outlet.appendChild(component);
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
}

export const router = new Router();
