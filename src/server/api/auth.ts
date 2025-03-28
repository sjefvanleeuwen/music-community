import express from 'express';
import { UserModel } from '../models/user-model';
import { generateToken } from '../utils/auth';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const userModel = new UserModel();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               display_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     display_name:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create user
    const userId = await userModel.createUser({
      username,
      email,
      password,
      display_name: display_name || username
    });
    
    // Generate token
    const token = generateToken({ id: userId, username });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username,
        display_name: display_name || username
      }
    });
  } catch (error) {
    logger.error('Error registering user', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     display_name:
 *                       type: string
 *                     profile_image:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Authenticate user
    const user = await userModel.authenticate(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate token
    const token = generateToken({ id: user.id, username: user.username });
    
    res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    logger.error('Error logging in', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with stats
    const user = await userModel.getUserWithStats(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.json(user);
  } catch (error) {
    logger.error('Error getting user profile', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, bio } = req.body;
    
    // Only allow certain fields to be updated
    const updateData: any = {};
    if (display_name) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    
    // Update user
    const updated = await userModel.update(userId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated user
    const user = await userModel.findById(userId);
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('Error updating user profile', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    
    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    // Verify current password
    const user = await userModel.authenticate(req.user.username, current_password);
    
    if (!user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    await userModel.updatePassword(userId, new_password);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
