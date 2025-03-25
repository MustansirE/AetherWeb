import React, { ReactNode, useEffect, useState } from 'react';
import { Plus, Save, X, Edit2, Trash2, Clock, Minus, Power } from 'lucide-react';

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
        <h1 className="text-2xl font-semibold text-white">Routines</h1>
        <button
          onClick={() => setShowAddRoutine(true)}
          className="bg-[#8DA08E] hover:bg-[#7A9580] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
        >
          <Plus className="w-5 h-5" />
          Add Routine
        </button>
      </div>

      {/* Add/Edit Routine Form */}
      {showAddRoutine && (
        <div className="glass-card p-6 rounded-xl animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              {editingRoutine ? 'Edit Routine' : 'Create New Routine'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Routine Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Routine Name</label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Enter routine name"
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
              />
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Select Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
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
                <label className="block text-sm font-medium text-gray-200 mb-2">Select Device</label>
                <select
                  value=""
                  onChange={(e) => handleDeviceSelect(e.target.value)}
                  className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
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
                    className="flex items-center justify-between bg-[#262626] p-3 rounded-lg"
                  >
                    <span className="text-white">{device.name}</span>

                    {/* Toggle Power Button */}
                    <button
                      onClick={() => toggleDevicePower(device.id)}
                      className={`px-4 py-2 rounded-lg ${device.isOn ? 'bg-red-500' : 'bg-green-500'
                        } text-white`}
                    >
                      {device.isOn ? 'Turn Off' : 'Turn On'}
                    </button>

                    {/* State Controls (Only shown if device is ON and not a Toggle device) */}
                    {device.isOn && device.type !== 'Toggle' && (
                      <>
                        {/* Dropdown for FixedOption devices */}
                        {device.type === 'FixedOption' && device.options && (
                          <select
                            value={device.state}
                            onChange={(e) => handleDeviceChange(device.id, e.target.value)}
                            className="bg-[#333] text-white border border-gray-500 px-3 py-1 rounded-lg"
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
                              className="p-2 bg-gray-700 rounded-lg"
                            >
                              <Minus />
                            </button>
                            <span className="text-white">{device.state}</span>
                            <button
                              onClick={() =>
                                handleDeviceChange(
                                  device.id,
                                  Math.min(32, Number(device.state) + 1)
                                )}
                              className="p-2 bg-gray-700 rounded-lg"
                            >
                              <Plus />
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Remove Device Button */}
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors"
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
                <label className="block text-sm font-medium text-gray-200 mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoutine}
                disabled={!routineName.trim() || !selectedRoomId || !startTime || !endTime}
                className="bg-[#EAAC82] hover:bg-[#D9A279] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        {routines.map((routine) => (
          <div key={routine.id} className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-white">{routine.name}</h3>
                <p className="text-sm text-gray-400">
                  {routine.startTime} - {routine.endTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Display "Active" or "Inactive" based on the current time */}
                <span
                  className={`px-3 py-1 rounded-lg ${isAutomationActive(routine.startTime, routine.endTime)
                    ? 'bg-green-500'
                    : 'bg-gray-700'
                    } text-white`}
                >
                  {isAutomationActive(routine.startTime, routine.endTime)
                    ? 'Active'
                    : 'Inactive'}
                </span>
                <button
                  onClick={() => handleEditRoutine(routine)}
                  className="p-2 bg-gray-700 rounded-lg"
                >
                  <Edit2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="p-2 bg-red-500 rounded-lg"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {routine.devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between bg-[#262626] p-3 rounded-lg"
                >
                  <span className="text-white">
                    {device.deviceName} ({device.roomName})
                  </span>
                  <span className="text-gray-400">
                    {device.status ? "Activated" : "Deactivated"}
                    {device.status && device.type !== "Toggle" && device.state !== "none" && ` (${device.state})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {routines.length === 0 && !showAddRoutine && (
        <div className="text-center text-gray-400 py-12">
          No routines created yet. Click "Add Routine" to get started.
        </div>
      )}
    </div>
  );




}