import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Stethoscope } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Pharmacy illustration */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <svg width="600" height="600" viewBox="0 0 200 200" fill="none" className="animate-pulse">
          <rect x="60" y="50" width="80" height="110" rx="8" stroke="#0FD452" strokeWidth="2" fill="none" />
          <rect x="75" y="70" width="50" height="6" rx="3" fill="#0FD452" />
          <rect x="85" y="60" width="30" height="30" rx="4" stroke="#0FD452" strokeWidth="1.5" fill="none" />
          <line x1="100" y1="65" x2="100" y2="85" stroke="#0FD452" strokeWidth="2" />
          <line x1="90" y1="75" x2="110" y2="75" stroke="#0FD452" strokeWidth="2" />
          <rect x="75" y="90" width="50" height="4" rx="2" fill="#0FD452" />
          <rect x="85" y="100" width="30" height="4" rx="2" fill="#0FD452" />
          <rect x="90" y="130" width="20" height="30" rx="3" stroke="#0FD452" strokeWidth="1.5" fill="none" />
          <circle cx="105" cy="145" r="2" fill="#0FD452" />
          <circle cx="50" cy="140" r="8" stroke="#0FD452" strokeWidth="1.5" fill="none" />
          <rect x="46" y="134" width="8" height="12" rx="1" fill="#0FD452" />
          <circle cx="150" cy="140" r="8" stroke="#0FD452" strokeWidth="1.5" fill="none" />
          <rect x="146" y="134" width="8" height="12" rx="1" fill="#0FD452" />
          <rect x="70" y="40" width="60" height="15" rx="6" stroke="#0FD452" strokeWidth="1.5" fill="none" />
          <text x="100" y="51" textAnchor="middle" fill="#0FD452" fontSize="7" fontWeight="bold">PHARMEX</text>
        </svg>
      </div>

      <div className="text-center relative z-10 px-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-9 h-9 text-primary" />
          </div>
        </div>

        <h1 className="text-[120px] md:text-[180px] font-black text-primary leading-none tracking-tighter">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0FD452] text-[#000F14] text-sm font-semibold hover:bg-[#0bc246] transition-colors shadow-lg shadow-[#0FD452]/20"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
