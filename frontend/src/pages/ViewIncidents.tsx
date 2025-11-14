import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Incident, IncidentStatus, IncidentType } from '../types';
import { MapPin, Calendar, Search, Filter, LayoutGrid, List, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';

export const ViewIncidents: React.FC = () => {
  const { incidents, deleteIncident, refreshIncidents, loading, error } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<IncidentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'all'>('all');
  const [showMyIncidents, setShowMyIncidents] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

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

  const getTypeColor = (type: IncidentType) => {
    return type === 'red-flag' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch = 
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || incident.type === filterType;
      const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
      const matchesUser = !showMyIncidents || incident.user_id === user?.id;

      return matchesSearch && matchesType && matchesStatus && matchesUser;
    });
  }, [incidents, searchQuery, filterType, filterStatus, showMyIncidents, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Open delete confirmation for a specific incident
  // We set the incident id and open the dialog directly from the button handlers
  // to avoid creating inline typed event handlers that can trigger lint/TS issues.

  const confirmDelete = async () => {
    if (incidentToDelete) {
      try {
        setDeleting(true);
        await deleteIncident(incidentToDelete);
        toast.success('Draft deleted successfully');
        setDeleteDialogOpen(false);
        setIncidentToDelete(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete incident');
      } finally {
        setDeleting(false);
      }
    }
  };

  const canDeleteIncident = (incident: any) => {
    return user && incident.user_id === user.id && incident.status === 'draft';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-gray-900 mb-2">Incident Reports</h1>
            <p className="text-gray-600">
              Browse and track all reported incidents
            </p>
          </div>
          <Link to="/create">
            <Button>Create New Incident</Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900 mb-2">Incident Reports</h1>
          <p className="text-gray-600">
            Browse and track all reported incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/create">
            <Button>Create New Incident</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value as IncidentType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="red-flag">Red-flag</SelectItem>
                <SelectItem value="intervention">Intervention</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value as IncidentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under-investigation">Under Investigation</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant={showMyIncidents ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMyIncidents(!showMyIncidents)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showMyIncidents ? 'Showing My Incidents' : 'Show My Incidents'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading incidents...</p>
          </div>
        </div>
      ) : (
        <>
          {/* View Mode Tabs and Results */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
            </div>
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="relative">
                  <Link to={`/incidents/${incident.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={getTypeColor(incident.type)}>
                            {incident.type === 'red-flag' ? 'Red-flag' : 'Intervention'}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2">{incident.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {incident.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {incident.location.address || `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(incident.created_at)}</span>
                        </div>
                        {incident.media && incident.media.length > 0 && (
                          <div className="flex gap-2">
                            {incident.media.slice(0, 3).map((media, idx) => (
                              <div
                                key={idx}
                                className="w-16 h-16 bg-gray-200 rounded overflow-hidden"
                              >
                                {media.type === 'image' && (
                                  <img
                                    src={media.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ))}
                            {incident.media.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                                +{incident.media.length - 3}
                              </div>
                            )}
                            {media.type === 'video' && (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[8px] border-l-gray-900 border-y-[6px] border-y-transparent ml-1"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                  {canDeleteIncident(incident) && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => { setIncidentToDelete(incident.id); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="relative">
                  <Link to={`/incidents/${incident.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Media Preview */}
                          <div className="flex-shrink-0">
                            {incident.media && incident.media.length > 0 && incident.media[0].type === 'image' ? (
                              <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={incident.media[0].url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={getTypeColor(incident.type)}>
                                    {incident.type === 'red-flag' ? 'Red-flag' : 'Intervention'}
                                  </Badge>
                                  <Badge className={getStatusColor(incident.status)}>
                                    {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                                  {incident.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {incident.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-xs">
                                  {incident.location.address || `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(incident.created_at)}</span>
                              </div>
                              {incident.media && incident.media.length > 1 && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                  {incident.media.length} files
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {canDeleteIncident(incident) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 gap-2"
                      onClick={() => { setIncidentToDelete(incident.id); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredIncidents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No incidents found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};