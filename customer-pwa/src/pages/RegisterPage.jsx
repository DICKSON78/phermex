import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Building2, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '\u{1F1F9}\u{1F1FF}' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '\u{1F1FA}\u{1F1EC}' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '\u{1F1F7}\u{1F1FC}' },
];

const pharmacyTypes = [
  { value: 'independent', label: 'Independent' },
  { value: 'chain', label: 'Chain' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'online', label: 'Online' },
];

const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RegisterPage() {
  const [step, setStep] = useState('select');
  const [role, setRole] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    phone_code: '+255',
    password: '',
    password_confirmation: '',
    pharmacy_name: '',
    pharmacy_type: 'independent',
    license_number: '',
    country: 'Tanzania',
    region: '',
    district: '',
    ward: '',
    street: '',
    description: '',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    opening_time: '08:00',
    closing_time: '18:00',
  });

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleTypeSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: `${form.phone_code}${form.phone}`,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role,
      };

      if (role === 'owner') {
        payload.pharmacy_name = form.pharmacy_name;
        payload.pharmacy_type = form.pharmacy_type;
        payload.license_number = form.license_number;
        payload.country = form.country;
        payload.region = form.region;
        payload.district = form.district;
        payload.ward = form.ward;
        payload.street = form.street;
        payload.description = form.description;
        payload.working_days = form.working_days;
        payload.opening_time = form.opening_time;
        payload.closing_time = form.closing_time;
      }

      const result = await register(payload);
      if (result?.redirect === 'dashboard') return;
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    const days = form.working_days.includes(day)
      ? form.working_days.filter((d) => d !== day)
      : [...form.working_days, day];
    update('working_days', days);
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-[#0FD452] flex items-center justify-center">
            <span className="text-[#000F14] font-extrabold text-lg">P</span>
          </div>
          <span className="text-[#000F14] font-bold text-xl tracking-tight">PHARMEX</span>
        </div>

        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1">Register</p>
        <h1 className="text-2xl font-bold text-[#000F14] mb-3">Create Account</h1>
        <p className="text-sm text-gray-500 mb-8">How would you like to use Pharmex?</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleTypeSelect('owner')}
            className="w-full border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-[#0FD452] hover:bg-[#0FD452]/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#000F14] flex items-center justify-center">
                <Store className="w-6 h-6 text-[#0FD452]" />
              </div>
              <div>
                <p className="font-bold text-[#000F14] text-base">Pharmacy Owner</p>
                <p className="text-sm text-gray-500 mt-0.5">Manage your pharmacy, inventory, staff & sales</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('customer')}
            className="w-full border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-[#0FD452] hover:bg-[#0FD452]/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0FD452] flex items-center justify-center">
                <User className="w-6 h-6 text-[#000F14]" />
              </div>
              <div>
                <p className="font-bold text-[#000F14] text-base">Customer</p>
                <p className="text-sm text-gray-500 mt-0.5">Find pharmacies, order medicines & track deliveries</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-auto">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0FD452] font-semibold">Sign In</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-8">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-xl bg-[#0FD452] flex items-center justify-center">
          <span className="text-[#000F14] font-extrabold text-lg">P</span>
        </div>
        <span className="text-[#000F14] font-bold text-xl tracking-tight">PHARMEX</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setStep('select')} className="text-sm text-gray-400 hover:text-[#000F14]">
          Back
        </button>
        <span className="text-sm text-gray-300">/</span>
        <span className="text-sm font-semibold text-[#0FD452]">
          {role === 'owner' ? 'Pharmacy Owner' : 'Customer'}
        </span>
      </div>

      <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1">Register</p>
      <h1 className="text-2xl font-bold text-[#000F14] mb-6">
        {role === 'owner' ? 'Setup Your Pharmacy' : 'Create Customer Account'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-500 text-xs rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>

        <div className="relative">
          <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>

        <div className="relative flex">
          <select
            value={form.phone_code}
            onChange={(e) => update('phone_code', e.target.value)}
            className="border border-gray-200 rounded-l-xl px-3 py-3 text-sm bg-gray-50 text-gray-600 focus:ring-2 focus:ring-[#0FD452] outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              required
              className="w-full border border-gray-200 border-l-0 rounded-r-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
            />
          </div>
        </div>

        {role === 'owner' && (
          <>
            <div className="relative">
              <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pharmacy name"
                value={form.pharmacy_name}
                onChange={(e) => update('pharmacy_name', e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>

            <select
              value={form.pharmacy_type}
              onChange={(e) => update('pharmacy_type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:ring-2 focus:ring-[#0FD452] outline-none"
            >
              {pharmacyTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="License number (optional)"
              value={form.license_number}
              onChange={(e) => update('license_number', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Region"
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
              <input
                type="text"
                placeholder="District"
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ward"
                value={form.ward}
                onChange={(e) => update('ward', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
              <input
                type="text"
                placeholder="Street"
                value={form.street}
                onChange={(e) => update('street', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Working Days</p>
              <div className="flex gap-2 flex-wrap">
                {workingDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.working_days.includes(day)
                        ? 'bg-[#0FD452] text-[#000F14]'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Opens</p>
                <input
                  type="time"
                  value={form.opening_time}
                  onChange={(e) => update('opening_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Closes</p>
                <input
                  type="time"
                  value={form.closing_time}
                  onChange={(e) => update('closing_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
                />
              </div>
            </div>
          </>
        )}

        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Confirm password"
            value={form.password_confirmation}
            onChange={(e) => update('password_confirmation', e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3.5 mt-2 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-auto">
        Already have an account?{' '}
        <Link to="/login" className="text-[#0FD452] font-semibold">Sign In</Link>
      </p>
    </div>
  );
}
