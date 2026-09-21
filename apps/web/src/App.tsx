import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { RoleName } from '@uhv/shared-types';
import { Loader2 } from 'lucide-react';

// Layouts & Routing Guards (keep eager for core skeleton)
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Lazy loaded Public Web Pages
const Home = lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const About = lazy(() => import('./pages/public/About').then(m => ({ default: m.About })));
const Objectives = lazy(() => import('./pages/public/Objectives').then(m => ({ default: m.Objectives })));
const Activities = lazy(() => import('./pages/public/Activities').then(m => ({ default: m.Activities })));
const Events = lazy(() => import('./pages/public/Events').then(m => ({ default: m.Events })));
const EventDetail = lazy(() => import('./pages/public/EventDetail').then(m => ({ default: m.EventDetail })));
const RegistrationNotOpened = lazy(() => import('./pages/public/RegistrationNotOpened').then(m => ({ default: m.RegistrationNotOpened })));
const Workshops = lazy(() => import('./pages/public/Workshops').then(m => ({ default: m.Workshops })));
const Team = lazy(() => import('./pages/public/Team').then(m => ({ default: m.Team })));
const Resources = lazy(() => import('./pages/public/Resources').then(m => ({ default: m.Resources })));
const Gallery = lazy(() => import('./pages/public/Gallery').then(m => ({ default: m.Gallery })));
const Announcements = lazy(() => import('./pages/public/Announcements').then(m => ({ default: m.Announcements })));
const AnnouncementDetail = lazy(() => import('./pages/public/AnnouncementDetail').then(m => ({ default: m.AnnouncementDetail })));
const Contact = lazy(() => import('./pages/public/Contact').then(m => ({ default: m.Contact })));
const NotFound = lazy(() => import('./pages/public/NotFound').then(m => ({ default: m.NotFound })));

// Lazy loaded Admin CMS Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const ObjectivesManager = lazy(() => import('./pages/admin/ObjectivesManager').then(m => ({ default: m.ObjectivesManager })));
const ActivitiesManager = lazy(() => import('./pages/admin/ActivitiesManager').then(m => ({ default: m.ActivitiesManager })));
const EventsManager = lazy(() => import('./pages/admin/EventsManager').then(m => ({ default: m.EventsManager })));
const WorkshopsManager = lazy(() => import('./pages/admin/WorkshopsManager').then(m => ({ default: m.WorkshopsManager })));
const TeamManager = lazy(() => import('./pages/admin/TeamManager').then(m => ({ default: m.TeamManager })));
const ResourcesManager = lazy(() => import('./pages/admin/ResourcesManager').then(m => ({ default: m.ResourcesManager })));
const GalleryManager = lazy(() => import('./pages/admin/GalleryManager').then(m => ({ default: m.GalleryManager })));
const AnnouncementsManager = lazy(() => import('./pages/admin/AnnouncementsManager').then(m => ({ default: m.AnnouncementsManager })));
const MessagesInbox = lazy(() => import('./pages/admin/MessagesInbox').then(m => ({ default: m.MessagesInbox })));
const UsersManager = lazy(() => import('./pages/admin/UsersManager').then(m => ({ default: m.UsersManager })));
const RolesViewer = lazy(() => import('./pages/admin/RolesViewer').then(m => ({ default: m.RolesViewer })));
const AuditLogsViewer = lazy(() => import('./pages/admin/AuditLogsViewer').then(m => ({ default: m.AuditLogsViewer })));
const SettingsManager = lazy(() => import('./pages/admin/SettingsManager').then(m => ({ default: m.SettingsManager })));
const DatabaseManager = lazy(() => import('./pages/admin/DatabaseManager').then(m => ({ default: m.DatabaseManager })));
const TicketScanner = lazy(() => import('./pages/admin/TicketScanner').then(m => ({ default: m.TicketScanner })));

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

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Institutional Portal */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/objectives" element={<Objectives />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:slug" element={<EventDetail />} />
                  <Route path="/events/:slug/not-opened" element={<RegistrationNotOpened />} />
                  <Route path="/events/id/:id" element={<EventDetail />} />
                  <Route path="/workshops" element={<Navigate to="/events" replace />} />
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
                  <Route path="scanner" element={<TicketScanner />} />
                  <Route path="workshops" element={<Navigate to="/admin/events" replace />} />
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
                  <Route
                    path="database"
                    element={
                      <ProtectedRoute allowedRoles={[RoleName.SUPER_ADMIN]}>
                        <DatabaseManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="roles" element={<RolesViewer />} />

                  <Route path="audit-logs" element={<AuditLogsViewer />} />
                  <Route path="settings" element={<SettingsManager />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
