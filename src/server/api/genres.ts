import express from 'express';
import { GenreModel } from '../models/genre-model';
import { logger } from '../utils/logger';

const router = express.Router();
const genreModel = new GenreModel();

// Get all genres
router.get('/', async (req, res) => {
  try {
    const genres = await genreModel.findAll();
    res.json(genres);
  } catch (error) {
    logger.error('Error fetching genres', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// Get genre by ID
router.get('/:id', async (req, res) => {
  try {
    const genreId = parseInt(req.params.id);
    const genre = await genreModel.findById(genreId);
    
    if (!genre) {
      return res.status(404).json({ error: 'Genre not found' });
    }
    
    res.json(genre);
  } catch (error) {
    logger.error(`Error fetching genre ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch genre' });
  }
});

// Get child genres
router.get('/:id/children', async (req, res) => {
  try {
    const parentId = parseInt(req.params.id);
    const children = await genreModel.getChildGenres(parentId);
    
    res.json(children);
  } catch (error) {
    logger.error(`Error fetching child genres for ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch child genres' });
  }
});

// Get genre ancestry
router.get('/:id/ancestors', async (req, res) => {
  try {
    const genreId = parseInt(req.params.id);
    const ancestry = await genreModel.getGenreAncestry(genreId);
    
    res.json(ancestry);
  } catch (error) {
    logger.error(`Error fetching genre ancestry for ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch genre ancestry' });
  }
});

// Get complete genre tree
router.get('/tree', async (req, res) => {
  try {
    const tree = await genreModel.getGenreTree();
    res.json(tree);
  } catch (error) {
    logger.error('Error fetching genre tree', error);
    res.status(500).json({ error: 'Failed to fetch genre tree' });
  }
});

// Get popular genres
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const genres = await genreModel.getPopularGenres(limit);
    
    res.json(genres);
  } catch (error) {
    logger.error('Error fetching popular genres', error);
    res.status(500).json({ error: 'Failed to fetch popular genres' });
  }
});

// Get root genres
router.get('/roots', async (req, res) => {
  try {
    const roots = await genreModel.getRootGenres();
    res.json(roots);
  } catch (error) {
    logger.error('Error fetching root genres', error);
    res.status(500).json({ error: 'Failed to fetch root genres' });
  }
});

export default router;
