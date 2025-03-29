import express from 'express';
import { mailService } from '../services/mail-service';
import { logger } from '../utils/logger';
// Fix the incorrect import path
import { getDb } from '../db/connection'; // Changed from '../services/db-service'
import { UserModel } from '../models/user-model';

// Only enable in development environment
const router = express.Router();

// Skip this router in production
if (process.env.NODE_ENV === 'production') {
  router.use((req, res) => {
    res.status(404).json({ error: 'Development endpoints not available in production' });
  });
} else {
  /**
   * Test email sending (development only)
   */
  router.post('/test-email', async (req, res) => {
    try {
      const { to, template, subject } = req.body;
      
      if (!to) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }
      
      const emailSubject = subject || 'Test Email from Music Community';
      
      if (template) {
        // Send with template
        await mailService.sendMail({
          to,
          subject: emailSubject,
          template,
          context: {
            username: 'Test User',
            verificationUrl: 'https://example.com/verify?token=test',
            resetUrl: 'https://example.com/reset?token=test',
            code: '123456', // Test verification code
            year: new Date().getFullYear()
          }
        });
      } else {
        // Send basic email
        await mailService.sendMail({
          to,
          subject: emailSubject,
          text: 'This is a test email from the Music Community application.',
          html: '<p>This is a <b>test email</b> from the Music Community application.</p>'
        });
      }
      
      res.json({ 
        message: `Test email sent to ${to}`,
        mailhogUrl: 'http://localhost:8025'
      });
    } catch (error) {
      logger.error('Error sending test email', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });
  
  /**
   * Test verification code sending (development only)
   */
  router.post('/test-verification', async (req, res) => {
    try {
      const { email, username } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const testCode = '123456';
      const testUsername = username || 'TestUser';
      
      await mailService.sendVerificationCodeEmail(email, testUsername, testCode);
      
      res.json({ 
        message: `Verification code email sent to ${email}`,
        code: testCode, // Include the code in the response for easy testing
        mailhogUrl: 'http://localhost:8025'
      });
    } catch (error) {
      logger.error('Error sending verification code email', error);
      res.status(500).json({ error: 'Failed to send verification code email' });
    }
  });
  
  /**
   * List available email templates (development only)
   */
  router.get('/email-templates', (req, res) => {
    try {
      const templatesDir = require('path').resolve(process.cwd(), 'src/server/templates/emails');
      const fs = require('fs');
      
      const templates = fs.readdirSync(templatesDir)
        .filter(file => file.endsWith('.hbs'))
        .map(file => file.replace('.hbs', ''));
      
      res.json({ templates });
    } catch (error) {
      logger.error('Error listing email templates', error);
      res.status(500).json({ error: 'Failed to list email templates' });
    }
  });
  
  /**
   * SMTP server status (development only)
   */
  router.get('/smtp-status', async (req, res) => {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true
      });
      
      const isReady = await new Promise(resolve => {
        transporter.verify(error => {
          resolve(!error);
        });
      });
      
      res.json({
        status: isReady ? 'online' : 'offline',
        host: 'localhost',
        port: 1025,
        mailhogUrl: 'http://localhost:8025'
      });
    } catch (error) {
      logger.error('Error checking SMTP status', error);
      res.status(500).json({ 
        error: 'Failed to check SMTP status',
        details: error.message
      });
    }
  });

  /**
   * Direct SMTP test (development only)
   */
  router.get('/direct-smtp-test', async (req, res) => {
    try {
      const nodemailer = require('nodemailer');
      const testTransport = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true,
        debug: true
      });
      
      // Send a test email directly
      const info = await testTransport.sendMail({
        from: 'Direct Test <direct@test.com>',
        to: 'recipient@test.com',
        subject: 'Direct SMTP Test',
        text: 'This is a direct SMTP test from the dev API endpoint',
        html: '<p>This is a <b>direct SMTP test</b> from the dev API endpoint</p>'
      });
      
      res.json({
        success: true,
        message: 'Direct SMTP test email sent',
        messageId: info.messageId,
        mailhogUrl: 'http://localhost:8025'
      });
    } catch (error) {
      logger.error('Error in direct SMTP test', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
        details: 'Failed to send direct test email'
      });
    }
  });

  /**
   * Database check endpoint (development only)
   */
  router.get('/db-status', async (req, res) => {
    try {
      const db = await getDb();
      
      // Test database connection by counting users
      const result = await db.get('SELECT COUNT(*) as count FROM users');
      
      // Get database info
      const pragmaResult = await db.all(`
        SELECT * FROM pragma_database_list;
      `);
      
      // Get schema info
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name;
      `);
      
      const usersSchema = await db.all(`
        PRAGMA table_info(users);
      `);
      
      res.json({
        status: 'connected',
        userCount: result.count,
        databaseInfo: pragmaResult,
        tables: tables.map(t => t.name),
        usersSchema
      });
    } catch (error) {
      logger.error('Error checking database status', error);
      res.status(500).json({
        status: 'error',
        error: error.message,
        stack: error.stack
      });
    }
  });

  /**
   * Get database schema (development only)
   */
  router.get('/db-schema', async (req, res) => {
    try {
      const db = await getDb();
      
      // Get all tables
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `);
      
      // Get schema for each table
      const schema = {};
      for (const table of tables) {
        schema[table.name] = await db.all(`PRAGMA table_info(${table.name})`);
      }
      
      res.json({
        tables: tables.map(t => t.name),
        schema
      });
    } catch (error) {
      logger.error('Error getting database schema', error);
      res.status(500).json({ error: 'Failed to get database schema' });
    }
  });

  /**
   * Test user creation (development only)
   */
  router.post('/test-user-creation', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      
      // Create a UserModel instance
      const userModel = new UserModel();
      
      // Test the creation
      const verificationCode = '123456';
      const codeExpiry = new Date();
      codeExpiry.setHours(codeExpiry.getHours() + 1);
      
      const userId = await userModel.createUser({
        username,
        email,
        password,
        display_name: username,
        verification_code: verificationCode,
        verification_code_expiry: codeExpiry.toISOString(),
        status: 'pending'
      });
      
      res.json({
        success: true,
        message: 'Test user created successfully',
        userId,
        verificationCode
      });
    } catch (error) {
      logger.error('Error creating test user', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  /**
   * Email test panel (development only)
   */
  router.get('/mail-test-panel', (req, res) => {
    // Only in development mode
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Testing Panel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #5850ec; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; }
          input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #5850ec; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
          button:hover { background: #4a3edb; }
          .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
          .success { background: #e6fffa; border-left: 4px solid #38b2ac; }
          .error { background: #fff5f5; border-left: 4px solid #e53e3e; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>Email Testing Panel</h1>
        
        <div class="card">
          <h2>SMTP Server Status</h2>
          <button id="check-smtp">Check SMTP Status</button>
          <div id="smtp-result"></div>
        </div>
        
        <div class="card">
          <h2>Send Test Email</h2>
          <form id="test-email-form">
            <div class="form-group">
              <label for="to">Recipient Email:</label>
              <input type="email" id="to" name="to" required>
            </div>
            <div class="form-group">
              <label for="subject">Subject:</label>
              <input type="text" id="subject" name="subject" value="Test Email">
            </div>
            <div class="form-group">
              <label for="template">Template (optional):</label>
              <select id="template" name="template">
                <option value="">No template (simple email)</option>
                <option value="verification-code">Verification Code</option>
                <option value="welcome">Welcome Email</option>
                <option value="password-reset">Password Reset</option>
              </select>
            </div>
            <button type="submit">Send Test Email</button>
          </form>
          <div id="email-result"></div>
        </div>
        
        <div class="card">
          <h2>Send Verification Code</h2>
          <form id="verification-form">
            <div class="form-group">
              <label for="verification-email">Email:</label>
              <input type="email" id="verification-email" name="email" required>
            </div>
            <div class="form-group">
              <label for="verification-username">Username:</label>
              <input type="text" id="verification-username" name="username" value="TestUser">
            </div>
            <button type="submit">Send Verification Code</button>
          </form>
          <div id="verification-result"></div>
        </div>
        
        <script>
          // SMTP status check
          document.getElementById('check-smtp').addEventListener('click', async () => {
            const resultEl = document.getElementById('smtp-result');
            resultEl.innerHTML = 'Checking SMTP status...';
            
            try {
              const response = await fetch('/api/dev/smtp-status');
              const data = await response.json();
              
              if (data.status === 'online') {
                resultEl.innerHTML = \`
                  <div class="result success">
                    <p>✅ SMTP server is online and ready to accept messages.</p>
                    <p>Host: \${data.host}</p>
                    <p>Port: \${data.port}</p>
                    <p><a href="\${data.mailhogUrl}" target="_blank">Open MailHog Interface</a></p>
                  </div>
                \`;
              } else {
                resultEl.innerHTML = \`
                  <div class="result error">
                    <p>❌ SMTP server is offline or not responding.</p>
                    <p>Details: \${JSON.stringify(data)}</p>
                  </div>
                \`;
              }
            } catch (error) {
              resultEl.innerHTML = \`
                <div class="result error">
                  <p>❌ Error checking SMTP status: \${error.message}</p>
                </div>
              \`;
            }
          });
          
          // Test email form
          document.getElementById('test-email-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const resultEl = document.getElementById('email-result');
            resultEl.innerHTML = 'Sending test email...';
            
            const formData = {
              to: document.getElementById('to').value,
              subject: document.getElementById('subject').value,
              template: document.getElementById('template').value
            };
            
            try {
              const response = await fetch('/api/dev/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              
              const data = await response.json();
              
              if (response.ok) {
                resultEl.innerHTML = \`
                  <div class="result success">
                    <p>✅ \${data.message}</p>
                    <p><a href="\${data.mailhogUrl}" target="_blank">View in MailHog</a></p>
                  </div>
                \`;
              } else {
                resultEl.innerHTML = \`
                  <div class="result error">
                    <p>❌ Error: \${data.error}</p>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                  </div>
                \`;
              }
            } catch (error) {
              resultEl.innerHTML = \`
                <div class="result error">
                  <p>❌ Error sending email: \${error.message}</p>
                </div>
              \`;
            }
          });
          
          // Verification code form
          document.getElementById('verification-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const resultEl = document.getElementById('verification-result');
            resultEl.innerHTML = 'Sending verification code...';
            
            const formData = {
              email: document.getElementById('verification-email').value,
              username: document.getElementById('verification-username').value
            };
            
            try {
              const response = await fetch('/api/dev/test-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              
              const data = await response.json();
              
              if (response.ok) {
                resultEl.innerHTML = \`
                  <div class="result success">
                    <p>✅ \${data.message}</p>
                    <p>Verification code: <strong>\${data.code}</strong></p>
                    <p><a href="\${data.mailhogUrl}" target="_blank">View in MailHog</a></p>
                  </div>
                \`;
              } else {
                resultEl.innerHTML = \`
                  <div class="result error">
                    <p>❌ Error: \${data.error}</p>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                  </div>
                \`;
              }
            } catch (error) {
              resultEl.innerHTML = \`
                <div class="result error">
                  <p>❌ Error sending verification code: \${error.message}</p>
                </div>
              \`;
            }
          });
          
          // Check SMTP status on page load
          document.getElementById('check-smtp').click();
        </script>
      </body>
      </html>
    `);
  });
}

export default router;
