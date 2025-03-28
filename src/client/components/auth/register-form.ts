import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../ui/button.js';
import '../ui/input-field.js';
import '../ui/alert-message.js';
import { router } from '../../utils/router.js';
import { authService } from '../../services/auth-service.js';
import { store } from '../../store/index.js';

@customElement('register-form')
export class RegisterForm extends LitElement {
  @state() private username = '';
  @state() private email = '';
  @state() private password = '';
  @state() private confirmPassword = '';
  @state() private displayName = '';
  @state() private isLoading = false;
  @state() private errorMessage = '';
  @state() private formErrors: { [key: string]: string } = {};

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
      justify-content: center;
      margin-top: 2rem;
    }
    
    .login-link {
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

  private validateForm(): boolean {
    this.formErrors = {};
    
    if (!this.username) {
      this.formErrors.username = 'Username is required';
    } else if (this.username.length < 3) {
      this.formErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!this.email) {
      this.formErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(this.email)) {
      this.formErrors.email = 'Email is invalid';
    }
    
    if (!this.password) {
      this.formErrors.password = 'Password is required';
    } else if (this.password.length < 6) {
      this.formErrors.password = 'Password must be at least 6 characters';
    }
    
    if (this.password !== this.confirmPassword) {
      this.formErrors.confirmPassword = 'Passwords do not match';
    }
    
    return Object.keys(this.formErrors).length === 0;
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const result = await authService.register({
        username: this.username,
        email: this.email,
        password: this.password,
        display_name: this.displayName || this.username
      });
      
      // Store token and user data
      store.dispatch({
        type: 'AUTH_LOGIN',
        payload: {
          token: result.token,
          user: result.user
        }
      });
      
      // Navigate to home page after successful registration
      router.navigate('/');
    } catch (error: any) {
      this.errorMessage = error.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="register-container">
        <h2 class="form-title">Create an Account</h2>
        
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
              error="${this.formErrors.username}"
              required
            ></input-field>
          </div>
          
          <div class="form-row">
            <input-field
              label="Email"
              type="email"
              .value="${this.email}"
              @input="${(e: any) => this.email = e.target.value}"
              error="${this.formErrors.email}"
              required
            ></input-field>
          </div>
          
          <div class="form-row">
            <input-field
              label="Display Name (optional)"
              type="text"
              .value="${this.displayName}"
              @input="${(e: any) => this.displayName = e.target.value}"
            ></input-field>
          </div>
          
          <div class="form-row">
            <input-field
              label="Password"
              type="password"
              .value="${this.password}"
              @input="${(e: any) => this.password = e.target.value}"
              error="${this.formErrors.password}"
              required
            ></input-field>
          </div>
          
          <div class="form-row">
            <input-field
              label="Confirm Password"
              type="password"
              .value="${this.confirmPassword}"
              @input="${(e: any) => this.confirmPassword = e.target.value}"
              error="${this.formErrors.confirmPassword}"
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
              Register
            </app-button>
          </div>
        </form>
        
        <div class="login-link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    `;
  }
}
