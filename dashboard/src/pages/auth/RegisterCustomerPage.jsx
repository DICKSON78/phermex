import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pill, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: 'TZ' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: 'KE' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: 'UG' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: 'RW' },
]

export default function RegisterCustomerPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', phone_code: '+255', password: '', password_confirmation: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.post('/customer-app/register', {
        name: form.name,
        email: form.email,
        phone: `${form.phone_code}${form.phone}`,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      const userData = await login({ login: form.email, password: form.password })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">PHARMEX</span>
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Customer</p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">Create Account</h1>
          <p className="text-gray-500 text-lg">Join Pharmex to find pharmacies and order medicines</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
