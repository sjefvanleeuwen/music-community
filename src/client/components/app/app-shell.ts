import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../../store/index.js';
import '../ui/top-nav.js';
import '../ui/footer.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  @state() private isAuthenticated = false;
  @state() private user = null;
  
  private unsubscribe: (() => void) | null = null;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    main {
      flex: 1;
      padding: 1rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to store
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      this.isAuthenticated = state.auth.isAuthenticated;
      this.user = state.auth.user;
    });
    
    // Initialize from store
    const state = store.getState();
    this.isAuthenticated = state.auth.isAuthenticated;
    this.user = state.auth.user;
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    return html`
      <top-nav 
        ?is-authenticated="${this.isAuthenticated}"
        .user="${this.user}"
      ></top-nav>
      
      <main>
        <div class="container">
          <div id="app-outlet"></div>
        </div>
      </main>
      
      <app-footer></app-footer>
    `;
  }
}
