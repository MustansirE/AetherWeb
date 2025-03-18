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

  // Fetch user data
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
          setUserName(data.name); // Assuming the response has a `name` field
        } else {
          console.error('Failed to fetch user data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserName();
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

  // Handle logout
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
        navigate('/');
      } else {
        console.error('Logout failed:', response.status);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "hidden md:flex bg-[#262626]/80 backdrop-blur-lg transition-all duration-300",
        isMinimized ? "w-20" : "w-64"
      )}>
        <div className="h-full w-full flex flex-col">
          <div className={cn(
            "flex items-center h-16 px-4",
            isMinimized ? "justify-center" : "justify-between"
          )}>
            {!isMinimized && <CustomLogo size="small" />}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
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
                      : "text-gray-400 hover:bg-[#333333] hover:text-white"
                  )}
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
                "flex items-center px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors",
                isMinimized && "justify-center"
              )}
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
        <header className="bg-[#262626]/80 backdrop-blur-lg border-b border-gray-700/50">
          <div className="h-16 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">
                  Hi, <span className="text-[#90AC95]">  { userName } </span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleNotificationsClick}
                className="relative p-2 text-gray-400 hover:text-[#D9A279] transition-colors rounded-lg"
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
            <div className="bg-[#262626] rounded-lg shadow-lg w-96 max-w-full">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div key={index} className="p-3 bg-[#333333] rounded-lg">
                      <p className="text-sm text-gray-300">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No notifications found.</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => setIsNotificationsModalOpen(false)}
                  className="w-full text-sm font-medium text-[#90AC95] hover:text-[#7A9580] transition-colors"
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
            <div className="absolute inset-y-0 left-0 w-64 bg-[#262626] shadow-lg">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                  <CustomLogo size="small" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
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
                            : 'text-gray-400 hover:bg-[#333333] hover:text-white'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
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
        <main className="flex-1 overflow-auto bg-[#1A1A1A] p-6">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}