const MembershipHistory = React.lazy(() => import('./pages/MembershipHistory').then(m => ({ default: m.MembershipHistory })));
const MembershipRecords = React.lazy(() => import('./pages/MembershipRecords').then(m => ({ default: m.MembershipRecords })));
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LandingPage } from './pages/LandingPage';
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ChapterManagement = React.lazy(() => import('./pages/ChapterManagement').then(m => ({ default: m.ChapterManagement })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Education = React.lazy(() => import('./pages/Education').then(m => ({ default: m.Education })));
const LMS = React.lazy(() => import('./pages/LMS'));
const CourseViewer = React.lazy(() => import('./pages/CourseViewer').then(m => ({ default: m.CourseViewer })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const AdminEvents = React.lazy(() => import('./pages/AdminEvents').then(m => ({ default: m.AdminEvents })));
const UserEvents = React.lazy(() => import('./pages/UserEvents').then(m => ({ default: m.UserEvents })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminCRM = React.lazy(() => import('./pages/AdminCRM').then(m => ({ default: m.AdminCRM })));
const AdminMembers = React.lazy(() => import('./pages/AdminMembers').then(m => ({ default: m.AdminMembers })));
const MemberProfile = React.lazy(() => import('./pages/MemberProfile').then(m => ({ default: m.MemberProfile })));
const AdminSubscriptions = React.lazy(() => import('./pages/AdminSubscriptions').then(m => ({ default: m.AdminSubscriptions })));
const AdminAccounting = React.lazy(() => import('./pages/AdminAccounting').then(m => ({ default: m.AdminAccounting })));
const AdminGroups = React.lazy(() => import('./pages/AdminGroups').then(m => ({ default: m.AdminGroups })));
const AdminGroupDetail = React.lazy(() => import('./pages/AdminGroupDetail').then(m => ({ default: m.AdminGroupDetail })));
const GroupDetail = React.lazy(() => import('./pages/GroupDetail').then(m => ({ default: m.GroupDetail })));
const GroupMeetingDetailPage = React.lazy(() => import('./pages/GroupMeetingDetailPage').then(m => ({ default: m.GroupMeetingDetailPage })));
const AdminShuffleHistory = React.lazy(() => import('./pages/AdminShuffleHistory').then(m => ({ default: m.AdminShuffleHistory })));
const AdminShuffle = React.lazy(() => import('./pages/AdminShuffle').then(m => ({ default: m.AdminShuffle })));
const AdminWebJobs = React.lazy(() => import('./pages/AdminWebJobs').then(m => ({ default: m.AdminWebJobs })));
const AdminExams = React.lazy(() => import('./pages/AdminExams').then(m => ({ default: m.AdminExams })));
const AdminLMS = React.lazy(() => import('./pages/AdminLMS').then(m => ({ default: m.AdminLMS })));
const AdminCourseEditor = React.lazy(() => import('./pages/AdminCourseEditor').then(m => ({ default: m.AdminCourseEditor })));
const Referrals = React.lazy(() => import('./pages/Referrals').then(m => ({ default: m.Referrals })));
const Activities = React.lazy(() => import('./pages/Activities').then(m => ({ default: m.Activities })));
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const RevenueEntry = React.lazy(() => import('./pages/RevenueEntry').then(m => ({ default: m.RevenueEntry })));
const MembershipPage = React.lazy(() => import('./pages/Membership').then(m => ({ default: m.MembershipPage })));
const GroupManagerDashboard = React.lazy(() => import('./pages/GroupManagerDashboard').then(m => ({ default: m.GroupManagerDashboard })));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const PublicProfile = React.lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const Navigation = React.lazy(() => import('./shared/Navigation').then(m => ({ default: m.Navigation })));
const PublicEventsPage = React.lazy(() => import('./pages/PublicEventsPage').then(m => ({ default: m.PublicEventsPage })));
const AdminReports = React.lazy(() => import('./pages/AdminReports'));
const AdminEmailSettings = React.lazy(() => import('./pages/AdminEmailSettings').then(m => ({ default: m.AdminEmailSettings })));
const MeetingTimer = React.lazy(() => import('./pages/MeetingTimer').then(m => ({ default: m.MeetingTimer })));
const VisitorPaymentPage = React.lazy(() => import('./pages/VisitorPaymentPage').then(m => ({ default: m.VisitorPaymentPage })));
const AdminVisitors = React.lazy(() => import('./pages/AdminVisitors').then(m => ({ default: m.AdminVisitors })));
const EventDetail = React.lazy(() => import('./pages/EventDetail').then(m => ({ default: m.EventDetail })));
const CreateMember = React.lazy(() => import('./pages/CreateMember').then(m => ({ default: m.CreateMember })));

const MeetingRequests = React.lazy(() => import('./pages/MeetingRequests').then(m => ({ default: m.MeetingRequests })));


const SupportTickets = React.lazy(() => import('./pages/SupportTickets').then(m => ({ default: m.SupportTickets })));
const AdminSupportTickets = React.lazy(() => import('./pages/AdminSupportTickets').then(m => ({ default: m.AdminSupportTickets })));
const AdminProfessions = React.lazy(() => import('./pages/AdminProfessions').then(m => ({ default: m.AdminProfessions })));
const CreatePassword = React.lazy(() => import('./pages/CreatePassword').then(m => ({ default: m.CreatePassword })));
const PendingApproval = React.lazy(() => import('./pages/PendingApproval').then(m => ({ default: m.PendingApproval })));
const DistanceSellingContract = React.lazy(() => import('./pages/DistanceSellingContract').then(m => ({ default: m.DistanceSellingContract })));
const CancellationRefundPolicy = React.lazy(() => import('./pages/CancellationRefundPolicy').then(m => ({ default: m.CancellationRefundPolicy })));
const PreInformationForm = React.lazy(() => import('./pages/PreInformationForm').then(m => ({ default: m.PreInformationForm })));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const CookiePolicy = React.lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const TermsOfUse = React.lazy(() => import('./pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const AdminBlogs = React.lazy(() => import('./pages/AdminBlogs').then(m => ({ default: m.AdminBlogs })));
const AdminBlogEditor = React.lazy(() => import('./pages/AdminBlogEditor').then(m => ({ default: m.AdminBlogEditor })));
const BlogListPage = React.lazy(() => import('./pages/BlogListPage').then(m => ({ default: m.BlogListPage })));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
import { NotFound } from './pages/NotFound';
import { MainPublicLayout } from './components/MainPublicLayout';
const E4NNedir = React.lazy(() => import('./pages/E4NNedir').then(m => ({ default: m.E4NNedir })));
const NasilCalisir = React.lazy(() => import('./pages/NasilCalisir').then(m => ({ default: m.NasilCalisir })));
const Uyelik = React.lazy(() => import('./pages/Uyelik').then(m => ({ default: m.Uyelik })));
const Hakkimizda = React.lazy(() => import('./pages/Hakkimizda').then(m => ({ default: m.Hakkimizda })));
const SSS = React.lazy(() => import('./pages/SSS').then(m => ({ default: m.SSS })));
const DegerlendirmeBasvurusu = React.lazy(() => import('./pages/DegerlendirmeBasvurusu').then(m => ({ default: m.DegerlendirmeBasvurusu })));
const Topluluklarimiz = React.lazy(() => import('./pages/Topluluklarimiz').then(m => ({ default: m.Topluluklarimiz })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const KVKK = React.lazy(() => import('./pages/KVKK').then(m => ({ default: m.KVKK })));
const KapaliGruplar = React.lazy(() => import('./pages/KapaliGruplar').then(m => ({ default: m.KapaliGruplar })));
const ShufflePage = React.lazy(() => import('./pages/ShufflePage').then(m => ({ default: m.ShufflePage })));
const KatilimIlkeleri = React.lazy(() => import('./pages/KatilimIlkeleri').then(m => ({ default: m.KatilimIlkeleri })));
const BirebirNetworking = React.lazy(() => import('./pages/BirebirNetworking').then(m => ({ default: m.BirebirNetworking })));
const BusinessNetworkingPage = React.lazy(() => import('./pages/BusinessNetworkingPage').then(m => ({ default: m.BusinessNetworkingPage })));
const IsCevresiNasilGenisletilirPage = React.lazy(() => import('./pages/IsCevresiNasilGenisletilirPage').then(m => ({ default: m.IsCevresiNasilGenisletilirPage })));
const ProfesyonelIsAgiNasilKurulurPage = React.lazy(() => import('./pages/ProfesyonelIsAgiNasilKurulurPage').then(m => ({ default: m.ProfesyonelIsAgiNasilKurulurPage })));
const NetworkingKartvizitFarkiPage = React.lazy(() => import('./pages/NetworkingKartvizitFarkiPage').then(m => ({ default: m.NetworkingKartvizitFarkiPage })));
const NetworkingSatisFarkiPage = React.lazy(() => import('./pages/NetworkingSatisFarkiPage').then(m => ({ default: m.NetworkingSatisFarkiPage })));
const CityNetworkingPage = React.lazy(() => import('./pages/CityNetworkingPage').then(m => ({ default: m.CityNetworkingPage })));
const MemberHandbook = React.lazy(() => import('./pages/MemberHandbook').then(m => ({ default: m.MemberHandbook })));
const MembershipActivationPage = React.lazy(() => import('./pages/MembershipActivationPage').then(m => ({ default: m.MembershipActivationPage })));
const BusinessDnaPage = React.lazy(() => import('./pages/BusinessDnaPage').then(m => ({ default: m.BusinessDnaPage })));
import { RouteMetadata } from './seo/RouteMetadata';
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
      <RouteMetadata />
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <React.Suspense fallback={<div role="status" className="p-8 text-center">Sayfa yükleniyor…</div>}>
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
                element={!user ? <Navigate to={'/auth/register'+window.location.search} replace /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/auth/forgot-password"
                element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />}
              />
              <Route path="/create-password" element={<CreatePassword />} />
              <Route path="/auth/pending" element={<PendingApproval />} />

              {/* Legacy & Alias Redirects for SEO & backward compatibility - 404 koruması */}
              <Route path="/login" element={<Navigate to="/auth/login" replace />} />
              <Route path="/register" element={<Navigate to="/auth/register" replace />} />
              <Route path="/signin" element={<Navigate to="/auth/login" replace />} />
              <Route path="/signup" element={<Navigate to="/auth/register" replace />} />
              <Route path="/auth/sign-in" element={<Navigate to="/auth/login" replace />} />
              <Route path="/auth/sign-up" element={<Navigate to="/auth/register" replace />} />

              <Route path="/ziyaretci-ol" element={<Navigate to="/ziyaretci-basvurusu" replace />} />
              <Route path="/basvuru" element={<Navigate to="/ziyaretci-basvurusu" replace />} />
              <Route path="/degerlendirme" element={<Navigate to="/ziyaretci-basvurusu" replace />} />

              <Route path="/public-events" element={<Navigate to="/etkinlikler" replace />} />
              <Route path="/etkinlik" element={<Navigate to="/etkinlikler" replace />} />
              <Route path="/networking-etkinlikleri" element={<Navigate to="/etkinlikler" replace />} />
              <Route path="/networking-etkinlikleri/istanbul" element={<Navigate to="/networking/istanbul" replace />} />
              <Route path="/networking-etkinlikleri/ankara" element={<Navigate to="/networking/ankara" replace />} />
              <Route path="/networking-etkinlikleri/izmir" element={<Navigate to="/networking/izmir" replace />} />

              <Route path="/networking" element={<Navigate to="/topluluklarimiz" replace />} />
              <Route path="/topluluklar" element={<Navigate to="/topluluklarimiz" replace />} />
              <Route path="/loncalar" element={<Navigate to="/topluluklarimiz" replace />} />
              <Route path="/loncalar/girisimcilik" element={<Navigate to="/topluluklarimiz" replace />} />
              <Route path="/gruplar" element={<Navigate to="/kapali-gruplar" replace />} />

              <Route path="/business-networking" element={<Navigate to="/e4n-nedir" replace />} />
              <Route path="/is-insanlari-kulubu" element={<Navigate to="/e4n-nedir" replace />} />
              <Route path="/b2b-is-gelistirme" element={<Navigate to="/kapali-gruplar" replace />} />
              <Route path="/nitelikli-is-yonlendirmesi" element={<Navigate to="/birebir-networking" replace />} />
              <Route path="/e4n-nasil-calisir" element={<Navigate to="/nasil-calisir" replace />} />

              <Route path="/is-agi-rehberi" element={<Navigate to="/blog" replace />} />
              <Route path="/is-agi-rehberi/:slug" element={<LegacyBlogRedirect />} />

              <Route path="/sss" element={<Navigate to="/sikca-sorulan-sorular" replace />} />
              <Route path="/faq" element={<Navigate to="/sikca-sorulan-sorular" replace />} />
              <Route path="/biz-kimiz" element={<Navigate to="/hakkimizda" replace />} />
              <Route path="/about" element={<Navigate to="/hakkimizda" replace />} />
              <Route path="/contact" element={<Navigate to="/iletisim" replace />} />
              <Route path="/kurallar" element={<Navigate to="/rehber" replace />} />
              <Route path="/katilim" element={<Navigate to="/katilim-ilkeleri" replace />} />
              <Route path="/payment" element={<Navigate to="/ziyaretci" replace />} />
              <Route path="/membership/activate" element={<MembershipActivationPage />} />
              <Route path="/sozlesmeler" element={<MembershipActivationPage />} />
              <Route path="/sozlesme" element={<Navigate to="/sozlesmeler" replace />} />
              <Route path="/aktivasyon" element={<Navigate to="/membership/activate" replace />} />
              <Route path="/checkout/review" element={<MembershipActivationPage defaultTab="pre" />} />

              {/* Main Public Pages wrapped with Shared Header & Footer */}
              <Route element={<MainPublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/rehber" element={<MemberHandbook />} />
                <Route path="/calisma-rehberi" element={<Navigate to="/rehber" replace />} />
                <Route path="/e4n-nedir" element={<E4NNedir />} />
                <Route path="/egitim" element={<Navigate to="/uyelik" replace />} />
                <Route path="/egitim-basvuru" element={<Navigate to="/uyelik" replace />} />
                <Route path="/nasil-calisir" element={<NasilCalisir />} />
                <Route path="/kapali-gruplar" element={<KapaliGruplar />} />
                <Route path="/shuffle" element={<ShufflePage />} />
                <Route path="/katilim-ilkeleri" element={<KatilimIlkeleri />} />
                <Route path="/birebir-networking" element={<BirebirNetworking />} />
                <Route path="/business-networking" element={<BusinessNetworkingPage />} />
                <Route path="/is-cevresi-nasil-genisletilir" element={<IsCevresiNasilGenisletilirPage />} />
                <Route path="/profesyonel-is-agi-nasil-kurulur" element={<ProfesyonelIsAgiNasilKurulurPage />} />
                <Route path="/networking-neden-kartvizit-toplamak-degildir" element={<NetworkingKartvizitFarkiPage />} />
                <Route path="/networking-ile-satis-arasindaki-fark" element={<NetworkingSatisFarkiPage />} />
                <Route path="/uyelik" element={<Uyelik />} />
                <Route path="/etkinlikler" element={<PublicEventsPage />} />
                <Route path="/networking/:city" element={<CityNetworkingPage />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/hakkimizda" element={<Hakkimizda />} />
                <Route path="/sikca-sorulan-sorular" element={<SSS />} />
                <Route path="/degerlendirme-basvurusu" element={<LegacyMembershipEntry />} />
                <Route path="/ziyaretci-basvurusu" element={<DegerlendirmeBasvurusu />} />
                <Route path="/topluluklarimiz" element={<Topluluklarimiz />} />
                <Route path="/power-teams" element={<Navigate to="/topluluklarimiz" replace />} />
                <Route path="/power-teams/:id" element={<Navigate to="/topluluklarimiz" replace />} />
                <Route path="/admin/power-teams/:id" element={<Navigate to="/topluluklarimiz" replace />} />
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

              {/* LMS Routes */}
              <Route path="/lms" element={<LMS />} />
              <Route path="/lms/course/:id" element={<CourseViewer />} />

              {/* Member Business Profile (İş DNA'sı) */}
              <Route path="/is-dna" element={<BusinessDnaPage />} />
              <Route path="/is-profili" element={<BusinessDnaPage />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/membership-history" element={<MembershipHistory />} />
              <Route path="/admin/membership-history/:id" element={<MembershipHistory admin />} />
              <Route path="/membership-records" element={<MembershipRecords />} />
              <Route path="/admin/membership-records" element={<MembershipRecords admin />} />
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
              <Route path="/admin/shuffle-history" element={<AdminShuffleHistory />} />
              <Route path="/admin/web-jobs" element={<AdminWebJobs />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/groups/:id" element={<AdminGroupDetail />} />
              <Route path="/admin/groups/:id/meetings" element={<GroupMeetingDetailPage />} />

              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/groups/:id/meetings" element={<GroupMeetingDetailPage />} />

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
          </React.Suspense>
          <ScrollToTopButton />
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}


export default App;

class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean; message?: string }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu' };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
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
    return this.props.children;
  }
}

function LegacyMembershipEntry() {
  const { search } = useLocation();
  // Keep existing visitor referral links; they are separate from normal membership.
  const target = new URLSearchParams(search).has('refId') ? '/ziyaretci-basvurusu' : '/auth/register';
  return <Navigate to={target + search} replace />;
}

function LegacyBlogRedirect() {
  const { slug } = useParams();
  const { search } = useLocation();
  return <Navigate to={'/blog/' + encodeURIComponent(slug || '') + search} replace />;
}
