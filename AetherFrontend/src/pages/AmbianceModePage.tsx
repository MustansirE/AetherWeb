import React, { useState, useEffect } from 'react';
import { Plus, X, Minus, ChevronDown, Trash2, Edit2, Power } from 'lucide-react';

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
        <h1 className="text-2xl font-semibold text-white">Ambiance Modes</h1>
        <button
          onClick={() => setShowAddMode(true)}
          className="bg-[#8DA08E] hover:bg-[#7A9580] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
        >
          <Plus className="w-5 h-5" />
          Add Mode
        </button>
      </div>

      {showAddMode && (
        <div className="glass-card p-6 rounded-xl animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              {editModeId ? 'Edit Ambiance Mode' : 'Create New Ambiance Mode'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Mode Name</label>
              <input
                type="text"
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                placeholder="Enter mode name"
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Select Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2"
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
                <div key={device.deviceId} className="flex items-center justify-between bg-[#262626] p-3 rounded-lg">
                  <span className="text-white">{device.deviceName}</span>

                  {/* Dropdown for devices with options */}
                  {device.type === 'FixedOption' && device.options && (
                    <select
                      value={selectedDevices[device.deviceId] || device.state}
                      onChange={(e) => handleDeviceChange(device.deviceId, e.target.value)}
                      className="bg-[#333] text-white border border-gray-500 px-3 py-1 rounded-lg"
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
                        className="p-2 bg-gray-700 rounded-lg"
                      >
                        <Minus />
                      </button>
                      <span className="text-white">
                        {selectedDevices[device.deviceId] || device.state}
                      </span>
                      <button
                        onClick={() =>
                          handleDeviceChange(
                            device.deviceId,
                            Math.min(32, Number(selectedDevices[device.deviceId] || device.state) + 1)
                          )
                        }
                        className="p-2 bg-gray-700 rounded-lg"
                      >
                        <Plus />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={editModeId ? handleSaveEdit : handleAddMode}
                className="bg-[#8DA08E] hover:bg-[#7A9580] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
              >
                {editModeId ? 'Save Changes' : 'Add Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Ambiance Modes */}
      <div className="space-y-4">
        {ambianceModes.map(mode => (
          <div key={mode.id} className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">{mode.name}</h2>
                <p className="text-gray-400">{mode.roomName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleMode(mode.id)}
                  className={`p-2 rounded-lg ${mode.isActive ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <Power className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => handleEditMode(mode.id)}
                  className="p-2 bg-gray-700 rounded-lg"
                >
                  <Edit2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteMode(mode.id)}
                  className="p-2 bg-red-500 rounded-lg"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {mode.devices.map(device => (
                <div key={device.deviceId} className="flex items-center justify-between bg-[#262626] p-3 rounded-lg">
                  <span className="text-white">{device.deviceName}</span>
                  <span className="text-gray-400">{device.state}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}