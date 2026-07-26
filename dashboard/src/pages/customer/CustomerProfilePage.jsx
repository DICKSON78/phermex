import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ChevronRight, LogOut, FileText, ChevronLeft, Bell, HelpCircle, MessageCircle, Shield, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

export default function CustomerProfilePage() {
  const { user, logout, setUser } = useAuth();
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
      const res = await api.put('/customer-app/me', form);
      setUser(res.data.data || res.data);
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

  if (editing) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] pb-24">
        <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <h1 className="font-bold text-gray-900 text-lg">Edit Profile</h1>
          </div>
        </div>
        <div className="px-4 mt-4 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none border-0"
                placeholder="Full name"
              />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none border-0"
                placeholder="Email"
              />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none border-0"
                placeholder="Phone"
              />
            </div>
          </div>
          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 disabled:opacity-50 active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#000F14] border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-24">
      {/* Profile header */}
      <div className="bg-white px-5 pt-6 pb-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0FD452] flex items-center justify-center shadow-sm shadow-[#0FD452]/20">
            <span className="text-[#000F14] font-bold text-lg">{initials}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{user?.name || 'User'}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Phone size={11} className="text-gray-400" />
              <p className="text-sm text-gray-400">{user?.phone || 'No phone'}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={11} className="text-gray-400" />
              <p className="text-xs text-gray-400">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setEditing(true)}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.97] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <User size={18} className="text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Edit Profile</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Update your info</p>
          </button>
          <button
            onClick={() => navigate('/chats')}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.97] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center mb-3">
              <MessageCircle size={18} className="text-[#0FD452]" />
            </div>
            <p className="text-sm font-bold text-gray-900">Messages</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Chat with pharmacies</p>
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Account</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button onClick={() => navigate('/prescriptions')} className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <FileText size={16} className="text-purple-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">My Prescriptions</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <div className="h-px bg-gray-50 mx-4" />
          <button onClick={() => navigate('/orders')} className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Shield size={16} className="text-amber-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">My Orders</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <div className="h-px bg-gray-50 mx-4" />
          <button className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell size={16} className="text-amber-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">Notifications</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <div className="h-px bg-gray-50 mx-4" />
          <button className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <HelpCircle size={16} className="text-gray-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">Help & Support</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl border border-red-100 px-4 py-4 flex items-center gap-3 text-left active:bg-red-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={16} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-red-500">Logout</span>
        </button>
      </div>

      {/* App version */}
      <div className="text-center mt-6 mb-4">
        <p className="text-[10px] text-gray-300">Pharmex v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
}
