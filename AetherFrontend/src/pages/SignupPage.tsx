import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react';
import { CustomLogo } from '../components/CustomLogo';
import axios from 'axios';

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    planType: 'home',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      plan_type: formData.planType,
    };

    try {
      const response = await axios.post('http://localhost:8000/signup/', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 201) {
        localStorage.setItem('access_token', response.data.access_token);
        navigate('/dashboard');
      }
    } catch (error:any) {
      const message = error.response?.data?.error || error.message;
      setErrorMessage(message || 'Signup failed. Please try again.');
      console.error('Signup error:', error.response?.data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 9) : value 
    }));
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1558002038-1055907df827")' }}>
      
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
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
        </div>

        <div className="bg-black/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-200 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-200 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="someone@email.com"
                  className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-200 mb-2">Phone</label>
              <div className="flex gap-2">
                <div className="w-20 px-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-center text-gray-300">
                  +971
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="** *** ****"
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                    pattern="\d{9}"
                    title="9 digits required"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-200 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-200 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Plan Type */}
            <div>
              <label className="block text-sm text-gray-200 mb-2">Plan Type</label>
              <select
                name="planType"
                value={formData.planType}
                onChange={handleChange}
                className="w-full py-2 px-3 bg-black/30 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#90AC95]">
                <option value="home">Home</option>
                <option value="business">Business</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D9A279] text-white font-semibold rounded-xl hover:bg-[#b48862] transition-colors">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}