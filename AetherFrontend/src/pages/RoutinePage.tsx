import React, { ReactNode, useEffect, useState } from 'react';
import { Plus, Save, X, Edit2, Trash2, Clock, Minus, Power, Search, Pause, Square } from 'lucide-react';

// Define the Device interface
interface Device {
  id: string;
  name: string;
  type: 'FixedOption' | 'VariableOption' | 'Toggle';
  options?: string[];
  state: string | number;
  general_product_code: string;
  isOn: boolean; // Track if the device is on/off
}

// Define the Room interface
interface Room {
  id: string;
  name: string;
}

// Define the Routine interface
interface Routine {
  id: string;
  name: string;
  devices: {
    [x: string]: ReactNode; id: string; state: string | number; isOn: boolean
  }[]; // Track device states and on/off status
  startTime: string;
  endTime: string;
  isActive: boolean;
  isPaused?: boolean; // Add isPaused property to track paused state
}

export function RoutinePage() {
  // State for managing routines
  const [routines, setRoutines] = useState<Routine[]>([]);

  // State for managing rooms
  const [rooms, setRooms] = useState<Room[]>([]);

  // State for managing the form visibility
  const [showAddRoutine, setShowAddRoutine] = useState(false);

  // State for managing the selected room
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // State for managing devices in the selected room
  const [roomDevices, setRoomDevices] = useState<Device[]>([]);

  // State for managing the routine name
  const [routineName, setRoutineName] = useState('');

  // State for managing the start and end times
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // State for managing the editing routine
  const [editingRoutine, setEditingRoutine] = useState<string | null>(null);

  // State for managing selected devices
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);

  // State for managing the current time
  const [currentTime, setCurrentTime] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoutines, setFilteredRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRoutines(routines);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = routines.filter(routine => 
        routine.name.toLowerCase().includes(lowercaseQuery) ||
        routine.devices.some(device => 
          device.hasOwnProperty('deviceName') && 
          typeof device.deviceName === 'string' && 
          device.deviceName.toLowerCase().includes(lowercaseQuery)
        )
      );
      setFilteredRoutines(filtered);
    }
  }, [routines, searchQuery]);

  // Fetch automations and rooms on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      try {
        // Fetch automations
        const automationsRes = await fetch('http://127.0.0.1:8000/automations_list/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const automationsData = await automationsRes.json();
        setRoutines(
          automationsData.automations.map((a: any) => ({
            id: a.id,
            name: a.name,
            devices: a.devices,  // Ensure devices are correctly mapped
            startTime: a.startTime,  // Ensure startTime is correctly mapped
            endTime: a.endTime,  // Ensure endTime is correctly mapped
            isActive: a.isActive,
            isPaused: a.isPaused || false, // Set default value for isPaused
          }))
        );
        const roomsRes = await fetch('http://127.0.0.1:8000/rooms_list/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roomsData = await roomsRes.json();
        console.log("Fetched Rooms Data:", roomsData);  // Add this line to log the response
        setRooms(roomsData.rooms);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Update current time every minute
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }, 60000);

    // Set initial time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}`);

    return () => clearInterval(interval);
  }, []);

  // Fetch devices when a room is selected
  useEffect(() => {
    if (!selectedRoomId) return;

    const fetchDevices = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8000/room_alldevices/${selectedRoomId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const devices = await res.json();
        setRoomDevices(
          devices.map((d: any) => ({
            id: d.deviceId, // Map deviceId to id
            name: d.deviceName, // Map deviceName to name
            type: d.type,
            options: d.options || [],
            state: d.state,
            general_product_code: d.general_product_code,
            isOn: false, // Default value for isOn
          }))
        );
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchDevices();
  }, [selectedRoomId]);

  // Handle device selection
  const handleDeviceSelect = (deviceId: string) => {
    const device = roomDevices.find((d) => d.id === deviceId);
    if (device) {
      setSelectedDevices((prev) => [...prev, { ...device, isOn: false }]);
    }
  };

  // Handle device state changes
  const handleDeviceChange = (deviceId: string, value: string | number) => {
    setSelectedDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, state: value } : device
      )
    );
  };

  // Toggle device on/off
  const toggleDevicePower = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, isOn: !device.isOn } : device
      )
    );
  };

  // Remove a device from the list
  const removeDevice = (deviceId: string) => {
    setSelectedDevices((prev) => prev.filter((device) => device.id !== deviceId));
  };

  // Handle add/edit routine
  const handleAddRoutine = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !routineName || !startTime || !endTime || !selectedDevices.length) return;

    const routineData = {
      name: routineName,
      devices: selectedDevices.map((d) => ({
        device_id: d.id,
        state: d.state,
        status: d.isOn,
      })),
      start_time: startTime,
      end_time: endTime,
      status: true,
    };

    try {
      if (editingRoutine) {
        // Update existing routine
        await fetch(`http://127.0.0.1:8000/update_automation/${editingRoutine}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(routineData),
        });
      } else {
        // Create new routine
        await fetch('http://127.0.0.1:8000/add_automation/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(routineData),
        });
      }

      // Refresh the list of routines
      const res = await fetch('http://127.0.0.1:8000/automations_list/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoutines(data.automations);
      resetForm();
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  // Reset the form
  const resetForm = () => {
    setShowAddRoutine(false);
    setRoutineName('');
    setSelectedRoomId('');
    setStartTime('');
    setEndTime('');
    setSelectedDevices([]);
    setEditingRoutine(null);
  };

  const handleEditRoutine = (routine: Routine) => {
    // Set the editing state
    setEditingRoutine(routine.id);

    // Populate the form with routine data
    setRoutineName(routine.name);
    setStartTime(routine.startTime);
    setEndTime(routine.endTime);

    // Pre-select the room (if available)
    if (routine.devices.length > 0) {
      const firstDevice = routine.devices[0];
      const roomId = firstDevice.roomId; // Assuming roomId is available in the device object
      setSelectedRoomId(roomId);
    }

    // Pre-select the devices
    const selectedDevices = routine.devices.map((device) => ({
      id: device.deviceId,
      name: device.deviceName,
      type: device.type,
      options: device.options || [],
      state: device.state,
      general_product_code: device.general_product_code,
      isOn: device.status,
    }));
    setSelectedDevices(selectedDevices);

    // Show the add/edit form
    setShowAddRoutine(true);
  };

  // Delete a routine
  const handleDeleteRoutine = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`http://127.0.0.1:8000/delete_automation/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  // Toggle routine activation
  const toggleRoutineActivation = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`http://127.0.0.1:8000/toggle_automation/${id}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isActive: !r.isActive } : r
        )
      );
    } catch (error) {
      console.error('Error toggling routine:', error);
    }
  };

  // Pause a routine
  const handlePauseRoutine = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // You'll need to implement this endpoint on your backend
      await fetch(`http://127.0.0.1:8000/pause_automation/${id}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state immediately for better UX
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isPaused: true } : r
        )
      );
    } catch (error) {
      console.error('Error pausing routine:', error);
    }
  };

  // Resume a paused routine
  const handleResumeRoutine = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // You'll need to implement this endpoint on your backend
      await fetch(`http://127.0.0.1:8000/resume_automation/${id}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state immediately for better UX
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isPaused: false } : r
        )
      );
    } catch (error) {
      console.error('Error resuming routine:', error);
    }
  };

  // Stop a routine (end it immediately even if within time range)
  const handleStopRoutine = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // You'll need to implement this endpoint on your backend
      await fetch(`http://127.0.0.1:8000/stop_automation/${id}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isActive: false, isPaused: false } : r
        )
      );
    } catch (error) {
      console.error('Error stopping routine:', error);
    }
  };

  // Helper function to check if the current time is within the automation's time slot
  const isAutomationActive = (startTime: string, endTime: string): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert current time to minutes

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotal = startHour * 60 + startMinute; // Convert start time to minutes
    const endTotal = endHour * 60 + endMinute; // Convert end time to minutes

    return currentTime >= startTotal && currentTime <= endTotal;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Add Routine Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Routines</h1>
        <button
          onClick={() => setShowAddRoutine(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
          style={{ backgroundColor: 'var(--secondary-accent)', color: 'var(--text-on-accent)' }}
        >
          <Plus className="w-5 h-5" />
          Add Routine
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
          style={{ 
            backgroundColor: 'var(--input-bg)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)' 
          }}
          placeholder="Search routines or devices..."
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

            {/* Add/Edit Routine Form */}
            {showAddRoutine && (
        <div className="glass-card p-6 rounded-xl animate-slide-up" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editingRoutine ? 'Edit Routine' : 'Create New Routine'}
            </h2>
            <button 
              onClick={resetForm} 
              className="hover:text-gray-300"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Routine Name Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Routine Name</label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Enter routine name"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border-color)' 
                }}
              />
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Select Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <option value="">Choose a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Selection */}
            {selectedRoomId && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Select Device</label>
                <select
                  value=""
                  onChange={(e) => handleDeviceSelect(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    color: 'var(--text-primary)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <option value="">Choose a device</option>
                  {roomDevices
                    .filter((device) => !selectedDevices.some((selected) => selected.id === device.id)) // Exclude selected devices
                    .map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Selected Devices List */}
            {selectedDevices.length > 0 && (
              <div className="space-y-4">
                {selectedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{device.name}</span>

                    {/* Toggle Power Button */}
                    <button
                      onClick={() => toggleDevicePower(device.id)}
                      className="px-4 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: device.isOn ? 'var(--success-color)' : 'var(--danger-text)', 
                        color: 'white' 
                      }}
                    >
                      {device.isOn ? 'Turn Off' : 'Turn On'}
                    </button>

                    {/* State Controls (Only shown if device is ON and not a Toggle device) */}
                    {device.isOn && device.type !== 'Toggle' && (
                      <>
                        {/* Dropdown for FixedOption devices */}
                        {device.type === 'FixedOption' && device.options && (
                          <select
                            value={device.state as string}
                            onChange={(e) => handleDeviceChange(device.id, e.target.value)}
                            className="border px-3 py-1 rounded-lg"
                            style={{ 
                              backgroundColor: 'var(--input-bg)', 
                              color: 'var(--text-primary)', 
                              borderColor: 'var(--border-color)' 
                            }}
                          >
                            {device.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* + and - buttons for VariableOption devices */}
                        {device.type === 'VariableOption' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleDeviceChange(
                                  device.id,
                                  Math.max(16, Number(device.state) - 1)
                                )}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                              <Minus style={{ color: 'var(--text-primary)' }} />
                            </button>
                            <span style={{ color: 'var(--text-primary)' }}>{device.state}</span>
                            <button
                              onClick={() =>
                                handleDeviceChange(
                                  device.id,
                                  Math.min(32, Number(device.state) + 1)
                                )}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                              <Plus style={{ color: 'var(--text-primary)' }} />
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Remove Device Button */}
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--danger-text)' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Time Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    color: 'var(--text-primary)', 
                    borderColor: 'var(--border-color)' 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    color: 'var(--text-primary)', 
                    borderColor: 'var(--border-color)' 
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoutine}
                disabled={!routineName.trim() || !selectedRoomId || !startTime || !endTime}
                className="px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                <Save className="w-5 h-5" />
                {editingRoutine ? 'Update Routine' : 'Save Routine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routines List */}
      <div className="grid gap-4">
        {filteredRoutines.map((routine) => {
          // Check if routine is currently active based on time
          const isActive = isAutomationActive(routine.startTime, routine.endTime);
          
          return (
            <div key={routine.id} className="glass-card p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{routine.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {routine.startTime} - {routine.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status badge */}
                  <span
                    className="px-3 py-1 rounded-lg"
                    style={{ 
                      backgroundColor: isActive && !routine.isPaused
                        ? 'var(--success-color)' 
                        : routine.isPaused 
                          ? 'var(--warning-color)' 
                          : 'var(--bg-tertiary)',
                      color: (isActive && !routine.isPaused) || routine.isPaused
                        ? 'white'
                        : 'var(--text-muted)'
                    }}
                  >
                    {routine.isPaused 
                      ? 'Paused'
                      : isActive
                        ? 'Active'
                        : 'Inactive'}
                  </span>
                  
                  {/* Pause/Resume and Stop buttons only shown when routine is active */}
                  {isActive && (
                    <>
                      {/* Pause/Resume button */}
                      <button
                        onClick={() => routine.isPaused 
                          ? handleResumeRoutine(routine.id) 
                          : handlePauseRoutine(routine.id)
                        }
                        className="p-2 rounded-lg flex items-center gap-1"
                        style={{ 
                          backgroundColor: routine.isPaused 
                            ? 'var(--success-color)' 
                            : 'var(--warning-color)',
                          color: 'white'
                        }}
                        title={routine.isPaused ? "Resume Routine" : "Pause Routine"}
                      >
                        {routine.isPaused ? 'Resume' : <Pause className="w-5 h-5" />}
                      </button>
                      
                      {/* Stop button */}
                      <button
                        onClick={() => handleStopRoutine(routine.id)}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' }}
                        title="Stop Routine"
                      >
                        <Square className="w-5 h-5" fill="var(--danger-text)" />
                      </button>
                    </>
                  )}
                  
                  {/* Edit button */}
                  <button
                    onClick={() => handleEditRoutine(routine)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <Edit2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--danger-bg)' }}
                  >
                    <Trash2 className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {routine.devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>
                      {device.deviceName} ({device.roomName})
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {device.status ? "Activated" : "Deactivated"}
                      {device.status && device.type !== "Toggle" && device.state !== "none" && ` (${device.state})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRoutines.length === 0 && !showAddRoutine && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          {searchQuery ? 
            'No routines match your search criteria.' : 
            'No routines created yet. Click "Add Routine" to get started.'}
        </div>
      )}
    </div>
  );
}