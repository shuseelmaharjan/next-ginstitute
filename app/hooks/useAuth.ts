import { useAuthenticate } from '../context/AuthenticateContext';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const { isAuthenticated, user, loading } = useAuthenticate();
  return {
    isAuthenticated,
    username: user?.username || null,
    isLoading: loading,
  };
}
