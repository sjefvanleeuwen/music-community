import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('app-button')
export class Button extends LitElement {
  @property({ type: String }) type = 'button';
  @property({ type: Boolean }) primary = false;
  @property({ type: Boolean }) secondary = false;
  @property({ type: Boolean }) danger = false;
  @property({ type: Boolean }) outline = false;
  @property({ type: Boolean }) small = false;
  @property({ type: Boolean }) large = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) fullWidth = false;

  static styles = css`
    :host {
      display: inline-block;
    }
    
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1.25rem;
      border-radius: 4px;
      font-weight: 500;
      font-size: 1rem;
      line-height: 1.5;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    
    button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.25);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .primary {
      background-color: var(--color-primary);
      color: white;
    }
    
    .primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    
    .secondary {
      background-color: var(--color-secondary);
      color: white;
    }
    
    .secondary:hover:not(:disabled) {
      background-color: var(--color-secondary-dark);
    }
    
    .danger {
      background-color: var(--color-error);
      color: white;
    }
    
    .danger:hover:not(:disabled) {
      background-color: var(--color-error-dark);
    }
    
    .outline {
      background-color: transparent;
    }
    
    .outline.primary {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    
    .outline.primary:hover:not(:disabled) {
      background-color: rgba(var(--color-primary-rgb), 0.1);
    }
    
    .outline.secondary {
      color: var(--color-secondary);
      border-color: var(--color-secondary);
    }
    
    .outline.secondary:hover:not(:disabled) {
      background-color: rgba(var(--color-secondary-rgb), 0.1);
    }
    
    .outline.danger {
      color: var(--color-error);
      border-color: var(--color-error);
    }
    
    .outline.danger:hover:not(:disabled) {
      background-color: rgba(var(--color-error-rgb), 0.1);
    }
    
    .small {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .large {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
    
    .full-width {
      width: 100%;
    }
    
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      margin-right: 0.5rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    
    .outline .spinner {
      border: 2px solid rgba(var(--color-primary-rgb), 0.3);
      border-top-color: var(--color-primary);
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    const classes = {
      'primary': this.primary,
      'secondary': this.secondary,
      'danger': this.danger,
      'outline': this.outline,
      'small': this.small,
      'large': this.large,
      'full-width': this.fullWidth
    };
    
    return html`
      <button
        type="${this.type}"
        class="${Object.entries(classes)
          .filter(([_, isActive]) => isActive)
          .map(([className]) => className)
          .join(' ')}"
        ?disabled="${this.disabled || this.loading}"
      >
        ${this.loading ? html`<span class="spinner"></span>` : null}
        <slot></slot>
      </button>
    `;
  }
}
