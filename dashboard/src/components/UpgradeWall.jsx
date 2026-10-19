import { useNavigate } from 'react-router-dom'
import { Lock, Settings, ArrowRight } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function UpgradeWall({ settingsPath = '/dashboard/settings' }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0FD452]/10 flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-[#0FD452]" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{t('subscription.required')}</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {t('subscription.expiredMessage')}
        </p>
        <button
          onClick={() => navigate('/subscribe')}
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#0FD452] text-[#000F14] text-sm font-bold hover:bg-[#0cb843] transition-all active:scale-[0.98]"
        >
          {t('subscription.choosePlan')} <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(settingsPath)}
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all mt-3"
        >
          <Settings className="w-4 h-4" /> {t('subscription.goToSettings')}
        </button>
      </div>
    </div>
  )
}
