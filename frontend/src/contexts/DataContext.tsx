import React, { createContext, useContext, useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MediaFile {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Incident {
  id: string;
  type: 'red-flag' | 'intervention';
  title: string;
  description: string;
  location: Location;
  media: MediaFile[];
  status: 'draft' | 'under-investigation' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string;
  adminComment?: string;
}

interface DataContextType {
  incidents: Incident[];
  createIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  getIncidentById: (id: string) => Promise<Incident | null>;
  getUserIncidents: (userId: string) => Promise<Incident[]>;
  refreshIncidents: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const transformIncidentFromBackend = (incident: any): Incident => {
    console.log('🔄 Transforming incident from backend:', incident);
    
    return {
      id: incident.id.toString(),
      type: incident.type,
      title: incident.title,
      description: incident.description,
      location: {
        lat: parseFloat(incident.location_lat),
        lng: parseFloat(incident.location_lng),
        address: incident.location_address
      },
      media: incident.media ? incident.media.map((media: any) => ({
        id: media.id.toString(),
        type: media.type,
        url: media.url,
        thumbnail: media.thumbnail
      })) : [],
      status: incident.status,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      userId: incident.user_id.toString(),
      adminComment: incident.admin_comment
    };
  };

  const transformIncidentToBackend = (incident: any) => {
    console.log('🔄 Transforming incident for backend - Original data:', incident);
    
    const transformed = {
      type: incident.type || 'red-flag',
      title: incident.title || '',
      description: incident.description || '',
      location: {
        lat: incident.location?.lat !== undefined && incident.location.lat !== null ? incident.location.lat : 40.7128,
        lng: incident.location?.lng !== undefined && incident.location.lng !== null ? incident.location.lng : -74.0060,
        address: incident.location?.address || null
      },
      media: incident.media || [],
      status: incident.status || 'draft'
    };

    console.log('🔄 Transformed incident for backend:', transformed);
    
    Object.entries(transformed).forEach(([key, value]) => {
      if (value === undefined) {
        console.error(`❌ ERROR: ${key} is undefined in transformed data!`);
      }
    });

    return transformed;
  };

  const refreshIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch incidents: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Fetched incidents from backend:', data);
      const transformedIncidents = data.map(transformIncidentFromBackend);
      console.log('✅ Transformed incidents:', transformedIncidents);
      setIncidents(transformedIncidents);
    } catch (error) {
      console.error('❌ Error fetching incidents:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshIncidents();
  }, []);

  const createIncident = async (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting createIncident process...');
      console.log('📝 Original incident data:', incident);

      const backendIncident = transformIncidentToBackend(incident);
      
      console.log('📤 Sending to backend:', backendIncident);

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(backendIncident),
      });

      console.log('📨 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Failed to create incident: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Incident created successfully:', responseData);
      
      await refreshIncidents();
    } catch (error) {
      console.error('❌ Error in createIncident:', error);
      setError(error instanceof Error ? error.message : 'Failed to create incident');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    setError(null);
    
    try {
      const backendUpdates: any = {};
      
      if (updates.status) backendUpdates.status = updates.status;
      if (updates.adminComment !== undefined) backendUpdates.adminComment = updates.adminComment;

      console.log('🔄 Updating incident:', id, backendUpdates);

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(backendUpdates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update incident');
      }

      await refreshIncidents();
    } catch (error) {
      console.error('❌ Error updating incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to update incident');
      throw error;
    }
  };

  const deleteIncident = async (id: string) => {
    setError(null);
    
    try {
      console.log('🗑️ Deleting incident:', id);
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete incident');
      }

      await refreshIncidents();
    } catch (error) {
      console.error('❌ Error deleting incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete incident');
      throw error;
    }
  };

  const getIncidentById = async (id: string): Promise<Incident | null> => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        headers: headers,
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch incident ${id}: ${response.status}`);
        return null;
      }

      const incident = await response.json();
      console.log('✅ Fetched incident:', incident);
      return transformIncidentFromBackend(incident);
    } catch (error) {
      console.error('❌ Error fetching incident:', error);
      return null;
    }
  };

  const getUserIncidents = async (userId: string): Promise<Incident[]> => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/incidents/user/${userId}`, {
        headers: headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user incidents');
      }

      const data = await response.json();
      console.log('✅ User incidents from backend:', data);
      return data.map(transformIncidentFromBackend);
    } catch (error) {
      console.error('❌ Error fetching user incidents:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        incidents,
        createIncident,
        updateIncident,
        deleteIncident,
        getIncidentById,
        getUserIncidents,
        refreshIncidents,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};