import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  DoorOpen,
  LineChart,
  Palette,
  Clock,
  Share2,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { CustomLogo } from '../components/CustomLogo';
import axios from 'axios';
import { useTheme } from '../pages/ThemeContext';

const navigation = [
  { name: 'Home', icon: Home, to: '/dashboard' },
  { name: 'Rooms & Devices', icon: DoorOpen, to: '/dashboard/rooms-devices' },
  { name: 'Energy Stats', icon: LineChart, to: '/dashboard/energy-stats' },
  { name: 'Ambiance Mode', icon: Palette, to: '/dashboard/ambiance' },
  { name: 'Routines', icon: Clock, to: '/dashboard/routines' },
  { name: 'Device Sharing', icon: Share2, to: '/dashboard/device-sharing' },
  { name: 'My Guests', icon: Users, to: '/dashboard/my-guests' },
  { name: 'Settings', icon: Settings, to: '/dashboard/settings' },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userName, setUserName] = useState('');
  const [notifications, setNotifications] = useState([]); // Store notifications
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false); // Modal state
  const { theme } = useTheme();

// DashboardLayout.tsx
useEffect(() => {
  const fetchUserName = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        navigate('/');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/me/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Add axios interceptor for token refresh
  const interceptor = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
              refresh: refreshToken,
            });
            localStorage.setItem('access_token', data.access);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
            return axios(originalRequest);
          } catch (err) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/');
          }
        }
      }
      return Promise.reject(error);
    }
  );

  fetchUserName();

  // Cleanup interceptor
  return () => {
    axios.interceptors.response.eject(interceptor);
  };
}, [navigate]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/get_notifications/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 5)); 
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Handle notifications button click
  const handleNotificationsClick = () => {
    setIsNotificationsModalOpen(!isNotificationsModalOpen);
    if (!isNotificationsModalOpen) {
      fetchNotifications(); // Fetch notifications when the modal is opened
    }
  };

// DashboardLayout.tsx
const handleLogout = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No token found, please log in');
      return;
    }

    const response = await fetch('http://127.0.0.1:8000/logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');  
      navigate('/');
    } else {
      console.error('Logout failed:', response.status);
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

return (
  <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
    {/* Sidebar - Desktop */}
    <div className={cn(
      "hidden md:flex backdrop-blur-lg transition-all duration-300",
      isMinimized ? "w-20" : "w-64"
    )} style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="h-full w-full flex flex-col">
        <div className={cn(
          "flex items-center h-16 px-4",
          isMinimized ? "justify-center" : "justify-between"
        )}>
          {!isMinimized && <CustomLogo size="small" />}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', hover: 'var(--text-primary)' }}
          >
            {isMinimized ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-[#90AC95] text-white shadow-lg"
                    : ""
                )}
                style={isActive ? {} : { 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'transparent',
                  ':hover': { backgroundColor: 'var(--bg-tertiary)' }
                }}
                title={isMinimized ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5", isMinimized ? "mx-auto" : "mr-3")} />
                {!isMinimized && item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors",
              isMinimized && "justify-center"
            )}
            style={{ color: 'var(--danger-text)' }}
            title={isMinimized ? "Logout" : undefined}
          >
            <LogOut className={cn("h-5 w-5", isMinimized ? "mx-auto" : "mr-3")} />
            {!isMinimized && "Logout"}
          </button>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        borderBottomColor: 'var(--border-color)' 
      }} className="backdrop-blur-lg border-b">
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Hi, <span style={{ color: 'var(--secondary-accent)' }}>  { userName } </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNotificationsClick}
              className="relative p-2 transition-colors rounded-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="rounded-lg shadow-lg w-96 max-w-full">
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{notification.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications found.</p>
              )}
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setIsNotificationsModalOpen(false)}
                className="w-full text-sm font-medium transition-colors"
                style={{ color: 'var(--secondary-accent)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <CustomLogo size="small" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive =
                    item.to === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-[#90AC95] text-white shadow-lg'
                          : ''
                      )}
                      style={isActive ? {} : { color: 'var(--text-primary)' }}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: 'var(--danger-text)' }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
}