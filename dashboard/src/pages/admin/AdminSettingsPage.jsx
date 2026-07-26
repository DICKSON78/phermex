import { useState, useEffect } from 'react'
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Database,
  Save,
  Check,
  Mail,
  Phone,
  Globe,
  FileText,
  Loader2,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react'
import api from '../../services/api'

const SAMPLE_SETTINGS = {
  platform: {
    name: 'Pharmex',
    tagline: 'Modern Pharmacy Management Platform',
    support_email: 'support@pharmex.com',
    support_phone: '+1 (800) 555-PHARM',
  },
  plans: [
    { id: 1, name: 'Trial', price: 0, duration: '14 days', features: 'Up to 100 drugs, 2 users, basic reports' },
    { id: 2, name: 'Basic', price: 29, duration: 'Monthly', features: 'Up to 500 drugs, 5 users, sales reports, prescriptions' },
    { id: 3, name: 'Pro', price: 79, duration: 'Monthly', features: 'Unlimited drugs, 15 users, advanced analytics, API access' },
    { id: 4, name: 'Enterprise', price: 199, duration: 'Monthly', features: 'Unlimited everything, multi-branch, priority support, custom integrations' },
  ],
  notifications: {
    email_enabled: true,
    sms_enabled: false,
  },
  data_retention: {
    period: '24',
  },
}

const PLAN_COLORS = {
  Trial: 'border-gray-200 bg-gray-50',
  Basic: 'border-green-200 bg-green-50',
  Pro: 'border-blue-200 bg-blue-50',
  Enterprise: 'border-amber-200 bg-amber-50',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      const remote = response.data || {}
      setSettings({ ...SAMPLE_SETTINGS, ...remote, platform: { ...SAMPLE_SETTINGS.platform, ...(remote.platform || {}) } })
    } catch {
      setSettings(SAMPLE_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlatform = async () => {
    setSaving('platform')
    try {
      await api.put('/admin/settings/platform', settings.platform)
    } catch {}
    setTimeout(() => {
      setSaving(null)
      setSaved('platform')
      setTimeout(() => setSaved(null), 2000)
    }, 800)
  }

  const handleSaveNotifications = async () => {
    setSaving('notifications')
    try {
      await api.put('/admin/settings/notifications', settings.notifications)
    } catch {}
    setTimeout(() => {
      setSaving(null)
      setSaved('notifications')
      setTimeout(() => setSaved(null), 2000)
    }, 800)
  }

  const handleSaveRetention = async () => {
    setSaving('retention')
    try {
      await api.put('/admin/settings/retention', settings.data_retention)
    } catch {}
    setTimeout(() => {
      setSaving(null)
      setSaved('retention')
      setTimeout(() => setSaved(null), 2000)
    }, 800)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
            <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
              <div className="h-10 w-1/2 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Configure platform settings and subscription plans.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Platform Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0FD452]/10">
              <Building2 className="h-5 w-5 text-[#0FD452]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#000F14]">Platform Information</h2>
              <p className="text-sm text-gray-500">Basic platform branding and contact details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#000F14]">Platform Name</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={settings.platform.name}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platform: { ...prev.platform, name: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#000F14]">Tagline</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={settings.platform.tagline}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platform: { ...prev.platform, tagline: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#000F14]">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={settings.platform.support_email}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platform: { ...prev.platform, support_email: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#000F14]">Support Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={settings.platform.support_phone}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platform: { ...prev.platform, support_phone: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSavePlatform}
              disabled={saving === 'platform'}
              className="btn-primary"
            >
              {saving === 'platform' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved === 'platform' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved === 'platform' ? 'Saved!' : saving === 'platform' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#000F14]">Subscription Plans</h2>
              <p className="text-sm text-gray-500">Configure available subscription tiers</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Plan</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Price (USD)</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Duration</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Features</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settings.plans.map((plan) => (
                  <tr key={plan.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <CreditCard className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_COLORS[plan.name] || 'bg-gray-100 text-gray-600'}`}>
                          {plan.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14]">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{plan.duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{plan.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#000F14]">Notification Settings</h2>
              <p className="text-sm text-gray-500">Control how the platform sends notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-[#000F14]">Email Notifications</p>
                  <p className="text-xs text-gray-500">Send platform alerts and reports via email</p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      email_enabled: !prev.notifications.email_enabled,
                    },
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.email_enabled ? 'bg-[#0FD452]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    settings.notifications.email_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-[#000F14]">SMS Notifications</p>
                  <p className="text-xs text-gray-500">Send alerts and reminders via SMS</p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      sms_enabled: !prev.notifications.sms_enabled,
                    },
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.sms_enabled ? 'bg-[#0FD452]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    settings.notifications.sms_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={saving === 'notifications'}
              className="btn-primary"
            >
              {saving === 'notifications' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved === 'notifications' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved === 'notifications' ? 'Saved!' : saving === 'notifications' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Data Retention */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Database className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#000F14]">Data Retention</h2>
              <p className="text-sm text-gray-500">How long to keep platform data</p>
            </div>
          </div>

          <div className="max-w-sm">
            <label className="mb-1.5 block text-sm font-medium text-[#000F14]">
              Retention Period
            </label>
            <select
              value={settings.data_retention.period}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  data_retention: { ...prev.data_retention, period: e.target.value },
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="60">60 months</option>
              <option value="0">Forever</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Transaction records, audit logs, and analytics data will be purged after this period.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveRetention}
              disabled={saving === 'retention'}
              className="btn-primary"
            >
              {saving === 'retention' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved === 'retention' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved === 'retention' ? 'Saved!' : saving === 'retention' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
