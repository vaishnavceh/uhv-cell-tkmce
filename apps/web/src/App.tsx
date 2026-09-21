import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { RoleName } from '@uhv/shared-types';

// Layouts & Routing Guards
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Web Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Objectives } from './pages/public/Objectives';
import { Activities } from './pages/public/Activities';
import { Events } from './pages/public/Events';
import { EventDetail } from './pages/public/EventDetail';
import { Workshops } from './pages/public/Workshops';
import { Team } from './pages/public/Team';
import { Resources } from './pages/public/Resources';
import { Gallery } from './pages/public/Gallery';
import { Announcements } from './pages/public/Announcements';
import { AnnouncementDetail } from './pages/public/AnnouncementDetail';
import { Contact } from './pages/public/Contact';
import { NotFound } from './pages/public/NotFound';

// Admin CMS Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { ObjectivesManager } from './pages/admin/ObjectivesManager';
import { ActivitiesManager } from './pages/admin/ActivitiesManager';
import { EventsManager } from './pages/admin/EventsManager';
import { WorkshopsManager } from './pages/admin/WorkshopsManager';
import { TeamManager } from './pages/admin/TeamManager';
import { ResourcesManager } from './pages/admin/ResourcesManager';
import { GalleryManager } from './pages/admin/GalleryManager';
import { AnnouncementsManager } from './pages/admin/AnnouncementsManager';
import { MessagesInbox } from './pages/admin/MessagesInbox';
import { UsersManager } from './pages/admin/UsersManager';
import { RolesViewer } from './pages/admin/RolesViewer';
import { AuditLogsViewer } from './pages/admin/AuditLogsViewer';
import { SettingsManager } from './pages/admin/SettingsManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Institutional Portal */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/objectives" element={<Objectives />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/workshops" element={<Workshops />} />
                <Route path="/team" element={<Team />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin Portal Authentication */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Administrative CMS */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="objectives" element={<ObjectivesManager />} />
                <Route path="activities" element={<ActivitiesManager />} />
                <Route path="events" element={<EventsManager />} />
                <Route path="workshops" element={<WorkshopsManager />} />
                <Route path="team" element={<TeamManager />} />
                <Route path="resources" element={<ResourcesManager />} />
                <Route path="gallery" element={<GalleryManager />} />
                <Route path="announcements" element={<AnnouncementsManager />} />
                <Route path="messages" element={<MessagesInbox />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={[RoleName.SUPER_ADMIN]}>
                      <UsersManager />
                    </ProtectedRoute>
                  }
                />
                <Route path="roles" element={<RolesViewer />} />
                <Route path="audit-logs" element={<AuditLogsViewer />} />
                <Route path="settings" element={<SettingsManager />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
