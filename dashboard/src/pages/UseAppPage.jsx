import { Pill, Smartphone, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function UseAppPage() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
            <Pill className="w-7 h-7 text-[#000F14]" />
          </div>
          <span className="text-gray-600 font-black text-3xl">HELIX</span>
        </div>

        <div className="w-20 h-20 mx-auto bg-[#0FD452]/10 rounded-2xl flex items-center justify-center mb-6">
          <Smartphone className="w-10 h-10 text-[#0FD452]" />
        </div>
        <h1 className="text-3xl font-black text-gray-600 mb-3">Use the Helix App</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-8">
          Ordering has moved to the Helix mobile app. Download it on your phone to browse pharmacies,
          order medicines, upload prescriptions, and track your deliveries.
        </p>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] font-bold px-8 py-4 rounded-xl transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
