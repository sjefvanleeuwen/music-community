const nodemailer = require('nodemailer');

console.log('Testing SMTP connection to MailHog...');

// Create test transporter
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
  ignoreTLS: true,
  debug: true,
  logger: true
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
    process.exit(1);
  }
  
  console.log('SMTP connection successful! Server is ready to accept messages');
  
  // Send test mail
  console.log('Sending test email...');
  transporter.sendMail({
    from: 'Test <test@example.com>',
    to: 'recipient@example.com',
    subject: 'MailHog Connection Test',
    text: 'If you see this, your MailHog connection is working!',
    html: '<p>If you see this, your <b>MailHog connection</b> is working!</p>'
  }, (err, info) => {
    if (err) {
      console.error('Error sending test email:', err);
      process.exit(1);
    }
    
    console.log('Test email sent successfully!');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Check MailHog interface at: http://localhost:8025');
    process.exit(0);
  });
});
