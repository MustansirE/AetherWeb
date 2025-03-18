import React from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CustomLogo } from '../components/CustomLogo'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div 
      className="h-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80")',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      <div className="max-w-md w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CustomLogo />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Aether
          </h1>
          <p className="text-gray-200 text-lg">
            Elevate your living space with intelligent control
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-black/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          {/* Login Button */}
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-[#90AC95] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-5 h-5" />
            Login to Your Account
          </button>


          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="h-[1px] flex-1 bg-gray-400"></div>
            <span className="text-gray-200 text-sm whitespace-nowrap">If not an existing member</span>
            <div className="h-[1px] flex-1 bg-gray-400"></div>
          </div>

          {/* Become a Member Button */}
          <button 
            onClick={() => navigate('/signup')}
            className="w-full bg-[#90AC95] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-5 h-5" />
            Become a Member
          </button>

        </div>
      </div>
    </div>
  )
}