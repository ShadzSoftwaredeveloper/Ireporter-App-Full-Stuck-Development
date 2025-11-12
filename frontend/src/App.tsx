import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Landing } from './pages/Landing';
import { Welcome } from './pages/Welcome';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { CreateIncident } from './pages/CreateIncident';
import { ViewIncidents } from './pages/ViewIncidents';
import { IncidentDetail } from './pages/IncidentDetail';
import { UserProfile } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route 
                path="/signin" 
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes with automatic role-based redirect */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RoleBasedRedirect />
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
              
              {/* Catch all - redirect based on role */}
              <Route path="*" element={<NavigateToAppropriateRoute />} />
            </Routes>
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

// Component to redirect users based on their role
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/incidents" replace />;
  }
};

// Component for catch-all route that considers authentication and role
const NavigateToAppropriateRoute: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/incidents" replace />;
  }
};

// You'll need to import useAuth
import { useAuth } from './contexts/AuthContext';

export default App;