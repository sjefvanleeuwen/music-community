/**
 * This script checks if MailHog is running correctly
 * and tests sending an email through the local SMTP server
 */

const nodemailer = require('nodemailer');
const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const checkMailHog = async () => {
  console.log('Checking MailHog status...');
  
  // Create a test SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    ignoreTLS: true,
    auth: null,
    tls: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('✅ MailHog is running and SMTP server is ready');
    
    // Send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'Test <test@example.com>',
      to: 'recipient@example.com',
      subject: 'MailHog Test',
      text: 'This is a test email sent to verify MailHog is working correctly',
      html: '<p>This is a <b>test email</b> sent to verify MailHog is working correctly</p>'
    });
    
    console.log('✅ Test email sent successfully');
    console.log('MessageID:', info.messageId);
    console.log('View at: http://localhost:8025');
    return true;
  } catch (error) {
    console.log('❌ MailHog is not running or SMTP server is not ready');
    console.error('Error:', error.message);
    
    // Try to start MailHog
    try {
      await startMailHog();
      return await checkMailHog(); // Try checking again
    } catch (startError) {
      console.error('Failed to start MailHog:', startError.message);
      return false;
    }
  }
};

const startMailHog = async () => {
  const isWindows = os.platform() === 'win32';
  const mailhogDir = path.join(__dirname, '../tools/mailhog');
  const executable = path.join(mailhogDir, isWindows ? 'MailHog.exe' : 'MailHog');
  
  if (!fs.existsSync(executable)) {
    console.log('MailHog executable not found. Running setup script...');
    execSync('node scripts/setup-mailhog.js', { stdio: 'inherit' });
  }
  
  console.log('Starting MailHog...');
  
  if (isWindows) {
    spawn(executable, [], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn(executable, [], { detached: true, stdio: 'ignore' }).unref();
  }
  
  // Wait a moment for MailHog to start
  console.log('Waiting for MailHog to start...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('MailHog should be running now');
};

// Run the check
checkMailHog()
  .then(success => {
    if (success) {
      console.log('MailHog check completed successfully');
    } else {
      console.log('MailHog check failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during MailHog check:', error);
    process.exit(1);
  });
