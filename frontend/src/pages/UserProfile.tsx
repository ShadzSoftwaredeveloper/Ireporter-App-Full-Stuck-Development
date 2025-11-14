import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { User, Mail, Calendar, FileText, CheckCircle, Clock, XCircle, Edit, Upload, Camera, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { getUserIncidents } = useData();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfilePicture, setEditProfilePicture] = useState('');
  const [profilePictureSrc, setProfilePictureSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [userIncidents, setUserIncidents] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserIncidents = async () => {
      if (user) {
        try {
          console.log('📥 Fetching user incidents for:', user.id);
          const incidents = await getUserIncidents(user.id);
          console.log('✅ User incidents:', incidents);
          setUserIncidents(incidents);
        } catch (error) {
          console.error('❌ Error fetching user incidents:', error);
          toast.error('Failed to load incidents');
        } finally {
          setIncidentsLoading(false);
        }
      }
    };

    fetchUserIncidents();
  }, [user, getUserIncidents]);

  const stats = useMemo(() => {
    const resolved = userIncidents.filter(i => i.status === 'resolved').length;
    const unresolved = userIncidents.filter(i => 
      i.status === 'draft' || i.status === 'under-investigation'
    ).length;
    const rejected = userIncidents.filter(i => i.status === 'rejected').length;
    const total = userIncidents.length;

    return { resolved, unresolved, rejected, total };
  }, [userIncidents]);

  const recentIncidents = useMemo(() => {
    return [...userIncidents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [userIncidents]);

  const handleEditClick = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditProfilePicture((user as any).profile_picture || '');
      setError('');
      setIsEditDialogOpen(true);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64Image = reader.result as string;
        
        // If base64 is too large, try to compress
        if (base64Image.length > 1000000) { // 1MB in characters
          toast.error('Image too large. Please choose a smaller image.');
          setUploadingImage(false);
          return;
        }

        try {
          await updateProfile(user.name, user.email, base64Image);
          toast.success('Profile picture updated successfully!');
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to update profile picture';
          toast.error(errorMsg);
          console.error('Profile update error:', err);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to upload image');
      setUploadingImage(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Check base64 size
        if (base64.length > 1000000) {
          setError('Image too large after conversion. Please choose a smaller image.');
          return;
        }
        setEditProfilePicture(base64);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProfile(editName, editEmail, editProfilePicture);
      toast.success('Profile updated successfully!');
      setIsEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Please sign in to view your profile</AlertDescription>
      </Alert>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">User Profile</h1>
        <p className="text-gray-600">Manage your account and view your incident reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingImage}
                    className="relative block focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full"
                  >
                    <Avatar className="w-16 h-16" key={profilePictureSrc}>
                      <AvatarImage src={profilePictureSrc || (user as any).profile_picture} alt={user.name} />
                      <AvatarFallback className="bg-red-100 text-red-600">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-1">Click to change</p>
                </div>
                <div>
                  <p className="text-gray-900">{user.name}</p>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-gray-900">{formatDate((user as any).created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Total Reports</p>
                    <p className="text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2 mt-4" onClick={handleEditClick}>
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-gray-900 mb-4">Report Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 mb-1">Resolved</p>
                      <p className="text-2xl font-bold text-green-900">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 mb-1">Unresolved</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.unresolved}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Draft or Under Investigation</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 mb-1">Rejected</p>
                      <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Recent Reports</h2>
              <Link to="/incidents">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {incidentsLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p>Loading incidents...</p>
                  </div>
                ) : recentIncidents.length > 0 ? (
                  <div className="divide-y">
                    {recentIncidents.map((incident) => (
                      <Link
                        key={incident.id}
                        to={`/incidents/${incident.id}`}
                        className="block p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={
                                  incident.type === 'red-flag'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-orange-100 text-orange-800'
                                }
                              >
                                {incident.type === 'red-flag' ? 'Red-flag' : 'Intervention'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  incident.status === 'resolved'
                                    ? 'border-green-300 text-green-700'
                                    : incident.status === 'rejected'
                                    ? 'border-red-300 text-red-700'
                                    : 'border-blue-300 text-blue-700'
                                }
                              >
                                {incident.status.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </Badge>
                            </div>
                            <p className="text-gray-900 truncate">{incident.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(incident.created_at)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No incidents reported yet</p>
                    <Link to="/create">
                      <Button className="mt-4">Create Your First Report</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="profilePicture" className="text-right">
                Profile Picture
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={editProfilePicture} alt={editName} />
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {getInitials(editName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => document.getElementById('profilePicture')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </div>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 mt-4">{error}</p>
            )}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
