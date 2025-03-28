import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-footer')
export class Footer extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background-dark, #1a1a1a);
      color: var(--color-text-light, #f0f0f0);
      padding: 2rem 1rem;
      margin-top: 2rem;
    }
    
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    
    .footer-section h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: white;
    }
    
    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .footer-section li {
      margin-bottom: 0.5rem;
    }
    
    .footer-section a {
      color: var(--color-text-light, #f0f0f0);
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .footer-section a:hover {
      color: var(--color-primary-light, #90caf9);
    }
    
    .social-links {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .social-links a {
      font-size: 1.5rem;
    }
    
    .bottom-bar {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
    }
  `;

  render() {
    return html`
      <div class="footer-container">
        <div class="footer-section">
          <h3>Music Community</h3>
          <p>A platform for musicians to share, collaborate, and grow together.</p>
          <div class="social-links">
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Twitter">TW</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="YouTube">YT</a>
          </div>
        </div>
        
        <div class="footer-section">
          <h3>Explore</h3>
          <ul>
            <li><a href="/genres">Genres</a></li>
            <li><a href="/recent">Recent Uploads</a></li>
            <li><a href="/popular">Popular Tracks</a></li>
            <li><a href="/stems">Stems Library</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/copyright">Copyright Info</a></li>
            <li><a href="/licenses">Licenses</a></li>
          </ul>
        </div>
      </div>
      
      <div class="bottom-bar">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    `;
  }
}
