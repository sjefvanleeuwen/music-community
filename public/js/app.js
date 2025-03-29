// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  // Simple page router - using the globally defined routes or fallback to default
  const routes = window.appRoutes || {
    '/': renderHomePage,
    '/login': renderLoginPage,
    '/register': renderRegisterPage,
    '/verify-code': renderVerifyCodePage,
    '/profile': renderProfilePage,
    '/404': renderNotFoundPage
  };

  // Get current page path
  const path = window.location.pathname;
  
  // Render appropriate page
  if (routes[path]) {
    if (typeof routes[path] === 'string') {
      // If it's a string (from window.appRoutes), call the function by name
      window[routes[path]]();
    } else {
      // If it's a function reference (from default routes object)
      routes[path]();
    }
  } else {
    // Default to 404 page
    if (typeof routes['/404'] === 'string') {
      window[routes['/404']]();
    } else {
      routes['/404']();
    }
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
          <div id="login-error" class="error-message" style="display: none;"></div>
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
              <button type="submit" class="button primary" id="login-button">Login</button>
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
  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    
    // Reset error message
    loginError.style.display = 'none';
    
    // Simple validation
    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password';
      loginError.style.display = 'block';
      return;
    }
    
    // Disable button during API call
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    try {
      // Call API to login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is an unverified account
        if (response.status === 403 && data.requiresVerification) {
          // Redirect to verification page
          window.location.href = `/verify-code?userId=${data.userId}&email=${encodeURIComponent(data.email)}`;
          return;
        }
        
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to home page or intended destination
        window.location.href = '/';
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      // Show error message
      loginError.textContent = error.message || 'Login failed. Please check your credentials.';
      loginError.style.display = 'block';
      console.error('Login error:', error);
    } finally {
      // Re-enable button
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
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
          <div id="register-error" class="error-message" style="display: none;"></div>
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
              <button type="submit" class="button primary" id="register-button">Register</button>
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
    document.getElementById('register-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const captchaInput = document.getElementById('captcha-input').value;
      const captchaError = document.getElementById('captcha-error');
      const registerError = document.getElementById('register-error');
      const registerButton = document.getElementById('register-button');
      
      // Reset error message
      captchaError.textContent = '';
      registerError.style.display = 'none';
      
      // Simple validation
      if (!username || !email || !password) {
        registerError.textContent = 'Please fill in all required fields';
        registerError.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        registerError.textContent = 'Passwords do not match';
        registerError.style.display = 'block';
        return;
      }
      
      // Validate CAPTCHA
      if (!captcha.validate(captchaInput)) {
        captchaError.textContent = 'Invalid security code. Please try again.';
        captchaError.style.display = 'block';
        captcha.generate(); // Generate a new CAPTCHA
        document.getElementById('captcha-input').value = '';
        return;
      }
      
      // Disable button during API call
      registerButton.disabled = true;
      registerButton.textContent = 'Registering...';
      
      try {
        // Call the backend API to register the user
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            email,
            password,
            display_name: username
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        
        // Redirect to verification page with userId and email
        window.location.href = `/verify-code?userId=${data.userId}&email=${encodeURIComponent(email)}`;
      } catch (error) {
        registerError.textContent = error.message || 'Registration failed. Please try again.';
        registerError.style.display = 'block';
        console.error('Registration error:', error);
      } finally {
        // Re-enable button
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
      }
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
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please fill in all required fields';
        this.insertBefore(errorDiv, this.firstChild);
        return;
      }
      
      if (password !== confirmPassword) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Passwords do not match';
        this.insertBefore(errorDiv, this.firstChild);
        return;
      }
      
      // Immediately redirect to the verification code page without showing an alert
      window.location.href = `/verify-code?userId=tempUser123&email=${encodeURIComponent(email)}`;
    });
  }
}

function renderVerifyCodePage() {
  // Get email and userId from URL parameters
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || '';
  const email = params.get('email') || '';

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
          <h1>Verify Your Account</h1>
          <p style="text-align: center; margin-bottom: 1.5rem;">
            We've sent a verification code to <strong>${email}</strong>
          </p>
          <div id="verify-message" class="success-message" style="display: none;"></div>
          <div id="verify-error" class="error-message" style="display: none;"></div>
          <form id="verify-form">
            <div class="form-group">
              <label for="verification-code">Verification Code</label>
              <input type="text" id="verification-code" name="verification-code" 
                placeholder="Enter 6-digit code" required
                style="font-size: 1.25rem; letter-spacing: 0.25rem; text-align: center;">
            </div>
            <div class="form-actions">
              <button type="submit" class="button primary" id="verify-button">Verify Account</button>
            </div>
            <div class="form-footer">
              <p>Didn't receive a code? <a href="#" id="resend-code">Resend Code</a></p>
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

  // Add form handler
  document.getElementById('verify-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('verification-code').value;
    const verifyButton = document.getElementById('verify-button');
    const verifyError = document.getElementById('verify-error');
    const verifyMessage = document.getElementById('verify-message');
    
    // Reset messages - Check if elements exist first
    if (verifyError) verifyError.style.display = 'none';
    if (verifyMessage) verifyMessage.style.display = 'none';
    
    if (!code) {
      if (verifyError) {
        verifyError.textContent = 'Please enter the verification code';
        verifyError.style.display = 'block';
      }
      return;
    }
    
    // Disable button during API call
    verifyButton.disabled = true;
    verifyButton.textContent = 'Verifying...';
    
    try {
      // Call API to verify the code
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          code
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }
      
      // Show success message
      if (verifyMessage) {
        verifyMessage.textContent = 'Account verified successfully! Redirecting to login page...';
        verifyMessage.style.display = 'block';
      }
      
      // Redirect to login page
      setTimeout(() => window.location.href = '/login', 1500);
    } catch (error) {
      // Show error message
      if (verifyError) {
        verifyError.textContent = error.message || 'Failed to verify code. Please try again.';
        verifyError.style.display = 'block';
      }
      console.error('Verification error:', error);
    } finally {
      // Re-enable button
      verifyButton.disabled = false;
      verifyButton.textContent = 'Verify Account';
    }
  });

  // Add resend handler
  document.getElementById('resend-code').addEventListener('click', async function(e) {
    e.preventDefault();
    const verifyError = document.getElementById('verify-error');
    const verifyMessage = document.getElementById('verify-message');
    
    // Reset messages - Check if elements exist first
    if (verifyError) verifyError.style.display = 'none';
    if (verifyMessage) verifyMessage.style.display = 'none';
    
    if (!email) {
      if (verifyError) {
        verifyError.textContent = 'Email address is missing. Please go back to registration.';
        verifyError.style.display = 'block';
      }
      return;
    }
    
    try {
      // Call API to resend code
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      
      // Show success message
      if (verifyMessage) {
        verifyMessage.textContent = `A new verification code has been sent to ${email}`;
        verifyMessage.style.display = 'block';
      }
    } catch (error) {
      // Show error message
      if (verifyError) {
        verifyError.textContent = error.message || 'Failed to resend code. Please try again.';
        verifyError.style.display = 'block';
      }
      console.error('Resend code error:', error);
    }
  });
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
