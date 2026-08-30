import { useState, useRef, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Shield,
  Calendar,
  Check,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/Toast'
import api from '../../services/api'

function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-[#0FD452]']

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    photo: null,
    photoPreview: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        photo: null,
        photoPreview: user.photo_url || user.avatar || '',
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      }))
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('phone', form.phone)
      if (form.photo) formData.append('photo', form.photo)

      const response = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser(response.data.user || response.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setSavingPassword(true)
      await api.post('/user/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        password_confirmation: passwordForm.confirm_password,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      toast.success('Password changed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const strengthScore = getPasswordStrength(passwordForm.new_password)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <User className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">View and update your personal information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {form.photoPreview ? (
                <img src={form.photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-[#0FD452]">
                  {user?.name?.charAt(0) || 'U'}
                </span>
                
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#0FD452] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#0bc246] transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <h2 className="text-xl font-bold text-[#000F14]">{user?.name || 'User'}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          {user?.phone && (
            <p className="text-sm text-gray-500">{user.phone}</p>
          )}

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0FD452]/10 text-[#0FD452] text-xs font-semibold capitalize">
              <Shield className="w-3 h-3" />
              {user?.role || 'Owner'}
            </span>
            
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <KeyRound className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{user?.user_code || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2024'}</span>
            </div>
          </div>
        </div>

        {/* Right - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-md font-bold text-[#000F14] mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0FD452]" />
              Profile Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
                <div className="flex items-center gap-4">
                  {form.photoPreview ? (
                    <div className="relative w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden">
                      <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-[#0FD452] hover:underline font-medium"
                    >
                      {form.photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0FD452] text-white text-sm font-semibold hover:bg-[#0bc246] transition-colors disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-md font-bold text-[#000F14] mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0FD452]" />
              Change Password
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-10 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-10 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.new_password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLORS[strengthScore]}`}
                          style={{ width: `${(strengthScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {STRENGTH_LABELS[strengthScore]}
                      </span>
                      
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#1a2a30] transition-colors disabled:opacity-50"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
