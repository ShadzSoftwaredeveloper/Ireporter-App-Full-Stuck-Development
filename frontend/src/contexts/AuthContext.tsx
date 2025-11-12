import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profile_picture?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ message: string; email: string }>;
  verifySignInOtp: (email: string, otp: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'user' | 'admin') => Promise<{ message: string; email: string }>;
  verifySignUpOtp: (email: string, otp: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (name: string, email: string, profilePicture?: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

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

  useEffect(() => {
    // Check if user is authenticated by verifying token with backend
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const signIn = async (email: string, password: string): Promise<{ message: string; email: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/send-signin-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send OTP');
    }

    const data = await response.json();
    return data;
  };

  const verifySignInOtp = async (email: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-signin-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid OTP');
    }

    const data = await response.json();
    
    // Store token for future requests
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'admin' = 'user'): Promise<{ message: string; email: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/send-signup-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send OTP');
    }

    const data = await response.json();
    return data;
  };

  const verifySignUpOtp = async (email: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-signup-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid OTP');
    }

    const data = await response.json();
    
    // Store token for future requests
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (name: string, email: string, profilePicture?: string) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        name, 
        email, 
        profile_picture: profilePicture 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const updatedUser = await response.json();
    setUser(updatedUser);
  };

  const deleteUser = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        verifySignInOtp,
        signUp,
        verifySignUpOtp,
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