import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Factory, Mail, Phone, MapPin, Globe, ShieldCheck, Pencil, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Spinner,
} from './ManufacturerUI'

export default function ManufacturerProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-portal/profile')
      setProfile(data.profile)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load the profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = () => navigate('/dashboard/manufacturer/profile/edit')
  const openPassword = () => navigate('/dashboard/manufacturer/profile/password')

  if (loading) return <Spinner />

  const displayName = profile?.manufacturer_name || profile?.name

  return (
    <div>
      <PageHeader
        title="Manufacturer profile"
        subtitle="This identity is shown on your portal and on product information."
        action={
          <div className="flex gap-2">
            <SecondaryButton onClick={openPassword}>
              <KeyRound className="h-4 w-4" /> Change password
            </SecondaryButton>
            <PrimaryButton onClick={openEdit}>
              <Pencil className="h-4 w-4" /> Edit profile
            </PrimaryButton>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0FD452]/10 text-[#0a8f3c]">
              {profile?.manufacturer_logo ? (
                <img src={profile.manufacturer_logo} alt={displayName} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <Factory className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-[#000F14]">{displayName}</p>
              <p className="text-sm text-gray-400">Manufacturer account</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <Line icon={Mail} label="Account email" value={profile?.email} />
            <Line icon={Phone} label="Account phone" value={profile?.phone} />
            <Line icon={ShieldCheck} label="License" value={profile?.manufacturer_license} />
            <Line icon={MapPin} label="Address" value={profile?.manufacturer_address} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-[#000F14]">Business details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Manufacturer name" value={profile?.manufacturer_name} />
            <Detail label="License number" value={profile?.manufacturer_license} />
            <Detail label="Business email" value={profile?.manufacturer_email} />
            <Detail label="Business phone" value={profile?.manufacturer_phone} />
            <Detail label="Website" value={profile?.manufacturer_website} icon={Globe} />
            <Detail label="Address" value={profile?.manufacturer_address} icon={MapPin} />
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">About</p>
              <p className="mt-1 text-sm text-gray-600">{profile?.manufacturer_description || 'No description added yet.'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function Line({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-[#000F14]">{value || '—'}</p>
      </div>
    </div>
  )
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#000F14]">{value || '—'}</p>
    </div>
  )
}
