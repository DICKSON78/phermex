import { Link } from 'react-router-dom'
import { Pill, Building2, ArrowRight } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function RegisterPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">HELIX</span>
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">{t('authPages.registerChooser.chooseType')}</p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">{t('authPages.registerChooser.howMany')}</h1>
          <p className="text-gray-500 text-lg">{t('authPages.registerChooser.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/register/owner"
            className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#0FD452] hover:shadow-lg hover:shadow-[#0FD452]/10 transition-all duration-500"
          >
            <div className="w-16 h-16 bg-[#0FD452]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0FD452]/20 transition-all duration-300">
              <Building2 className="w-8 h-8 text-[#0FD452]" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">{t('common.roleOwner')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('authPages.registerChooser.ownerDesc')}</p>
            <div className="flex items-center gap-2 text-[#0FD452] font-semibold text-sm">
              <span>{t('authPages.registerChooser.getStarted')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/register/owner?mode=multiple"
            className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#0FD452] hover:shadow-lg hover:shadow-[#0FD452]/10 transition-all duration-500"
          >
            <div className="w-16 h-16 bg-[#0FD452]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0FD452]/20 transition-all duration-300">
              <Building2 className="w-8 h-8 text-[#0FD452]" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">{t('authPages.registerChooser.multiTitle')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('authPages.registerChooser.multiDesc')}</p>
            <div className="flex items-center gap-2 text-[#0FD452] font-semibold text-sm">
              <span>{t('authPages.registerChooser.getStarted')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
