import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Landing } from './pages/Landing';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { CreateIncident } from './pages/CreateIncident';
import { ViewIncidents } from './pages/ViewIncidents';
import { IncidentDetail } from './pages/IncidentDetail';
import { UserProfile } from './pages/UserProfile';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Policy } from './pages/Policy';
import { Terms } from './pages/Terms';
import { Toaster } from './components/ui/sonner';
import { EmailNotificationBanner } from './components/EmailNotificationBanner';
import { useNotifications } from './contexts/NotificationContext';
import { toast } from 'sonner';
import { Incident } from './types';
import { emailService } from './utils/emailService';

// Wrapper component to connect DataProvider with NotificationProvider
const AppContent = () => {
  const { addNotification } = useNotifications();
  const [emailBanner, setEmailBanner] = useState<{
    show: boolean;
    recipientCount: number;
    recipientType: 'admin' | 'user';
  }>({ show: false, recipientCount: 0, recipientType: 'user' });

  const handleStatusUpdate = (incident: Incident, oldStatus: string, newStatus: string) => {
    // Create notification for the incident owner
    const statusText = newStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const message = `Your incident "${incident.title}" status has been updated to "${statusText}"`;
    
    addNotification({
      userId: incident.userId,
      incidentId: incident.id,
      incidentTitle: incident.title,
      type: 'status-update',
      message,
      oldStatus: oldStatus as any,
      newStatus: newStatus as any,
    });

    // Send email to user
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const user = users.find((u: any) => u.id === incident.userId);
      if (user) {
        emailService.sendStatusUpdateEmail(user, incident, oldStatus as any, newStatus as any);
        
        // Show email banner
        setEmailBanner({ show: true, recipientCount: 1, recipientType: 'user' });
      }
    }

    // Show toast for email simulation
    toast.success(`📧 Email notification sent to user about status update`);
  };

  const handleIncidentCreate = (incident: Incident) => {
    // Get all admin users and incident creator from localStorage
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const admins = users.filter((user: any) => user.role === 'admin');
      const creator = users.find((u: any) => u.id === incident.userId);
      
      // Create notification for each admin
      admins.forEach((admin: any) => {
        const incidentType = incident.type === 'red-flag' ? 'Red-flag' : 'Intervention';
        const message = `New ${incidentType.toLowerCase()} incident reported: "${incident.title}"`;
        
        addNotification({
          userId: admin.id,
          incidentId: incident.id,
          incidentTitle: incident.title,
          type: 'new-incident',
          message,
          newStatus: incident.status as any,
        });

        // Send email to each admin
        if (creator) {
          emailService.sendIncidentCreatedEmail(admin, incident, creator);
        }
      });

      // Show email banner and toast
      if (admins.length > 0) {
        setEmailBanner({ show: true, recipientCount: admins.length, recipientType: 'admin' });
        toast.success(`📧 Email notifications sent to ${admins.length} admin${admins.length > 1 ? 's' : ''}`);
      }
    }
  };

  return (
    <>
      <EmailNotificationBanner
        show={emailBanner.show}
        recipientCount={emailBanner.recipientCount}
        recipientType={emailBanner.recipientType}
        onClose={() => setEmailBanner({ show: false, recipientCount: 0, recipientType: 'user' })}
      />
      <DataProvider onStatusUpdate={handleStatusUpdate} onIncidentCreate={handleIncidentCreate}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateIncident />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateIncident />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <Layout>
                  <ViewIncidents />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <IncidentDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/policy"
            element={
              <ProtectedRoute>
                <Layout>
                  <Policy />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/terms"
            element={
              <ProtectedRoute>
                <Layout>
                  <Terms />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </DataProvider>
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
