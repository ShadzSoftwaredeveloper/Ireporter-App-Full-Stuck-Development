/// <reference types="vite/client" />
// API Configuration
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
// Auth
// `ME` is the authenticated GET endpoint returning the current user (auth controller)
ME: `${API_BASE_URL}/api/auth/me`,
// Profile (PUT) lives under auth controller as well
PROFILE: `${API_BASE_URL}/api/auth/profile`,
// Auth endpoints
SIGNIN: `${API_BASE_URL}/api/auth/signin`,
SIGNUP: `${API_BASE_URL}/api/auth/signup`,
VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
// Legacy
LOGIN: `${API_BASE_URL}/api/auth/signin`,
REGISTER: `${API_BASE_URL}/api/auth/signup`,

// Incidents
INCIDENTS: `${API_BASE_URL}/api/incidents`,
INCIDENT_BY_ID: (id: string) => `${API_BASE_URL}/api/incidents/${id}`,
INCIDENT_STATS: `${API_BASE_URL}/api/incidents/stats/overview`,

// Notifications
NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
NOTIFICATION_BY_ID: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
MARK_READ: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
MARK_ALL_READ: `${API_BASE_URL}/api/notifications/mark-all-read`,

// Users
USERS: `${API_BASE_URL}/api/users`,
USER_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,

// Upload
UPLOAD: `${API_BASE_URL}/api/upload`,
DELETE_FILE: (filename: string) => `${API_BASE_URL}/api/upload/${filename}`,
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to construct full media URL
export const getMediaUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/uploads/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/uploads/${path}`;
};
