import React, { useState, useEffect } from 'react';
import { Plus, X, Minus, ChevronDown, Trash2, Edit2, Power, Search } from 'lucide-react';

interface Device {
  deviceId: string;
  deviceName: string;
  type: 'FixedOption' | 'VariableOption';
  options?: string[]; // Available options for FixedOptionDevice
  state: string | number;
  general_product_code: string; // Ensure this is included
}

interface Room {
  id: string;
  name: string;
}

interface AmbianceMode {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
  isActive: boolean;
  devices: Device[];
}

export function AmbianceModePage() {
  const [showAddMode, setShowAddMode] = useState(false);
  const [modeName, setModeName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<Record<string, string | number>>({});
  const [ambianceModes, setAmbianceModes] = useState<AmbianceMode[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDevices, setRoomDevices] = useState<Device[]>([]);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModes, setFilteredModes] = useState<AmbianceMode[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModes(ambianceModes);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = ambianceModes.filter(mode => 
        mode.name.toLowerCase().includes(lowercaseQuery) ||
        mode.roomName.toLowerCase().includes(lowercaseQuery) ||
        mode.devices.some(device => 
          device.deviceName.toLowerCase().includes(lowercaseQuery)
        )
      );
      setFilteredModes(filtered);
    }
  }, [ambianceModes, searchQuery]);

  // Fetch modes and rooms on component mount
  useEffect(() => {
    const fetchModesAndRooms = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No token found, please log in');
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/modes_list/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAmbianceModes(data.ambiance_modes);
          setRooms(data.rooms);
        } else {
          console.error('Failed to fetch modes and rooms data');
        }
      } catch (error) {
        console.error('Error fetching modes and rooms:', error);
      }
    };

    fetchModesAndRooms();
  }, []);

  // Fetch devices for the selected room
  useEffect(() => {
    if (!selectedRoomId) return;

    const fetchDevices = async (roomId: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/room_devices/${roomId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }

        const data = await response.json();
        console.log('Fetched devices:', data); // Debugging: Log the fetched devices
        setRoomDevices(data); // Set the filtered devices directly
      } catch (error) {
        console.error('Error fetching devices:', error);
        setRoomDevices([]); // Reset devices if there's an error
      }
    };

    fetchDevices(selectedRoomId);
  }, [selectedRoomId]);

  // Handle device state changes
  const handleDeviceChange = (deviceId: string, value: string | number) => {
    setSelectedDevices(prev => ({
      ...prev,
      [deviceId]: value,
    }));
  };

  const handleAddMode = async () => {
    if (!modeName.trim() || !selectedRoomId) return;
  
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }
  
      // Prepare the new mode data
      const newModeData = {
        name: modeName,
        roomId: selectedRoomId,
        devices: roomDevices.map(device => ({
          deviceId: device.deviceId,
          state: selectedDevices[device.deviceId] || device.state,
        })),
      };
  
      // Send the request to the backend
      const response = await fetch('http://127.0.0.1:8000/add_ambiance_mode/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newModeData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Mode created successfully:', data);
  
        // Update the local state with the new mode
        const newMode: AmbianceMode = {
          id: data.modeId, // Use the modeId returned by the backend
          name: modeName,
          roomId: selectedRoomId,
          roomName: getSelectedRoom()?.name || '',
          devices: roomDevices.map(device => ({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            type: device.type,
            state: selectedDevices[device.deviceId] || device.state,
            general_product_code: device.general_product_code,
          })),
          isActive: false,
        };
  
        setAmbianceModes(prev => [...prev, newMode]);
        resetForm();
      } else {
        console.error('Failed to create mode');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error creating mode:', error);
    }
  };

  // Edit an existing ambiance mode
  const handleEditMode = (modeId: string) => {
    const modeToEdit = ambianceModes.find(mode => mode.id === modeId);
    if (modeToEdit) {
      setModeName(modeToEdit.name);
      setSelectedRoomId(modeToEdit.roomId);
      setSelectedDevices(
        modeToEdit.devices.reduce((acc, device) => {
          acc[device.deviceId] = device.state;
          return acc;
        }, {} as Record<string, string | number>)
      );
      setEditModeId(modeId);
      setShowAddMode(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!modeName.trim() || !selectedRoomId || !editModeId) return;
  
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }
  
      // Prepare the updated mode data
      const updatedModeData = {
        name: modeName,
        roomId: selectedRoomId,
        devices: roomDevices.map(device => ({
          deviceId: device.deviceId,
          state: selectedDevices[device.deviceId] || device.state,
        })),
      };
  
      // Send the request to the backend to update the mode
      const response = await fetch(`http://127.0.0.1:8000/update_ambiance_mode/${editModeId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedModeData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Mode updated successfully:', data);
  
        // Directly update the frontend state
        setAmbianceModes(prevModes =>
          prevModes.map(mode =>
            mode.id === editModeId
              ? {
                  ...mode,
                  name: modeName,
                  roomId: selectedRoomId,
                  roomName: getSelectedRoom()?.name || '', // Update room name if needed
                  devices: roomDevices.map(device => ({
                    deviceId: device.deviceId,
                    deviceName: device.deviceName,
                    type: device.type,
                    state: selectedDevices[device.deviceId] || device.state,
                    general_product_code: device.general_product_code,
                  })),
                }
              : mode
          )
        );
  
        // Reset the form
        resetForm();
      } else {
        console.error('Failed to update mode');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error updating mode:', error);
    }
  };

  // Reset the form
  const resetForm = () => {
    setShowAddMode(false);
    setModeName('');
    setSelectedRoomId('');
    setSelectedDevices({});
    setEditModeId(null);
  };

  // Get the selected room
  const getSelectedRoom = () => rooms.find(room => room.id === selectedRoomId);

  // Delete a mode
  const handleDeleteMode = async (modeId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/delete_ambiance_mode/${modeId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAmbianceModes(prev => prev.filter(mode => mode.id !== modeId));
      } else {
        console.error('Failed to delete mode');
      }
    } catch (error) {
      console.error('Error deleting mode:', error);
    }
  };

  // Toggle a mode on/off
  const handleToggleMode = async (modeId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/toggle_ambiance/${modeId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedModes = ambianceModes.map(mode =>
          mode.id === modeId ? { ...mode, isActive: !mode.isActive } : mode
        );
        setAmbianceModes(updatedModes);
      } else {
        console.error('Failed to toggle mode');
      }
    } catch (error) {
      console.error('Error toggling mode:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Ambiance Modes</h1>
        <button
          onClick={() => setShowAddMode(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
          style={{ backgroundColor: 'var(--secondary-accent)', color: 'white' }}
        >
          <Plus className="w-5 h-5" />
          Add Mode
        </button>
      </div>

      {/* Add Search Bar */}
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
          placeholder="Search modes or devices..."
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

      {showAddMode && (
        <div className="glass-card p-6 rounded-xl animate-slide-up" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editModeId ? 'Edit Ambiance Mode' : 'Create New Ambiance Mode'}
            </h2>
            <button 
              onClick={resetForm} 
              style={{ color: 'var(--text-muted)' }}
              className="hover:opacity-80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Mode Name</label>
              <input
                type="text"
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                placeholder="Enter mode name"
                className="w-full rounded-lg px-4 py-2 border focus:outline-none"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border-color)' 
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Select Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-lg px-4 py-2 border focus:outline-none"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <option value="">Choose a room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Controls */}
            <div className="space-y-4">
              {roomDevices.map(device => (
                <div 
                  key={device.deviceId} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{device.deviceName}</span>

                  {/* Dropdown for devices with options */}
                  {device.type === 'FixedOption' && device.options && (
                    <select
                      value={selectedDevices[device.deviceId] || device.state}
                      onChange={(e) => handleDeviceChange(device.deviceId, e.target.value)}
                      className="px-3 py-1 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        color: 'var(--text-primary)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      {Array.isArray(device.options) ? (
                        device.options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))
                      ) : (
                        <option value="">No options available</option>
                      )}
                    </select>
                  )}

                  {/* + and - buttons for Thermostat */}
                  {device.general_product_code === 'AV0001' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleDeviceChange(
                            device.deviceId,
                            Math.max(16, Number(selectedDevices[device.deviceId] || device.state) - 1)
                          )
                        }
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <Minus style={{ color: 'var(--text-primary)' }} />
                      </button>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {selectedDevices[device.deviceId] || device.state}
                      </span>
                      <button
                        onClick={() =>
                          handleDeviceChange(
                            device.deviceId,
                            Math.min(32, Number(selectedDevices[device.deviceId] || device.state) + 1)
                          )
                        }
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <Plus style={{ color: 'var(--text-primary)' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={editModeId ? handleSaveEdit : handleAddMode}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
                style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                {editModeId ? 'Save Changes' : 'Add Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Ambiance Modes - Use filteredModes instead of ambianceModes */}
      <div className="space-y-4">
        {filteredModes.map(mode => (
          <div key={mode.id} className="glass-card p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{mode.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{mode.roomName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleMode(mode.id)}
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: mode.isActive ? 'var(--success-color)' : 'var(--bg-tertiary)',
                    color: mode.isActive ? 'white' : 'var(--text-muted)'
                  }}
                >
                  <Power className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEditMode(mode.id)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <Edit2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
                <button
                  onClick={() => handleDeleteMode(mode.id)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--danger-bg)' }}
                >
                  <Trash2 className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {mode.devices.map(device => (
                <div 
                  key={device.deviceId} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{device.deviceName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{device.state}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State - Updated to check filteredModes and show different message when searching */}
        {filteredModes.length === 0 && !showAddMode && (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 
              'No ambiance modes match your search criteria.' : 
              'No ambiance modes created yet. Click "Add Mode" to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}