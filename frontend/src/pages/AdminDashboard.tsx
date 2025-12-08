import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { IncidentStatus, Incident, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, CheckCircle, Clock, XCircle, AlertTriangle, Trash2, Users as UsersIcon, Bell, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const { user, deleteUser, getAllUsers } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const { incidents, updateIncident, deleteIncident } = useData();
  const { notifications, markAsRead, addNotification } = useNotifications();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('under-investigation');
  const [adminComment, setAdminComment] = useState('');
  const [deleteIncidentDialogOpen, setDeleteIncidentDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  if (!user || user.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setUsersLoading(true);
      try {
        const users = await getAllUsers();
        if (mounted) setAllUsers(users);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [getAllUsers]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const underInvestigation = incidents.filter(i => i.status === 'under-investigation').length;
    const rejected = incidents.filter(i => i.status === 'rejected').length;
    const draft = incidents.filter(i => i.status === 'draft').length;
    const redFlags = incidents.filter(i => i.type === 'red-flag').length;
    const interventions = incidents.filter(i => i.type === 'intervention').length;

    return {
      total,
      resolved,
      underInvestigation,
      rejected,
      draft,
      redFlags,
      interventions,
    };
  }, [incidents]);

  const chartData = [
    { name: 'Red-flags', value: stats.redFlags },
    { name: 'Interventions', value: stats.interventions },
  ];

  const statusData = [
    { name: 'Resolved', count: stats.resolved },
    { name: 'Under Investigation', count: stats.underInvestigation },
    { name: 'Rejected', count: stats.rejected },
    { name: 'Draft', count: stats.draft },
  ];

  const COLORS = ['#ef4444', '#f97316'];
  const STATUS_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#6b7280'];

  const pendingIncidents = useMemo(() => {
    return incidents
      .filter(i => i.status === 'under-investigation' || i.status === 'draft')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [incidents]);

  const handleUpdateStatus = async () => {
    if (selectedIncident) {
      try {
        await updateIncident(selectedIncident.id, {
          status: newStatus,
          adminComment: adminComment.trim() || undefined,
        });
        toast.success('Incident status updated successfully');
        setSelectedIncident(null);
        setAdminComment('');
      } catch (error) {
        toast.error('Failed to update incident status');
      }
    }
  };

  const openIncidentDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setNewStatus(incident.status);
    setAdminComment(incident.adminComment || '');
  };

  const handleDeleteIncident = async () => {
    if (incidentToDelete) {
      try {
        await deleteIncident(incidentToDelete.id);
        setDeleteIncidentDialogOpen(false);
        setIncidentToDelete(null);
        toast.success('Incident deleted successfully');
        addNotification({
          title: 'Incident Deleted',
          message: `Incident \"${incidentToDelete.title}\" deleted successfully`,
          type: 'success',
        });
      } catch (error) {
        toast.error('Failed to delete incident');
      }
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        setDeleteUserDialogOpen(false);
        setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
        toast.success(`User "${userToDelete.name}" deleted successfully`);
        addNotification({
          title: 'User Deleted',
          message: `User "${userToDelete.name}" deleted successfully`,
          type: 'success',
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete user');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage all incident reports and users</p>
      </div>

      {/* Tabs for Different Sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                    <p className="text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1">Resolved</p>
                    <p className="text-green-900">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Under Investigation</p>
                    <p className="text-blue-900">{stats.underInvestigation}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 mb-1">Rejected</p>
                    <p className="text-red-900">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incidents by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications Widget */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  <CardTitle>Recent Notifications</CardTitle>
                </div>
                <Link to="/notifications">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.filter(n => n.userId === user?.id).length > 0 ? (
                <div className="space-y-3">
                  {notifications
                    .filter(n => n.userId === user?.id)
                    .slice(0, 5)
                    .map((notification) => (
                      <Link
                        key={notification.id}
                        to={`/incidents/${notification.incidentId}`}
                        className="block"
                      >
                        <div
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                            notification.read
                              ? 'bg-white border-gray-200'
                              : 'bg-blue-50 border-blue-300'
                          }`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={notification.type === 'new-incident' ? 'default' : 'outline'}
                                  className={
                                    notification.type === 'new-incident'
                                      ? 'bg-red-600'
                                      : ''
                                  }
                                >
                                  {notification.type === 'new-incident' ? '🆕 New Incident' : '📊 Status Update'}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No recent notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Incidents</CardTitle>
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pendingIncidents.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
                              incident.status === 'draft'
                                ? 'border-gray-300 text-gray-700'
                                : incident.status === 'under-investigation'
                                ? 'border-blue-300 text-blue-700'
                                : incident.status === 'resolved'
                                ? 'border-green-300 text-green-700'
                                : 'border-red-300 text-red-700'
                            }
                          >
                            {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                        </div>
                        <Link to={`/incidents/${incident.id}`}>
                          <p className="text-gray-900 hover:text-red-600 transition-colors">
                            {incident.title}
                          </p>
                        </Link>
                        <p className="text-sm text-gray-500">
                          {formatDate(incident.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openIncidentDialog(incident)}
                          className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIncidentToDelete(incident);
                            setDeleteIncidentDialogOpen(true);
                          }}
                          className="hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No incidents found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : allUsers.length > 0 ? (
                <div className="space-y-3">
                  {allUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UsersIcon className="w-4 h-4 text-gray-500" />
                          <p className="text-gray-900">{u.name}</p>
                          <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {formatDate(u.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserToDelete(u);
                          setDeleteUserDialogOpen(true);
                        }}
                        className="hover:bg-red-50 hover:border-red-300 transition-colors"
                        disabled={u.id === user.id}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Incident Status</DialogTitle>
            <DialogDescription>
              Change the status and add admin comments for this incident
            </DialogDescription>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Incident</p>
                <p className="text-gray-900">{selectedIncident.title}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-900">New Status</p>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as IncidentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under-investigation">Under Investigation</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-900">Admin Comment</p>
                <Textarea
                  placeholder="Add a comment explaining the status change..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIncident(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} className="hover:bg-primary/90 transition-colors">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Incident Dialog */}
      <Dialog open={deleteIncidentDialogOpen} onOpenChange={setDeleteIncidentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {incidentToDelete && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Incident:</p>
              <p className="text-gray-900">{incidentToDelete.title}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIncidentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteIncident} variant="destructive" className="hover:bg-destructive/90 transition-colors">
              Delete Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">User:</p>
              <p className="text-gray-900">{userToDelete.name}</p>
              <p className="text-sm text-gray-500">{userToDelete.email}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} variant="destructive" className="hover:bg-destructive/90 transition-colors">
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};