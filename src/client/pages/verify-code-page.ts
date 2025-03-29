import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/ui/input-field.js';
import '../components/ui/button.js';
import '../components/ui/alert-message.js';
import { authService } from '../services/auth-service.js';
import { store } from '../store/index.js';
import { router } from '../utils/router.js';

@customElement('verify-code-page')
export class VerifyCodePage extends LitElement {
  @state() private userId: string | null = null;
  @state() private email: string | null = null;
  @state() private code: string = '';
  @state() private isLoading: boolean = false;
  @state() private message: string = '';
  @state() private error: string = '';
  @state() private resendingCode: boolean = false;

  static styles = css`
    :host {
      display: block;
      padding: 2rem 1rem;
    }
    
    .page-container {
      max-width: 500px;
      margin: 0 auto;
      background-color: var(--color-background-light);
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    
    .page-title {
      text-align: center;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }
    
    .page-subtitle {
      text-align: center;
      margin-bottom: 2rem;
      font-size: 1rem;
      color: var(--color-text);
    }
    
    .form-row {
      margin-bottom: 1.5rem;
    }
    
    .code-input {
      font-size: 1.5rem;
      letter-spacing: 0.5rem;
      text-align: center;
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    .resend-button {
      text-align: center;
      margin-top: 0.5rem;
    }
    
    .help-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: var(--color-text);
    }
    
    .email-highlight {
      font-weight: bold;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    
    // Get userId and email from URL query params
    const params = new URLSearchParams(window.location.search);
    this.userId = params.get('userId');
    this.email = params.get('email');
    
    if (!this.userId || !this.email) {
      router.navigate('/register');
    }
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!this.code || !this.userId) {
      this.error = 'Please enter the verification code';
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    
    try {
      const result = await authService.verifyCode(parseInt(this.userId), this.code);
      
      // Store token and user data
      store.dispatch({
        type: 'AUTH_LOGIN',
        payload: {
          token: result.token,
          user: result.user
        }
      });
      
      // Show success message briefly before redirect
      this.message = 'Verification successful! Redirecting to homepage...';
      setTimeout(() => {
        router.navigate('/');
      }, 1500);
      
    } catch (error: any) {
      this.error = error.message || 'Verification failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
  
  async resendCode() {
    if (!this.email) return;
    
    this.resendingCode = true;
    this.error = '';
    
    try {
      await authService.resendVerificationCode(this.email);
      this.message = 'A new verification code has been sent to your email';
    } catch (error: any) {
      this.error = error.message || 'Failed to resend code. Please try again.';
    } finally {
      this.resendingCode = false;
    }
  }

  render() {
    return html`
      <div class="page-container">
        <h1 class="page-title">Verify Your Email</h1>
        <p class="page-subtitle">
          We've sent a verification code to <span class="email-highlight">${this.email}</span>
        </p>
        
        ${this.message ? html`<alert-message type="success" message="${this.message}"></alert-message>` : ''}
        ${this.error ? html`<alert-message type="error" message="${this.error}"></alert-message>` : ''}
        
        <form @submit="${this.handleSubmit}">
          <div class="form-row">
            <input-field
              label="Verification Code"
              .value="${this.code}"
              @input="${(e: any) => this.code = e.target.value}"
              placeholder="Enter 6-digit code"
              class="code-input"
              required
            ></input-field>
          </div>
          
          <div class="actions">
            <app-button
              type="submit"
              primary
              fullWidth
              ?loading="${this.isLoading}"
              ?disabled="${this.isLoading || this.resendingCode}"
            >
              Verify
            </app-button>
            
            <div class="resend-button">
              <app-button
                type="button"
                outline
                small
                @click="${this.resendCode}"
                ?loading="${this.resendingCode}"
                ?disabled="${this.isLoading || this.resendingCode}"
              >
                Resend Code
              </app-button>
            </div>
          </div>
        </form>
        
        <p class="help-text">
          Didn't receive the code? Check your spam folder or click resend code.
        </p>
      </div>
    `;
  }
}
