import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import multer from 'multer';
import { BlogPostModel } from '../models/blog-post-model';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const blogPostModel = new BlogPostModel();

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for blog images
  }
});

/**
 * @swagger
 * /blog:
 *   get:
 *     summary: Get all blog posts
 *     description: Retrieve a list of published blog posts
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of posts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of posts to skip
 *     responses:
 *       200:
 *         description: List of blog posts
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const posts = await blogPostModel.getPublishedPosts(limit, offset);
    
    res.json(posts);
  } catch (error) {
    logger.error('Error fetching blog posts', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * @swagger
 * /blog/{id}:
 *   get:
 *     summary: Get blog post by ID
 *     description: Retrieve a specific blog post by its ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post details
 *       404:
 *         description: Blog post not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await blogPostModel.getPostWithUserInfo(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Only allow access to published posts unless author or admin
    if (!post.published && (!req.user || req.user.id !== post.user_id)) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(post);
  } catch (error) {
    logger.error(`Error fetching blog post ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * @swagger
 * /blog:
 *   post:
 *     summary: Create a new blog post
 *     description: Create a new blog post with optional image
 *     tags: [Blog]
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, published } = req.body;
    const userId = req.user.id;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Handle image upload if provided
    let imagePath = null;
    if (req.file) {
      const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'blog');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
      const filePath = path.join(storageDir, uniqueFileName);
      
      await fs.promises.writeFile(filePath, req.file.buffer);
      imagePath = path.join('storage', 'uploads', 'blog', uniqueFileName);
    }
    
    // Determine if post should be published now
    const isPublished = published === 'true';
    const publishedAt = isPublished ? new Date().toISOString() : null;
    
    // Create blog post
    const postId = await blogPostModel.create({
      user_id: userId,
      title,
      content,
      image: imagePath,
      published: isPublished,
      published_at: publishedAt
    });
    
    res.status(201).json({
      id: postId,
      message: 'Blog post created successfully'
    });
  } catch (error) {
    logger.error('Error creating blog post', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

/**
 * @swagger
 * /blog/{id}:
 *   put:
 *     summary: Update a blog post
 *     description: Update an existing blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not post owner
 *       404:
 *         description: Blog post not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title, content, published } = req.body;
    
    // Check if post exists and belongs to the user
    const post = await blogPostModel.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    
    // Handle publishing status changes
    if (published !== undefined) {
      const isPublished = published === true || published === 'true';
      updateData.published = isPublished;
      
      // If publishing for the first time, set published_at
      if (isPublished && !post.published) {
        updateData.published_at = new Date().toISOString();
      }
      
      // If unpublishing, clear published_at
      if (!isPublished) {
        updateData.published_at = null;
      }
    }
    
    // Update post
    const updated = await blogPostModel.update(postId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({
      message: 'Blog post updated successfully',
      id: postId
    });
  } catch (error) {
    logger.error(`Error updating blog post ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

/**
 * @swagger
 * /blog/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     description: Delete a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not post owner
 *       404:
 *         description: Blog post not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if post exists and belongs to the user
    const post = await blogPostModel.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    // Delete post
    const deleted = await blogPostModel.delete(postId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Delete image if it exists
    if (post.image) {
      const imagePath = path.resolve(process.cwd(), post.image);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
      }
    }
    
    res.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting blog post ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

/**
 * @swagger
 * /blog/{id}/image:
 *   post:
 *     summary: Update blog post image
 *     description: Upload a new image for a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
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
 *         description: Forbidden - Not post owner
 *       404:
 *         description: Blog post not found
 *       500:
 *         description: Server error
 */
router.post('/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    // Check if post exists and belongs to the user
    const post = await blogPostModel.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    // Handle image upload
    const storageDir = path.resolve(process.cwd(), 'storage', 'uploads', 'blog');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${userId}_${timestamp}_${safeFileName}`;
    const filePath = path.join(storageDir, uniqueFileName);
    
    await fs.promises.writeFile(filePath, req.file.buffer);
    const imagePath = path.join('storage', 'uploads', 'blog', uniqueFileName);
    
    // Delete old image if it exists
    if (post.image) {
      const oldPath = path.resolve(process.cwd(), post.image);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath);
      }
    }
    
    // Update post with new image
    await blogPostModel.update(postId, { image: imagePath });
    
    res.json({
      message: 'Blog post image updated successfully',
      image_path: imagePath
    });
  } catch (error) {
    logger.error(`Error updating image for blog post ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to update blog post image' });
  }
});

/**
 * @swagger
 * /blog/user/{userId}:
 *   get:
 *     summary: Get user's blog posts
 *     description: Retrieve blog posts written by a specific user
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of posts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of posts to skip
 *     responses:
 *       200:
 *         description: List of user's blog posts
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Only return published posts unless the requester is the author
    const includeUnpublished = req.user && req.user.id === userId;
    
    const posts = await blogPostModel.getUserPosts(userId, limit, offset, includeUnpublished);
    
    res.json(posts);
  } catch (error) {
    logger.error(`Error fetching blog posts for user ${req.params.userId}`, error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

export default router;
