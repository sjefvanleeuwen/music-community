import express from 'express';
import { UserModel } from '../models/user-model';
import { generateToken } from '../utils/auth';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { mailService } from '../services/mail-service';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const userModel = new UserModel();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends verification code via email
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
 *         description: Verification code sent successfully
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
    
    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date();
    codeExpiry.setHours(codeExpiry.getHours() + 1); // 1 hour expiry
    
    // Create user in database
    const userId = await userModel.createUser({
      username,
      email,
      password,
      display_name: display_name || username,
      verification_code: verificationCode,
      verification_code_expiry: codeExpiry.toISOString(),
      status: 'pending' // User status is pending until verification
    });
    
    // Send verification email
    try {
      await mailService.sendVerificationCodeEmail(email, username, verificationCode);
    } catch (emailError) {
      logger.error(`Failed to send verification email to ${email}`, emailError);
      // Continue with registration even if email fails
    }
    
    // Return success response
    res.status(201).json({ 
      message: 'Registration initiated. Please check your email for a verification code.',
      userId,
      email
    });
  } catch (error) {
    logger.error('Error registering user', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify registration code
 *     description: Verifies the code sent to user's email to complete registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: integer
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification successful, returns auth token
 *       400:
 *         description: Invalid or expired code
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and verification code are required' });
    }
    
    // Find user by ID
    const user = await userModel.findById(parseInt(userId.toString()));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already verified
    if (user.status === 'active') {
      return res.status(400).json({ error: 'User is already verified' });
    }
    
    // Check if code matches and is not expired
    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    const codeExpiry = new Date(user.verification_code_expiry);
    if (codeExpiry < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }
    
    // Mark user as active
    await userModel.update(user.id, {
      status: 'active',
      verification_code: null,
      verification_code_expiry: null
    });
    
    // Generate token for auto-login
    const token = generateToken({ id: user.id, username: user.username });
    
    // Send welcome email now that they're verified
    await mailService.sendWelcomeEmail(user.email, user.username);
    
    res.json({ 
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    logger.error('Error verifying code', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

/**
 * @swagger
 * /auth/resend-code:
 *   post:
 *     summary: Resend verification code
 *     description: Resends verification code to the user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Invalid email or user already verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const user = await userModel.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }
    
    // Check if user is already verified
    if (user.status === 'active') {
      return res.status(400).json({ error: 'User is already verified' });
    }
    
    // Generate a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date();
    codeExpiry.setHours(codeExpiry.getHours() + 1); // 1 hour expiry
    
    // Update user with new code
    await userModel.update(user.id, {
      verification_code: verificationCode,
      verification_code_expiry: codeExpiry.toISOString()
    });
    
    // Send new verification code email
    await mailService.sendVerificationCodeEmail(user.email, user.username, verificationCode);
    
    res.json({ 
      message: 'Verification code has been resent to your email',
      userId: user.id
    });
  } catch (error) {
    logger.error('Error resending verification code', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
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
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    logger.info(`Login attempt for user: ${username}`);
    
    // Find user by username
    const user = await userModel.findByUsername(username);
    
    if (!user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check if the user account is pending verification
    if (user.status === 'pending' && !user.email_verified) {
      logger.info(`Login attempted for unverified account: ${username}`);
      return res.status(403).json({
        error: 'Account not verified',
        requiresVerification: true,
        userId: user.id,
        email: user.email
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for user ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Omit sensitive data from the user object
    const { password: _, verification_code: __, verification_code_expiry: ___, ...safeUserData } = user;
    
    logger.info(`User logged in successfully: ${username}`);
    
    res.json({
      token,
      user: safeUserData,
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     description: Verify a user's email address using the token sent via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Missing token
 *       404:
 *         description: Token not found or expired
 *       500:
 *         description: Server error
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    // Find user by verification token
    const user = await userModel.findByEmailVerificationToken(token);
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired verification token' });
    }
    
    // Check if token is expired
    const tokenExpiry = new Date(user.email_verification_expiry);
    if (tokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }
    
    // Mark email as verified
    await userModel.update(user.id, {
      email_verified: true,
      email_verification_token: null,
      email_verification_expiry: null
    });
    
    // Send welcome email now that they're verified
    await mailService.sendWelcomeEmail(user.email, user.username);
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Error verifying email', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset link sent to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       400:
 *         description: Missing email
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const user = await userModel.findByEmail(email);
    
    // Don't reveal if the email exists or not for security reasons
    if (!user) {
      return res.json({ message: 'If your email is registered, you will receive a password reset link shortly.' });
    }
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 24); // 24 hour expiry
    
    // Update user with reset token
    await userModel.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expiry: resetExpiry.toISOString()
    });
    
    // Send password reset email
    await mailService.sendPasswordResetEmail(email, user.username, resetToken);
    
    res.json({ message: 'If your email is registered, you will receive a password reset link shortly.' });
  } catch (error) {
    logger.error('Error requesting password reset', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using token from email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Missing required fields or invalid token
 *       404:
 *         description: Token not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    // Find user by reset token
    const user = await userModel.findByPasswordResetToken(token);
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    const tokenExpiry = new Date(user.password_reset_expiry);
    if (tokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
    }
    
    // Update password and clear reset token
    await userModel.updatePassword(user.id, password);
    await userModel.update(user.id, {
      password_reset_token: null,
      password_reset_expiry: null
    });
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    logger.error('Error resetting password', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Returns the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update profile
 *     description: Update the current user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /auth/me/password:
 *   put:
 *     summary: Change password
 *     description: Change the current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Current password is incorrect
 *       500:
 *         description: Server error
 */
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
