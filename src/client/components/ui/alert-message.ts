import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('alert-message')
export class AlertMessage extends LitElement {
  @property({ type: String }) type = 'info'; // info, success, warning, error
  @property({ type: String }) message = '';
  @property({ type: Boolean }) dismissible = false;
  @property({ type: Number }) autoClose = 0; // milliseconds, 0 = no auto close

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1rem;
    }
    
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .info {
      background-color: var(--color-info-light, #e3f2fd);
      color: var(--color-info, #0288d1);
      border-left: 4px solid var(--color-info, #0288d1);
    }
    
    .success {
      background-color: var(--color-success-light, #e8f5e9);
      color: var(--color-success, #388e3c);
      border-left: 4px solid var(--color-success, #388e3c);
    }
    
    .warning {
      background-color: var(--color-warning-light, #fff8e1);
      color: var(--color-warning, #f57c00);
      border-left: 4px solid var(--color-warning, #f57c00);
    }
    
    .error {
      background-color: var(--color-error-light, #ffebee);
      color: var(--color-error, #d32f2f);
      border-left: 4px solid var(--color-error, #d32f2f);
    }
    
    .message {
      flex: 1;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      font-size: 1.25rem;
      line-height: 1;
      padding: 0;
      margin-left: 0.5rem;
    }
    
    .close-btn:hover {
      opacity: 0.7;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    
    if (this.autoClose > 0) {
      setTimeout(() => {
        this.remove();
      }, this.autoClose);
    }
  }
  
  dismiss() {
    this.remove();
  }

  render() {
    return html`
      <div class="alert ${this.type}">
        <div class="message">${this.message}</div>
        ${this.dismissible ? 
          html`<button class="close-btn" @click="${this.dismiss}">×</button>` : 
          null}
      </div>
    `;
  }
}
