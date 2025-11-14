import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  createdAt: string;
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
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await verifyToken();
      }
    };
    verifyToken();
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
        console.log('✅ User profile fetched:', userData);
        const transformedUser: User = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name,
          role: userData.role,
          profilePicture: userData.profile_picture,
          createdAt: userData.created_at
        };
        setUser(transformedUser);
      } else {
        console.log('❌ Token invalid, clearing storage');
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error);
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
    
    localStorage.setItem('token', data.token);
    
    const transformedUser: User = {
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      profilePicture: data.user.profile_picture,
      createdAt: data.user.created_at
    };
    
    setUser(transformedUser);
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
    
    localStorage.setItem('token', data.token);
    
    const transformedUser: User = {
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      profilePicture: data.user.profile_picture,
      createdAt: data.user.created_at
    };
    
    setUser(transformedUser);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (name: string, email: string, profilePicture?: string) => {
    console.log('🔄 Updating profile:', { name, email, profilePicture });
    
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: headers,
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
    console.log('✅ Profile updated successfully:', updatedUser);
    
    const transformedUser: User = {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      profilePicture: updatedUser.profile_picture,
      createdAt: updatedUser.created_at
    };
    
    setUser(transformedUser);
  };

  const deleteUser = async (userId: string) => {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const users = await response.json();
    return users.map((userData: any) => ({
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      profilePicture: userData.profile_picture,
      createdAt: userData.created_at
    }));
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