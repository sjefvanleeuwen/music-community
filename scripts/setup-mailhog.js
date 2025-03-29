/**
 * This script sets up MailHog as a local SMTP server for development
 * On first run, it will download MailHog and create a startup script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

const mailhogDir = path.join(__dirname, '../tools/mailhog');
let executable = '';
let downloadUrl = '';

// Create mailhog directory if it doesn't exist
if (!fs.existsSync(mailhogDir)) {
  fs.mkdirSync(mailhogDir, { recursive: true });
}

// Determine the correct MailHog binary for the platform
if (isWindows) {
  executable = path.join(mailhogDir, 'MailHog.exe');
  downloadUrl = 'https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_windows_amd64.exe';
} else if (isMac) {
  executable = path.join(mailhogDir, 'MailHog');
  downloadUrl = 'https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_darwin_amd64';
} else if (isLinux) {
  executable = path.join(mailhogDir, 'MailHog');
  downloadUrl = 'https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64';
} else {
  console.error('Unsupported platform:', platform);
  process.exit(1);
}

// Download MailHog if it doesn't exist
if (!fs.existsSync(executable)) {
  console.log('Downloading MailHog...');
  
  try {
    if (isWindows) {
      execSync(`curl -L ${downloadUrl} -o "${executable}"`);
    } else {
      execSync(`curl -L ${downloadUrl} -o "${executable}" && chmod +x "${executable}"`);
    }
    console.log('MailHog downloaded successfully!');
  } catch (error) {
    console.error('Failed to download MailHog:', error.message);
    process.exit(1);
  }
}

// Create startup scripts
console.log('Creating startup scripts...');

// Windows batch script
if (isWindows) {
  const batchContent = `@echo off
echo Starting MailHog...
echo Web interface: http://localhost:8025
echo SMTP server: localhost:1025
start "" "${executable.replace(/\\/g, '\\\\')}"
`;
  fs.writeFileSync(path.join(mailhogDir, 'start-mailhog.bat'), batchContent);
}

// Shell script for Mac/Linux
if (isMac || isLinux) {
  const shContent = `#!/bin/bash
echo "Starting MailHog..."
echo "Web interface: http://localhost:8025"
echo "SMTP server: localhost:1025"
"${executable}" &
`;
  fs.writeFileSync(path.join(mailhogDir, 'start-mailhog.sh'), shContent);
  execSync(`chmod +x "${path.join(mailhogDir, 'start-mailhog.sh')}"`);
}

console.log(`
MailHog setup complete!

To start the local SMTP server, run:
${isWindows ? 
  path.join('tools', 'mailhog', 'start-mailhog.bat') : 
  path.join('tools', 'mailhog', 'start-mailhog.sh')
}

Once started, you can:
- View emails at http://localhost:8025
- Configure your app to use SMTP server at localhost:1025
`);
