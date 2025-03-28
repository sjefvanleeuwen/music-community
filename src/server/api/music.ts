import express from 'express';
import { MusicService } from '../services/music-service';
import { RatingModel } from '../models/rating-model';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import { logger } from '../utils/logger';

const router = express.Router();
const musicService = new MusicService();
const ratingModel = new RatingModel();

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Get recent tracks
router.get('/tracks/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const tracks = await musicService.getRecentTracks(limit);
    res.json(tracks);
  } catch (error) {
    logger.error('Error fetching recent tracks', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// Get track by ID
router.get('/tracks/:id', async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const track = await musicService.getTrack(trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(track);
  } catch (error) {
    logger.error(`Error fetching track ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Upload a new track
router.post('/tracks', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, album_id, description, lyrics, release_date, allow_downloads, allow_remix, license_type } = req.body;
    const genres = JSON.parse(req.body.genres || '[]');
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // Handle file upload
    const filePath = await musicService.handleFileUpload(
      req.file.buffer,
      req.file.originalname,
      userId,
      'track'
    );
    
    // Create track record
    const trackId = await musicService.createTrack({
      title,
      user_id: userId,
      album_id: album_id ? parseInt(album_id) : undefined,
      file_path: filePath,
      description,
      lyrics,
      release_date,
      allow_downloads: allow_downloads === 'true',
      allow_remix: allow_remix === 'true',
      license_type,
      genres
    });
    
    res.status(201).json({ id: trackId });
  } catch (error) {
    logger.error('Error uploading track', error);
    res.status(500).json({ error: 'Failed to upload track' });
  }
});

// Upload a stem for a track
router.post('/tracks/:id/stems', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const { title, instrument_type, description } = req.body;
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // Handle file upload
    const filePath = await musicService.handleFileUpload(
      req.file.buffer,
      req.file.originalname,
      userId,
      'stem'
    );
    
    // Add stem to track
    const stemId = await musicService.addStem({
      track_id: trackId,
      user_id: userId,
      title,
      file_path: filePath,
      instrument_type,
      description
    });
    
    res.status(201).json({ id: stemId });
  } catch (error) {
    logger.error(`Error uploading stem to track ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to upload stem' });
  }
});

// Rate a track
router.post('/tracks/:id/ratings', authMiddleware, async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { rating, review } = req.body;
    
    if (!rating || isNaN(parseInt(rating))) {
      return res.status(400).json({ error: 'Valid rating is required' });
    }
    
    const ratingId = await ratingModel.setRating(
      userId,
      trackId,
      parseInt(rating),
      review
    );
    
    res.status(201).json({ id: ratingId });
  } catch (error) {
    logger.error(`Error rating track ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get ratings for a track
router.get('/tracks/:id/ratings', async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);
    const ratings = await ratingModel.getTrackRatings(trackId);
    const stats = await ratingModel.getTrackRatingStats(trackId);
    
    res.json({ ratings, stats });
  } catch (error) {
    logger.error(`Error fetching ratings for track ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Search for tracks
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await musicService.searchMusic(query, limit, offset);
    res.json(results);
  } catch (error) {
    logger.error('Error searching tracks', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Get genre hierarchy
router.get('/genres/tree', async (req, res) => {
  try {
    const genreTree = await musicService.getGenreHierarchy();
    res.json(genreTree);
  } catch (error) {
    logger.error('Error fetching genre hierarchy', error);
    res.status(500).json({ error: 'Failed to fetch genre hierarchy' });
  }
});

// Get tracks by genre
router.get('/genres/:id/tracks', async (req, res) => {
  try {
    const genreId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const tracks = await musicService.getTracksByGenre(genreId, limit, offset);
    res.json(tracks);
  } catch (error) {
    logger.error(`Error fetching tracks for genre ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch tracks for genre' });
  }
});

export default router;
