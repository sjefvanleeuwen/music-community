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
  message: string;
  userId: number;
  email: string;
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
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is an unverified account error
        if (response.status === 403 && data.requiresVerification) {
          const error = new Error(data.error || 'Account requires verification');
          // Add verification data to the error
          Object.assign(error, {
            requiresVerification: true,
            userId: data.userId,
            email: data.email
          });
          throw error;
        }
        
        throw new Error(data.error || 'Login failed');
      }
      
      return data;
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
      console.log('Making registration request:', data);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      console.log('Registration response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Registration service error:', error);
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

  /**
   * Verify registration code
   */
  async verifyCode(userId: number, code: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, code })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
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
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend verification code');
      }
      
      return await response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
