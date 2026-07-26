import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ChevronRight, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const save = async () => {
    setLoading(true);
    try {
      const res = await api.put('/me', form);
      updateUser(res.data.data || res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      <div className="bg-white px-4 pt-5 pb-6">
        <h1 className="text-lg font-bold text-[#000F14] mb-4">Profile</h1>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#0FD452] flex items-center justify-center mb-3">
            <span className="text-[#000F14] font-bold text-lg">{initials}</span>
          </div>
          <h2 className="font-semibold text-[#000F14]">{user?.name || 'User'}</h2>
          <p className="text-xs text-gray-400">{user?.email || ''}</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {editing ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="flex-1 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button onClick={() => setEditing(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                <User size={18} className="text-[#0FD452]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium text-[#000F14]">{user?.name || 'N/A'}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50">
                <Mail size={18} className="text-[#0FD452]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-[#000F14]">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50">
                <Phone size={18} className="text-[#0FD452]" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-[#000F14]">{user?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/prescriptions')}
              className="w-full bg-white rounded-2xl border border-gray-200 px-4 py-3.5 flex items-center gap-3 text-left"
            >
              <FileText size={18} className="text-[#0FD452]" />
              <span className="flex-1 text-sm font-medium text-[#000F14]">My Prescriptions</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-2xl border border-gray-200 px-4 py-3.5 flex items-center gap-3 text-left text-red-500"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
