import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../ui/button.js';
import '../ui/input-field.js';
import '../ui/alert-message.js';
import { router } from '../../utils/router.js';
import { authService } from '../../services/auth-service.js';
import { store } from '../../store/index.js';

@customElement('login-form')
export class LoginForm extends LitElement {
  @state() private username = '';
  @state() private password = '';
  @state() private isLoading = false;
  @state() private errorMessage = '';

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .form-title {
      font-size: 1.5rem;
      color: var(--color-primary);
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .form-row {
      margin-bottom: 1rem;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
    }
    
    .register-link {
      margin-top: 1rem;
      text-align: center;
    }
    
    a {
      color: var(--color-primary);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
  `;

  async handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const result = await authService.login(this.username, this.password);
      
      // Store token and user data
      store.dispatch({
        type: 'AUTH_LOGIN',
        payload: {
          token: result.token,
          user: result.user
        }
      });
      
      // Navigate to home page after successful login
      router.navigate('/');
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed. Please check your credentials.';
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="login-container">
        <h2 class="form-title">Login to Your Account</h2>
        
        ${this.errorMessage ? 
          html`<alert-message type="error" message="${this.errorMessage}"></alert-message>` : 
          null}
        
        <form @submit="${this.handleSubmit}">
          <div class="form-row">
            <input-field
              label="Username"
              type="text"
              .value="${this.username}"
              @input="${(e: any) => this.username = e.target.value}"
              required
            ></input-field>
          </div>
          
          <div class="form-row">
            <input-field
              label="Password"
              type="password"
              .value="${this.password}"
              @input="${(e: any) => this.password = e.target.value}"
              required
            ></input-field>
          </div>
          
          <div class="actions">
            <app-button
              type="submit"
              primary
              ?loading="${this.isLoading}"
              ?disabled="${this.isLoading}"
            >
              Login
            </app-button>
            
            <a href="/forgot-password">Forgot Password?</a>
          </div>
        </form>
        
        <div class="register-link">
          Don't have an account? <a href="/register">Register now</a>
        </div>
      </div>
    `;
  }
}
