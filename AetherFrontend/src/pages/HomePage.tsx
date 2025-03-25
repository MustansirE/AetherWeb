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

interface CommunityEvent {
  id: number;
  name: string;
  description: string;
  date: string; // Will be formatted from Date object
  time: string | null; // Time can be null
  joined?: boolean;
}

import { ThermostatControl } from '../components/ThermostatControl';

export function HomePage() {
  const [isEnvActivated, setIsEnvActivated] = useState(false); // State for virtual environment activation
  const [temperature, setTemperature] = useState(24); // State for temperature
  const [humidity, setHumidity] = useState(45); // State for humidity
  const [lightIntensity, setLightIntensity] = useState(70); // State for light intensity
  const [energyUsage, setEnergyUsage] = useState(65); // State for daily energy usage
  const [thermostatState, setThermostatState] = useState(22); // State for thermostat
  const [virtualEnvMessage, setVirtualEnvMessage] = useState<string | null>(null);
  const [goal, setGoal] = useState(0);
  const [todayUsage, setTodayUsage] = useState(0);
  const [percentageUsed, setPercentageUsed] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<{ [key: number]: boolean }>({});

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

  const [events, setEvents] = useState<CommunityEvent[]>([]);

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
          'Authorization': `Bearer ${token}`, // Add Bearer token to the request
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

  const eventIcons: { [key: string]: JSX.Element } = {
    'Lights Off!': <LightbulbOff className="h-6 w-6 text-[#EAAC82]" />,
    'Less water usage': <Droplets className="h-6 w-6 text-[#EAAC82]" />,
    'Lights Off Sunday': <LightbulbOff className="h-6 w-6 text-[#EAAC82]" />,
    'Morams Birthday': <CakeSlice className="h-6 w-6 text-[#EAAC82]" />,
    'Park Clean-Up': <RecycleIcon className="h-6 w-6 text-[#EAAC82]" />,
    'Silent Friday': <Speaker className="h-6 w-6 text-[#EAAC82]" />
  };
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Main Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Thermostat */}
        <div className="glass-card p-6 rounded-xl flex justify-center h-full">
          <ThermostatControl
            state={thermostatState} // Current thermostat state
            isHeating={thermostatState > 22} // Example logic for heating/cooling mode
            onIncrease={() => adjustThermostat('+')} // Call adjustThermostat with '+'
            onDecrease={() => adjustThermostat('-')} // Call adjustThermostat with '-'
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
            />
            <StatCard
              icon={Droplets}
              title="Humidity"
              value={`${humidity}%`}
              trend="normal"
              detail=""
            />
            <StatCard
              icon={Sun}
              title="Light Intensity"
              value={`${lightIntensity} lux`}
              trend="up"
              detail=""
            />
          </div>

          {/* Virtual Environments Box */}
          <div className="glass-card rounded-xl p-6 flex-1">
            <div className="flex items-center mb-6 space-x-2">
              <Palmtree className="h-5 w-5 text-[#EAAC82]" />
              <h2 className="text-lg font-semibold text-white">Virtual Environments</h2>
            </div>
            <div className="space-y-4">
              {virtualEnvMessage ? (
                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-400 mb-4">{virtualEnvMessage}</p>
                  {isEnvActivated ? (
                    <button
                      onClick={() => setIsEnvActivated(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-500/80 transition-colors"
                    >
                      Deactivate Environment
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEnvActivated(true)}
                      className="bg-[#EAAC82] text-white px-4 py-2 rounded-lg hover:bg-[#EAAC82]/80 transition-colors"
                    >
                      Activate Environment
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center">No virtual environment detected.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Section - Horizontal Elements */}
      <div className="flex gap-8">
        {/* Energy Goal Card */}
        <div className="glass-card rounded-xl p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-[#EAAC82]" />
              <h2 className="text-lg font-semibold text-white">Energy Goal</h2>
            </div>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
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
                className="w-full p-2 bg-[#333333] rounded-lg text-white"
                placeholder="Enter new goal"
              />
              <button
                onClick={handleUpdateGoal}
                className="w-full p-2 bg-[#90AC95] text-white rounded-lg hover:bg-[#7A9580] transition-colors"
              >
                Update Goal
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold text-white">{todayUsage.toFixed(2)} kWh</h3>
              <p className="text-sm text-gray-400">/ {goal.toFixed(2)} kWh</p>
              <div className="mt-4">
                <div className="w-full h-2 bg-[#333333] rounded-full">
                  <div
                    className="h-full bg-[#EAAC82] rounded-full"
                    style={{ width: `${percentageUsed}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">{percentageUsed.toFixed(1)}% of goal limit</p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Community Events Section */}
        <div className="glass-card rounded-xl p-6 flex-grow max-w-[80%]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#EAAC82]" />
            <span>Upcoming Community Events</span>
          </h2>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {communityEvents.map((event) => (
              <div key={event.id} className="flex-shrink-0 glass-card rounded-lg p-4 w-48">
                <div className="mb-2">{eventIcons[event.name]}</div>
                <h3 className="text-sm font-semibold text-white">{event.name}</h3>
                <p className="text-xs text-gray-400">{event.date}</p>
                <p className="text-xs text-gray-400">{event.time}</p>
                <button
                  onClick={() => toggleJoin(event.id)}
                  className={`w-full mt-2 px-3 py-1 text-white rounded-lg transition-colors ${joinedEvents[event.id] ? "bg-gray-500 hover:bg-gray-400" : "bg-[#EAAC82] hover:bg-[#D8946F]"
                    }`}
                >
                  {joinedEvents[event.id] ? "Leave" : "Join"}
                </button>
              </div>
            ))}
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
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'normal';
  detail: string;
}) {
  const colors = {
    up: 'text-[#EAAC82]',
    down: 'text-red-500',
    normal: 'text-[#8DA08E]',
  };

  return (
    <div className="glass-card rounded-xl p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-full bg-[#262626]">
          <Icon className="h-6 w-6 text-[#8DA08E]" />
        </div>
        <span className={`text-sm ${colors[trend]}`}>{detail}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

