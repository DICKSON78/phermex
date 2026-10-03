import { DASHBOARD_URL } from '../config'
import { useLanguage } from '../contexts/LanguageContext'

export default function HowItWorks() {

  const { t } = useLanguage()
  const steps = [
    { key: 'account',
      title: 'Create Your Account',
      desc: 'Sign up in minutes with your pharmacy details and verify your business information.',
    },
    { key: 'pharmacy',
      title: 'Set Up Your Pharmacy',
      desc: 'Add your inventory, staff, and customize your system settings to match your workflow.',
    },
    { key: 'transactions',
      title: 'Process Transactions',
      desc: 'Manage sales, prescriptions, and stock all from one unified dashboard.',
    },
    { key: 'grow',
      title: 'Grow Your Business',
      desc: 'Access analytics and insights to optimize your pharmacy operations and profitability.',
    },
  ]

  return (
    <section className="bg-white py-16 lg:py-24" id="how">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-2">{t('site.home.howItWorks')}</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-12">{t('site.home.stepsTitle')}</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#0FD452] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-700 font-bold text-sm">{i + 1}</span>
                </div>
              </div>
              <h3 className="text-black font-bold text-lg mb-2">{t(`site.home.steps.${step.key}.title`, step.title)}</h3>
              <p className="text-gray-500 text-xs leading-relaxed max-w-[260px] mx-auto">{t(`site.home.steps.${step.key}.desc`, step.desc)}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <a href={DASHBOARD_URL + '/register'} className="btn-asaak">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            {t('site.cta.getStarted')}
          </a>
        </div>
      </div>
    </section>
  )
}
