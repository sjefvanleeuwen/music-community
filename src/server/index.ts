import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { initializeDatabase } from './db/connection';
import { runMigrations } from './db/migrations';
import { seedDatabase } from './db/seeds';
import apiRoutes from './api';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import fs from 'fs';
import { mailService } from './services/mail-service';
import { spawn } from 'child_process';
import { getDb } from './db/connection';

// Get port from environment or default to 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Initialize the server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Run migrations
    try {
      await runMigrations();
    } catch (migrationError) {
      logger.error('Database migrations failed', migrationError);
      process.exit(1);
    }
    
    // Seed database with initial data
    try {
      const db = await getDb();
      await seedDatabase(db);
    } catch (seedError) {
      logger.error('Database seeding failed', seedError);
      // Continue starting the server even if seeding fails
    }
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      await startMailHog();
    }
    
    // Create Express app
    const app = express();
    
    // Apply middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'"]
        }
      }
    })); // Security headers with adjusted CSP
    app.use(cors()); // CORS support
    app.use(compression()); // Compression
    app.use(express.json()); // Parse JSON bodies
    app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
    app.use(morgan('dev', { stream: { write: message => logger.http(message.trim()) } })); // HTTP logging
    
    // Swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
    
    // API routes
    app.use('/api', apiRoutes);
    
    // Serve static files from public directory
    app.use(express.static(path.join(process.cwd(), 'public')));
    
    // Serve uploaded files
    app.use('/storage', express.static(path.join(process.cwd(), 'storage')));
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      // Create a basic index.html
      fs.writeFileSync(
        path.join(publicDir, 'index.html'),
        '<html><head><title>Music Community</title></head><body><h1>Music Community API</h1><p>Visit <a href="/api-docs">API Documentation</a></p></body></html>'
      );
    }
    
    // Serve frontend for any unmatched routes (SPA support)
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Serve index.html for all other routes
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Test email sending
    if (isDevelopment) {
      try {
        await mailService.sendTestEmail('test@example.com');
        logger.info('Test email sent successfully. Check MailHog at http://localhost:8025');
      } catch (error) {
        logger.error('Failed to send test email:', error);
      }
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      
      if (isDevelopment) {
        logger.info(`MailHog web interface available at http://localhost:8025`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

/**
 * Start MailHog if in development mode
 */
async function startMailHog() {
  const isWindows = process.platform === 'win32';
  const mailhogDir = path.join(process.cwd(), 'tools', 'mailhog');
  const executable = path.join(mailhogDir, isWindows ? 'MailHog.exe' : 'MailHog');
  
  if (!fs.existsSync(executable)) {
    logger.warn(`MailHog executable not found at ${executable}`);
    logger.info('Running setup script to download MailHog...');
    
    try {
      const setupScript = path.join(process.cwd(), 'scripts', 'setup-mailhog.js');
      if (fs.existsSync(setupScript)) {
        const { execSync } = require('child_process');
        execSync(`node ${setupScript}`, { stdio: 'inherit' });
        logger.info('MailHog setup completed.');
      } else {
        logger.error(`MailHog setup script not found at ${setupScript}`);
        return;
      }
    } catch (error) {
      logger.error('Failed to setup MailHog:', error);
      return;
    }
  }
  
  // Start MailHog
  try {
    logger.info('Starting MailHog...');
    const mailhog = spawn(executable, [], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Don't wait for the child process
    mailhog.unref();
    
    // Give MailHog a moment to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('MailHog started successfully.');
  } catch (error) {
    logger.error('Failed to start MailHog:', error);
  }
}

// Start the server
startServer();
