import { Link } from 'react-router-dom'
import { Pill, Building2, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">PHARMEX</span>
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Choose Type</p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">What Would You Like To Be?</h1>
          <p className="text-gray-500 text-lg">Select the platform that best suits your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/register/owner"
            className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#0FD452] hover:shadow-lg hover:shadow-[#0FD452]/10 transition-all duration-500"
          >
            <div className="w-16 h-16 bg-[#0FD452]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0FD452]/20 transition-all duration-300">
              <Building2 className="w-8 h-8 text-[#0FD452]" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Pharmacy Owner</h3>
            <p className="text-gray-500 text-sm mb-6">Register your pharmacy and manage inventory, sales, and staff all in one place.</p>
            <div className="flex items-center gap-2 text-[#0FD452] font-semibold text-sm">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/register/customer"
            className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#0FD452] hover:shadow-lg hover:shadow-[#0FD452]/10 transition-all duration-500"
          >
            <div className="w-16 h-16 bg-[#0FD452]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0FD452]/20 transition-all duration-300">
              <User className="w-8 h-8 text-[#0FD452]" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Customer</h3>
            <p className="text-gray-500 text-sm mb-6">Order medicines and manage your prescriptions with ease.</p>
            <div className="flex items-center gap-2 text-[#0FD452] font-semibold text-sm">
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

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
