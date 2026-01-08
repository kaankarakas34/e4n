import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ChapterManagement } from './pages/ChapterManagement';
import { Reports } from './pages/Reports';
import { Education } from './pages/Education';
import LMS from './pages/LMS';
import { CourseViewer } from './pages/CourseViewer';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminEvents } from './pages/AdminEvents';
import { UserEvents } from './pages/UserEvents';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMembers } from './pages/AdminMembers';
import { MemberProfile } from './pages/MemberProfile';
import { AdminSubscriptions } from './pages/AdminSubscriptions';
import { AdminGroups } from './pages/AdminGroups';
import { AdminGroupDetail } from './pages/AdminGroupDetail';
import { AdminShuffle } from './pages/AdminShuffle';
import { AdminExams } from './pages/AdminExams';
import { AdminLMS } from './pages/AdminLMS';
import { AdminCourseEditor } from './pages/AdminCourseEditor';
import { Referrals } from './pages/Referrals';
import { Activities } from './pages/Activities';
import { DocumentsPage } from './pages/DocumentsPage';
import { RevenueEntry } from './pages/RevenueEntry';
import { MembershipPage } from './pages/Membership';
import { GroupManagerDashboard } from './pages/GroupManagerDashboard';
import { MessagesPage } from './pages/MessagesPage';
import { PublicProfile } from './pages/PublicProfile';
import { PowerTeams } from './pages/PowerTeams';
import { Navigation } from './shared/Navigation';
import { PublicEventsPage } from './pages/PublicEventsPage';
import AdminReports from './pages/AdminReports';
import { AdminEmailSettings } from './pages/AdminEmailSettings';
import { MeetingTimer } from './pages/MeetingTimer';
import { VisitorApplication } from './pages/VisitorApplication';
import { AdminVisitors } from './pages/AdminVisitors';
import { EventDetail } from './pages/EventDetail';
import { CreateMember } from './pages/CreateMember';

import { MeetingRequests } from './pages/MeetingRequests';

import { PaymentLanding } from './pages/PaymentLanding';
import { SupportTickets } from './pages/SupportTickets';
import { AdminSupportTickets } from './pages/AdminSupportTickets';

// Public Routes Layout - No Sidebar
const PublicLayout = () => {
  return <Outlet />;
};

// Protected Routes Layout - With Sidebar
const ProtectedLayout = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;

  // Check for payment status
  if (user.status === 'PASSIVE' || user.status === 'PENDING') {
    return <Navigate to="/payment" state={{ reason: user.status === 'PASSIVE' ? 'expired' : 'initial' }} replace />;
  }

  return (
    <>
      <Navigation />
      <div className="flex-1">
        <Outlet />
      </div>
    </>
  );
};

function App() {
  const { user, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/ziyaretci-ol" element={<VisitorApplication />} />
              <Route
                path="/auth/login"
                element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/register"
                element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/forgot-password"
                element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="/public-events" element={<PublicEventsPage />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/payment" element={<PaymentLanding />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route
                path="/dashboard"
                element={user && user.role === 'ADMIN' ? <AdminDashboard /> : <Dashboard />}
              />
              <Route path="/group-management" element={<GroupManagerDashboard />} />
              <Route path="/chapter-management" element={<ChapterManagement />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/meetings" element={<MeetingRequests />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/revenue-entry" element={<RevenueEntry />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/education" element={<Education />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/lms" element={<LMS />} />
              <Route path="/lms/course/:id" element={<CourseViewer />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/events" element={<UserEvents />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/visitors" element={<AdminVisitors />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/members/new" element={<CreateMember />} />
              <Route path="/admin/members/:id" element={<MemberProfile />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/shuffle" element={<AdminShuffle />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/groups/:id" element={<AdminGroupDetail />} />
              <Route path="/admin/power-teams/:id" element={<AdminGroupDetail />} />
              <Route path="/admin/exams" element={<AdminExams />} />
              <Route path="/admin/lms" element={<AdminLMS />} />
              <Route path="/admin/lms/course/:id" element={<AdminCourseEditor />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/email-settings" element={<AdminEmailSettings />} />
              <Route path="/meeting-timer" element={<MeetingTimer />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/support" element={<SupportTickets />} />
              <Route path="/admin/support" element={<AdminSupportTickets />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}


export default App;

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean; message?: string }> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || 'Beklenmeyen bir hata oluştu' };
  }
  componentDidCatch(error: any, info: any) {
    console.error('Uygulama hatası:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">Bir hata oluştu</div>
            <div className="text-gray-600">{this.state.message}</div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}
