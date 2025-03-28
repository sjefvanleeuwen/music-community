import { createStore } from './store';
import { User } from '../services/auth-service';

export interface AppState {
  auth: {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
  };
  // Other state slices can be added here
}

// Initial state
const initialState: AppState = {
  auth: {
    isAuthenticated: !!localStorage.getItem('token'),
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }
};

// Reducer
function reducer(state = initialState, action: any): AppState {
  switch (action.type) {
    case 'AUTH_LOGIN':
      // Save token and user to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      
      return {
        ...state,
        auth: {
          isAuthenticated: true,
          token: action.payload.token,
          user: action.payload.user
        }
      };
      
    case 'AUTH_LOGOUT':
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          token: null,
          user: null
        }
      };
      
    default:
      return state;
  }
}

// Create the store
export const store = createStore(reducer, initialState);
