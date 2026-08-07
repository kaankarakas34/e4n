import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ChapterManagement } from './pages/ChapterManagement';
import { Reports } from './pages/Reports';
import { Education } from './pages/Education';
import { Egitim } from './pages/Egitim';
import { EgitimBasvuru } from './pages/EgitimBasvuru';
import LMS from './pages/LMS';
import { CourseViewer } from './pages/CourseViewer';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminEvents } from './pages/AdminEvents';
import { UserEvents } from './pages/UserEvents';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCRM } from './pages/AdminCRM';
import { AdminMembers } from './pages/AdminMembers';
import { MemberProfile } from './pages/MemberProfile';
import { AdminSubscriptions } from './pages/AdminSubscriptions';
import { AdminAccounting } from './pages/AdminAccounting';
import { AdminGroups } from './pages/AdminGroups';
import { AdminGroupDetail } from './pages/AdminGroupDetail';
import { GroupDetail } from './pages/GroupDetail';
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
import { VisitorPaymentPage } from './pages/VisitorPaymentPage';
import { AdminVisitors } from './pages/AdminVisitors';
import { EventDetail } from './pages/EventDetail';
import { CreateMember } from './pages/CreateMember';

import { MeetingRequests } from './pages/MeetingRequests';


import { SupportTickets } from './pages/SupportTickets';
import { AdminSupportTickets } from './pages/AdminSupportTickets';
import { AdminProfessions } from './pages/AdminProfessions';
import { CreatePassword } from './pages/CreatePassword';
import { PendingApproval } from './pages/PendingApproval';
import { ComingSoon } from './pages/ComingSoon';
import { DistanceSellingContract } from './pages/DistanceSellingContract';
import { CancellationRefundPolicy } from './pages/CancellationRefundPolicy';
import { PreInformationForm } from './pages/PreInformationForm';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { AdminBlogs } from './pages/AdminBlogs';
import { AdminBlogEditor } from './pages/AdminBlogEditor';
import { BlogListPage } from './pages/BlogListPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { NotFound } from './pages/NotFound';
import { MainPublicLayout } from './components/MainPublicLayout';
import { E4NNedir } from './pages/E4NNedir';
import { NasilCalisir } from './pages/NasilCalisir';
import { Uyelik } from './pages/Uyelik';
import { Hakkimizda } from './pages/Hakkimizda';
import { SSS } from './pages/SSS';
import { DegerlendirmeBasvurusu } from './pages/DegerlendirmeBasvurusu';
import { Topluluklarimiz } from './pages/Topluluklarimiz';
import { ContactPage } from './pages/ContactPage';
import { KVKK } from './pages/KVKK';
import { ScrollToTopButton } from './components/ScrollToTopButton';


// Public Routes Layout - No Sidebar
const PublicLayout = () => {
  return <Outlet />;
};

// Protected Routes Layout - With Sidebar
const ProtectedLayout = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;

  // Check for payment status - DISABLED FOR NOW
  /*
  if (user.status === 'PASSIVE') {
    return <Navigate to="/payment" state={{ reason: 'expired' }} replace />;
  }
  */

  if (user.status === 'PENDING') {
    return <Navigate to="/auth/pending" replace />;
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
              <Route
                path="/auth/login"
                element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/register"
                element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/register-community"
                element={!user ? <Register isCommunity={true} /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/forgot-password"
                element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="/create-password" element={<CreatePassword />} />
              <Route path="/auth/pending" element={<PendingApproval />} />

              {/* Legacy Redirects for SEO & backward compatibility */}
              <Route path="/ziyaretci-ol" element={<Navigate to="/degerlendirme-basvurusu" replace />} />
              <Route path="/public-events" element={<Navigate to="/etkinlikler" replace />} />
              <Route path="/is-agi-rehberi" element={<Navigate to="/blog" replace />} />
              <Route path="/is-agi-rehberi/:slug" element={<Navigate to="/blog/:slug" replace />} />

              {/* Main Public Pages wrapped with Shared Header & Footer */}
              <Route element={<MainPublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/e4n-nedir" element={<E4NNedir />} />
                <Route path="/egitim" element={<Egitim />} />
                <Route path="/egitim-basvuru" element={<EgitimBasvuru />} />
                <Route path="/nasil-calisir" element={<NasilCalisir />} />
                <Route path="/uyelik" element={<Uyelik />} />
                <Route path="/etkinlikler" element={<PublicEventsPage />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/hakkimizda" element={<Hakkimizda />} />
                <Route path="/sikca-sorulan-sorular" element={<SSS />} />
                <Route path="/degerlendirme-basvurusu" element={<DegerlendirmeBasvurusu />} />
                <Route path="/topluluklarimiz" element={<Topluluklarimiz />} />
                <Route path="/ziyaretci" element={<VisitorPaymentPage />} />
                <Route path="/iletisim" element={<ContactPage />} />
                <Route path="/kvkk" element={<KVKK />} />
                <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
                <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSellingContract />} />
                <Route path="/iptal-ve-iade-kosullari" element={<CancellationRefundPolicy />} />
                <Route path="/on-bilgilendirme-formu" element={<PreInformationForm />} />
                <Route path="/kullanim-kosullari" element={<TermsOfUse />} />
                <Route path="/cerez-politikasi" element={<CookiePolicy />} />
              </Route>
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

              {/* LMS Routes - Temporarily Disabled */}
              <Route path="/lms" element={<ComingSoon />} />
              <Route path="/lms/course/:id" element={<ComingSoon />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/events" element={<UserEvents />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/visitors" element={<AdminVisitors />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/blogs" element={<AdminBlogs />} />
              <Route path="/admin/blogs/:id" element={<AdminBlogEditor />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/members/new" element={<CreateMember />} />
              <Route path="/admin/members/:id" element={<MemberProfile />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/accounting" element={<AdminAccounting />} />
              <Route path="/admin/shuffle" element={<AdminShuffle />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/groups/:id" element={<AdminGroupDetail />} />
              <Route path="/admin/power-teams/:id" element={<AdminGroupDetail />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/power-teams/:id" element={<GroupDetail />} />
              <Route path="/admin/exams" element={<AdminExams />} />
              <Route path="/admin/lms" element={<AdminLMS />} />
              <Route path="/admin/lms/course/:id" element={<AdminCourseEditor />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/email-settings" element={<AdminEmailSettings />} />
              <Route path="/meeting-timer" element={<MeetingTimer />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/support" element={<SupportTickets />} />
              <Route path="/admin/support" element={<AdminSupportTickets />} />
              <Route path="/admin/professions" element={<AdminProfessions />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTopButton />
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
