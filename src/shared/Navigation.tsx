import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Logo } from './Logo';
import { Button } from './Button';
import {
  Home,
  Users,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
  Briefcase,
  FileText,
  Bell,
  MessageCircle,
  Zap,
  Ticket,
  UserPlus,
  Clock,
  Mail,
  CreditCard,
  Settings,
  MessageSquare,
  BarChart2
} from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { useEffect } from 'react';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Raporlar', href: '/reports', icon: BarChart3 },
    { name: 'Grup Yönetimi', href: '/admin/groups', icon: Users },
    { name: 'Destek', href: '/admin/support', icon: MessageSquare },
  ];

  const baseMemberNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Destek', href: '/support', icon: MessageSquare },
  ];

  const commonNavigation = [
    { name: 'Yönlendirmeler', href: '/referrals', icon: TrendingUp },
    { name: 'Etkinlikler', href: '/events', icon: Ticket },
    { name: 'Aktiviteler', href: '/activities', icon: Zap },
    { name: 'LMS', href: '/lms', icon: BookOpen },
  ];

  let navigation = [];

  const isPresident = user?.role === 'PRESIDENT' || user?.role === 'VICE_PRESIDENT';
  const isAdmin = user?.role === 'ADMIN';

  // Separate links for clarity
  const groupsLink = { name: 'Gruplar', href: '/chapter-management', icon: Users };
  const managementLink = { name: 'Grup Yönetimi', href: '/group-management', icon: Briefcase };

  if (isAdmin) {
    navigation = adminNavigation;
  } else {
    // Start with base (Dashboard)
    navigation = [...baseMemberNavigation];

    // Add Management link for Presidents/VPs
    if (isPresident) {
      navigation.push(managementLink);
    }

    // Add Groups link for everyone
    navigation.push(groupsLink);

    // Add remaining common items
    navigation.push(...commonNavigation);
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                <Logo variant="icon" />
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${isActive(item.href)
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                      transition-colors duration-200
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User dropdown & Notifications */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* Messages */}
            <Link to="/messages" className="text-gray-400 hover:text-gray-500 relative">
              <MessageCircle className="h-6 w-6" />
            </Link>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative ml-2">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.profession}</p>
                </div>

                <Link
                  to="/profile"
                  className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-base font-medium
                    ${isActive(item.href)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 border-l-4'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                    transition-colors duration-200
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.profession}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/membership"
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/membership') ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <CreditCard className={`mr-3 h-5 w-5 ${isActive('/membership') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  Üyelik & Ödemeler
                </Link>
                <Link
                  to="/support"
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/support') ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <MessageSquare className={`mr-3 h-5 w-5 ${isActive('/support') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  Destek
                </Link>
                <Link
                  to="/admin/reports"
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/admin/reports') ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <BarChart2 className={`mr-3 h-5 w-5 ${isActive('/admin/reports') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  Raporlar
                </Link>
                <Link
                  to="/admin/support"
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/admin/support') ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <MessageSquare className={`mr-3 h-5 w-5 ${isActive('/admin/support') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  Destek Talepleri
                </Link>
                <Link
                  to="/admin/email-settings"
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/admin/email-settings') ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Settings className={`mr-3 h-5 w-5 ${isActive('/admin/email-settings') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  E-posta Ayarları
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NotificationBell() {
  const { unreadCount, notifications, fetchNotifications, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user, fetchNotifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-500 relative p-1"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Bildirimler</span>
            {unreadCount > 0 && <span className="text-xs text-red-500">{unreadCount} yeni</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">Bildiriminiz yok.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${!n.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    markAsRead(n.id);
                    setIsOpen(false);
                    if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPTED') {
                      navigate(`/profile/${n.type === 'FRIEND_REQUEST' ? n.content.split(' ')[0] : ''}`); // Basic navigation, ideally link to profile
                    } else if (n.type === 'MESSAGE') {
                      navigate('/messages');
                    }
                  }}
                >
                  <p className="text-sm text-gray-900">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
