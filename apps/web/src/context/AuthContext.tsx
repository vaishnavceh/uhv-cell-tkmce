import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { RoleName, UserProfile } from '@uhv/shared-types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isContentManager: boolean;
  hasRole: (roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('uhv_access_token');
      const storedUser = localStorage.getItem('uhv_user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with /auth/me
          const res = await apiClient.get('/auth/me');
          const freshUser = res.data;
          setUser(freshUser);
          localStorage.setItem('uhv_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('uhv_access_token');
          localStorage.removeItem('uhv_refresh_token');
          localStorage.removeItem('uhv_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiClient.post('/auth/login', { email, password: pass });
    const { tokens, user: authUser } = res.data;

    localStorage.setItem('uhv_access_token', tokens.accessToken);
    localStorage.setItem('uhv_refresh_token', tokens.refreshToken);
    localStorage.setItem('uhv_user', JSON.stringify(authUser));

    setUser(authUser);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('uhv_refresh_token');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('uhv_access_token');
      localStorage.removeItem('uhv_refresh_token');
      localStorage.removeItem('uhv_user');
      setUser(null);
    }
  };

  const roleName = user?.role?.name;
  const isSuperAdmin = roleName === RoleName.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || roleName === RoleName.ADMIN;
  const isEditor = isAdmin || roleName === RoleName.EDITOR;
  const isContentManager = isEditor || roleName === RoleName.CONTENT_MANAGER;

  const hasRole = (roles: RoleName[]): boolean => {
    if (!roleName) return false;
    if (roleName === RoleName.SUPER_ADMIN) return true;
    return roles.includes(roleName as RoleName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isSuperAdmin,
        isAdmin,
        isEditor,
        isContentManager,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
