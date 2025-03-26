import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Sun,
  PartyPopper,
  Users,
  Clock as ClockIcon,
  Calendar,
  BatteryFull,
  Palmtree,
  LineChart, Zap, Edit,
  LightbulbOff,
  CakeSlice,
  HeartIcon,
  Speaker,
  Brush,
  RecycleIcon
} from 'lucide-react';
import { ThermostatControl } from '../components/ThermostatControl';

interface CommunityEvent {
  id: number;
  name: string;
  description: string;
  date: string; // Will be formatted from Date object
  time: string | null; // Time can be null
  joined?: boolean;
}

export function HomePage() {
  // Environment & Home State
  const [isEnvActivated, setIsEnvActivated] = useState(false);
  const [temperature, setTemperature] = useState(24);
  const [humidity, setHumidity] = useState(45);
  const [lightIntensity, setLightIntensity] = useState(70);
  const [energyUsage, setEnergyUsage] = useState(65);
  const [thermostatState, setThermostatState] = useState(22);
  const [virtualEnvMessage, setVirtualEnvMessage] = useState<string | null>(null);
  
  // Energy Goal State
  const [goal, setGoal] = useState(0);
  const [todayUsage, setTodayUsage] = useState(0);
  const [percentageUsed, setPercentageUsed] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  
  // Community Events State
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<{ [key: number]: boolean }>({});
  const [isLightMode, setIsLightMode] = useState(false);

  // Check if light mode is active
  useEffect(() => {
    const checkTheme = () => {
      const theme = localStorage.getItem('theme') || 'dark';
      setIsLightMode(theme === 'light');
    };

    // Initial check
    checkTheme();

    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        checkTheme();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('themeChanged', checkTheme);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('themeChanged', checkTheme);
    };
  }, []);

  // Fetch initial data when the page loads
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');

        const response = await fetch('http://127.0.0.1:8000/home/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();

        setTemperature(data.temperature);
        setHumidity(data.humidity);
        setLightIntensity(data.light_intensity);
        setEnergyUsage(data.energy_usage);
        setThermostatState(data.thermostat_state);
        setIsEnvActivated(data.virtual_environment);

        if (data.virtual_environment) {
          setVirtualEnvMessage(data.virtual_environment_message);
        } else {
          setVirtualEnvMessage(null);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch community events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');

        const response = await fetch('http://localhost:8000/event_list/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch events');

        const data: CommunityEvent[] = await response.json();
        const formattedEvents = data.map(event => ({
          ...event,
          date: new Date(event.date).toLocaleDateString(),
          time: event.time ? event.time.substring(0, 5) : null
        }));

        setCommunityEvents(formattedEvents);

        // Initialize joined status
        const initialJoinedStatus: { [key: number]: boolean } = {};
        formattedEvents.forEach(event => {
          initialJoinedStatus[event.id] = event.joined || false;
        });
        setJoinedEvents(initialJoinedStatus);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Fetch energy goal and today's usage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No token found, please log in');
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/get_energy_goal_and_usage/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGoal(data.goal);
          setTodayUsage(data.today_usage);
          setPercentageUsed(data.percentage_used);
        } else {
          console.error('Failed to fetch energy data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };

    fetchData();
  }, []);

  // Toggle event joining status
  const toggleJoin = async (eventId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`http://localhost:8000/toggle_event_join/${eventId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setJoinedEvents(prev => ({
          ...prev,
          [eventId]: !prev[eventId]
        }));
      }
    } catch (err) {
      console.error('Join toggle failed:', err);
    }
  };

  // Event icons mapping
  const eventIcons: { [key: string]: JSX.Element } = {
    'Lights Off!': <LightbulbOff className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />,
    'Less water usage': <Droplets className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />,
    'Lights Off Sunday': <LightbulbOff className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />,
    'Morams Birthday': <CakeSlice className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />,
    'Park Clean-Up': <RecycleIcon className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />,
    'Silent Friday': <Speaker className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />
  };

  // Handle goal update
  const handleUpdateGoal = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/update_energy_goal/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ goal: parseFloat(newGoal) }),
      });

      if (response.ok) {
        const data = await response.json();
        setGoal(data.goal);
        setIsEditingGoal(false);
        setNewGoal('');
      } else {
        console.error('Failed to update energy goal:', response.status);
      }
    } catch (error) {
      console.error('Error updating energy goal:', error);
    }
  };

  // Toggle virtual environment activation
  const toggleVirtualEnvironment = async (activate: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No token found');

      const response = await fetch('http://127.0.0.1:8000/toggle_virtual_environment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ activate }),
      });

      if (!response.ok) throw new Error('Failed to toggle virtual environment');

      const data = await response.json();
      setIsEnvActivated(data.active);
      setVirtualEnvMessage(data.message || null);
    } catch (error) {
      console.error('Error toggling virtual environment:', error);
    }
  };

  // Function to adjust the thermostat
  const adjustThermostat = async (change: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('http://127.0.0.1:8000/adjust_thermostat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ change }),
      });

      if (!response.ok) {
        throw new Error('Failed to adjust thermostat');
      }

      const data = await response.json();
      setThermostatState(data.new_state); // Update thermostat state in the UI
    } catch (error) {
      console.error('Error adjusting thermostat:', error);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in p-4">
      {/* Main Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Thermostat */}
        <div className="glass-card p-6 rounded-xl flex justify-center h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <ThermostatControl
            state={thermostatState}
            isHeating={thermostatState > 22}
            onIncrease={() => adjustThermostat('+')}
            onDecrease={() => adjustThermostat('-')}
            isLightMode={isLightMode}
          />
        </div>

        {/* Right Column - Stats and Virtual Environments */}
        <div className="flex flex-col gap-6 h-full">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={Thermometer}
              title="Temperature"
              value={`${temperature}°C`}
              trend="up"
              detail=""
              isLightMode={isLightMode}
            />
            <StatCard
              icon={Droplets}
              title="Humidity"
              value={`${humidity}%`}
              trend="normal"
              detail=""
              isLightMode={isLightMode}
            />
            <StatCard
              icon={Sun}
              title="Light Intensity"
              value={`${lightIntensity} lux`}
              trend="up"
              detail=""
              isLightMode={isLightMode}
            />
          </div>

          {/* Virtual Environments Box */}
          <div className="glass-card rounded-xl p-6 flex-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center mb-6 space-x-2">
              <Palmtree 
                className="h-5 w-5" 
                style={{ color: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)' }} 
              />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Virtual Environments</h2>
            </div>
            <div className="space-y-4">
              {virtualEnvMessage ? (
                <div className="flex flex-col items-center text-center">
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{virtualEnvMessage}</p>
                  {isEnvActivated ? (
                    <button
                      onClick={() => toggleVirtualEnvironment(false)}
                      className="px-4 py-2 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-primary)' 
                      }}
                    >
                      Deactivate Environment
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleVirtualEnvironment(true)}
                      className="px-4 py-2 rounded-lg transition-colors hover-pulse"
                      style={{ 
                        backgroundColor: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)', 
                        color: 'var(--text-on-accent)' 
                      }}
                    >
                      Activate Environment
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No virtual environment detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Horizontal Elements */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Energy Goal Card */}
        <div className="glass-card rounded-xl p-7 md:w-1/3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap 
                className="h-6 w-6" 
                style={{ color: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)' }} 
              />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Energy Goal</h2>
            </div>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>

          {isEditingGoal ? (
            <div className="space-y-4">
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="w-full p-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
                placeholder="Enter new goal"
              />
              <button
                onClick={handleUpdateGoal}
                className="w-full p-2 rounded-lg transition-colors hover-pulse"
                style={{ 
                  backgroundColor: isLightMode ? 'var(--accent-color-light)' : 'var(--accent-color)', 
                  color: 'var(--text-on-accent)' 
                }}
              >
                Update Goal
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{todayUsage.toFixed(2)} kWh</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {goal.toFixed(2)} kWh</p>
              <div className="mt-4">
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${percentageUsed}%`,
                      backgroundColor: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)'
                    }}
                  />
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{percentageUsed.toFixed(1)}% of goal limit</p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Community Events Section */}
        <div className="glass-card rounded-xl p-6 flex-grow" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar 
              className="h-5 w-5" 
              style={{ color: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)' }} 
            />
            <span>Upcoming Community Events</span>
          </h2>
          
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {communityEvents.length > 0 ? (
              communityEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex-shrink-0 glass-card rounded-lg p-4 w-52"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="mb-2">
                    {eventIcons[event.name] || <PartyPopper className="h-6 w-6" style={{ color: isLightMode ? '#D9924E' : '#EAAC82' }} />}
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{event.name}</h3>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{event.date}</p>
                  {event.time && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.time}</p>
                  )}
                  <button
                    onClick={() => toggleJoin(event.id)}
                    className={`w-full mt-3 px-3 py-1.5 rounded-lg text-sm transition-colors`}
                    style={{ 
                      backgroundColor: joinedEvents[event.id] 
                        ? 'var(--bg-tertiary)' 
                        : isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)',
                      color: joinedEvents[event.id] 
                        ? 'var(--text-primary)' 
                        : 'var(--text-on-accent)',
                      border: joinedEvents[event.id] ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    {joinedEvents[event.id] ? "Leave" : "Join"}
                  </button>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No upcoming events at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  detail,
  isLightMode
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'normal';
  detail: string;
  isLightMode: boolean;
}) {
  // Define theme-based color variables for trends
  const trendColors = {
    up: isLightMode ? 'var(--secondary-accent-light)' : 'var(--secondary-accent)',
    down: 'var(--danger-text)',
    normal: isLightMode ? 'var(--accent-color-light)' : 'var(--accent-color)',
  };

  return (
    <div className="glass-card rounded-xl p-6 h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <Icon className="h-6 w-6" style={{ color: isLightMode ? 'var(--accent-color-light)' : 'var(--accent-color)' }} />
        </div>
        <span className="text-sm" style={{ color: trendColors[trend] }}>{detail}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</p>
    </div>
  );
}