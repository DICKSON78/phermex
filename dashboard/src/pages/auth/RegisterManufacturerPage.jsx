import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pill, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function RegisterManufacturerPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    manufacturer_name: '', manufacturer_license: '', manufacturer_address: '',
    manufacturer_phone: '', manufacturer_email: '', manufacturer_website: '', manufacturer_description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { toast.error('Passwords do not match'); return }
    setSubmitting(true)
    try {
      await api.post('/register', { ...form, role: 'manufacturer' })
      toast.success('Registration submitted. Please verify your email.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/register" className="text-gray-500 hover:text-[#0FD452]"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center"><Pill className="w-6 h-6 text-[#000F14]" /></div>
          <span className="text-gray-600 font-black text-2xl">HELIX</span>
        </div>
        <h1 className="text-3xl font-black text-gray-600 mb-2">Manufacturer Registration</h1>
        <p className="text-gray-500 mb-8">Create your manufacturer account to list products and receive wholesale orders.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input required placeholder="Contact name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
            <input required placeholder="Phone (+255...)" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
            <input required placeholder="Manufacturer name" value={form.manufacturer_name} onChange={(e) => set('manufacturer_name', e.target.value)} className={inputClass} />
            <input placeholder="License number" value={form.manufacturer_license} onChange={(e) => set('manufacturer_license', e.target.value)} className={inputClass} />
            <input placeholder="Address" value={form.manufacturer_address} onChange={(e) => set('manufacturer_address', e.target.value)} className={inputClass} />
            <input placeholder="Manufacturer phone" value={form.manufacturer_phone} onChange={(e) => set('manufacturer_phone', e.target.value)} className={inputClass} />
            <input type="email" placeholder="Manufacturer email" value={form.manufacturer_email} onChange={(e) => set('manufacturer_email', e.target.value)} className={inputClass} />
            <input placeholder="Website" value={form.manufacturer_website} onChange={(e) => set('manufacturer_website', e.target.value)} className={inputClass} />
            <input required type="password" placeholder="Password (8+ chars, 1 uppercase, 1 number)" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} />
            <input required type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} className={inputClass} />
          </div>
          <textarea placeholder="Description" value={form.manufacturer_description} onChange={(e) => set('manufacturer_description', e.target.value)} className={inputClass} rows={3} />
          <button type="submit" disabled={submitting} className="w-full bg-[#0FD452] text-[#000F14] font-bold py-3 rounded-xl hover:bg-[#0cb843] disabled:opacity-60">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Register as Manufacturer'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843]">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
