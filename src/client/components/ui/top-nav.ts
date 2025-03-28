import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { store } from '../../store/index.js';
import { router } from '../../utils/router.js';
import { User } from '../../services/auth-service.js';
import '../ui/button.js';

@customElement('top-nav')
export class TopNav extends LitElement {
  @property({ type: Boolean }) isAuthenticated = false;
  @property({ type: Object }) user: User | null = null;
  @state() private isMobileMenuOpen = false;
  @state() private isUserMenuOpen = false;

  static styles = css`
    :host {
      display: block;
      background-color: var(--color-primary);
      color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
      color: white;
    }
    
    .nav-links {
      display: flex;
      gap: 1.5rem;
    }
    
    .nav-links a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      position: relative;
    }
    
    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background-color: white;
      transition: width 0.3s;
    }
    
    .nav-links a:hover::after {
      width: 100%;
    }
    
    .user-menu {
      position: relative;
    }
    
    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
    }
    
    .user-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .profile-image {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-secondary, #2196f3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    .profile-image img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      min-width: 200px;
      margin-top: 0.5rem;
      z-index: 100;
      overflow: hidden;
      display: none;
    }
    
    .dropdown-menu.open {
      display: block;
    }
    
    .dropdown-menu a,
    .dropdown-menu button {
      display: block;
      padding: 0.75rem 1rem;
      color: var(--color-text);
      text-decoration: none;
      text-align: left;
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
    
    .dropdown-menu a:hover,
    .dropdown-menu button:hover {
      background-color: var(--color-background-light);
    }
    
    .dropdown-menu button.logout {
      color: var(--color-error);
      border-top: 1px solid var(--color-border);
    }
    
    .mobile-menu-button {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }
    
    .auth-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      .nav-links.open {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        background-color: var(--color-primary);
        padding: 1rem;
        z-index: 10;
      }
      
      .mobile-menu-button {
        display: block;
      }
    }
  `;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  logout() {
    store.dispatch({ type: 'AUTH_LOGOUT' });
    router.navigate('/');
    this.isUserMenuOpen = false;
  }

  render() {
    return html`
      <nav>
        <a href="/" class="logo">Music Community</a>
        
        <button class="mobile-menu-button" @click="${this.toggleMobileMenu}">
          ☰
        </button>
        
        <div class="nav-links ${this.isMobileMenuOpen ? 'open' : ''}">
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/genres">Genres</a>
          ${this.isAuthenticated ? html`
            <a href="/upload">Upload</a>
          ` : null}
        </div>
        
        ${this.isAuthenticated ? html`
          <div class="user-menu">
            <button class="user-button" @click="${this.toggleUserMenu}">
              <div class="profile-image">
                ${this.user?.profile_image 
                  ? html`<img src="${this.user.profile_image}" alt="${this.user.display_name}">`
                  : html`${this.user?.display_name?.charAt(0) || this.user?.username?.charAt(0) || 'U'}`
                }
              </div>
              <span>${this.user?.display_name || this.user?.username}</span>
              <span>▼</span>
            </button>
            
            <div class="dropdown-menu ${this.isUserMenuOpen ? 'open' : ''}">
              <a href="/profile">My Profile</a>
              <a href="/my-music">My Music</a>
              <a href="/settings">Settings</a>
              <button class="logout" @click="${this.logout}">Logout</button>
            </div>
          </div>
        ` : html`
          <div class="auth-buttons">
            <app-button small outline @click="${() => router.navigate('/login')}">Login</app-button>
            <app-button small primary @click="${() => router.navigate('/register')}">Register</app-button>
          </div>
        `}
      </nav>
    `;
  }
  
  // Close the user menu when clicking outside
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleOutsideClick);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }
  
  handleOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(this as any) && this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }
}
