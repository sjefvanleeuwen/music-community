const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const isWindows = os.platform() === 'win32';
const mailhogDir = path.join(__dirname, '../tools/mailhog');
const executable = path.join(mailhogDir, isWindows ? 'MailHog.exe' : 'MailHog');

// Check if MailHog executable exists
if (!fs.existsSync(executable)) {
  console.log('MailHog executable not found. Running setup script...');
  require('./setup-mailhog');
}

console.log('Starting MailHog SMTP server...');
console.log('Web interface: http://localhost:8025');
console.log('SMTP server: localhost:1025');

// Start MailHog
const mailhog = spawn(executable, [], {
  stdio: 'inherit',
  detached: !isWindows // Detach on non-Windows platforms
});

if (!isWindows) {
  mailhog.unref();
}

// Listen for process exit
mailhog.on('exit', (code) => {
  if (code !== 0) {
    console.log(`MailHog process exited with code ${code}`);
  }
});

// Handle SIGINT to close gracefully
process.on('SIGINT', () => {
  console.log('Stopping MailHog...');
  if (isWindows) {
    spawn('taskkill', ['/pid', mailhog.pid, '/f', '/t']);
  } else {
    mailhog.kill();
  }
  process.exit(0);
});
