import { useState, useEffect } from 'react'
import {
  Settings,
  Shield,
  CreditCard,
  Bell,
  Plug,
  Save,
  Check,
  Globe,
  Lock,
  Mail,
  Smartphone,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const SECTIONS = [
  { id: 'general', label: 'General', icon: Globe, description: 'Platform name, branding, and contact info' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Authentication, passwords, and sessions' },
  { id: 'payment', label: 'Payment & Billing', icon: CreditCard, description: 'Gateway, plans, and pricing' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email templates and SMS config' },
  { id: 'integrations', label: 'Integrations', icon: Plug, description: 'API keys and webhooks' },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center py-3 border-b border-gray-50 last:border-0">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

export default function AdminPlatformSettingsPage() {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      platform_name: 'Helix',
      platform_url: 'https://pharmexdawa.online',
      support_email: 'support@pharmexdawa.online',
      support_phone: '+255 625 460 081',
      default_currency: 'TZS',
      secondary_currency: 'USD',
      exchange_rate: 2500,
      default_timezone: 'Africa/Dar_es_Salaam',
      maintenance_mode: false,
    },
    security: {
      two_factor_required: false,
      session_timeout: 30,
      max_login_attempts: 5,
      lockout_duration: 15,
      password_min_length: 8,
      require_special_chars: true,
      require_numbers: true,
    },
    payment: {
      gateway: 'M-Pesa',
      test_mode: false,
      monthly_fee_basic: 50000,
      monthly_fee_pro: 100000,
      monthly_fee_enterprise: 200000,
      trial_days: 7,
      late_fee_percent: 5,
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: false,
    },
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/admin/settings')
        const s = res.data?.settings || res.data || {}
        setSettings(prev => ({
          ...prev,
          general: { ...prev.general, ...s.general },
          security: { ...prev.security, ...s.security },
          payment: { ...prev.payment, ...s.payment },
          notifications: {
            ...prev.notifications,
            email_notifications: s.email_notifications ?? prev.notifications.email_notifications,
            sms_notifications: s.sms_notifications ?? prev.notifications.sms_notifications,
            push_notifications: s.push_notifications ?? prev.notifications.push_notifications,
          },
        }))
      } catch (err) {
        // Use defaults
      }
    }
    loadSettings()
  }, [])

  const { general: gen = {}, security: sec = {}, payment: pay = {} } = settings

  const updateGeneral = (key, value) => {
    setSettings(prev => ({ ...prev, general: { ...prev.general, [key]: value } }))
  }
  const updateSecurity = (key, value) => {
    setSettings(prev => ({ ...prev, security: { ...prev.security, [key]: value } }))
  }
  const updatePayment = (key, value) => {
    setSettings(prev => ({ ...prev, payment: { ...prev.payment, [key]: value } }))
  }

  const handleSave = async () => {
    try {
      await api.put('/admin/settings/platform', settings)
      toast.success('Settings saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-sm text-gray-500">Configure platform-wide settings, currencies, and regional preferences.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <div className="card p-0">
            <div className="p-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all mb-0.5 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg, #0FD452, #05b843)' } : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'general' && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  General Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Basic platform configuration</p>
              </div>
              <div className="p-6">
                <Field label="Platform Name">
                  <input type="text" value={gen.platform_name} onChange={(e) => updateGeneral('platform_name', e.target.value)} className="form-input" />
                </Field>
                <Field label="Platform URL">
                  <input type="url" value={gen.platform_url} onChange={(e) => updateGeneral('platform_url', e.target.value)} className="form-input" />
                </Field>
                <Field label="Support Email">
                  <input type="email" value={gen.support_email} onChange={(e) => updateGeneral('support_email', e.target.value)} className="form-input" />
                </Field>
                <Field label="Support Phone">
                  <input type="tel" value={gen.support_phone} onChange={(e) => updateGeneral('support_phone', e.target.value)} className="form-input" />
                </Field>
                <Field label="Primary Currency">
                  <select value={gen.default_currency} onChange={(e) => updateGeneral('default_currency', e.target.value)} className="form-input">
                    <option value="TZS">TZS — Tanzania Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                  </select>
                </Field>
                <Field label="Secondary Currency">
                  <select value={gen.secondary_currency || 'USD'} onChange={(e) => updateGeneral('secondary_currency', e.target.value)} className="form-input">
                    <option value="USD">USD — US Dollar</option>
                    <option value="TZS">TZS — Tanzania Shilling</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                  </select>
                </Field>
                <Field label="Exchange Rate (Primary → Secondary)">
                  <input type="number" step="0.01" value={gen.exchange_rate || 2500} onChange={(e) => updateGeneral('exchange_rate', parseFloat(e.target.value))} className="form-input" />
                  <p className="text-xs text-gray-400 mt-1">1 {gen.default_currency} = {gen.exchange_rate || 2500} {gen.secondary_currency || 'USD'}</p>
                </Field>
                <Field label="Timezone">
                  <select value={gen.default_timezone} onChange={(e) => updateGeneral('default_timezone', e.target.value)} className="form-input">
                    <option value="Africa/Dar_es_Salaam">East Africa Time (EAT)</option>
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                  </select>
                </Field>
                <Field label="Maintenance Mode">
                  <Toggle checked={gen.maintenance_mode} onChange={(v) => updateGeneral('maintenance_mode', v)} />
                </Field>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Authentication and access control</p>
              </div>
              <div className="p-6">
                <Field label="Require 2FA">
                  <Toggle checked={sec.two_factor_required} onChange={(v) => updateSecurity('two_factor_required', v)} />
                </Field>
                <Field label="Session Timeout (min)">
                  <input type="number" value={sec.session_timeout} onChange={(e) => updateSecurity('session_timeout', parseInt(e.target.value))} className="form-input" />
                </Field>
                <Field label="Max Login Attempts">
                  <input type="number" value={sec.max_login_attempts} onChange={(e) => updateSecurity('max_login_attempts', parseInt(e.target.value))} className="form-input" />
                </Field>
                <Field label="Lockout Duration (min)">
                  <input type="number" value={sec.lockout_duration} onChange={(e) => updateSecurity('lockout_duration', parseInt(e.target.value))} className="form-input" />
                </Field>
                <Field label="Min Password Length">
                  <input type="number" value={sec.password_min_length} onChange={(e) => updateSecurity('password_min_length', parseInt(e.target.value))} className="form-input" />
                </Field>
                <Field label="Require Special Characters">
                  <Toggle checked={sec.require_special_chars} onChange={(v) => updateSecurity('require_special_chars', v)} />
                </Field>
                <Field label="Require Numbers">
                  <Toggle checked={sec.require_numbers} onChange={(v) => updateSecurity('require_numbers', v)} />
                </Field>
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment & Billing
                </h3>
                <p className="text-sm text-gray-500 mt-1">Gateway configuration and pricing</p>
              </div>
              <div className="p-6">
                <Field label="Payment Gateway">
                  <select value={pay.gateway} onChange={(e) => updatePayment('gateway', e.target.value)} className="form-input">
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Flutterwave">Flutterwave</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </Field>
                <Field label="Test Mode">
                  <Toggle checked={pay.test_mode} onChange={(v) => updatePayment('test_mode', v)} />
                </Field>
                <Field label="Basic Plan ($/mo)">
                  <input type="number" step="0.01" value={pay.monthly_fee_basic} onChange={(e) => updatePayment('monthly_fee_basic', parseFloat(e.target.value))} className="form-input" />
                </Field>
                <Field label="Pro Plan ($/mo)">
                  <input type="number" step="0.01" value={pay.monthly_fee_pro} onChange={(e) => updatePayment('monthly_fee_pro', parseFloat(e.target.value))} className="form-input" />
                </Field>
                <Field label="Enterprise Plan ($/mo)">
                  <input type="number" step="0.01" value={pay.monthly_fee_enterprise} onChange={(e) => updatePayment('monthly_fee_enterprise', parseFloat(e.target.value))} className="form-input" />
                </Field>
                <Field label="Trial Period (days)">
                  <input type="number" value={pay.trial_days} onChange={(e) => updatePayment('trial_days', parseInt(e.target.value))} className="form-input" />
                </Field>
                <Field label="Late Fee (%)">
                  <input type="number" value={pay.late_fee_percent} onChange={(e) => updatePayment('late_fee_percent', parseInt(e.target.value))} className="form-input" />
                </Field>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Email templates and SMS configuration</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'email_new_registration', label: 'New Registration', desc: 'When a new pharmacy signs up', icon: Mail },
                  { key: 'email_subscription_expiry', label: 'Subscription Expiry', desc: '7 days before subscription expires', icon: CreditCard },
                  { key: 'email_payment_received', label: 'Payment Received', desc: 'When payment is confirmed', icon: Check },
                  { key: 'email_support_ticket', label: 'Support Ticket Update', desc: 'When a ticket status changes', icon: Bell },
                  { key: 'email_system_maintenance', label: 'System Maintenance', desc: 'Scheduled maintenance alerts', icon: Settings },
                  { key: 'email_drug_recall', label: 'Drug Recall Alert', desc: 'Critical drug recall notifications', icon: Shield },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <Toggle checked={settings.notifications[item.key] ?? true} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, [item.key]: v}})} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Plug className="w-5 h-5 text-primary" />
                  Integrations
                </h3>
                <p className="text-sm text-gray-500 mt-1">API keys and webhook configuration</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { name: 'Stripe', desc: 'Payment processing', connected: true, icon: CreditCard },
                  { name: 'SendGrid', desc: 'Email delivery', connected: true, icon: Mail },
                  { name: 'Twilio', desc: 'SMS notifications', connected: false, icon: Smartphone },
                  { name: 'Firebase', desc: 'Push notifications', connected: false, icon: Bell },
                ].map((integration, i) => {
                  const Icon = integration.icon
                  return (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${integration.connected ? 'badge-green' : 'badge-gray'}`}>
                          {integration.connected ? 'Connected' : 'Not connected'}
                        </span>
                        
                        <button className="btn-outline text-xs px-3 py-1.5">
                          {integration.connected ? 'Configure' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button onClick={handleSave} className="btn-primary">
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
