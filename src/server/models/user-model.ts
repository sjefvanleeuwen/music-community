import { BaseModel } from './base-model';
import { hashPassword, comparePassword } from '../utils/auth';
import { logger } from '../utils/logger';

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
      const users = await this.findBy('username', username);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Error finding user by username', error);
      throw error;
    }
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.findBy('email', email);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Error finding user by email', error);
      throw error;
    }
  }
  
  /**
   * Create a new user with hashed password
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
    bio?: string;
    profile_image?: string;
  }): Promise<number> {
    try {
      const passwordHash = await hashPassword(userData.password);
      
      const data = {
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        display_name: userData.display_name || null,
        bio: userData.bio || null,
        profile_image: userData.profile_image || null
      };
      
      return await this.create(data);
    } catch (error) {
      logger.error('Error creating user', error);
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
