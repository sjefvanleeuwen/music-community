import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/auth/register-form.js';

@customElement('register-page')
export class RegisterPage extends LitElement {
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
      margin-bottom: 2rem;
      color: var(--color-primary);
    }
  `;

  render() {
    return html`
      <div class="page-container">
        <register-form></register-form>
      </div>
    `;
  }
}
