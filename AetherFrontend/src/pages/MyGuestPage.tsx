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

// Fake Data (Hardcoded)
const testGuests: Guest[] = [
  {
    id: "1",
    full_name: "John Doe",
    departure_date: "2025-03-20",
    access_code: "XYZ123",
    allowed_rooms: ["Living Room", "Kitchen"],
    status: "active",
  },
  {
    id: "2",
    full_name: "Jane Smith",
    departure_date: "2025-04-10",
    access_code: "ABC456",
    allowed_rooms: ["Master Bedroom"],
    status: "pending",
  },
];

const testRooms: Room[] = [
  { id: "1", name: "Living Room" },
  { id: "2", name: "Kitchen" },
  { id: "3", name: "Master Bedroom" },
];


// Mock rooms data
const rooms: Room[] = [
  { id: '1', name: 'Living Room' },
  { id: '2', name: 'Kitchen' },
  { id: '3', name: 'Master Bedroom' },
  { id: '4', name: 'Guest Bedroom' },
  { id: '5', name: 'Bathroom' }
]

export function MyGuestPage() {
  //const [showAddGuest, setShowAddGuest] = useState(false)
  //const [guests, setGuests] = useState<Guest[]>([])
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
  // const [rooms, setRooms] = useState<Room[]>([])
  const [timer, setTimer] = useState<number>(300); // 5 minutes in seconds
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);
  // const [guests, setGuests] = useState<Guest[]>(testGuests);
  const [guests, setGuests] = useState<Guest[]>([]);
  // const [rooms, setRooms] = useState<Room[]>(testRooms);
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

  const handleDeleteGuest = (guestId: string) => {
    setGuests(prev => prev.filter(guest => guest.id !== guestId))
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

  // Guests list rendering
  const renderGuestsList = () => {
    if (guests.length === 0) {
      return (
        <div className="text-center text-gray-400 py-12">
          No active guests found
        </div>
      )
    }

    return guests.map(guest => (
      <div key={guest.id} className="glass-card p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">{guest.full_name}</h3>
            <p className="text-sm text-gray-400">
              Departure: {new Date(guest.departure_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-400">Code: {guest.access_code}</p>
          </div>
          <button
            className="text-gray-400 hover:text-red-500 p-2 rounded-lg"
            onClick={() => handleDeleteGuest(guest.id)}
          >
            <Trash2 className="w-5 h-5" />
          </button>

        </div>

        <div className="flex items-center gap-2 text-sm">
          <DoorOpen className="w-4 h-4 text-[#EAAC82]" />
          <span className="text-gray-400">
            {guest.allowed_rooms.length} {guest.allowed_rooms.length === 1 ? 'room' : 'rooms'} allowed
          </span>
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">My Guests</h1>
        <button
          onClick={() => setShowAddGuest(true)}
          className="bg-[#8DA08E] hover:bg-[#7A9580] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover-pulse"
        >
          <Plus className="w-5 h-5" />
          Add Guest
        </button>
      </div>

      {/* Add Guest Form */}
      {showAddGuest && (
        <div className="glass-card p-6 rounded-xl animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Add New Guest</h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!generatedCodes ? (
            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter guest name"
                  className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                />
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
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
                    className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                  />
                </div>
              </div>

              {/* Room Access */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Room Access
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map(room => (
                    <label
                      key={room.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-[#262626] cursor-pointer hover:bg-[#333333] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={newGuest.allowedRooms.includes(room.id)}
                        onChange={() => handleRoomToggle(room.id)}
                        className="form-checkbox h-5 w-5 text-[#EAAC82] rounded border-gray-600 bg-transparent focus:ring-[#EAAC82]"
                      />
                      <span className="text-white">{room.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={!newGuest.name || !newGuest.departureDate || newGuest.allowedRooms.length === 0}
                className="w-full bg-[#EAAC82] hover:bg-[#D9A279] text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                <Key className="w-5 h-5" />
                Generate Guest Code
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EAAC82]/20 text-[#EAAC82] mb-4">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Guest Access Codes Generated
                </h3>
                <p className="text-sm text-gray-400">
                  Share these codes with your guest to grant them access
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#262626] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Guest Code</span>
                    <button
                      onClick={() => handleCopyCode(generatedCodes.guestCode, 'guestCode')}
                      className="text-[#EAAC82] hover:text-[#D9A279] p-2 rounded-lg transition-colors"
                    >
                      {copiedField === 'guestCode' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xl font-mono text-white tracking-wider">
                    {generatedCodes.guestCode}
                  </div>
                </div>

                <div className="bg-[#262626] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">House ID</span>
                    <button
                      onClick={() => handleCopyCode(generatedCodes.houseId, 'houseId')}
                      className="text-[#EAAC82] hover:text-[#D9A279] p-2 rounded-lg transition-colors"
                    >
                      {copiedField === 'houseId' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xl font-mono text-white tracking-wider">
                    {generatedCodes.houseId}
                  </div>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full bg-[#90AC95] hover:bg-[#7A9580] text-white py-3 rounded-lg transition-colors"
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
            <div key={guest.id} className="glass-card p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{guest.full_name}</h3>
                  <p className="text-sm text-gray-400">
                    Departure: {new Date(guest.departure_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-400">Code: {guest.access_code}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg"
                  onClick={() => setGuests(guests.filter((g) => g.id !== guest.id))}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="w-4 h-4 text-[#EAAC82]" />
                <span className="text-gray-400">
                  {guest.allowed_rooms.length} {guest.allowed_rooms.length === 1 ? "room" : "rooms"} allowed
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-12"> </div>
        )}



        {/* Modal for Generated Code */}
        {generatedCodes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#262626] p-6 rounded-lg w-full max-w-md">
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-4">
                  Guest Code Generated
                </h3>
                <div className="text-sm text-gray-400 mb-6">
                  Share these codes with your guest. The code will expire in:
                </div>
                <div className="text-2xl font-mono text-[#EAAC82] mb-6">
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </div>
                <div className="space-y-4">
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Guest Code</span>
                      <button
                        onClick={() => handleCopyCode(generatedCodes.guestCode, 'guestCode')}
                        className="text-[#EAAC82] hover:text-[#D9A279] p-2 rounded-lg transition-colors"
                      >
                        {copiedField === 'guestCode' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xl font-mono text-white tracking-wider">
                      {generatedCodes.guestCode}
                    </div>
                  </div>
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">House ID</span>
                      <button
                        onClick={() => handleCopyCode(generatedCodes.houseId, 'houseId')}
                        className="text-[#EAAC82] hover:text-[#D9A279] p-2 rounded-lg transition-colors"
                      >
                        {copiedField === 'houseId' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="text-xl font-mono text-white tracking-wider">
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
                  className="w-full bg-[#90AC95] hover:bg-[#7A9580] text-white py-3 rounded-lg transition-colors mt-6"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {
        guests.length === 0 && !showAddGuest && (
          <div className="text-center text-gray-400 py-12">
            No guests added yet. Click "Add Guest" to get started.
          </div>
        )
      }
    </div >
  )
}