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
  const [checkedbox, setChecked] = useState<Boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');
  const termsAndConditions = `
    Terms and Conditions:

    We request you, the user, to read our terms and conditions and privacy policy before signing up 
    to use AETHER. By using our service you agree to follow our terms and conditions, inability to do so may result 
    in losing your access to our services. 

    - You must be at least 18 years of age to use our services.
    - Any user below the minimum age requirements may have their account terminated.
    - All illustrations and interfaces in our services are the intellectual property of AETHER.
    - The use of our services must comply with the local laws of the user’s location.
    - AETHER reserves the right to terminate accounts if necessary.

    Please contact us at support@aether.ae for any queries.
  `;

  const privacyPolicy = `
  Privacy Policy:

  To effectively provide our services to our users, we are required to collect some data from our 
  users. Our aim with the privacy policy is to inform our users regarding our usage of their data. 
  This is done to comply with international laws and standard disclaimers regarding privacy. 
  
  We ask you, the user, to assess our privacy policy thoroughly in order to get a complete 
  understanding of what data is collected, how it is collected, and protected. This policy statement 
  also serves to remind you that you are able to request us to discard all data collected from your 
  account. 

  Data Collection: 
  We collect many different types of data, for providing our features to our users and to comply 
  with legal requirements.  

  Types of Data collected: 
  - Personal information (including Name, Email, Phone Number, and Payment Information)  
  - Device specifications  
  - Device network usage logs  
  - Device usage patterns  
  - Notification, Location, and Time Zone access  

  **Purpose of data collection:**  
  The data we collect is used to provide our services, such as precise device control over the internet using our app.  
  The data collected also allows us to provide a personalized experience based on usage patterns.  
  We also use location, time zone, and notification access to provide timely reminders to optimize electricity usage.  

  Guest users are exempt from personal data collection; all data related to guest-used devices is attributed to the owner's account.  

  Our services are intended for users over 18 years of age due to the personal information collected.  
  We ensure that all collected data is protected—only the respective user and authorized staff can access it.  
  Users can request access, edits, or deletion of their data at any time.  

  Any external links in our applications follow their respective privacy policies. AETHER bears no responsibility for external privacy policies.  

  We will notify users of any changes to our terms and conditions or privacy policy.  
  For any queries, contact support@aether.ae.  
`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!checkedbox) {
      setErrorMessage('You must accept the terms and conditions to sign up.');
      return;
    }

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
        localStorage.setItem('refresh_token', response.data.refresh_token);
        navigate('/tutorial');
      }
    } catch (error: any) {
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
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
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
              disabled={!checkedbox} // Changed from disabled={checkedbox}
              className="w-full py-3 bg-[#D9A279] text-white font-semibold rounded-xl hover:bg-[#b48862] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Create Account
            </button>
          </form>

          {/* Checkbox with Clickable Terms and Conditions & Privacy Policy */}
          <div className="flex items-center mt-4">
            <input
              id="accept-terms"
              type="checkbox"
              onChange={handleCheckbox}
              className="h-4 w-4 rounded border-gray-600 bg-black/30 text-[#90AC95] focus:ring-[#90AC95]"
              checked={!!checkedbox}
            />
            <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-200">
              I accept
              <button
                type="button"
                onClick={() => { setIsModalOpen(true); setModalContent('terms'); }}
                className="text-orange-400 underline ml-1">
                Terms and Conditions
              </button>
              and
              <button
                type="button"
                onClick={() => { setIsModalOpen(true); setModalContent('privacy'); }}
                className="text-orange-400 underline ml-1">
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Modal for Terms & Conditions and Privacy Policy */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <div className="flex justify-between mb-4 border-b pb-2">
                  <button
                    className={`text-lg font-semibold ${modalContent === 'terms' ? 'text-orange-500' : 'text-gray-500'}`}
                    onClick={() => setModalContent('terms')}>
                    Terms & Conditions
                  </button>
                  <button
                    className={`text-lg font-semibold ${modalContent === 'privacy' ? 'text-orange-500' : 'text-gray-500'}`}
                    onClick={() => setModalContent('privacy')}>
                    Privacy Policy
                  </button>
                </div>

                <div className="h-60 overflow-y-auto text-sm text-gray-700">
                  <pre className="whitespace-pre-wrap">{modalContent === 'terms' ? termsAndConditions : privacyPolicy}</pre>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}