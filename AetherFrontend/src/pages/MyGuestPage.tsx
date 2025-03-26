import React, { useEffect, useState } from 'react';
import { Plus, X, DoorOpen, Trash2, Calendar, Key, Check, Copy } from 'lucide-react';

interface Room {
  id: string;
  name: string;
}

interface Guest {
  id: string;
  full_name: string;
  departure_date: string;
  access_code: string;
  allowed_rooms: string[];
  status: string;
}

export function MyGuestPage() {
  const [newGuest, setNewGuest] = useState({
    name: '',
    departureDate: '',
    allowedRooms: [] as string[]
  })
  const [generatedCodes, setGeneratedCodes] = useState<{
    guestCode: string;
    houseId: string;
  } | null>(null)
  const [copiedField, setCopiedField] = useState<'guestCode' | 'houseId' | null>(null)
  const [timer, setTimer] = useState<number>(300); // 5 minutes in seconds
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddGuest, setShowAddGuest] = useState(false);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/get_rooms/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Rooms Data:", data); // Debugging
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      } else {
        console.error("Failed to fetch rooms:", response.status);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  useEffect(() => {
    if (showAddGuest) {
      fetchRooms();
    }
  }, [showAddGuest]);

  const handleRoomToggle = (roomId: string) => {
    setNewGuest(prev => ({
      ...prev,
      allowedRooms: prev.allowedRooms.includes(roomId)
        ? prev.allowedRooms.filter(id => id !== roomId)
        : [...prev.allowedRooms, roomId]
    }))
  }

  const generateRandomCode = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('')
  }

  const handleGenerateCode = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/create_incomplete_guest/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGuest.name,
          departure_date: newGuest.departureDate,
          allowed_rooms: newGuest.allowedRooms,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("New Guest Added:", data);

        // Immediately update the guest list
        setGuests((prevGuests) => [
          ...prevGuests,
          {
            id: data.guestId,
            full_name: newGuest.name,
            departure_date: newGuest.departureDate,
            access_code: data.guestCode,
            allowed_rooms: newGuest.allowedRooms,
            status: "pending",
          },
        ]);

        // Store generated codes
        setGeneratedCodes({ guestCode: data.guestCode, houseId: data.houseId });
        setCurrentGuestId(data.guestId);
        startTimer();
      } else {
        console.error("Failed to generate guest code:", response.status);
      }
    } catch (error) {
      console.error("Error generating guest code:", error);
    }
  };

  // Fetch verified guests from backend
  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/my_guests/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Guests Data:", data);
        setGuests(Array.isArray(data.guests) ? data.guests : []);
      } else {
        console.error("Failed to fetch guests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleCopyCode = async (code: string, type: 'guestCode' | 'houseId') => {
    await navigator.clipboard.writeText(code)
    setCopiedField(type)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const resetForm = () => {
    setNewGuest({
      name: '',
      departureDate: '',
      allowedRooms: []
    })
    setGeneratedCodes(null)
    setShowAddGuest(false)
  }

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/delete_guest/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guest_id: guestId }),
      });

      if (response.ok) {
        setGuests(prev => prev.filter(guest => guest.id !== guestId));
      } else {
        console.error("Failed to delete guest:", response.status);
      }
    } catch (error) {
      console.error("Error deleting guest:", error);
    }
  }

  useEffect(() => {
    if (timer > 0 && currentGuestId) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (timer === 0 && currentGuestId) {
      handleDeleteUnverifiedGuest();
    }
  }, [timer, currentGuestId]);

  const startTimer = () => {
    setTimer(300); // Reset to 5 minutes
  };

  const handleDeleteUnverifiedGuest = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/delete_unverified_guest/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guest_id: currentGuestId }),
      });

      if (response.ok) {
        setCurrentGuestId(null);
        setGeneratedCodes(null);
        fetchGuests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting unverified guest:', error);
    }
  };

  useEffect(() => {
    if (currentGuestId) {
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://127.0.0.1:8000/check_guest_verification/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ guest_id: currentGuestId }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.verified === 1) {
              setCurrentGuestId(null); // Stop checking
              setTimer(0); // Stop timer
              fetchGuests(); // Refresh the list
            }
          }
        } catch (error) {
          console.error('Error checking verification:', error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentGuestId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Guests</h1>
        <button
          onClick={() => setShowAddGuest(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover-pulse"
          style={{ 
            backgroundColor: 'var(--secondary-accent)', 
            color: 'white'
          }}
        >
          <Plus className="w-5 h-5" />
          Add Guest
        </button>
      </div>

      {/* Add Guest Form */}
      {showAddGuest && (
        <div className="glass-card p-6 rounded-xl animate-slide-up" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add New Guest</h2>
            <button
              onClick={resetForm}
              style={{ color: 'var(--text-muted)' }}
              className="hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!generatedCodes ? (
            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Guest Name
                </label>
                <input
                  type="text"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter guest name"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    color: 'var(--text-primary)', 
                    borderColor: 'var(--border-color)'
                  }}
                />
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Departure Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-[#EAAC82]" />
                  </div>
                  <input
                    type="date"
                    value={newGuest.departureDate}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, departureDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      color: 'var(--text-primary)', 
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>
              </div>

              {/* Room Access */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Room Access
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map(room => (
                    <label
                      key={room.id}
                      className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        color: 'var(--text-primary)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newGuest.allowedRooms.includes(room.id)}
                        onChange={() => handleRoomToggle(room.id)}
                        className="form-checkbox h-5 w-5 rounded border-gray-600 bg-transparent focus:ring-[#EAAC82]"
                        style={{ color: 'var(--accent-color)' }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{room.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={!newGuest.name || !newGuest.departureDate || newGuest.allowedRooms.length === 0}
                className="w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                <Key className="w-5 h-5" />
                Generate Guest Code
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
                  style={{ backgroundColor: 'var(--accent-color)', opacity: 0.2, color: 'var(--accent-color)' }}>
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Guest Access Codes Generated
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Share these codes with your guest to grant them access
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Guest Code</span>
                    <button
                      onClick={() => handleCopyCode(generatedCodes.guestCode, 'guestCode')}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--accent-color)' }}
                    >
                      {copiedField === 'guestCode' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xl font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    {generatedCodes.guestCode}
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>House ID</span>
                    <button
                      onClick={() => handleCopyCode(generatedCodes.houseId, 'houseId')}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--accent-color)' }}
                    >
                      {copiedField === 'houseId' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xl font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    {generatedCodes.houseId}
                  </div>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full py-3 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--secondary-accent)', color: 'white' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guests List */}
      <div className="grid gap-4">
        {guests.length > 0 ? (
          guests.map((guest) => (
            <div key={guest.id} className="glass-card p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{guest.full_name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Departure: {new Date(guest.departure_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Code: {guest.access_code}</p>
                </div>
                <button
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => handleDeleteGuest(guest.id)}
                >
                  <Trash2 className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  {guest.allowed_rooms.length} {guest.allowed_rooms.length === 1 ? "room" : "rooms"} allowed
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}> </div>
        )}

        {/* Modal for Generated Code */}
        {generatedCodes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-6 rounded-lg w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  Guest Code Generated
                </h3>
                <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Share these codes with your guest. The code will expire in:
                </div>
                <div className="text-2xl font-mono mb-6" style={{ color: 'var(--accent-color)' }}>
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Guest Code</span>
                      <button
                        onClick={() => handleCopyCode(generatedCodes.guestCode, 'guestCode')}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {copiedField === 'guestCode' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xl font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      {generatedCodes.guestCode}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>House ID</span>
                      <button
                        onClick={() => handleCopyCode(generatedCodes.houseId, 'houseId')}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {copiedField === 'houseId' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xl font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      {generatedCodes.houseId}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGeneratedCodes(null);
                    setCurrentGuestId(null);
                    handleDeleteUnverifiedGuest();
                  }}
                  className="w-full py-3 rounded-lg transition-colors mt-6"
                  style={{ backgroundColor: 'var(--secondary-accent)', color: 'white' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {guests.length === 0 && !showAddGuest && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No guests added yet. Click "Add Guest" to get started.
        </div>
      )}
    </div>
  )
}