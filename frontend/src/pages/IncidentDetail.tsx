import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MediaGallery } from '../components/MediaGallery';
import { IncidentStatus } from '../types';
import { MapPin, Calendar, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncidentById, deleteIncident } = useData();
  const { user } = useAuth();
  const incident = id ? getIncidentById(id) : undefined;
  if (!incident) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Incident not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/incidents')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
    );
  }
  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'under-investigation':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getTypeColor = (type: string) => {
    return type === 'red-flag'
      ? 'bg-red-100 text-red-800'
      : 'bg-orange-100 text-orange-800';
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      deleteIncident(incident.id);
      navigate('/incidents');
    }
  };
  const isOwner = user?.id === incident.userId;
  const isAdmin = user?.role === 'admin';
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Incidents
        </Button>
        {(isOwner || isAdmin) && (
          <div className="flex gap-2">
            {isOwner && incident.status === 'draft' && (
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {(isOwner || isAdmin) && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={getTypeColor(incident.type)}>
              {incident.type === 'red-flag' ? 'Red-flag' : 'Intervention'}
            </Badge>
            <Badge className={getStatusColor(incident.status)}>
              {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>
          <CardTitle>{incident.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{incident.description}</p>
          </div>
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p>{formatDate(incident.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p>{formatDate(incident.updatedAt)}</p>
              </div>
            </div>
          </div>
          {/* Admin Comment */}
          {incident.adminComment && (
            <Alert>
              <AlertDescription>
                <p className="text-sm text-gray-500 mb-1">Admin Comment:</p>
                <p>{incident.adminComment}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Latitude</p>
                <p className="text-gray-900">{incident.location.lat.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Longitude</p>
                <p className="text-gray-900">{incident.location.lng.toFixed(6)}</p>
              </div>
            </div>
            {incident.location.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">{incident.location.address}</p>
              </div>
            )}
            {/* Map Display */}
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-100 via-green-50 to-yellow-50 rounded-lg border-2 border-gray-300 overflow-hidden">
              {/* Marker */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${((incident.location.lng + 180) / 360) * 100}%`,
                  top: `${((90 - incident.location.lat) / 180) * 100}%`,
                }}
              >
                <MapPin className="w-8 h-8 text-red-600 fill-red-500" />
              </div>
              {/* Coordinates display */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white px-4 py-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Incident Location</span>
                  <span>
                    {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Media */}
      {incident.media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Media Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaGallery media={incident.media} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};