import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { UserModel } from '../models/user-model';
import { logger } from '../utils/logger';

const userModel = new UserModel();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * This middleware will attach the user to the request if a valid token is provided,
 * but will not block the request if no token or an invalid token is provided.
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      // Verify token
      const decoded = verifyToken(token);
      
      if (decoded) {
        // Get user from database
        const user = await userModel.findById(decoded.id);
        
        if (user) {
          // Attach user to request
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Just log the error but continue with the request
    logger.error('Optional authentication error', error);
    next();
  }
}
