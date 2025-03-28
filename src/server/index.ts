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

// Get port from environment or default to 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Initialize database and start server
async function bootstrap() {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await initializeDatabase();
    
    // Run migrations
    logger.info('Running migrations...');
    await runMigrations();
    
    // Seed database
    logger.info('Seeding database...');
    await seedDatabase();
    
    // Create Express app
    const app = express();
    
    // Apply middleware
    app.use(helmet()); // Security headers
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
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
bootstrap();
