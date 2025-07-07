import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if session cookie exists
        const sessionCookie = Cookies.get('session');
        
        if (sessionCookie === 'true') {
          // Get username from sessionStorage first, then fallback to cookie
          const storedUsername = 
            sessionStorage.getItem('username') || 
            Cookies.get('username');
          
          setAuthState({
            isAuthenticated: true,
            username: storedUsername || null,
            isLoading: false,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            username: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState({
          isAuthenticated: false,
          username: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  return authState;
};
