import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('input-field')
export class InputField extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) type = 'text';
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host {
      display: block;
    }
    
    .input-container {
      position: relative;
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-text);
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background-color: var(--color-background-light);
      color: var(--color-text);
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.25);
    }
    
    input:disabled {
      background-color: var(--color-background-disabled);
      cursor: not-allowed;
    }
    
    .error-text {
      margin-top: 0.3rem;
      color: var(--color-error);
      font-size: 0.85rem;
    }
    
    input.error {
      border-color: var(--color-error);
    }
    
    input.error:focus {
      box-shadow: 0 0 0 3px rgba(var(--color-error-rgb), 0.25);
    }
  `;

  render() {
    return html`
      <div class="input-container">
        ${this.label ? html`<label for="input">${this.label}${this.required ? ' *' : ''}</label>` : null}
        <input
          id="input"
          type="${this.type}"
          .value="${this.value}"
          placeholder="${this.placeholder}"
          ?required="${this.required}"
          ?disabled="${this.disabled}"
          class="${this.error ? 'error' : ''}"
          @input="${this._handleInput}"
        />
        ${this.error ? html`<div class="error-text">${this.error}</div>` : null}
      </div>
    `;
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: input.value },
      bubbles: true,
      composed: true
    }));
  }
}
