import React, { useState, useEffect } from 'react'
import { 
  User, HelpCircle, Phone, Mail, Trash2, ChevronDown, ChevronUp, AlertTriangle 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: "How do I add a new device?",
    answer: "Go to 'Rooms & Devices', select a room, and click the 'Add Device' button. Follow the prompts to set up your new device."
  },
  {
    question: "Can I share access with guests?",
    answer: "Yes! Visit the 'My Guests' page to generate guest access codes. Guests can use these codes to access specific rooms and devices for a limited time."
  },
  {
    question: "How do I set up routines?",
    answer: "Navigate to the 'Routines' page, click 'Add Routine', and specify the device, time, and actions you want to automate."
  },
  {
    question: "What happens if I lose connection?",
    answer: "Your devices will continue to operate based on their last known settings. Once connection is restored, they will automatically sync with the system."
  }
]

export function SettingsPage() {
  const navigate = useNavigate()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // User state
  const [user, setUser] = useState({ first_name: '', last_name: '', email: '' })

  // Get auth token from localStorage (or sessionStorage)
  const token = localStorage.getItem('access_token')  // Adjust if using sessionStorage

  // Fetch user data on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/account/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => setUser(data))
      .catch(error => console.error('Error fetching user data:', error))
  }, [token])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value })
  }

  // Save updated user info
  const handleSave = () => {
    const token = localStorage.getItem('access_token');
    fetch('http://127.0.0.1:8000/account/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data.message)
        setIsEditing(false)
      })
      .catch(error => console.error('Error updating user:', error))
  }

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }
  
      const response = await fetch('http://127.0.0.1:8000/delete_account/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
      });
  
      if (response.ok) {
        localStorage.removeItem('access_token');
        // Redirect using React Router
        navigate('/');
      } else {
        console.error('Failed to delete account:', response.status);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };
  

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>

      {/* Profile Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-[#EAAC82]" />
          <h2 className="text-lg font-semibold text-white">My Profile</h2>
        </div>
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={user.first_name}
                onChange={handleChange}
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={user.last_name}
                onChange={handleChange}
                className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2"
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              className="w-full bg-[#262626] text-white border border-gray-600 rounded-lg px-4 py-2"
              readOnly={!isEditing}
            />
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-3 mt-4">
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 bg-[#EAAC82] hover:bg-orange-600 text-white py-3 rounded-lg">
              Save Changes
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="w-full mt-4 bg-[#EAAC82] hover:bg-orange-600 text-white py-3 rounded-lg">
            Edit Profile
          </button>
        )}
      </section>

      {/* FAQs Section */}
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-[#EAAC82]" />
          <h2 className="text-lg font-semibold text-white">General FAQs</h2>
        </div>
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-700 rounded-lg">
            <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#262626]">
              <span className="text-white font-medium">{faq.question}</span>
              {expandedFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedFaq === index && <div className="px-4 py-3 bg-[#262626] text-gray-300">{faq.answer}</div>}
          </div>
        ))}
      </section>

      {/* Delete Account */}
      <section className="glass-card rounded-xl p-6">
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-lg">
          Delete My Account
        </button>
        {showDeleteConfirm && <button onClick={handleDeleteAccount} className="w-full bg-red-500 text-white py-3 rounded-lg">Confirm Delete</button>}
      </section>
    </div>
  )
}
