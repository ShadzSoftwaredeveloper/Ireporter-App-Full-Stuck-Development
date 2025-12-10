import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Safely parse JSON responses. Some endpoints may return empty bodies
  // (204/empty on error) which causes `response.json()` to throw.
  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('safeJson: failed to parse response as JSON', e);
      return null;
    }
  };

  // Load user from token on mount and when localStorage changes
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      // First, try to get user from localStorage (set during OTP login)
      const storedUser = localStorage.getItem('user');
      if (storedUser && token) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse stored user:', e);
        }
      }
      
      // Otherwise, fetch user from ME endpoint
      if (token) {
        try {
          const response = await fetch(API_ENDPOINTS.ME, {
            headers: {
              ...getAuthHeaders(),
            },
          });

          if (response.ok) {
            const data = await safeJson(response);
            setUser(data?.data?.user ?? null);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
    
    // Listen for localStorage changes (e.g., from other tabs or OTP login)
    const handleStorageChange = () => {
      initializeAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Traditional sign-in (email + password)
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error((data && data.message) || 'Failed to sign in');
      }

      const token = data?.token ?? data?.data?.token ?? null;
      const signedUser = data?.user ?? data?.data?.user ?? null;
      if (token) localStorage.setItem('authToken', token);
      if (signedUser) setUser(signedUser);
      return signedUser;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error) || 'Failed to sign in';
      throw new Error(msg);
    }
  };

  const signUp = async (email: string, password: string, name: string, role?: string) => {
    // Traditional registration (email + password + name)
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error((data && data.message) || 'Failed to register');
      }

      const token = data?.token ?? data?.data?.token ?? null;
      const createdUser = data?.user ?? data?.data?.user ?? null;
      if (token) localStorage.setItem('authToken', token);
      if (createdUser) setUser(createdUser);
      return createdUser;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error) || 'Failed to sign up';
      throw new Error(msg);
    }
  };

  // OTP verify functions removed — using traditional auth endpoints

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const updateProfile = async (name: string, email: string, profilePicture?: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, email, profilePicture }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error((data && data.message) || 'Update failed');
      }

      // Update user in state - response has { status, message, data: { user: updated } }
      const updatedUser = data?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error) || 'Failed to update profile';
      throw new Error(msg);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await safeJson(response);
        throw new Error((data && data.message) || 'Delete failed');
      }

      // If the deleted user is the current user, sign them out
      if (userId === user.id) {
        signOut();
      }
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error) || 'Failed to delete user';
      throw new Error(msg);
    }
  };

  const getAllUsers = async () => {
    if (!user || user.role !== 'admin') {
      return [];
    }

    try {
      const response = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await safeJson(response);
      return data?.data?.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };



  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
      
        signOut,
        updateProfile,
        deleteUser,
        getAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
