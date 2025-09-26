import { useState, useEffect } from 'react';
import { useAccessToken } from '../context/AccessTokenContext';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const { isAuthenticated, user, loading } = useAccessToken();
  return {
    isAuthenticated,
    username: user?.username || null,
    isLoading: loading,
  };
}
