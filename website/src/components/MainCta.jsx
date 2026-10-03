import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { DASHBOARD_URL } from '../config'

export default function MainCta() {
  const { t } = useLanguage()

  return (
    <section className="bg-[#000F14] py-20 lg:py-28 text-center" id="cta">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">{t('site.home.ctaKicker')}</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            {t('site.home.ctaTitle')}

          </h2>
          <p className="text-gray-400 text-sm mt-6 leading-relaxed max-w-xl mx-auto">
            {t('site.home.ctaBody')}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <a href={DASHBOARD_URL + '/register'} className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              {t('site.cta.applyNow')}
            </a>
            <Link to="/contact" className="btn-asaak hover:!bg-white hover:!text-black">
              {t('site.cta.contactUs')}
            </Link>
          </div>

          <p className="text-[#0FD452] text-sm font-bold mt-8 tracking-wider">{t('site.home.ctaHashtag')}</p>
        </div>
      </div>
    </section>
  )
}
