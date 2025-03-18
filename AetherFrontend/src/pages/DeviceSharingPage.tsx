import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check, X, ListPlus, Clock, Share2, RotateCcw } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  productCode: string;
  room: string;
  owner: string;
}

interface DeviceListing {
  ownerName: string;
  id: string;
  deviceId: string;
  deviceName: string;
  condition: 'new' | 'average' | 'old';
}

interface LendRequest {
  id: string;
  listingId: string;
  deviceName: string;
  requesterName: string;
  status: 'pending' | 'active' | 'completed';
}

export function DeviceSharingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeviceListing[]>([]);
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<DeviceListing['condition']>('average');
  const [listings, setListings] = useState<DeviceListing[]>([]);
  const [lendRequests, setLendRequests] = useState<LendRequest[]>([]);
  const [userDevices, setUserDevices] = useState<Device[]>([]);

  useEffect(() => {
    // Fetch user devices with token authentication
    fetchUserDevices();
    fetchListings();
    fetchLendRequests();
  }, []);

  const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No token found, please log in');
      return null;
    }
    return token;
  };

  const fetchUserDevices = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/user_devices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserDevices(data);
      } else {
        console.error('Failed to fetch user devices:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user devices:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/my_listings/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        console.error('Failed to fetch listings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchLendRequests = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/lend_requests/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLendRequests(data);
      } else {
        console.error('Failed to fetch lend requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching lend requests:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/search/?query=${searchQuery}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);  // Debugging: Log the search results
        setSearchResults(data);  // Update the search results state
      } else {
        console.error('Search failed:', response.status);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  const handleAddListing = async () => {
    if (!selectedDevice || !selectedCondition) return;

    const device = userDevices.find(d => d.id === selectedDevice);
    if (!device) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const newListing:
        DeviceListing = {
        id: Date.now().toString(),
        deviceId: device.id,
        deviceName: device.name,
        condition: selectedCondition,
        ownerName: device.owner
      };

      const response = await fetch('http://127.0.0.1:8000/add_listing/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newListing),
      });

      if (response.ok) {
        const data = await response.json();
        setListings(prev => [...prev, data]);
        setShowAddListing(false);
        setSelectedDevice('');
        setSelectedCondition('average');
      } else {
        console.error('Failed to add listing:', response.status);
      }
    } catch (error) {
      console.error('Error adding listing:', error);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/remove_listing/${listingId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setListings(prev => prev.filter(listing => listing.id !== listingId));
      } else {
        console.error('Failed to delete listing:', response.status);
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/request_action/${requestId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setLendRequests(prev => prev.map(request => {
          if (request.id === requestId) {
            return {
              ...request,
              status: action === 'accept' ? 'active' : 'completed'
            };
          }
          return request;
        }));

        // If accepting, update the listing availability
        if (action === 'accept') {
          const request = lendRequests.find(r => r.id === requestId);
          if (request) {
            setListings(prev => prev.map(listing => {
              if (listing.id === request.listingId) {
                return {
                  ...listing,
                  isAvailable: false
                };
              }
              return listing;
            }));
          }
        }
      } else {
        console.error('Failed to update request:', response.status);
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleReturnDevice = async (requestId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/return_device/${requestId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLendRequests(prev => prev.map(request => {
          if (request.id === requestId) {
            return {
              ...request,
              status: 'completed'
            };
          }
          return request;
        }));

        const request = lendRequests.find(r => r.id === requestId);
        if (request) {
          setListings(prev => prev.map(listing => {
            if (listing.id === request.listingId) {
              return {
                ...listing,
                isAvailable: true
              };
            }
            return listing;
          }));
        }
      } else {
        console.error('Failed to return device:', response.status);
      }
    } catch (error) {
      console.error('Error returning device:', error);
    }
  };

  const handleCreateRequest = async (listingId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;
  
      const response = await fetch(`http://127.0.0.1:8000/create_request/${listingId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        alert('Request created successfully');
        setSearchResults([]); // Clear the search results to close the section
      } else {
        console.error('Failed to create request:', response.status);
      }
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-semibold text-white">Device Sharing</h1>

      {/* Device Search Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-[#EAAC82]" />
          <h2 className="text-lg font-semibold text-white">Find Device</h2>
        </div>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter device product code"
            className="flex-1 bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
          />
          <button
            type="submit"
            className="bg-[#EAAC82] hover:bg-[#D9A279] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </section>

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <section className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-[#EAAC82]" />
            <h2 className="text-lg font-semibold text-white">Search Results</h2>
          </div>
          <div className="grid gap-4">
            {searchResults.map(result => (
              <div key={result.id} className="bg-[#262626] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{result.deviceName}</h3>
                  <p className="text-sm text-gray-400">Condition: {result.condition}</p>
                  <p className="text-sm text-gray-400">Owner: {result.ownerName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleCreateRequest(result.id)}
                    className="bg-[#EAAC82] hover:bg-[#D9A279] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Listings Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-[#EAAC82]" />
            <h2 className="text-lg font-semibold text-white">My Listings</h2>
          </div>
          <button
            onClick={() => setShowAddListing(true)}
            className="bg-[#90AC95] hover:bg-[#7A9580] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Listing
          </button>
        </div>

        {/* Add Listing Form */}
        {showAddListing && (
          <div className="bg-[#262626] p-4 rounded-lg mb-6 animate-slide-up">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Device</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-[#333333] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                >
                  <option value="">Choose a device</option>
                  {userDevices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.room})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Device Condition</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value as DeviceListing['condition'])}
                  className="w-full bg-[#333333] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#EAAC82]"
                >
                  <option value="new">New</option>
                  <option value="average">Average</option>
                  <option value="old">Old</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddListing}
                  className="flex-1 bg-[#EAAC82] hover:bg-[#D9A279] text-white py-2 rounded-lg transition-colors"
                >
                  Add Listing
                </button>
                <button
                  onClick={() => setShowAddListing(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid gap-4">
          {listings.map(listing => (
            <div key={listing.id} className="bg-[#262626] p-4 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{listing.deviceName}</h3>
                <p className="text-sm text-gray-400">Condition: {listing.condition}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDeleteListing(listing.id)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {listings.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No listings yet. Add your first device listing!
            </div>
          )}
        </div>
      </section>

      {/* Requests Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-[#EAAC82]" />
          <h2 className="text-lg font-semibold text-white">Requests</h2>
        </div>

        <div className="space-y-6">
          {/* Pending Requests */}
          <div>
            <h3 className="text-white font-medium mb-4">Pending Requests</h3>
            <div className="space-y-4">
              {lendRequests
                .filter(request => request.status === 'pending')
                .map(request => (
                  <div key={request.id} className="bg-[#262626] p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{request.deviceName}</h4>
                        <p className="text-sm text-gray-400">
                          Requested by: {request.requesterName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(request.id, 'accept')}
                          className="p-2 bg-[#90AC95]/20 text-[#90AC95] rounded-lg hover:bg-[#90AC95]/30 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'reject')}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {lendRequests.filter(request => request.status === 'pending').length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No pending requests
                </div>
              )}
            </div>
          </div>

          {/* Active Lends */}
          <div>
            <h3 className="text-white font-medium mb-4">Active Lends</h3>
            <div className="space-y-4">
              {lendRequests
                .filter(request => request.status === 'active')
                .map(request => (
                  <div key={request.id} className="bg-[#262626] p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{request.deviceName}</h4>
                        <p className="text-sm text-gray-400">
                          Lent to: {request.requesterName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">

                        <div className="flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-[#EAAC82]" />
                          <span className="text-[#EAAC82]">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {lendRequests.filter(request => request.status === 'active').length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No active lends
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}