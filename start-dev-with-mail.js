/**
 * This script ensures MailHog is running before starting the dev server
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detect platform
const isWindows = os.platform() === 'win32';

// Stop existing MailHog processes (Windows only)
if (isWindows) {
  try {
    // Try to kill any existing MailHog processes
    execSync('taskkill /f /im MailHog.exe', { stdio: 'ignore' });
    console.log('Stopped existing MailHog process');
  } catch (e) {
    // It's fine if there wasn't one running
  }
}

// Path to MailHog
const mailhogDir = path.join(__dirname, 'tools', 'mailhog');
const mailhogExe = path.join(mailhogDir, isWindows ? 'MailHog.exe' : 'MailHog');

// Check if MailHog exists, if not, set it up
if (!fs.existsSync(mailhogExe)) {
  console.log('Setting up MailHog...');
  execSync('node scripts/setup-mailhog.js', { stdio: 'inherit' });
}

// Start MailHog
console.log('Starting MailHog...');
const mailhog = spawn(mailhogExe, [], {
  stdio: 'ignore',
  detached: true
});
mailhog.unref();

// Give MailHog a moment to start
console.log('Waiting for MailHog to initialize...');
setTimeout(() => {
  // Now start the dev server
  console.log('Starting development server...');
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle server exit
  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle our script being terminated
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (isWindows) {
      try {
        execSync('taskkill /f /im MailHog.exe', { stdio: 'ignore' });
      } catch (e) {
        // Ignore errors
      }
    }
    process.exit(0);
  });
}, 2000);

console.log('MailHog web interface: http://localhost:8025');
