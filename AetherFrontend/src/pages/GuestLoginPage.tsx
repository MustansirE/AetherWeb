import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Key, ArrowLeft } from 'lucide-react'
import { CustomLogo } from '../components/CustomLogo'

export function GuestLoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    houseId: '',
    guestCode: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
  
    try {
      const response = await fetch('http://localhost:8000/guest_login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestCode: formData.guestCode,
          houseId: formData.houseId
        })
      })
  
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
  
      // Store token same as regular login
      localStorage.setItem('access_token', data.access_token)
      console.log('Guest login successful!')
      navigate(data.redirect || '/guest-home')
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
      localStorage.removeItem('access_token')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="h-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1558002038-1055907df827")',
      }}>
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-black/80 p-3 rounded-full text-white z-20 hover:text-[#D9A279] transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CustomLogo />
          </div>
          <h2 className="text-3xl font-bold text-white">Guest Access</h2>
        </div>

        <div className="bg-black/80 p-8 rounded-2xl shadow-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* House ID Input */}
            <div>
              <label className="block text-sm text-gray-200 mb-2">House ID</label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="houseId"
                  value={formData.houseId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                  placeholder="Enter House ID"
                  required
                />
              </div>
            </div>

            {/* Guest Code Input */}
            <div>
              <label className="block text-sm text-gray-200 mb-2">Guest Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="guestCode"
                  value={formData.guestCode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                  placeholder="Enter Guest Code"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-white font-semibold bg-[#D9A279] hover:bg-[#b47c57] rounded-xl transition-colors">
              Activate Guest Access
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}