import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import multer from 'multer';
import { EventModel } from '../models/event-model';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const eventModel = new EventModel();

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for event images
  }
});

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of events to skip
 *       - in: query
 *         name: past
 *         schema:
 *           type: boolean
 *         description: Whether to include past events
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const includePast = req.query.past === 'true';
    
    const events = await eventModel.getEventsWithUserInfo({
      limit,
      offset,
      includePast
    });
    
    res.json(events);
  } catch (error) {
    logger.error('Error fetching events', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve a specific event by its ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await eventModel.getEventWithUserInfo(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    logger.error(`Error fetching event ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event with details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - start_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               venue:
 *                 type: string
 *               ticket_url:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      location, 
      venue, 
      ticket_url 
    } = req.body;
    const userId = req.user.id;
    
    if (!title || !start_date) {
      return res.status(400).json({ error: 'Title and start date are required' });
    }
    
    // Handle image upload if provided
    let imagePath = null;
    if (req.file) {
      const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'events');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
      const filePath = path.join(storageDir, uniqueFileName);
      
      await fs.promises.writeFile(filePath, req.file.buffer);
      imagePath = path.join('storage', 'uploads', 'events', uniqueFileName);
    }
    
    // Create event
    const eventId = await eventModel.create({
      user_id: userId,
      title,
      description: description || null,
      start_date,
      end_date: end_date || null,
      location: location || null,
      venue: venue || null,
      ticket_url: ticket_url || null,
      image: imagePath
    });
    
    res.status(201).json({
      id: eventId,
      message: 'Event created successfully'
    });
  } catch (error) {
    logger.error('Error creating event', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               venue:
 *                 type: string
 *               ticket_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      location, 
      venue, 
      ticket_url 
    } = req.body;
    
    // Check if event exists and belongs to the user
    const event = await eventModel.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (location !== undefined) updateData.location = location;
    if (venue !== undefined) updateData.venue = venue;
    if (ticket_url !== undefined) updateData.ticket_url = ticket_url;
    
    // Update event
    const updated = await eventModel.update(eventId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      message: 'Event updated successfully',
      id: eventId
    });
  } catch (error) {
    logger.error(`Error updating event ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if event exists and belongs to the user
    const event = await eventModel.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    // Delete event
    const deleted = await eventModel.delete(eventId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Delete event image if it exists
    if (event.image) {
      const imagePath = path.resolve(process.cwd(), event.image);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
      }
    }
    
    res.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting event ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * @swagger
 * /events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     description: Retrieve a list of upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of events to skip
 *     responses:
 *       200:
 *         description: List of upcoming events
 *       500:
 *         description: Server error
 */
router.get('/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const events = await eventModel.getEventsWithUserInfo({
      limit,
      offset,
      includePast: false
    });
    
    res.json(events);
  } catch (error) {
    logger.error('Error fetching upcoming events', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

/**
 * @swagger
 * /events/past:
 *   get:
 *     summary: Get past events
 *     description: Retrieve a list of past events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of events to skip
 *     responses:
 *       200:
 *         description: List of past events
 *       500:
 *         description: Server error
 */
router.get('/past', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const events = await eventModel.getPastEvents(limit, offset);
    
    res.json(events);
  } catch (error) {
    logger.error('Error fetching past events', error);
    res.status(500).json({ error: 'Failed to fetch past events' });
  }
});

/**
 * @swagger
 * /events/{id}/image:
 *   post:
 *     summary: Update event image
 *     description: Upload a new image for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       400:
 *         description: Missing image
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.post('/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    // Check if event exists and belongs to the user
    const event = await eventModel.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    
    // Handle image upload
    const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'events');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
    const filePath = path.join(storageDir, uniqueFileName);
    
    await fs.promises.writeFile(filePath, req.file.buffer);
    const imagePath = path.join('storage', 'uploads', 'events', uniqueFileName);
    
    // Delete old image if it exists
    if (event.image) {
      const oldPath = path.resolve(process.cwd(), event.image);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath);
      }
    }
    
    // Update event with new image
    await eventModel.update(eventId, { image: imagePath });
    
    res.json({
      message: 'Event image updated successfully',
      image_path: imagePath
    });
  } catch (error) {
    logger.error(`Error updating image for event ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update event image' });
  }
});

export default router;
