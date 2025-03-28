import express from 'express';
import musicRoutes from './music';
import authRoutes from './auth';
import stemRoutes from './stems';
import genreRoutes from './genres';
import albumRoutes from './albums';
import eventRoutes from './events';
import blogRoutes from './blog';
import { logger } from '../utils/logger';

const router = express.Router();

// Log all API requests
router.use((req, res, next) => {
  logger.info(`API Request: ${req.method} ${req.path}`);
  next();
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns basic API information and links to documentation
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Basic API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 documentation:
 *                   type: string
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Music Community API',
    version: '1.0.0',
    description: 'RESTful API for the Music Community platform',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      music: '/api/music',
      stems: '/api/stems',
      genres: '/api/genres',
      albums: '/api/albums',
      events: '/api/events',
      blog: '/api/blog',
      health: '/api/health'
    }
  });
});

// Register route handlers
router.use('/auth', authRoutes);
router.use('/music', musicRoutes);
router.use('/stems', stemRoutes);
router.use('/genres', genreRoutes);
router.use('/albums', albumRoutes);
router.use('/events', eventRoutes);
router.use('/blog', blogRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API
 *     tags: [API]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 time:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
