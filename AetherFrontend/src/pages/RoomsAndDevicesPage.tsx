import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Save, X, Info, Power, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Device {
  device_id: string
  name: string
  general_product_code: string
  status: string
  device_type: string
  state: string
  options: string[]
  average_energy_consumption_per_hour: number
  manufacturer?: string
}

interface Room {
  room_id: string
  name: string
  devices: Device[]
}

export function RoomsAndDevicesPage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([])
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [newDevice, setNewDevice] = useState({
    name: '',
    productCode: ''
  })
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editRoomName, setEditRoomName] = useState('')
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search query is empty, show all rooms
      setFilteredRooms(rooms);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      
      // Filter rooms where either the room name or any of its devices match the query
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(lowercaseQuery) ||
        room.devices.some(device => 
          device.name.toLowerCase().includes(lowercaseQuery) ||
          device.general_product_code.toLowerCase().includes(lowercaseQuery)
        )
      );
      
      setFilteredRooms(filtered);
      
      // If we have filtered results, show the first matching room
      if (filtered.length > 0) {
        // Find the index of the first matching room in the original rooms array
        const firstMatchIndex = rooms.findIndex(r => r.room_id === filtered[0].room_id);
        if (firstMatchIndex !== -1) {
          setCurrentRoomIndex(firstMatchIndex);
        }
      }
    }
  }, [rooms, searchQuery]);

  const fetchRoomsAndDevices = async () => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/roomsanddevices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Rooms and Devices:', data);
        setRooms(data.rooms);
      } else {
        console.error('Failed to fetch rooms and devices:', response.status);
        alert('Failed to fetch rooms and devices');
      }
    } catch (error) {
      console.error('Error fetching rooms and devices:', error);
    }
  };

  useEffect(() => {
    fetchRoomsAndDevices();
  }, []);

  const fetchDeviceInfo = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/device_info/${deviceId}/`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });


      const data = await response.json();
      setSelectedDevice(data);
      setModalOpen(true);
    } catch (error) {
      console.error("Error fetching device info:", error);
    }
  };

  const handleAddRoom = async () => {
    if (newRoomName.trim()) {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          console.error('No token found, please log in');
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/add_room/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            room_name: newRoomName,  // Send the room name to the backend
          }),
        });

        if (response.ok) {
          setNewRoomName('');
          setShowAddRoom(false);
          fetchRoomsAndDevices();  // Refresh the rooms list from the backend
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to add room');
        }
      } catch (error) {
        console.error('Error adding room:', error);
        alert('An error occurred while adding the room.');
      }
    }
  };

  const handleAddDevice = async (roomId: string) => {
    if (newDevice.productCode.trim()) {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          console.error('No token found, please log in');
          return;
        }

        const response = await fetch(`http://127.0.0.1:8000/add_device/${roomId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            general_product_code: newDevice.productCode, // Send the product code entered by the user
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Device added successfully:', data);
          setShowAddDevice(null);
          fetchRoomsAndDevices();
        } else {
          const errorData = await response.json();
          console.error('Failed to add device:', errorData.error);
          alert(errorData.error || 'Failed to add device');
        }
      } catch (error) {
        console.error('Error adding device:', error);
      }
    } else {
      alert('Please fill in all fields');
    }
  };


  const handleDeleteRoom = async (roomId: string) => {
    try {

      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/remove_room/${roomId}/`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }
      // Inside handleDeleteRoom, after setRooms
      // Adjust current index if necessary
      if (currentRoomIndex >= rooms.length - 1) {
        setCurrentRoomIndex(Math.max(0, rooms.length - 2));
      }
      setRooms(prev => prev.filter(room => room.room_id !== roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleDeleteDevice = async (roomId: string, deviceId: string) => {
    try {

      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/remove_device/${roomId}/${deviceId}/`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete device");
      }

      setRooms(prev =>
        prev.map(room =>
          room.room_id === roomId
            ? { ...room, devices: room.devices.filter(device => device.device_id !== deviceId) }
            : room
        )
      );
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };


  const toggleDevice = async (roomId: string, deviceId: string) => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/toggle_device/${deviceId}/`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.room_id === roomId
              ? {
                ...room,
                devices: room.devices.map((device) =>
                  device.device_id === deviceId
                    ? { ...device, status: data.new_state }
                    : device
                ),
              }
              : room
          )
        );
      } else {
        console.error("Failed to toggle device");
      }
    } catch (error) {
      console.error("Error toggling device:", error);
    }
  };

  const handleStateChange = (roomId: string, deviceId: string, newState: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.room_id === roomId) {
          return {
            ...room,
            devices: room.devices.map((device) => {
              if (device.device_id === deviceId) {
                return {
                  ...device,
                  state: newState, // Update the state to the new value
                };
              }
              return device;
            }),
          };
        }
        return room;
      })
    );
  };

  const incrementState = (roomId: string, deviceId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.room_id === roomId) {
        return {
          ...room,
          devices: room.devices.map(device => {
            if (device.device_id === deviceId && device.device_type === 'Variable') { // Only for Variable devices
              const newState = Math.min(100, parseInt(device.state) + 1); // Increment the state, max at 100
              return { ...device, state: newState.toString() };
            }
            return device;
          })
        };
      }
      return room;
    }));
  };

  const decrementState = (roomId: string, deviceId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.room_id === roomId) {
        return {
          ...room,
          devices: room.devices.map(device => {
            if (device.device_id === deviceId && device.device_type === 'Variable') { // Only for Variable devices
              const newState = Math.max(0, parseInt(device.state) - 1); // Decrement the state, min at 0
              return { ...device, state: newState.toString() };
            }
            return device;
          })
        };
      }
      return room;
    }));
  };

  const formatOptions = (options: string | string[]) => {
    if (Array.isArray(options)) {
      // If options is an array, clean up each string in the array
      return options.flatMap(option => {
        if (typeof option === 'string') {
          return option
            .replace(/[\[\]']+/g, '') // Remove square brackets and single quotes
            .split(',') // Split by commas
            .map(item => item.trim()) // Trim whitespace from each item
            .filter(item => item.length > 0); // Remove empty strings
        }
        return []; // Skip non-string items
      });
    }

    return []; // Default to an empty array if options is not an array
  };

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Carousel navigation functions
  const nextRoom = () => {
    if (rooms.length > 0) {
      setCurrentRoomIndex((prevIndex) => (prevIndex + 1) % rooms.length);
    }
  };

  const prevRoom = () => {
    if (rooms.length > 0) {
      setCurrentRoomIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length);
    }
  };

  const goToRoom = (index: number) => {
    setCurrentRoomIndex(index);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Rooms & Devices</h1>
        <button
          onClick={() => setShowAddRoom(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
          style={{ backgroundColor: 'var(--secondary-accent)', color: 'var(--text-on-accent)' }}
        >
          <Plus className="w-5 h-5" />
          Add Room
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
        placeholder="Search rooms or devices..."
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

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="glass-card p-6 rounded-xl mb-6 animate-slide-up" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add New Room</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 rounded-lg px-4 py-2 focus:outline-none"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-primary)', 
                borderColor: 'var(--border-color)',
                border: '1px solid var(--border-color)'
              }}
            />
            <button
              onClick={handleAddRoom}
              className="px-4 py-2 rounded-lg hover-pulse"
              style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddRoom(false)}
              className="px-4 py-2 rounded-lg hover-pulse"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rooms Carousel */}
{/* Rooms Carousel - Update to use filteredRooms instead of rooms */}
    {filteredRooms.length === 0 ? (
      <div className="text-center py-12 glass-card rounded-xl" 
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        {searchQuery ? 
          'No rooms or devices match your search criteria.' : 
          'No rooms available. Click "Add Room" to get started.'}
      </div>
    ) : (
      <div className="relative">
        {/* Carousel Navigation - Update to use filteredRooms for dots */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevRoom}
            className="p-2 rounded-full transition-colors z-10"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)'
            }}
            disabled={rooms.length <= 1}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex space-x-2 justify-center">
            {rooms.map((_, index) => (
              <button
                key={index}
                onClick={() => goToRoom(index)}
                className={`h-2 w-2 rounded-full transition-colors`}
                style={{ 
                  backgroundColor: index === currentRoomIndex 
                    ? 'var(--accent-color)' 
                    : 'var(--bg-tertiary)' 
                }}
              />
            ))}
          </div>

          <button
            onClick={nextRoom}
            className="p-2 rounded-full transition-colors z-10"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)'
            }}
            disabled={rooms.length <= 1}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Carousel Content - Continue with rooms not filteredRooms since we're using the index-based navigation */}
        <div
          ref={carouselRef}
          className="overflow-hidden"
        >
          <div
            className="transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentRoomIndex * 100}%)` }}
          >
            <div className="flex">
              {rooms.map(room => (
                  <div key={room.room_id} className="w-full flex-shrink-0 px-1">
                    <div className="glass-card p-6 rounded-xl h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{room.name}</h2>
                        <button
                          onClick={() => handleDeleteRoom(room.room_id)}
                          className="p-2 rounded-lg hover-pulse"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                        </button>
                      </div>

                      {/* Devices List */}
                      {room.devices.length === 0 ? (
                        <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                          No devices in this room. Click "Add Device" to get started.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {room.devices.map(device => (
                            <div key={device.device_id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.name}</div>
                                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Code: {device.general_product_code}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => fetchDeviceInfo(device.device_id)}
                                    className="p-2 rounded-lg hover-pulse"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    <Info className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDevice(room.room_id, device.device_id)}
                                    className="p-2 rounded-lg hover-pulse"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    <Trash2 className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                                  </button>
                                </div>
                              </div>

                              {/* Show State Buttons for Devices with Options */}
                              {device.status !== 'off' && device.device_type === 'Variable' && (
                                <div style={{ color: 'var(--text-muted)' }}>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => decrementState(room.room_id, device.device_id)}
                                      className="rounded-lg px-4 py-2 focus:outline-none"
                                      style={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        color: 'var(--text-primary)', 
                                        border: '1px solid var(--border-color)' 
                                      }}
                                    >
                                      -
                                    </button>
                                    <span className="mx-4" style={{ color: 'var(--text-primary)' }}>{device.state}</span>
                                    <button
                                      onClick={() => incrementState(room.room_id, device.device_id)}
                                      className="rounded-lg px-4 py-2 focus:outline-none"
                                      style={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        color: 'var(--text-primary)', 
                                        border: '1px solid var(--border-color)' 
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* For MonitorFixed or MonitorVariable devices (read-only state) */}
                              {device.device_type === 'MonitorFixed' && device.status !== 'off' && (
                                <div style={{ color: 'var(--text-muted)' }}>
                                  <span style={{ color: 'var(--text-primary)' }}>{formatOptions([device.state])}</span>
                                </div>
                              )}

                              {device.device_type === 'MonitorVariable' && device.status !== 'off' && (
                                <div style={{ color: 'var(--text-muted)' }}>
                                  <span style={{ color: 'var(--text-primary)' }}>{device.state}</span>
                                </div>
                              )}

                              {/* For all other devices (dropdown options) */}
                              {device.status !== 'off' && !(device.device_type === 'Variable' ||
                                device.device_type === 'MonitorFixed' ||
                                device.device_type === 'MonitorVariable') &&
                                device.general_product_code.charAt(1) !== 'T' && (
                                  <div style={{ color: 'var(--text-muted)' }}>
                                    <select
                                      id={`state-${device.device_id}`}
                                      value={device.state}
                                      onChange={(e) =>
                                        handleStateChange(room.room_id, device.device_id, e.target.value)
                                      }
                                      className="rounded-lg px-4 py-2 focus:outline-none w-full"
                                      style={{ 
                                        backgroundColor: 'var(--input-bg)', 
                                        color: 'var(--text-primary)', 
                                        border: '1px solid var(--border-color)' 
                                      }}
                                    >
                                      {formatOptions(device.options).map((option, index) => (
                                        <option key={index} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

<div className="mt-4 flex justify-between items-center">
  <button
    onClick={() => toggleDevice(room.room_id, device.device_id)}
    className="rounded-lg px-4 py-2"
    style={{ 
      backgroundColor: device.status === 'off' 
        ? 'var(--secondary-accent)' 
        : 'var(--accent-color)',
      color: 'var(--text-on-accent)'
    }}
  >
    {device.status === 'off' ? 'Turn On' : 'Turn Off'}
  </button>
</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Device Section */}
                      {showAddDevice === room.room_id ? (
                        <div className="space-y-4 mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Product Code</label>
                            <input
                              type="text"
                              value={newDevice.productCode}
                              onChange={(e) => setNewDevice({ ...newDevice, productCode: e.target.value })}
                              placeholder="Enter product code"
                              className="w-full rounded-lg px-4 py-2 focus:outline-none"
                              style={{ 
                                backgroundColor: 'var(--input-bg)', 
                                color: 'var(--text-primary)', 
                                border: '1px solid var(--border-color)' 
                              }}
                            />
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleAddDevice(room.room_id)}
                              className="flex-1 px-4 py-2 rounded-lg hover-pulse"
                              style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
                            >
                              Add Device
                            </button>
                            <button
                              onClick={() => setShowAddDevice(null)}
                              className="flex-1 px-4 py-2 rounded-lg hover-pulse"
                              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddDevice(room.room_id)}
                          className="flex items-center gap-2 mt-4 hover-pulse"
                          style={{ color: 'var(--secondary-accent)' }}
                        >
                          <Plus className="w-5 h-5" />
                          Add Device
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Info Modal */}
      {modalOpen && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="p-6 rounded-lg w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Device Information</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover-pulse"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Device Name:</label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{selectedDevice.name}</p>
              </div>

              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product Code:</label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{selectedDevice.general_product_code}</p>
              </div>

              {selectedDevice.manufacturer && (
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manufacturer:</label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{selectedDevice.manufacturer}</p>
                </div>
              )}

              {selectedDevice.average_energy_consumption_per_hour && (
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average Usage:</label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{selectedDevice.average_energy_consumption_per_hour} kWh</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}