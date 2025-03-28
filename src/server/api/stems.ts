import express from 'express';
import { StemModel } from '../models/stem-model';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import multer from 'multer';
import { MusicService } from '../services/music-service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const stemModel = new StemModel();
const musicService = new MusicService();

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Get stem by ID
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const stemId = parseInt(req.params.id);
    const stem = await stemModel.findById(stemId);
    
    if (!stem) {
      return res.status(404).json({ error: 'Stem not found' });
    }
    
    res.json(stem);
  } catch (error) {
    logger.error(`Error fetching stem ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch stem' });
  }
});

// Get stems for a track
router.get('/track/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const stems = await stemModel.getStemsWithUser(trackId);
    
    res.json(stems);
  } catch (error) {
    logger.error(`Error fetching stems for track ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch stems' });
  }
});

// Get tracks using a stem
router.get('/:id/usage', optionalAuthMiddleware, async (req, res) => {
  try {
    const stemId = parseInt(req.params.id);
    const tracks = await stemModel.getTracksUsingStem(stemId);
    
    res.json(tracks);
  } catch (error) {
    logger.error(`Error fetching tracks using stem ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch stem usage' });
  }
});

// Get popular instrument types
router.get('/instrument-types', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const instrumentTypes = await stemModel.getPopularInstrumentTypes(limit);
    
    res.json(instrumentTypes);
  } catch (error) {
    logger.error('Error fetching instrument types', error);
    res.status(500).json({ error: 'Failed to fetch instrument types' });
  }
});

// Download stem file
router.get('/download/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const stemId = parseInt(req.params.id);
    const stem = await stemModel.findById(stemId);
    
    if (!stem) {
      return res.status(404).json({ error: 'Stem not found' });
    }
    
    // Check if file exists
    const filePath = path.resolve(process.cwd(), stem.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Stem file not found' });
    }
    
    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(stem.file_path)}"`);
    res.setHeader('Content-Type', 'audio/wav'); // Assuming WAV format for stems
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`Error downloading stem ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to download stem' });
  }
});

// Record stem usage in a track
router.post('/usage/:id', authMiddleware, async (req, res) => {
  try {
    const stemId = parseInt(req.params.id);
    const { track_id } = req.body;
    
    if (!track_id) {
      return res.status(400).json({ error: 'Track ID is required' });
    }
    
    // Validate stem exists
    const stem = await stemModel.findById(stemId);
    if (!stem) {
      return res.status(404).json({ error: 'Stem not found' });
    }
    
    // Record usage
    await stemModel.recordStemUsage(stemId, parseInt(track_id));
    
    res.status(201).json({ message: 'Stem usage recorded successfully' });
  } catch (error) {
    logger.error(`Error recording stem usage for stem ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to record stem usage' });
  }
});

// Upload a new stem
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, track_id, instrument_type, description } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    if (!track_id || !instrument_type) {
      return res.status(400).json({ error: 'Track ID and instrument type are required' });
    }
    
    // Handle file upload
    const filePath = await musicService.handleFileUpload(
      req.file.buffer,
      req.file.originalname,
      userId,
      'stem'
    );
    
    // Create stem
    const stemId = await stemModel.create({
      track_id: parseInt(track_id),
      user_id: userId,
      title: title || req.file.originalname,
      file_path: filePath,
      instrument_type,
      description: description || null
    });
    
    res.status(201).json({ id: stemId });
  } catch (error) {
    logger.error('Error uploading stem', error);
    res.status(500).json({ error: 'Failed to upload stem' });
  }
});

export default router;
