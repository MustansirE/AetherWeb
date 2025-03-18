import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowLeft } from 'lucide-react'
import { CustomLogo } from '../components/CustomLogo'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e:any) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://127.0.0.1:8000/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        console.log('Login successful!');
        navigate('/dashboard');  
      } else {
        console.error('Login failed:', data.error);
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Something went wrong. Please try again.');
    }
  };
  
  
  
  
  const handleGuestLogin = () => {
    navigate('/guest-login')
  }

  return (
    <div 
      className="h-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80")',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-full text-white z-20 hover:text-[#D9A279] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CustomLogo />
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
        </div>

        {/* Login Form */}
        <div className="bg-black/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-black/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#90AC95] focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-black/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#90AC95] focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 bg-black/30 text-[#90AC95] focus:ring-[#90AC95]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-200">
                  Remember me
                </label>
              </div>
              <button type="button" className="text-sm text-[#D9A279] hover:text-[#90AC95]">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#90AC95] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-[1px] flex-1 bg-gray-400"></div>
            <span className="text-gray-200 text-sm whitespace-nowrap">Or</span>
            <div className="h-[1px] flex-1 bg-gray-400"></div>
          </div>

          {/* Guest Login Button */}
          <button
            onClick={handleGuestLogin}
            className="w-full bg-[#90AC95] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Guest Login
          </button>
        </div>
      </div>
    </div>
  )
}