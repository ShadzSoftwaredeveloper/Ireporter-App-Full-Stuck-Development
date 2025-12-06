import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { AlertCircle, Bell, FileText, LayoutDashboard, LogOut, Plus, Settings, Shield, ScrollText, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '../contexts/NotificationContext';
import { Badge } from './ui/badge';
import { getMediaUrl } from '../config/api';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from './ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = [
    { name: 'Create Incident', path: '/create', icon: Plus },
    { name: 'View Incidents', path: '/incidents', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
  ];

  if (user?.role === 'admin') {
    navigation.unshift({ name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard });
  } else {
    // Add Dashboard for regular users at the top
    navigation.unshift({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
    // Add Policy and Terms only for regular users (not admins)
    navigation.push({ name: 'Privacy Policy', path: '/policy', icon: Shield });
    navigation.push({ name: 'Terms & Conditions', path: '/terms', icon: ScrollText });
  }

  // Add Settings to navigation
  navigation.push({ name: 'Settings', path: '/settings', icon: Settings });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-gray-200 dark:border-gray-700">
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : "/"} className="flex items-center gap-2 px-2 py-3">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <span className="text-gray-900 dark:text-white">iReporter</span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path} className="p-[0px] px-[0px] py-[7px]">
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.path}>
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                          {item.badge && <Badge className="ml-2">{item.badge}</Badge>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-200 dark:border-gray-700">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-1 items-center justify-end gap-4">
            {user && (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={getMediaUrl(user.profilePicture || '')} alt={user.name} />
                  <AvatarFallback className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-900 dark:text-white text-sm hidden sm:inline">{user.name}</span>
              </Link>
            )}
            <NotificationDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};