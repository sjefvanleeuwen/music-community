import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
    cid?: string;
  }>;
}

class MailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    // Create a direct transport configuration with no auth and proper debugging
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable detailed debug output
      logger: true  // Log transport activity to console
    });

    // Test the connection on startup and log result
    this.transporter.verify((error) => {
      if (error) {
        logger.error('SMTP connection failed:', error);
        logger.error('Please make sure MailHog is running on localhost:1025');
      } else {
        logger.info('SMTP server connection successful - ready to send emails');
      }
    });

    // Initialize email templates directory
    this.templatesDir = path.resolve(process.cwd(), 'src/server/templates/emails');
    this.loadTemplates();
  }

  /**
   * Load all email templates from the templates directory
   */
  private loadTemplates() {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        logger.warn(`Templates directory not found: ${this.templatesDir}`);
        // Create the directory and sample templates if it doesn't exist
        this.createDefaultTemplates();
        return;
      }

      const templateFiles = fs.readdirSync(this.templatesDir);
      
      if (templateFiles.length === 0) {
        logger.warn('No email templates found. Creating default templates.');
        this.createDefaultTemplates();
        return;
      }
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = file.split('.')[0];
          const templatePath = path.join(this.templatesDir, file);
          const templateSource = fs.readFileSync(templatePath, 'utf8');
          
          this.templates.set(templateName, Handlebars.compile(templateSource));
          logger.info(`Loaded email template: ${templateName}`);
        }
      }
      
      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Error loading email templates', error);
    }
  }
  
  /**
   * Create default templates if they don't exist
   */
  private createDefaultTemplates() {
    try {
      // Create templates directory if it doesn't exist
      if (!fs.existsSync(this.templatesDir)) {
        fs.mkdirSync(this.templatesDir, { recursive: true });
        logger.info(`Created templates directory: ${this.templatesDir}`);
      }
      
      // Create a simple verification code template if it doesn't exist
      const verificationCodeTemplate = path.join(this.templatesDir, 'verification-code.hbs');
      if (!fs.existsSync(verificationCodeTemplate)) {
        const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Verification Code</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .code { font-size: 24px; font-weight: bold; color: #5850ec; }
  </style>
</head>
<body>
  <h1>Your Verification Code</h1>
  <p>Hello {{username}},</p>
  <p>Your verification code is: <span class="code">{{code}}</span></p>
  <p>Please use this code to complete your registration.</p>
  <p>This code will expire in 1 hour.</p>
  <p>Thanks,<br>The Music Community Team</p>
</body>
</html>`;
        
        fs.writeFileSync(verificationCodeTemplate, template);
        logger.info('Created default verification-code.hbs template');
        
        // Add it to the templates map
        this.templates.set('verification-code', Handlebars.compile(template));
      }
    } catch (error) {
      logger.error('Error creating default templates', error);
    }
  }

  /**
   * Send an email
   */
  async sendMail(options: MailOptions): Promise<void> {
    try {
      let html = options.html;
      
      // If a template is specified, use it
      if (options.template && !html) {
        const template = this.templates.get(options.template);
        
        if (template) {
          html = template(options.context || {});
        } else {
          logger.warn(`Email template not found: ${options.template}`);
          // Create a simple HTML if template not found
          html = `<h1>${options.subject}</h1><p>Hello ${options.context?.username || 'User'},</p><p>Your verification code is: ${options.context?.code || 'N/A'}</p>`;
        }
      }

      const mailOptions = {
        from: 'MusicCommunity <noreply@musiccommunity.example.com>',
        to: options.to,
        subject: options.subject,
        text: options.text || this.convertHtmlToText(html || ''),
        html: html,
        attachments: options.attachments
      };

      // Log email details for debugging
      logger.info(`Attempting to send email to ${options.to}`, {
        subject: options.subject,
        template: options.template || 'none',
        to: options.to
      });
      
      // Send mail with extended logging
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully:`, {
        messageId: info.messageId,
        response: info.response,
        recipient: options.to 
      });
      
      // For MailHog, log the preview URL
      if (info.messageId) {
        logger.info(`MailHog preview available at: http://localhost:8025`);
      }
    } catch (error) {
      logger.error('Error sending email - details:', {
        error: error.message, 
        stack: error.stack,
        to: options.to,
        subject: options.subject
      });
      throw error;
    }
  }
  
  /**
   * Convert HTML to plain text (basic implementation)
   */
  private convertHtmlToText(html: string): string {
    // Very basic HTML to text conversion
    return html
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with spaces
      .replace(/\n\s*\n/g, '\n\n'); // Normalize whitespace
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, username: string) {
    await this.sendMail({
      to,
      subject: 'Welcome to Music Community!',
      template: 'welcome',
      context: { 
        username,
        year: new Date().getFullYear()
      }
    });
  }

  /**
   * Send verification code email
   */
  async sendVerificationCodeEmail(to: string, username: string, code: string) {
    logger.info(`Sending verification code to ${to}`);
    
    try {
      await this.sendMail({
        to,
        subject: 'Your Verification Code for Music Community',
        template: 'verification-code',
        context: { 
          username,
          code,
          year: new Date().getFullYear()
        }
      });
      logger.info(`Verification code email sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send verification code email to ${to}`, error);
      throw error;
    }
  }

  /**
   * Send a test email for debugging purposes
   */
  async sendTestEmail(to: string) {
    logger.info(`Sending test email to ${to}`);
    
    await this.sendMail({
      to,
      subject: 'Test Email from Music Community',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Music Community application.</p>
        <p>If you're seeing this, email sending is working correctly!</p>
        <p>Current time: ${new Date().toLocaleString()}</p>
      `
    });
  }
}

// Create and export a singleton instance
export const mailService = new MailService();
