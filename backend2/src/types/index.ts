export type IncidentType = 'red-flag' | 'intervention';
export type IncidentStatus = 'draft' | 'under-investigation' | 'resolved' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface MediaFile {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  location: Location;
  media: MediaFile[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  adminComment?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  profilePicture?: string;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Request DTOs
export interface CreateIncidentRequest {
  type: IncidentType;
  title: string;
  description: string;
  location: Location;
  media?: Express.Multer.File[];
  status?: IncidentStatus;
}

export interface UpdateIncidentRequest {
  type?: IncidentType;
  title?: string;
  description?: string;
  location?: Location;
  status?: IncidentStatus;
  adminComment?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface SignInRequest {
  email: string;
  password: string;
}