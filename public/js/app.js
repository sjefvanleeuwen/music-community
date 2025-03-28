// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  // Simple page router
  const routes = {
    '/': renderHomePage,
    '/login': renderLoginPage,
    '/register': renderRegisterPage,
    '/profile': renderProfilePage,
    '/404': renderNotFoundPage
  };

  // Get current page path
  const path = window.location.pathname;
  
  // Render appropriate page
  if (routes[path]) {
    routes[path]();
  } else {
    routes['/404']();
  }

  // Setup navigation
  setupNavigation();
});

// Basic navigation handler
function setupNavigation() {
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = new URL(e.target.href).pathname;
      navigateTo(path);
    }
  });
}

// Simulated page navigation
function navigateTo(path) {
  window.history.pushState({}, '', path);
  
  // Dispatch custom event for router to pick up
  const navigationEvent = new CustomEvent('navigation', { detail: { path } });
  window.dispatchEvent(navigationEvent);
  
  // Reload page for now - in a real app, we'd use client-side routing
  window.location.reload();
}

// Page renderers
function renderHomePage() {
  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="logo">Music Community</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <div class="container">
        <h1>Welcome to Music Community</h1>
        <p>A platform for musicians to share, collaborate, and grow together.</p>
        <div class="cta-buttons">
          <a href="/register" class="button primary">Sign Up</a>
          <a href="/login" class="button secondary">Login</a>
        </div>
      </div>
    </main>
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function renderLoginPage() {
  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="logo">Music Community</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <div class="container">
        <div class="auth-form">
          <h1>Login</h1>
          <form id="login-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="button primary">Login</button>
            </div>
            <div class="form-footer">
              <p>Don't have an account? <a href="/register">Register</a></p>
            </div>
          </form>
        </div>
      </div>
    </main>
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    </footer>
  `;

  // Add form submission handler
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    
    // Simulate login
    alert('Login functionality will be implemented with actual backend integration');
  });
}

function renderRegisterPage() {
  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="logo">Music Community</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <div class="container">
        <div class="auth-form">
          <h1>Create an Account</h1>
          <form id="register-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" id="confirm-password" name="confirm-password" required>
            </div>
            
            <!-- CAPTCHA -->
            <div class="form-group captcha-container">
              <label for="captcha">Security Check</label>
              <div class="captcha-wrapper">
                <canvas id="captcha-canvas" width="200" height="50"></canvas>
                <button id="reload-captcha" class="reload-captcha" title="Generate new code">↻</button>
              </div>
              <input type="text" id="captcha-input" name="captcha" required placeholder="Enter code shown above">
              <div id="captcha-error" class="error-message"></div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="button primary">Register</button>
            </div>
            <div class="form-footer">
              <p>Already have an account? <a href="/login">Login</a></p>
            </div>
          </form>
        </div>
      </div>
    </main>
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    </footer>
  `;

  // Initialize CAPTCHA
  if (window.SimpleCaptcha) {
    const canvas = document.getElementById('captcha-canvas');
    const reloadButton = document.getElementById('reload-captcha');
    const captcha = new window.SimpleCaptcha(canvas, reloadButton);

    // Add form submission handler
    document.getElementById('register-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const captchaInput = document.getElementById('captcha-input').value;
      const captchaError = document.getElementById('captcha-error');
      
      // Reset error message
      captchaError.textContent = '';
      
      // Simple validation
      if (!username || !email || !password) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Validate CAPTCHA
      if (!captcha.validate(captchaInput)) {
        captchaError.textContent = 'Invalid security code. Please try again.';
        captcha.generate(); // Generate a new CAPTCHA
        document.getElementById('captcha-input').value = '';
        return;
      }
      
      // Simulate registration
      alert('Registration successful! You would be redirected to login page in a real application.');
      // Redirect to login page
      navigateTo('/login');
    });
  } else {
    // Fallback if CAPTCHA script failed to load
    document.getElementById('register-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Simple validation
      if (!username || !email || !password) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Simulate registration
      alert('Registration successful! You would be redirected to login page in a real application.');
      // Redirect to login page
      navigateTo('/login');
    });
  }
}

function renderProfilePage() {
  // Check if user is logged in (this would normally use a token or session)
  const isLoggedIn = false;
  
  if (!isLoggedIn) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  
  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="logo">Music Community</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/logout">Logout</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <div class="container">
        <h1>Your Profile</h1>
        <p>This is your profile page. You can view and edit your profile here.</p>
      </div>
    </main>
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function renderNotFoundPage() {
  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="logo">Music Community</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" class="button primary">Go to Homepage</a>
      </div>
    </main>
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Music Community. All rights reserved.</p>
      </div>
    </footer>
  `;
}
