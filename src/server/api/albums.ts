import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import multer from 'multer';
import { AlbumModel } from '../models/album-model';
import { TrackModel } from '../models/track-model';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const albumModel = new AlbumModel();
const trackModel = new TrackModel();

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for cover art
  }
});

/**
 * @swagger
 * /albums:
 *   get:
 *     summary: Get all albums
 *     description: Retrieve a list of all albums
 *     tags: [Albums]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of albums to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of albums to skip
 *     responses:
 *       200:
 *         description: List of albums
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const albums = await albumModel.getAlbumsWithUserInfo({
      limit,
      offset,
      orderBy: 'created_at',
      orderDir: 'DESC'
    });
    
    res.json(albums);
  } catch (error) {
    logger.error('Error fetching albums', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * @swagger
 * /albums/{id}:
 *   get:
 *     summary: Get album by ID
 *     description: Retrieve a specific album by its ID
 *     tags: [Albums]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album details
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const album = await albumModel.getAlbumWithTracks(albumId);
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json(album);
  } catch (error) {
    logger.error(`Error fetching album ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

/**
 * @swagger
 * /albums:
 *   post:
 *     summary: Create a new album
 *     description: Create a new album with optional cover art
 *     tags: [Albums]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               cover_art:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Album created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, upload.single('cover_art'), async (req, res) => {
  try {
    const { title, description, release_date } = req.body;
    const userId = req.user.id;
    
    if (!title) {
      return res.status(400).json({ error: 'Album title is required' });
    }
    
    // Handle cover art upload if provided
    let coverArtPath = null;
    if (req.file) {
      const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'covers');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
      const filePath = path.join(storageDir, uniqueFileName);
      
      await fs.promises.writeFile(filePath, req.file.buffer);
      coverArtPath = path.join('storage', 'uploads', 'covers', uniqueFileName);
    }
    
    // Create album
    const albumId = await albumModel.create({
      title,
      user_id: userId,
      description: description || null,
      release_date: release_date || null,
      cover_art: coverArtPath
    });
    
    res.status(201).json({
      id: albumId,
      message: 'Album created successfully'
    });
  } catch (error) {
    logger.error('Error creating album', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

/**
 * @swagger
 * /albums/{id}:
 *   put:
 *     summary: Update an album
 *     description: Update an existing album
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
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
 *               release_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Album updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not album owner
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title, description, release_date } = req.body;
    
    // Check if album exists and belongs to the user
    const album = await albumModel.findById(albumId);
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    if (album.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this album' });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (release_date) updateData.release_date = release_date;
    
    // Update album
    const updated = await albumModel.update(albumId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json({
      message: 'Album updated successfully',
      id: albumId
    });
  } catch (error) {
    logger.error(`Error updating album ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

/**
 * @swagger
 * /albums/{id}:
 *   delete:
 *     summary: Delete an album
 *     description: Delete an album and all associated tracks
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not album owner
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if album exists and belongs to the user
    const album = await albumModel.findById(albumId);
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    if (album.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this album' });
    }
    
    // Delete album (cascade deletion should handle tracks)
    const deleted = await albumModel.delete(albumId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json({
      message: 'Album deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting album ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

/**
 * @swagger
 * /albums/{id}/cover:
 *   post:
 *     summary: Update album cover art
 *     description: Upload a new cover art for an album
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - cover_art
 *             properties:
 *               cover_art:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover art updated successfully
 *       400:
 *         description: Missing cover art
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not album owner
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.post('/:id/cover', authMiddleware, upload.single('cover_art'), async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Cover art file is required' });
    }
    
    // Check if album exists and belongs to the user
    const album = await albumModel.findById(albumId);
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    if (album.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this album' });
    }
    
    // Handle cover art upload
    const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'covers');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
    const filePath = path.join(storageDir, uniqueFileName);
    
    await fs.promises.writeFile(filePath, req.file.buffer);
    const coverArtPath = path.join('storage', 'uploads', 'covers', uniqueFileName);
    
    // Delete old cover art if it exists
    if (album.cover_art) {
      const oldPath = path.resolve(process.cwd(), album.cover_art);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath);
      }
    }
    
    // Update album with new cover art
    await albumModel.update(albumId, { cover_art: coverArtPath });
    
    res.json({
      message: 'Cover art updated successfully',
      cover_path: coverArtPath
    });
  } catch (error) {
    logger.error(`Error updating cover art for album ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update cover art' });
  }
});

/**
 * @swagger
 * /albums/{id}/tracks:
 *   get:
 *     summary: Get tracks for an album
 *     description: Retrieve all tracks belonging to an album
 *     tags: [Albums]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Album ID
 *     responses:
 *       200:
 *         description: List of tracks
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.get('/:id/tracks', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    // Check if album exists
    const album = await albumModel.findById(albumId);
    
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    // Get tracks for album
    const tracks = await trackModel.findBy('album_id', albumId);
    
    res.json(tracks);
  } catch (error) {
    logger.error(`Error fetching tracks for album ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
});

export default router;
