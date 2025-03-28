import { BaseModel } from './base-model';
import { logger } from '../utils/logger';

export interface BlogPost {
  id: number;
  user_id: number;
  title: string;
  content: string;
  image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export class BlogPostModel extends BaseModel<BlogPost> {
  constructor() {
    super('blog_posts');
  }
  
  /**
   * Get published blog posts with user information
   */
  async getPublishedPosts(limit: number = 20, offset: number = 0): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.profile_image,
          (SELECT COUNT(*) FROM comments WHERE blog_post_id = p.id) as comments_count
        FROM blog_posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.published = 1
        ORDER BY p.published_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
    } catch (error) {
      logger.error('Error getting published blog posts', error);
      throw error;
    }
  }
  
  /**
   * Get a single blog post with user information
   */
  async getPostWithUserInfo(postId: number): Promise<any> {
    const db = await this.getDb();
    
    try {
      return await db.get(`
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM blog_posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [postId]);
    } catch (error) {
      logger.error(`Error getting blog post with user info for post ${postId}`, error);
      throw error;
    }
  }
  
  /**
   * Get blog posts by a specific user
   */
  async getUserPosts(
    userId: number, 
    limit: number = 20, 
    offset: number = 0,
    includeUnpublished: boolean = false
  ): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      // Build the query based on whether to include unpublished posts
      let query = `
        SELECT 
          p.*,
          (SELECT COUNT(*) FROM comments WHERE blog_post_id = p.id) as comments_count
        FROM blog_posts p
        WHERE p.user_id = ?
      `;
      
      if (!includeUnpublished) {
        query += ' AND p.published = 1';
      }
      
      query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      
      return await db.all(query, [userId, limit, offset]);
    } catch (error) {
      logger.error(`Error getting blog posts for user ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Get recent published blog posts
   */
  async getRecentPosts(limit: number = 5): Promise<any[]> {
    return this.getPublishedPosts(limit, 0);
  }
  
  /**
   * Search blog posts by title or content
   */
  async searchPosts(query: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const db = await this.getDb();
    
    try {
      return await db.all(`
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.profile_image
        FROM blog_posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.published = 1 AND (p.title LIKE ? OR p.content LIKE ?)
        ORDER BY p.published_at DESC
        LIMIT ? OFFSET ?
      `, [`%${query}%`, `%${query}%`, limit, offset]);
    } catch (error) {
      logger.error('Error searching blog posts', error);
      throw error;
    }
  }
}
