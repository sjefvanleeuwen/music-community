import { BaseModel } from './base-model';
import { hashPassword, comparePassword } from '../utils/auth';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  bio: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export class UserModel extends BaseModel<User> {
  constructor() {
    super('users');
  }
  
  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const db = await this.getDb();
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      return user || null;
    } catch (error) {
      logger.error(`Error finding user by username ${username}:`, error);
      throw error;
    }
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const db = await this.getDb();
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      return user || null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }
  
  /**
   * Find a user by email verification token
   */
  async findByEmailVerificationToken(token: string): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`SELECT * FROM users WHERE email_verification_token = ?`, [token]);
    } catch (error) {
      logger.error('Error finding user by email verification token', error);
      throw error;
    }
  }

  /**
   * Find a user by password reset token
   */
  async findByPasswordResetToken(token: string): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`SELECT * FROM users WHERE password_reset_token = ?`, [token]);
    } catch (error) {
      logger.error('Error finding user by password reset token', error);
      throw error;
    }
  }
  
  /**
   * Find a user by verification code
   */
  async findByVerificationCode(code: string): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`SELECT * FROM users WHERE verification_code = ?`, [code]);
    } catch (error) {
      logger.error('Error finding user by verification code', error);
      throw error;
    }
  }
  
  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    display_name: string;
    verification_code: string;
    verification_code_expiry: string;
    status: string;
  }): Promise<number> {
    const db = await this.getDb();
    
    try {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Insert user data into database
      const result = await db.run(`
        INSERT INTO users (
          username, 
          email, 
          password, 
          display_name, 
          verification_code, 
          verification_code_expiry, 
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.display_name,
        userData.verification_code,
        userData.verification_code_expiry,
        userData.status
      ]);
      
      return result.lastID;
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update user password
   */
  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const passwordHash = await hashPassword(newPassword);
      return await this.update(userId, { password_hash: passwordHash });
    } catch (error) {
      logger.error('Error updating user password', error);
      throw error;
    }
  }
  
  /**
   * Authenticate user with username and password
   */
  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByUsername(username);
      
      if (!user) {
        return null;
      }
      
      const isMatch = await comparePassword(password, user.password_hash);
      
      if (!isMatch) {
        return null;
      }
      
      // Update last login timestamp
      await this.update(user.id, {
        last_login: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      logger.error('Error authenticating user', error);
      throw error;
    }
  }
  
  /**
   * Verify a user's credentials
   */
  async verifyCredentials(username: string, password: string): Promise<any> {
    try {
      const user = await this.findByUsername(username);
      
      if (!user) {
        return null;
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return null;
      }
      
      // Remove sensitive data
      const { password: _, verification_code: __, verification_code_expiry: ___, ...safeUserData } = user;
      
      return safeUserData;
    } catch (error) {
      logger.error(`Error verifying credentials for user ${username}:`, error);
      throw error;
    }
  }
  
  /**
   * Get user with tracks count
   */
  async getUserWithStats(userId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`
        SELECT 
          u.*,
          (SELECT COUNT(*) FROM tracks WHERE user_id = u.id) as tracks_count,
          (SELECT COUNT(*) FROM stems WHERE user_id = u.id) as stems_count,
          (SELECT COUNT(*) FROM ratings WHERE track_id IN (SELECT id FROM tracks WHERE user_id = u.id)) as ratings_count
        FROM users u
        WHERE u.id = ?
      `, [userId]);
    } catch (error) {
      logger.error('Error getting user with stats', error);
      throw error;
    }
  }
}
