import { API_BASE_URL } from '../config';

export interface User {
  id: number;
  username: string;
  display_name: string;
  profile_image?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  message: string;
}

class AuthService {
  /**
   * Login a user
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      return await response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }
  
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      return await response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    // Client-side logout (clear token and user data)
    // You would normally also invalidate the token on the server
  }
  
  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }
      
      return await response.json();
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export const authService = new AuthService();
